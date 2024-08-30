const express = require("express");
const router = express.Router();

const blog = require("./blogRoute");

const {
  getBolger,
  registerBlogger,
  logOut,
  loginBlogger,
} = require("../../Controller/Blog/bloggerController");

//middleware
const { verifyBloggerJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerBlogger);
router.post("/login", loginBlogger);
router.get("/logOut", logOut);
router.get("/", verifyBloggerJWT, getBolger);

router.use(blog);

module.exports = router;
