const express = require("express");
const router = express.Router();

const {
  follow,
  followCount,
  follower,
  following,
  unFollow,
  removeFollower,
  getFollowerAnalytics,
  followerOfOther,
  followingOfOther,
} = require("../../Controller/User/Connection/followerController");
const {
  sendConnectionRequest,
  getMyConnection,
  acceptConnect,
} = require("../../Controller/User/Connection/connectionCont");

router.post("/follow", follow);
router.get("/followCount", followCount);
router.get("/follower", follower);
router.get("/following", following);
router.get("/followerOfOther", followerOfOther);
router.get("/followingOfOther", followingOfOther);
router.put("/unFollow", unFollow);
router.put("/removeFollower", removeFollower);
router.get("/followerAnalytics", getFollowerAnalytics);

router.post("/connection", sendConnectionRequest);
router.get("/connection", getMyConnection);
router.put("/connection", acceptConnect);

module.exports = router;
