const express = require("express");
const router = express.Router();

const userProfile = require("../userProfile");
const connection = require("../userConnection");
const post = require("../userPost");
const chat = require("../chatRoute");
const allUserSlot = require("../sloteForAllUser");
const master = require("../master");
const lawStudy = require("../law_study");

const {
  getDetailsOfStudentAndAdvocate,
  addUpdateProfilePic,
  addUpdateCoverPic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
  getAllUser,
  getUserById,
} = require("../../../Controller/User/userCont");
const {
  getAdvocateReviewForUser,
} = require("../../../Controller/User/Review/advocateReviewCont");

//middleware
const { isStudentUser } = require("../../../Middleware/role");
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken");
const uploadImage = require("../../../Middleware/UploadFile/image");

router.use(verifyUserJWT);
router.use(isStudentUser);

router.get("/", getDetailsOfStudentAndAdvocate);
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

router.use("/profile", userProfile);
router.use("/conn", connection);
router.use("/post", post);
router.use("/chat", chat);
router.use("/slot", allUserSlot);
router.use("/master", master);
router.use("/law-study", lawStudy);

// review
router.get("/reviews/:id", getAdvocateReviewForUser);

module.exports = router;
