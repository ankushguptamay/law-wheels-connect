// const {} = require("../../Middleware/Validation/connectionValidation");
const { Follow } = require("../../../Model/User/Connection/followerModel");
const { NEW_FOLLOWER } = require("../../../Socket/event");
const { emitEvent } = require("../../../Socket/io");
const { capitalizeFirstLetter } = require("../../../Util/utility");

exports.follow = async (req, res) => {
  try {
    const followee = req.body.followee;
    if (!followee) {
      return res.status(400).json({
        success: false,
        message: "Select a followee!",
      });
    }

    if (followee.toString() == req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "you can not follow your self!",
      });
    }
    // Check
    const isFollowed = await Follow.findOne({
      follower: req.user._id,
      followee: followee,
    });
    if (isFollowed) {
      return res.status(400).json({
        success: false,
        message: "Already followed!",
      });
    }
    // Create
    await Follow.create({
      follower: req.user._id,
      followee: followee,
    });
    // EVENT
    const users = [
      {
        _id: req.user._id,
        name: req.user.name,
        profilePic: req.user.profilePic ? req.user.profilePic.url : null,
      },
    ];
    emitEvent(req, NEW_FOLLOWER, users, `${req.user.name} followed you!`);

    res.status(200).json({
      success: true,
      message: "Followed successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.followCount = async (req, res) => {
  try {
    // Follower
    const [follower, following] = await Promise.all([
      Follow.countDocuments({ followee: req.user._id }),
      Follow.countDocuments({ follower: req.user._id }),
    ]);
    res.status(200).json({
      success: true,
      data: { follower, following },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Only for self Nun/Advocate/Student
exports.follower = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // follower
    const [followers, totalFollow] = await Promise.all([
      Follow.find({
        followee: req.user._id,
      })
        .populate("follower", ["name", "profilePic"])
        .select("-updatedAt -createdAt -followee")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Follow.countDocuments({ followee: req.user._id }),
    ]);

    const followerIds = followers.map((f) => f.follower._id);

    // Check in bulk if the logged-in user is following any of these followers
    const areYouFollowingSet = new Set(
      (
        await Follow.find({
          followee: { $in: followerIds },
          follower: req.user._id,
        })
          .select("followee")
          .lean()
      ).map((f) => f.followee.toString())
    );

    // Transform data
    const transformData = followers.map((f) => ({
      ...f,
      areYouFollowing: areYouFollowingSet.has(f.follower._id.toString()),
    }));

    const totalPages = Math.ceil(totalFollow / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Only for self Nun/Advocate/Student
exports.following = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    //   let query = {};
    //   if (req.query.search) {
    //     const startWith = new RegExp("^" + req.query.search.toLowerCase(), "i");
    //     query = { name: startWith };
    //   }
    // Following
    const [following, totalFollowing] = await Promise.all([
      Follow.find({
        follower: req.user._id,
      })
        .populate("followee", ["name", "profilePic"])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Follow.countDocuments({ follower: req.user._id }),
    ]);

    const followeeIds = following.map((f) => f.followee._id);

    // Check in bulk if the logged-in user is following any of these followers
    const isHeFollowingSet = new Set(
      (
        await Follow.find({
          follower: { $in: followeeIds },
          followee: req.user._id,
        })
          .select("follower")
          .lean()
      ).map((f) => f.follower.toString())
    );

    // Transform data
    const transformData = following.map((f) => ({
      ...f,
      isHeFollowing: isHeFollowingSet.has(f.followee._id.toString()),
    }));

    const totalPages = Math.ceil(totalFollowing / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeFollower = async (req, res) => {
  try {
    const follower = req.body.follower;
    if (!follower) {
      return res.status(400).json({
        success: false,
        message: "Select a follower!",
      });
    }
    // Check
    const isFollower = await Follow.findOne({
      followee: req.user._id,
      follower: follower,
    });
    if (!isFollower) {
      return res.status(400).json({
        success: false,
        message: "This follower is not present!",
      });
    }
    // Create
    await Follow.deleteOne({
      followee: req.user._id,
      follower: follower,
    });

    res.status(200).json({
      success: true,
      message: "Follower removed successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.unFollow = async (req, res) => {
  try {
    const followee = req.body.followee;
    if (!followee) {
      return res.status(400).json({
        success: false,
        message: "Select a followee!",
      });
    }
    // Check
    const isFollowee = await Follow.findOne({
      follower: req.user._id,
      followee: followee,
    });
    if (!isFollowee) {
      return res.status(400).json({
        success: false,
        message: "This followee is not present!",
      });
    }
    // Create
    await Follow.deleteOne({
      follower: req.user._id,
      followee: followee,
    });

    res.status(200).json({
      success: true,
      message: "Un followed successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getFollowerAnalytics = async (req, res) => {
  try {
    const { past7Days, past14Days, past28Days, past90Days, past365Days } =
      req.query;
    const dayInMilliSecond = 1000 * 60 * 60 * 24;
    const today = new Date();

    // For Current
    const lastDays = new Date();
    const compareLastDays = new Date();

    const _id = req.user._id;
    let query, follows, message, days, pastQuery;

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
    follows = new Array(days).fill(0);
    message = `Past ${days} days follows!`;
    query = { followee: _id, updatedAt: { $gte: lastDays } };
    pastQuery = {
      followee: _id,
      updatedAt: { $gte: compareLastDays, $lt: lastDays },
    };

    const [totalFollowers, followersWithRespectivePastTime, lastDaysFollowers] =
      await Promise.all([
        Follow.countDocuments(query),
        Follow.countDocuments(pastQuery),
        Follow.find(query).select("updatedAt"),
      ]);

    lastDaysFollowers.forEach((follow) => {
      const indexApprox =
        (today.getTime() - follow.updatedAt.getTime()) / dayInMilliSecond;
      const index = Math.floor(indexApprox);
      follows[days - 1 - index]++;
    });

    const status = {
      totalFollowers,
      followersWithRespectivePastTime,
      chart: follows,
    };
    return res.status(200).json({ success: true, message, data: status });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.followerOfOther = async (req, res) => {
  try {
    if (!req.body.id) {
     return res
        .status(400)
        .json({ success: false, message: "Please select a profile!" });
    }
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // follower
    const [followers, totalFollow] = await Promise.all([
      Follow.find({
        followee: req.body.id,
      })
        .populate("follower", ["name", "profilePic"])
        .select("-updatedAt -createdAt -followee")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Follow.countDocuments({ followee: req.user.id }),
    ]);

    const followerIds = followers.map((f) => f.follower._id);

    // Check in bulk if the logged-in user is following any of these followers
    const areYouFollowingSet = new Set(
      (
        await Follow.find({
          followee: { $in: followerIds },
          follower: req.user._id,
        })
          .select("followee")
          .lean()
      ).map((f) => f.followee.toString())
    );

    const isHeFollowingSet = new Set(
      (
        await Follow.find({
          followee: req.user._id,
          follower: { $in: followerIds },
        })
          .select("follower")
          .lean()
      ).map((f) => f.follower.toString())
    );

    // Transform data
    const transformData = followers.map((f) => ({
      ...f,
      areYouFollowing: areYouFollowingSet.has(f.follower._id.toString()),
      isHeFollowing: isHeFollowingSet.has(f.follower._id.toString()),
    }));

    const totalPages = Math.ceil(totalFollow / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.followingOfOther = async (req, res) => {
  try {
    if (!req.body.id) {
      return res
        .status(400)
        .json({ success: false, message: "Please select a profile!" });
    }
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Following
    const [following, totalFollowing] = await Promise.all([
      Follow.find({
        follower: req.body.id,
      })
        .populate("followee", ["name", "profilePic"])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Follow.countDocuments({ follower: req.body.id }),
    ]);

    const followeeIds = following.map((f) => f.followee._id);

    // Check in bulk if the logged-in user is following any of these followers
    const areYouFollowingSet = new Set(
      (
        await Follow.find({
          followee: { $in: followeeIds },
          follower: req.user._id,
        })
          .select("followee")
          .lean()
      ).map((f) => f.followee.toString())
    );

    const isHeFollowingSet = new Set(
      (
        await Follow.find({
          follower: { $in: followeeIds },
          followee: req.user._id,
        })
          .select("follower")
          .lean()
      ).map((f) => f.follower.toString())
    );

    // Transform data
    const transformData = following.map((f) => ({
      ...f,
      isHeFollowing: isHeFollowingSet.has(f.followee._id.toString()),
      areYouFollowing: areYouFollowingSet.has(f.followee._id.toString()),
    }));

    const totalPages = Math.ceil(totalFollowing / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
