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
} = require("../../Controller/User/postController");

const {
  addComment,
  getCommentByPost,
  softDeleteComment,
  replyOnComment,
  getReplyByComment,
  softDeleteReply,
} = require("../../Controller/User/commentController");

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

// Comment
router.post("/comment/:id", addComment);
router.get("/comment/:id", getCommentByPost);
router.delete("/comment/:id", softDeleteComment);
// Reply
router.post("/reply/:id", replyOnComment);
router.get("/reply/:id", getReplyByComment);
router.delete("/reply/:id", softDeleteReply);

module.exports = router;
