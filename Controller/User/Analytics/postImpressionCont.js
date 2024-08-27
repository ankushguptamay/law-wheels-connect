const {
  postImpression,
} = require("../../../Middleware/Validation/postValidation");
const {
  PostImpression,
} = require("../../../Model/Analytics/postImpressionModel");
const { Post } = require("../../../Model/User/Post/postModel");

exports.postImpression = async (req, res) => {
  try {
    // Body Validation
    const { error } = postImpression(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const userId = req.body.userId;
    const postId = req.body.postId;
    const _id = req.user._id;

    if (_id.toString() == userId.toString()) {
      return res.status(400).json({ success: false });
    }

    // Find post
    const post = await Post.findOne({
      _id: postId,
      isDelete: false,
    });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }
    // Create this if not exist else update
    await PostImpression.findOneAndUpdate(
      { post: postId, postViewer: _id }, // Query
      { updatedAt: new Date(), postOwner: userId }, // update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPostImpression = async (req, res) => {
  try {
    const { past7Days, past14Days, past28Days, past90Days, past365Days } =
      req.query;
    const dayInMilliSecond = 1000 * 60 * 60 * 24;
    const today = new Date();

    // For Current
    const lastDays = new Date();
    const compareLastDays = new Date();

    const _id = req.user._id;
    let query, impressions, message, pastQuery, days;

    if (past14Days) {
      days = 14;
    } else if (past28Days) {
      days = 28;
    } else if (past90Days) {
      days = 90;
    } else if (past365Days) {
      days = 365;
    } else {
      days = 7;
    }
    lastDays.setDate(lastDays.getDate() - days);
    compareLastDays.setDate(compareLastDays.getDate() - days * 2);
    impressions = new Array(days).fill(0);
    message = `Past ${days} days impressions!`;
    query = { postOwner: _id, updatedAt: { $gte: lastDays } };
    pastQuery = {
      postOwner: _id,
      updatedAt: { $gte: compareLastDays, $lt: lastDays },
    };

    const [
      totalImpressions,
      impressionsWithRespectivePastTime,
      lastDaysImpressions,
    ] = await Promise.all([
      PostImpression.countDocuments(query),
      PostImpression.countDocuments(pastQuery),
      PostImpression.find(query).select("updatedAt"),
    ]);

    lastDaysImpressions.forEach((impression) => {
      const indexApprox =
        (today.getTime() - impression.updatedAt.getTime()) / dayInMilliSecond;
      const index = Math.floor(indexApprox);
      impressions[days - 1 - index]++;
    });

    const status = {
      totalImpressions,
      impressionsWithRespectivePastTime,
      chart: impressions,
    };
    return res.status(200).json({ success: true, message, data: status });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
