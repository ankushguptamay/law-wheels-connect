const express = require("express");
const router = express.Router();

const master = require("./master");

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

router.use(master);

module.exports = router;
