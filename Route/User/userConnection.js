const express = require("express");
const router = express.Router();

const userProfile = require("./userProfile");

const {
  follow,
  followCount,
  follower,
  following,
  unFollow,
  removeFollower,
} = require("../../Controller/User/followerController");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyUserJWT);

router.post("/follow", follow);
router.get("/followCount", followCount);
router.get("/follower", follower);
router.get("/following", following);
router.delete("/unFollow", unFollow);
router.delete("/removeFollower", removeFollower);

module.exports = router;
