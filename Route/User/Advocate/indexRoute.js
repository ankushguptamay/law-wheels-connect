const express = require("express");
const router = express.Router();

const userProfile = require("../userProfile");
const connection = require("../userConnection");
const post = require("../userPost");
const chat = require("../chatRoute");
const advocateSlot = require("./slotRouteForAdvocate");
const allUserSlot = require("../sloteForAllUser");

const {
  getUser,
  addUpdateProfilePic,
  addUpdateLicensePic,
  addUpdateCoverPic,
  deleteLicensePic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
} = require("../../../Controller/User/userCont");

//middleware
const {
  isAdvocateUser,
  isAdvocateVerified,
} = require("../../../Middleware/role");
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken");
const uploadImage = require("../../../Middleware/UploadFile/image");

router.use(verifyUserJWT);
router.use(isAdvocateUser);

router.put(
  "/licensePic",
  uploadImage.single("LicensePic"),
  addUpdateLicensePic
);
router.get("/", getUser);

router.put(
  "/profilePic",
  uploadImage.single("ProfilePic"),
  addUpdateProfilePic
);
router.put("/coverPic", uploadImage.single("CoverPic"), addUpdateCoverPic);
router.put("/update", updateUser);

router.delete("/profilePic", deleteProfilePic);
router.delete("/coverPic", deleteCoverPic);
router.delete("/licensePic", deleteLicensePic);

router.use("/profile", userProfile);
router.use("/conn", connection);
router.use("/post", post);
router.use("/chat", chat);
router.use("/slot", allUserSlot);
router.use("/aSlot", advocateSlot);

module.exports = router;
