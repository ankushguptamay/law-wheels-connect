const { Post } = require("../../../Model/User/Post/postModel");

exports.rePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
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

    if (post.user.toString() == userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can not repost your own post!",
      });
    }

    const rePostedBy = post.rePostedBy;
    const totalRepost = post.totalRepost;
    if (rePostedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Already reposted!",
      });
    } else {
      const newRePostedBy = [...rePostedBy, userId];
      await post.updateOne({
        totalRepost: parseInt(totalRepost) + 1,
        rePostedBy: newRePostedBy,
      });
      return res.status(200).json({
        success: true,
        message: "Post reposted successfully!",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeFromRePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
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

    const rePostedBy = post.rePostedBy;
    const totalRepost = post.totalRepost;

    if (!rePostedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Sorry! You have not reposted this post yet!",
      });
    } else {
      const newRePostedBy = rePostedBy.filter(
        (e) => e.toString() !== userId.toString()
      );
      await post.updateOne({
        totalRepost: parseInt(totalRepost) - 1,
        rePostedBy: newRePostedBy,
      });
      return res.status(200).json({
        success: true,
        message: "Post un reposted successfully!",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.rePostBy = async (req, res) => {
  try {
    const postId = req.params.id;
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Find post
    const post = await Post.findOne({
      _id: postId,
      isDelete: false,
    }).populate({
      path: "rePostedBy",
      select: "name _id",
      options: { limit: resultPerPage, skip: skip },
    });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    const totalPages =
      Math.ceil(parseInt(post.totalRepost) / resultPerPage) || 0;

    return res.status(200).json({
      success: true,
      message: "Reposted by successfully!",
      data: post,
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
