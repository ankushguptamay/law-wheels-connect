const express = require("express");
const router = express.Router();

const {
  register,
  loginByMobile,
  verifyMobileOTP,
  rolePage,
  refreshAccessToken,
  logout,
} = require("../../Controller/User/userCont");
const chat = require("./chatRoute");

// Middle
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", register);
router.post("/loginByMobile", loginByMobile);
router.post("/verifyMobileOTP", verifyMobileOTP);
router.post("/refresh", refreshAccessToken);

router.put("/logout", verifyUserJWT, logout);
router.put("/rolePage", verifyUserJWT, rolePage);

router.use("/chat", verifyUserJWT, chat);

module.exports = router;
