const {
  validateComment,
} = require("../../../Middleware/Validation/postValidation");
const { Comment } = require("../../../Model/User/Post/commentModel");
const { Post } = require("../../../Model/User/Post/postModel");
const { Replies } = require("../../../Model/User/Post/replyModel");
const { NEW_COMMENT, emitEvent, TAG_USER } = require("../../../Util/event");

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
        const reply = await Replies.countDocuments({ comment: _id });
        return {
          _id,
          content,
          user: {
            _id: user._id,
            url: user.profilePic ? user.profilePic.url : null,
            name: user.name,
          },
          noOfReplay: reply,
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
        success: true,
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
        success: true,
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
