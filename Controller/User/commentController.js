const { default: mongoose } = require("mongoose");
const {
  validateComment,
} = require("../../Middleware/Validation/postValidation");
const { Comment } = require("../../Model/User/Post/commentModel");
const { Post } = require("../../Model/User/Post/postModel");
const {
  NEW_COMMENT,
  emitEvent,
  NEW_COMMENT_REPLY,
} = require("../../Util/event");

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
        success: true,
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

    const transformData = comment.map(
      ({ content, _id, createdAt, user, tagedUser, reply }) => {
        return {
          _id,
          content,
          user: {
            _id: user._id,
            url: user.profilePic ? user.profilePic.url : null,
            name: user.name,
          },
          noOfReplay: reply.length,
          tagedUser,
          createdAt,
        };
      }
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

exports.softDeleteComment = async (req, res) => {
  try {
    const _id = req.params.id; // comment _id
    const comment = await Comment.findOne({
      _id: _id,
      isDelete: false,
    }).populate("post", "user");
    if (!comment) {
      return res.status(400).json({
        success: true,
        message: "This comment is not present!",
      });
    }

    if (req.user._id == comment.post.user.toString()) {
      await comment.updateOne({
        isDelete: true,
        deleted_at: new Date(),
      });
    } else if (req.user._id == comment.user.toString()) {
      await comment.updateOne({
        isDelete: true,
        deleted_at: new Date(),
      });
    } else {
      return res.status(400).json({
        success: true,
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

exports.replyOnComment = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const _id = req.params.id; // Comment Id
    const { content, tagedUser } = req.body;

    // Find comment
    const comment = await Comment.findOne({
      _id,
      isDelete: false,
    }).populate("post", "user");
    if (!comment) {
      return res.status(400).json({
        success: true,
        message: "This comment is not present!",
      });
    }

    const reply = [
      ...comment.reply,
      {
        content: content,
        user: req.user._id,
        tagedUser: tagedUser,
        createdAt: new Date(),
      },
    ];

    await comment.updateOne({ reply: reply });
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
    const comment = await Comment.findById(_id).populate("reply.user");

    const transformData = [];
    for (let i = 0; i < comment.reply.length; i++) {
      if (!comment.reply[i].isDelete) {
        transformData.push({
          _id: comment.reply[i]._id,
          content: comment.reply[i].content,
          user: {
            _id: comment.reply[i].user._id,
            url: comment.reply[i].user.profilePic.url
              ? comment.reply[i].user.profilePic.url
              : null,
            name: comment.reply[i].user.name,
          },
          tagedUser: comment.reply[i].tagedUser,
          createdAt: comment.reply[i].createdAt,
        });
      }
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

exports.softDeleteReply = async (req, res) => {
  try {
    const commentId = req.body.commentId;
    const _id = req.params.id; // reply _id
    const comment = await Comment.findOne({
      _id: commentId,
      isDelete: false,
      "reply._id": _id,
    });
    if (!comment) {
      return res.status(400).json({
        success: true,
        message: "This reply is not present!",
      });
    }
    // New Reply
    const updateGiven = (all, given) => {
      const newAlls = [];
      for (let i = 0; i < all.length; i++) {
        if (all[i]._id.toString() == given.toString()) {
          const obj = all[i];
          newAlls.push({
            content: all[i].content,
            tagedUser: all[i].tagedUser,
            user: all[i].user,
            _id: all[i]._id,
            isDelete: true,
          });
        } else {
          newAlls.push(all[i]);
        }
      }
      return newAlls;
    };
    const newArray = updateGiven(comment.reply, _id);
    // update
    await comment.updateOne({ reply: newArray });
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
