const express = require("express");
const router = express.Router();

const userProfile = require("../userProfile");
const connection = require("../userConnection");
const post = require("../userPost");
const allUserSlot = require("../sloteForAllUser");

const {
  giveAdvocateReviews,
  notGiveAdvocateReviews,
  updateAdvocateReviewsByUser,
  deleteAdvocateReviewByUser,
  deleteAdvocateReviewMessageByUser,
  getAdvocateReviewForUser,
} = require("../../../Controller/User/Review/advocateReviewCont");

const {
  getDetailsOfNunUser,
  addUpdateProfilePic,
  addUpdateCoverPic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
  getAllUser,
  getUserById,
} = require("../../../Controller/User/userCont");

//middleware
const { isNunUser } = require("../../../Middleware/role");
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken");
const uploadImage = require("../../../Middleware/UploadFile/image");

router.use(verifyUserJWT);
router.use(isNunUser);

router.get("/", getDetailsOfNunUser);
router.get("/users", getAllUser);
router.get("/users/:id", getUserById);

router.put(
  "/profilePic",
  uploadImage.single("ProfilePic"),
  addUpdateProfilePic
);
router.put("/coverPic", uploadImage.single("CoverPic"), addUpdateCoverPic);
router.put("/update", updateUser);
router.delete("/profilePic", deleteProfilePic);
router.delete("/coverPic", deleteCoverPic);

// router.use("/profile", userProfile);
router.use("/conn", connection);
// router.use("/post", post);
router.use("/slot", allUserSlot);
// router.use("/master", master);

// Review
router.post("/giveAdvocateReviews", giveAdvocateReviews);
router.post("/notGiveAdvocateReviews", notGiveAdvocateReviews);
router.put("/updateAdvocateReviews", updateAdvocateReviewsByUser);
router.delete("/deleteAdvocateReview", deleteAdvocateReviewByUser);
router.delete(
  "/deleteAdvocateReviewMessage",
  deleteAdvocateReviewMessageByUser
);
router.get("/reviews/:id", getAdvocateReviewForUser);

module.exports = router;
