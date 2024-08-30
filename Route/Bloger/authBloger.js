const express = require("express");
const router = express.Router();

const blog = require("./blogRoute");

const {
  getBolger,
  registerBloger,
  logOut,
  loginBloger,
} = require("../../Controller/Blog/blogerController");

//middleware
const { verifyBlogerJWT } = require("../../Middleware/verifyJWTToken");

router.post("/register", registerBloger);
router.post("/login", loginBloger);
router.post("/logOut", logOut);
router.get("/", verifyBlogerJWT, getBolger);

router.use(blog);

module.exports = router;
