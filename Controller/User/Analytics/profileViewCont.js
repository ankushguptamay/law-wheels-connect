const {
  profileViewer,
} = require("../../../Middleware/Validation/userValidation");
const {
  PostImpression,
} = require("../../../Model/Analytics/postImpressionModel");
const { ProfileView } = require("../../../Model/Analytics/profileViewModel");
const { Follow } = require("../../../Model/User/Connection/followerModel");

exports.profileViewer = async (req, res) => {
  try {
    // Body Validation
    const { error } = profileViewer(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const userId = req.body.userId;
    const _id = req.user._id;

    if (_id.toString() == userId.toString()) {
      return res.status(400).json({ success: false });
    }

    // Create this if not exist else update
    await ProfileView.findOneAndUpdate(
      { profileOwner: userId, profileViewer: _id }, // Query
      { updatedAt: new Date() }, // update
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

exports.getProfileViewer = async (req, res) => {
  try {
    const { past7Days, past14Days, past28Days, past90Days, past365Days } =
      req.query;
    const dayInMilliSecond = 1000 * 60 * 60 * 24;
    const today = new Date();

    // For Current
    const lastDays = new Date();
    const compareLastDays = new Date();

    const _id = req.user._id;
    let query, views, message, days, pastQuery;

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
    views = new Array(days).fill(0);
    message = `Past ${days} days views!`;
    query = { profileOwner: _id, updatedAt: { $gte: lastDays } };
    pastQuery = {
      profileOwner: _id,
      updatedAt: { $gte: compareLastDays, $lt: lastDays },
    };

    const [totalViews, viewsWithRespectivePastTime, lastDaysViews] =
      await Promise.all([
        ProfileView.countDocuments(query),
        ProfileView.countDocuments(pastQuery),
        ProfileView.find(query).select("updatedAt"),
      ]);

    lastDaysViews.forEach((view) => {
      const indexApprox =
        (today.getTime() - view.updatedAt.getTime()) / dayInMilliSecond;
      const index = Math.floor(indexApprox);
      views[days - 1 - index]++;
    });

    const status = {
      totalViews,
      viewsWithRespectivePastTime,
      chart: views,
    };
    return res.status(200).json({ success: true, message, data: status });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const lastDays = new Date();
    const compareLastDays = new Date();

    const _id = req.user._id;
    const days = 7;

    lastDays.setDate(lastDays.getDate() - days);
    compareLastDays.setDate(compareLastDays.getDate() - days * 2);
    const message = `Past 7 days analytics!`;

    const viewsQuery = { profileOwner: _id, updatedAt: { $gte: lastDays } };
    const viewsPastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLastDays, $lt: lastDays },
      };
    const impressionsQuery = { postOwner: _id, updatedAt: { $gte: lastDays } };
    const impressionsPastQuery = {
        postOwner: _id,
        updatedAt: { $gte: compareLastDays, $lt: lastDays },
      };
    const followeeQuery = { followee: _id, updatedAt: { $gte: lastDays } };
    const followersPastQuery = {
        followee: _id,
        updatedAt: { $gte: compareLastDays, $lt: lastDays },
      };

    const [
      totalViews,
      viewsWithRespectivePastTime,
      totalImpressions,
      impressionsWithRespectivePastTime,
      totalFollowers,
      followersWithRespectivePastTime
    ] = await Promise.all([
      ProfileView.countDocuments(viewsQuery),
      ProfileView.countDocuments(viewsPastQuery),
      PostImpression.countDocuments(impressionsQuery),
      PostImpression.countDocuments(impressionsPastQuery),
      Follow.countDocuments(followeeQuery),
      Follow.countDocuments(followersPastQuery),
    ]);

    const status = {
      profileView:{totalViews,viewsWithRespectivePastTime},
      postImpession:{totalImpressions,impressionsWithRespectivePastTime},
      followers:{totalFollowers,followersWithRespectivePastTime}
    };
    return res.status(200).json({ success: true, message, data: status });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
