const {
  profileViewer,
} = require("../../../Middleware/Validation/userValidation");
const { ProfileView } = require("../../../Model/Analytics/profileViewModel");

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
    const last7Days = new Date();
    const last14Days = new Date();
    const last28Days = new Date();
    const last90Days = new Date();
    const last365Days = new Date();

    const _id = req.user._id;
    let query, views, message, days, pastQuery;

    // For Comparison
    const compareLast7Days = new Date();
    const compareLast14Days = new Date();
    const compareLast28Days = new Date();
    const compareLast90Days = new Date();
    const compareLast365Days = new Date();

    if (past14Days) {
      last14Days.setDate(last14Days.getDate() - 14);
      query = { profileOwner: _id, updatedAt: { $gte: last14Days } };
      compareLast14Days.setDate(compareLast14Days.getDate() - 28);
      pastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLast14Days, $lt: last14Days },
      };
      views = new Array(14).fill(0);
      message = "Past 14 days views!";
      days = 13;
    } else if (past28Days) {
      last28Days.setDate(last28Days.getDate() - 28);
      query = { profileOwner: _id, updatedAt: { $gte: last28Days } };
      compareLast28Days.setDate(compareLast28Days.getDate() - 56);
      pastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLast28Days, $lt: last28Days },
      };
      views = new Array(28).fill(0);
      message = "Past 28 days views!";
      days = 27;
    } else if (past90Days) {
      last90Days.setDate(last90Days.getDate() - 90);
      query = { profileOwner: _id, updatedAt: { $gte: last90Days } };
      compareLast90Days.setDate(compareLast90Days.getDate() - 180);
      pastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLast90Days, $lt: last90Days },
      };
      views = new Array(90).fill(0);
      message = "Past 90 days views!";
      days = 81;
    } else if (past365Days) {
      last365Days.setDate(last365Days.getDate() - 365);
      query = { profileOwner: _id, updatedAt: { $gte: last365Days } };
      compareLast365Days.setDate(compareLast365Days.getDate() - 730);
      pastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLast365Days, $lt: last365Days },
      };
      views = new Array(365).fill(0);
      message = "Past 365 days views!";
      days = 364;
    } else {
      last7Days.setDate(last7Days.getDate() - 7);
      query = { profileOwner: _id, updatedAt: { $gte: last7Days } };
      compareLast7Days.setDate(compareLast7Days.getDate() - 14);
      pastQuery = {
        profileOwner: _id,
        updatedAt: { $gte: compareLast7Days, $lt: last7Days },
      };
      views = new Array(7).fill(0);
      message = "Past 7 days views!";
      days = 6;
    }

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
      views[days - index]++;
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
