const express = require("express");
const router = express.Router();

const blog = require("./blogRoute");

const {
  getBolger,
  registerBlogger,
  loginBlogger,
  refreshAccessToken,
  logout,
} = require("../../Controller/Blog/bloggerController");

//middleware
const { verifyBloggerJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerBlogger);
router.post("/login", loginBlogger);
router.post("/refresh", refreshAccessToken);
router.get("/", verifyBloggerJWT, getBolger);
router.put("/logout", verifyBloggerJWT, logout);

router.use("/blog", blog);

module.exports = router;
