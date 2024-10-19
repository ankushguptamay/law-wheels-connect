const express = require("express");
const router = express.Router();

const blog = require("./blogRoute");

const {
  getBolger,
  registerBlogger,
  loginBlogger,
} = require("../../Controller/Blog/bloggerController");

//middleware
const { verifyBloggerJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerBlogger);
router.post("/login", loginBlogger);
router.get("/", verifyBloggerJWT, getBolger);

router.use("/blog", blog);

module.exports = router;
