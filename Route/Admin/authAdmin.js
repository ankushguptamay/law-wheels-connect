const express = require("express");
const router = express.Router();

const {
  getAdmin,
  registerAdmin,
  loginAdmin,
  logOut,
} = require("../../Controller/Admin/adminCont");

//middleware
const { verifyAdminJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logOut", logOut);
router.get("/", verifyAdminJWT, getAdmin);

module.exports = router;
