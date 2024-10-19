const express = require("express");
const router = express.Router();

const {
  register,
  loginByMobile,
  verifyMobileOTP,
  rolePage,
} = require("../../Controller/User/userCont");

// Middle
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", register);
router.post("/loginByMobile", loginByMobile);
router.post("/verifyMobileOTP", verifyMobileOTP);

router.put("/rolePage", verifyUserJWT, rolePage);

module.exports = router;
