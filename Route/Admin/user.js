const express = require("express");
const router = express.Router();

const { getAllUserForAdmin } = require("../../Controller/User/userCont");

router.get("/", getAllUserForAdmin);

module.exports = router;
