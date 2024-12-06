const {
  validateComment,
} = require("../../../Middleware/Validation/postValidation");
const { Comment } = require("../../../Model/User/Post/commentModel");
const {
  ReactionOnComment,
} = require("../../../Model/User/Post/reactionOnCommentModel");
const { Post } = require("../../../Model/User/Post/postModel");
const { Replies } = require("../../../Model/User/Post/replyModel");
const {
  NEW_COMMENT,
  emitEvent,
  TAG_USER,
  NEW_LIKE,
} = require("../../../Socket/event");

exports.addComment = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const _id = req.params.id; // Post _id

    const post = await Post.findById(_id);
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    const { content, tagedUser } = req.body;
    // Add comment
    await Comment.create({
      content: content,
      user: req.user._id,
      tagedUser: tagedUser,
      post: _id,
    });
    // Increase total comment count
    const newTotalComment = parseInt(post.totalComment) + 1;
    await post.updateOne({ totalComment: newTotalComment });

    // Event
    const user = {
      _id: req.user._id,
      name: req.user.name,
      profilePic: req.user.profilePic ? req.user.profilePic.url : null,
    };
    const users = [req.user._id, post.user.toString()];
    emitEvent(req, NEW_COMMENT, users, {
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
      message: "Comment added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCommentByPost = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    const _id = req.params.id; // Post _id

    const [comment, totalComment] = await Promise.all([
      Comment.find({ post: _id, isDelete: false })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("user")
        .lean(),
      Comment.countDocuments({ post: _id, isDelete: false }),
    ]);

    const totalPages = Math.ceil(totalComment / resultPerPage) || 0;
    const transformData = await Promise.all(
      comment.map(async ({ content, _id, createdAt, user, tagedUser }) => {
        const [reply, like] = await Promise.all([
          Replies.countDocuments({ comment: _id }),
          ReactionOnComment.countDocuments({ comment: _id }),
        ]);
        return {
          _id,
          content,
          user: {
            _id: user._id,
            url: user.profilePic ? user.profilePic.url : null,
            name: user.name,
          },
          noOfReplay: reply,
          noOfReaction: like,
          tagedUser,
          createdAt,
        };
      })
    );
    res.status(200).json({
      success: true,
      message: "Comment fetched successfully!",
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

exports.updateComment = async (req, res) => {
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
    const _id = req.params.id; // comment _id

    const comment = await Comment.findOne({
      _id: _id,
      isDelete: false,
    }).populate("post", "user");
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "This comment is not present!",
      });
    }

    if (req.user._id == comment.user.toString()) {
      await comment.updateOne({
        content: content,
        tagedUser: tagedUser,
      });
      // Event
      const user = {
        _id: req.user._id,
        name: req.user.name,
        profilePic: req.user.profilePic ? req.user.profilePic.url : null,
      };
      const newTagUser = tagedUser.filter(
        (item) => !comment.tagedUser.includes(item)
      );
      if (newTagUser.length > 0) {
        const tagUsers = [...tagedUser, req.user._id.toString()];
        emitEvent(req, TAG_USER, tagUsers, {
          message: `${req.user.name} taged you in his/her comment!`,
          user,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Comment updated successfully!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "You can not update this comment!",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteComment = async (req, res) => {
  try {
    const _id = req.params.id; // comment _id
    const comment = await Comment.findOne({
      _id: _id,
      isDelete: false,
    }).populate("post", ["user", "totalComment"]);
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "This comment is not present!",
      });
    }

    const post = comment.post;
    if (req.user._id == comment.post.user.toString()) {
      await comment.updateOne({
        isDelete: true,
        deleted_at: new Date(),
      });
      // Decrease total comment count
      const newTotalComment = parseInt(post.totalComment) - 1;
      await post.updateOne({ totalComment: newTotalComment });
    } else if (req.user._id == comment.user.toString()) {
      await comment.updateOne({
        isDelete: true,
        deleted_at: new Date(),
      });
      // Increase total comment count
      const newTotalComment = parseInt(post.totalComment) - 1;
      await post.updateOne({ totalComment: newTotalComment });
    } else {
      return res.status(400).json({
        success: false,
        message: "You can not delete this comment!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.reactOnComment = async (req, res) => {
  try {
    const {
      like = false,
      support = false,
      love = false,
      funny = false,
      insightful = false,
      celebrate = false,
    } = req.body;
    const _id = req.params.id; // comment _id
    const comment = await Comment.findOne({
      _id: _id,
      isDelete: false,
    });
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "This comment is not present!",
      });
    }
    // Create if not exist
    await ReactionOnComment.findOneAndUpdate(
      { user: req.user._id, comment: _id }, // Query
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
    const users = [req.user._id, comment.user.toString()];
    emitEvent(req, NEW_LIKE, users, {
      message: `${req.user.name} reacted comment!`,
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

exports.unReactOnComment = async (req, res) => {
  try {
    const _id = req.params.id; // comment _id
    const comment = await Comment.findOne({
      _id: _id,
      isDelete: false,
    });
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "This comment is not present!",
      });
    }

    await ReactionOnComment.deleteOne({ user: req.user._id, comment: _id });

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

exports.getReactionComment = async (req, res) => {
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
    const _id = req.params.id; // comment _id
    let query;
    if (like) {
      query = { comment: _id, like: true };
    } else if (support) {
      query = { comment: _id, support: true };
    } else if (love) {
      query = { comment: _id, love: true };
    } else if (celebrate) {
      query = { comment: _id, celebrate: true };
    } else if (insightful) {
      query = { comment: _id, insightful: true };
    } else if (funny) {
      query = { comment: _id, funny: true };
    } else {
      query = { comment: _id };
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
      ReactionOnComment.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("user")
        .lean(),
      ReactionOnComment.countDocuments({ comment: _id }),
      ReactionOnComment.countDocuments({ comment: _id, like: true }),
      ReactionOnComment.countDocuments({ comment: _id, support: true }),
      ReactionOnComment.countDocuments({ comment: _id, celebrate: true }),
      ReactionOnComment.countDocuments({ comment: _id, love: true }),
      ReactionOnComment.countDocuments({ comment: _id, insightful: true }),
      ReactionOnComment.countDocuments({ comment: _id, funny: true }),
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
        comment,
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
          comment,
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
