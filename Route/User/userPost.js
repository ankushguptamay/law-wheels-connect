const express = require("express");
const router = express.Router();

const {
  addDocumentPost,
  addMediaPost,
  addTemplatePost,
  addTextPost,
  addCelebratePost,
  addPollPost,
  updateMediaPost,
  updateDocumentPost,
  updateTextPost,
  updateCelebratePost,
  updatePollPost,
  updateTemplatePost,
  deleteMediaFile,
  getMyPost,
  getPostById,
  softDeletePost,
  reactOnPost,
  unReactOnPost,
  getReactionPost,
} = require("../../Controller/User/Post/postController");

const {
  addComment,
  getCommentByPost,
  softDeleteComment,
  updateComment,
  reactOnComment,
  unReactOnComment,
  getReactionComment,
} = require("../../Controller/User/Post/commentController");
const {
  replyOnComment,
  getReplyByComment,
  softDeleteReply,
  updateReply,
  reactOnReply,
  unReactOnReply,
  getReactionReply,
} = require("../../Controller/User/Post/replyController");
const {
  savePost,
  unSavePost,
  getSavePost,
} = require("../../Controller/User/Post/savedPostController");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");
const uploadPDF = require("../../Middleware/UploadFile/pdf");

router.use(verifyUserJWT);

router.post("/documentPost", uploadPDF.single("DocumentFile"), addDocumentPost);
router.post("/mediaPost", uploadImage.array("MediaFile", 10), addMediaPost);
router.post(
  "/templatePost",
  uploadImage.single("TemplateFile"),
  addTemplatePost
);
router.post("/textPost", addTextPost);
router.post(
  "/celebratePost",
  uploadImage.single("CelebrateFile"),
  addCelebratePost
);
router.post("/pollPost", addPollPost);
router.get("/post", getMyPost);
router.get("/post/:id", getPostById);
router.delete("/post/:id", softDeletePost);
router.put("/mediaFile/:id", deleteMediaFile);
router.put(
  "/mediaPost/:id",
  uploadImage.array("MediaFile", 10),
  updateMediaPost
);
router.put(
  "/documentPost/:id",
  uploadPDF.single("DocumentFile"),
  updateDocumentPost
);
router.put("/textPost/:id", updateTextPost);
router.put(
  "/celebratePost/:id",
  uploadImage.single("CelebrateFile"),
  updateCelebratePost
);
router.put("/pollPost/:id", updatePollPost);
router.put(
  "/templatePost/:id",
  uploadImage.single("TemplateFile"),
  updateTemplatePost
);

router.put("/reactionOnPost/:id", reactOnPost);
router.delete("/reactionOnPost/:id", unReactOnPost);
router.get("/reactionOnPost/:id", getReactionPost);

// Comment
router.post("/comment/:id", addComment);
router.get("/comment/:id", getCommentByPost);
router.delete("/comment/:id", softDeleteComment);
router.put("/comment/:id", updateComment);

router.put("/reactionOnComment/:id", reactOnComment);
router.delete("/reactionOnComment/:id", unReactOnComment);
router.get("/reactionOnComment/:id", getReactionComment);
// Reply
router.post("/reply", replyOnComment);
router.get("/reply/:id", getReplyByComment);
router.delete("/reply/:id", softDeleteReply);
router.put("/reply/:id", updateReply);

router.put("/reactionOnReply/:id", reactOnReply);
router.delete("/reactionOnReply/:id", unReactOnReply);
router.get("/reactionOnReply/:id", getReactionReply);

// Saved Post
router.post("/savePost/:id", savePost); // post _id
router.get("/savePost", getSavePost);
router.delete("/savePost/:id", unSavePost); // post _id

module.exports = router;
