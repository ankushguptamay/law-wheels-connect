const {
  validateReply,
  validateComment,
} = require("../../../Middleware/Validation/postValidation");
const { Comment } = require("../../../Model/User/Post/commentModel");
const {
  ReactionOnReplies,
} = require("../../../Model/User/Post/reactionOnReplyModel");
const { Replies } = require("../../../Model/User/Post/replyModel");
const {
  NEW_COMMENT,
  emitEvent,
  NEW_COMMENT_REPLY,
  TAG_USER,
  NEW_LIKE,
} = require("../../../Util/event");

exports.replyOnComment = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateReply(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, tagedUser, commentId } = req.body;

    // Find comment
    const comment = await Comment.findOne({
      _id: commentId,
      isDelete: false,
    }).populate("post", "user");
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "This comment is not present!",
      });
    }

    const reply = {
      content: content,
      user: req.user._id,
      comment: commentId,
      post: comment.post._id,
      tagedUser: tagedUser,
      createdAt: new Date(),
    };
    await Replies.create(reply);

    // Event
    const user = {
      _id: req.user._id,
      name: req.user.name,
      profilePic: req.user.profilePic ? req.user.profilePic.url : null,
    };
    const replyUsers = [req.user._id.toString(), comment.user.toString()];
    emitEvent(req, NEW_COMMENT_REPLY, replyUsers, {
      message: `${req.user.name} replyed on your comment!`,
      user,
    });

    const postUsers = [req.user._id.toString(), comment.post.user.toString()];
    emitEvent(req, NEW_COMMENT, postUsers, {
      message: `${req.user.name} commented on your post!`,
      user,
    });
    if (tagedUser.length > 0) {
      const tagUsers = [...tagedUser, req.user._id.toString()];
      emitEvent(req, TAG_USER, tagUsers, {
        message: `${req.user.name} taged you in his/her comment!`,
        user,
      });
    }

    res.status(200).json({
      success: true,
      message: "Replied successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getReplyByComment = async (req, res) => {
  try {
    const _id = req.params.id;
    const reply = await Replies.find({
      comment: _id,
      isDelete: false,
    }).populate("user");

    const transformData = [];
    for (let i = 0; i < reply.length; i++) {
      const reaction = await ReactionOnReplies.countDocuments({ replies: reply[i]._id });
      transformData.push({
        _id: reply[i]._id,
        content: reply[i].content,
        user: {
          _id: reply[i].user._id,
          url: reply[i].user.profilePic.url
            ? reply[i].user.profilePic.url
            : null,
          name: reply[i].user.name,
        },
        noOfReaction: reaction,
        tagedUser: reply[i].tagedUser,
        createdAt: reply[i].createdAt,
      });
    }
    res.status(200).json({
      success: true,
      message: "Reply fetched successfully!",
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateReply = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, tagedUser } = req.body;
    const _id = req.params.id; // reply _id

    const reply = await Replies.findOne({
      _id,
      isDelete: false,
    });
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "This reply is not present!",
      });
    }
    if (reply.user.toString() != req.user._id) {
      return res.status(400).json({
        success: false,
        message: "You can not update this reply!",
      });
    }
    // update
    await reply.updateOne({ content, tagedUser });

    // Event
    const user = {
      _id: req.user._id,
      name: req.user.name,
      profilePic: req.user.profilePic ? req.user.profilePic.url : null,
    };
    const newTagUser = tagedUser.filter(
      (item) => !reply.tagedUser.includes(item)
    );

    if (newTagUser.length > 0) {
      const tagUsers = [...tagedUser, req.user._id.toString()];
      emitEvent(req, TAG_USER, tagUsers, {
        message: `${req.user.name} taged you in his/her comment!`,
        user,
      });
    }
    res.status(200).json({
      success: true,
      message: "Comment updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteReply = async (req, res) => {
  try {
    const _id = req.params.id; // reply _id
    const reply = await Replies.findOne({
      _id,
      isDelete: false,
    }).populate("post", "user");
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "This reply is not present!",
      });
    }

    // update
    if (req.user._id.toString() == reply.user.toString()) {
      await reply.updateOne({ isDelete: true, deleted_at: new Date() });
    } else if (req.user._id.toString() == reply.post.user.toString()) {
      await reply.updateOne({ isDelete: true, deleted_at: new Date() });
    } else {
      return res.status(400).json({
        success: false,
        message: "You can not delete this reply!",
      });
    }
    res.status(200).json({
      success: true,
      message: "Relpy deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.reactOnReply = async (req, res) => {
  try {
    const {
      like = false,
      support = false,
      love = false,
      funny = false,
      insightful = false,
      celebrate = false,
    } = req.body;
    const _id = req.params.id; // reply _id
    const reply = await Replies.findOne({
      _id: _id,
      isDelete: false,
    });
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "This reply is not present!",
      });
    }
    // Create if not exist
    const data = await ReactionOnReplies.findOneAndUpdate(
      { user: req.user._id, replies: _id }, // Query
      {
        updatedAt: new Date(),
        like,
        support,
        love,
        funny,
        insightful,
        celebrate,
      }, // update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options
    );

    // Event
    const user = {
      _id: req.user._id,
      name: req.user.name,
      profilePic: req.user.profilePic ? req.user.profilePic.url : null,
    };
    const users = [req.user._id, reply.user.toString()];
    emitEvent(req, NEW_LIKE, users, {
      message: `${req.user.name} reacted on your comment!`,
      user,
    });

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.unReactOnReply = async (req, res) => {
  try {
    const _id = req.params.id; // reply _id
    const reply = await Replies.findOne({
      _id: _id,
      isDelete: false,
    });
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "This reply is not present!",
      });
    }

    await ReactionOnReplies.deleteOne({ user: req.user._id, replies: _id });

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getReactionReply = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 40;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    const {
      like = false,
      support = false,
      love = false,
      funny = false,
      insightful = false,
      celebrate = false,
    } = req.query;
    const _id = req.params.id; // reply _id
    let query;
    if (like) {
        console.log("Here")
      query = { replies: _id, like: true };
    } else if (support) {
      query = { replies: _id, support: true };
    } else if (love) {
      query = { replies: _id, love: true };
    } else if (celebrate) {
      query = { replies: _id, celebrate: true };
    } else if (insightful) {
      query = { replies: _id, insightful: true };
    } else if (funny) {
      query = { replies: _id, funny: true };
    } else {
      query = { replies: _id };
    }
    const [
      reaction,
      totalReaction,
      totalLike,
      totalSupport,
      totalCelebrate,
      totalLove,
      totalInsightful,
      totalFunny,
    ] = await Promise.all([
      ReactionOnReplies.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("user")
        .lean(),
      ReactionOnReplies.countDocuments({ replies: _id }),
      ReactionOnReplies.countDocuments({ replies: _id, like: true }),
      ReactionOnReplies.countDocuments({ replies: _id, support: true }),
      ReactionOnReplies.countDocuments({ replies: _id, celebrate: true }),
      ReactionOnReplies.countDocuments({ replies: _id, love: true }),
      ReactionOnReplies.countDocuments({ replies: _id, insightful: true }),
      ReactionOnReplies.countDocuments({ replies: _id, funny: true }),
    ]);

    let totalPages;
    if (like) {
      totalPages = Math.ceil(totalLike / resultPerPage) || 0;
    } else if (support) {
      totalPages = Math.ceil(totalSupport / resultPerPage) || 0;
    } else if (love) {
      totalPages = Math.ceil(totalLove / resultPerPage) || 0;
    } else if (celebrate) {
      totalPages = Math.ceil(totalCelebrate / resultPerPage) || 0;
    } else if (insightful) {
      totalPages = Math.ceil(totalInsightful / resultPerPage) || 0;
    } else if (funny) {
      totalPages = Math.ceil(totalFunny / resultPerPage) || 0;
    } else {
      totalPages = Math.ceil(totalReaction / resultPerPage) || 0;
    }
    const transformData = reaction.map(
      ({
        _id,
        replies,
        user,
        like,
        support,
        celebrate,
        love,
        insightful,
        funny,
        createdAt,
      }) => {
        return {
          _id,
          like,
          support,
          celebrate,
          love,
          insightful,
          funny,
          user: {
            _id: user._id,
            url: user.profilePic ? user.profilePic.url : null,
            name: user.name,
          },
          replies,
          createdAt,
        };
      }
    );
    res.status(200).json({
      success: true,
      message: "Get successfully!",
      data: {
        reaction: transformData,
        totalReaction,
        totalLike,
        totalSupport,
        totalCelebrate,
        totalLove,
        totalInsightful,
        totalFunny,
      },
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
