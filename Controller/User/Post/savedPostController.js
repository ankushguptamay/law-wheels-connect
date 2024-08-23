const { Post } = require("../../../Model/User/Post/postModel");
const { SavedPost } = require("../../../Model/User/Post/savedPostModel");

exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find post
    const post = await Post.findOne({
      _id: postId,
      isDelete: false,
    });
    console.log(post);
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    // Save post
    await SavedPost.findOneAndUpdate(
      { post: postId, user: userId }, // Query
      { updatedAt: new Date() }, // update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options
    );
    res.status(200).json({
      success: true,
      message: "Post saved successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.unSavePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const save = await SavedPost.findOne({ post: postId, user: userId });

    if (save) {
      await save.deleteOne();
    }
    res.status(200).json({
      success: true,
      message: "Post unsaved successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSavePost = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    const userId = req.user._id;

    const [save, totalSave] = await Promise.all([
      SavedPost.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      SavedPost.countDocuments({ user: userId }),
    ]);
    const totalPages = Math.ceil(totalSave / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Saved post fetched successfully!",
      data: save,
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
