const { PollResponse } = require("../../../Model/User/Post/pollResponseModel");
const { Post } = require("../../../Model/User/Post/postModel");

exports.givePollResponse = async (req, res) => {
  try {
    const { option1, option2, option3, option4 } = req.body;
    const postId = req.params.id;
    // Create text post
    const post = await Post.findOne({
      _id: postId,
      isDelete: false,
      postType: "poll",
    });
    if (!post) {
      return res.status(400).json({
        success: true,
        message: "This poll post is not present!",
      });
    }

    // Is Response present
    let pollResponse = await PollResponse.findOne({ post: postId });
    if (!pollResponse) {
      pollResponse = await PollResponse.create({
        post: postId,
        user: post.user,
      });
    }
    if (option1) {
      pollResponse.option1.push(req.user._id);
    } else if (option2) {
      pollResponse.option2.push(req.user._id);
    } else if (option3) {
      pollResponse.option3.push(req.user._id);
    } else if (option4) {
      pollResponse.option4.push(req.user._id);
    } else {
      return res.status(400).json({
        success: true,
        message: "Please select a option!",
      });
    }
    await pollResponse.save();
    res.status(200).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
