const express = require("express");
const router = express.Router();

const userProfile = require("../userProfile");
const connection = require("../userConnection");
const post = require("../userPost");
const advocateSlot = require("./slotRouteForAdvocate");
const allUserSlot = require("../sloteForAllUser");

const {
  getDetailsOfStudentAndAdvocate,
  addUpdateProfilePic,
  addUpdateLicensePic,
  addUpdateCoverPic,
  deleteLicensePic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
  getAllUser,
  getUserById,
  isProfileVisible,
  sendAadharOTP,
  verifyAadharOTP,
} = require("../../../Controller/User/userCont");

//middleware
const {
  isAdvocateUser,
  isAdvocateVerified,
} = require("../../../Middleware/role");
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken");
const uploadImage = require("../../../Middleware/UploadFile/image");
const {
  getAdvocateReviewForAdvocate,
  getAdvocateReviewForUser,
} = require("../../../Controller/User/Review/advocateReviewCont");

router.use(verifyUserJWT);
router.use(isAdvocateUser);

router.put(
  "/licensePic",
  uploadImage.single("LicensePic"),
  addUpdateLicensePic
);
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
router.put("/profileVisibility", isProfileVisible);

router.delete("/profilePic", deleteProfilePic);
router.delete("/coverPic", deleteCoverPic);
router.delete("/licensePic", deleteLicensePic);

// review
router.get("/myReviews", getAdvocateReviewForAdvocate);
router.get("/reviews/:id", getAdvocateReviewForUser);

// Aadhar
router.post("/sendAadharOTP", sendAadharOTP);
router.post("/verifyAadharOTP", verifyAadharOTP);

router.use("/profile", userProfile);
router.use("/conn", connection);
router.use("/post", post);
router.use("/slot", allUserSlot); // When advocate want to book other advocate slot
router.use("/aSlot", advocateSlot);

module.exports = router;
