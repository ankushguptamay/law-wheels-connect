const express = require("express");
const router = express.Router();

const {} = require("../../Controller/Master/firm_companyCont");
const {} = require("../../Controller/Master/school_universityCont");

//middleware
const { verifyAdminJWT } = require("../../Middleware/verifyJWTToken");

router.use(verifyAdminJWT);

// router.post("/register", registerAdmin);

module.exports = router;
