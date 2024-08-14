const express = require("express");
const router = express.Router();

const userProfile = require("./userProfile");

const {
  getUser,
  register,
  logOut,
  loginByMobile,
  addUpdateProfilePic,
  verifyMobileOTP,
  addUpdateLicensePic,
  addUpdateCoverPic,
  deleteLicensePic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
  isAdvocatePage,
} = require("../../Controller/User/userCont");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.post("/register", register);
router.post("/loginByMobile", loginByMobile);
router.post("/logOut", logOut);
router.post("/verifyMobileOTP", verifyMobileOTP);

router.get("/", verifyUserJWT, getUser);

router.put(
  "/profilePic",
  verifyUserJWT,
  uploadImage.single("ProfilePic"),
  addUpdateProfilePic
);
router.put(
  "/coverPic",
  verifyUserJWT,
  uploadImage.single("CoverPic"),
  addUpdateCoverPic
);
router.put(
  "/licensePic",
  verifyUserJWT,
  uploadImage.single("LicensePic"),
  addUpdateLicensePic
);
router.put("/update", verifyUserJWT, updateUser);
router.put("/isAdvocatePage", verifyUserJWT, isAdvocatePage);

router.delete("/profilePic", verifyUserJWT, deleteProfilePic);
router.delete("/coverPic", verifyUserJWT, deleteCoverPic);
router.delete("/licensePic", verifyUserJWT, deleteLicensePic);

router.use(userProfile);

module.exports = router;
