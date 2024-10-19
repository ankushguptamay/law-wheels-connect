const express = require("express");
const router = express.Router();

const {
  register,
  loginByMobile,
  verifyMobileOTP,
  rolePage,
} = require("../../Controller/User/userCont");

router.post("/register", register);
router.post("/loginByMobile", loginByMobile);
router.post("/verifyMobileOTP", verifyMobileOTP);

router.put("/rolePage", rolePage);

module.exports = router;
