const express = require("express");
const router = express.Router();

const master = require("./master");
const user = require("./user");

const {
  getAdmin,
  registerAdmin,
  loginAdmin,
} = require("../../Controller/Admin/adminCont");

//middleware
const { verifyAdminJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.use(verifyAdminJWT);
router.get("/", getAdmin);

router.use("/mst", master);
router.use("/users", user);

module.exports = router;
