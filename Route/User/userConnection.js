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
} = require("../../Controller/User/Connection/followerController");
const {
  sendConnectionRequest,
  getMyConnection,
  acceptConnect,
} = require("../../Controller/User/Connection/connectionCont");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");

router.use(verifyUserJWT);

router.post("/follow", follow);
router.get("/followCount", followCount);
router.get("/follower", follower);
router.get("/following", following);
router.delete("/unFollow", unFollow);
router.delete("/removeFollower", removeFollower);
router.get("/followerAnalytics", getFollowerAnalytics);

router.post("/connection", sendConnectionRequest);
router.get("/connection", getMyConnection);
router.put("/connection", acceptConnect);

module.exports = router;
