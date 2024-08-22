const {
  validateReply,
  validateComment,
} = require("../../../Middleware/Validation/postValidation");
const { Comment } = require("../../../Model/User/Post/commentModel");
const { Post } = require("../../../Model/User/Post/postModel");
const { Replies } = require("../../../Model/User/Post/replyModel");
const {
  NEW_COMMENT,
  emitEvent,
  NEW_COMMENT_REPLY,
  TAG_USER,
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
        success: true,
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
        success: true,
        message: "This reply is not present!",
      });
    }
    if (reply.user.toString() != req.user._id) {
      return res.status(400).json({
        success: true,
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
        success: true,
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
        success: true,
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
