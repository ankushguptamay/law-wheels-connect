const express = require("express");
const router = express.Router();

const userProfile = require("../userProfile");
const connection = require("../userConnection");
const post = require("../userPost");
const chat = require("../chatRoute");
const allUserSlot = require("../sloteForAllUser");
const master = require("../master");

const {
  getUser,
  addUpdateProfilePic,
  addUpdateCoverPic,
  deleteCoverPic,
  deleteProfilePic,
  updateUser,
} = require("../../../Controller/User/userCont");

//middleware
const { isNunUser } = require("../../../Middleware/role");
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken");
const uploadImage = require("../../../Middleware/UploadFile/image");

router.use(verifyUserJWT);
router.use(isNunUser);

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

router.use("/profile", userProfile);
router.use("/conn", connection);
router.use("/post", post);
router.use("/chat", chat);
router.use("/slot", allUserSlot);
router.use("/master", master);

module.exports = router;
