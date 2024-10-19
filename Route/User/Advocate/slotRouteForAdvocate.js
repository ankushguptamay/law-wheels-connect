const express = require("express");
const router = express.Router();

const {
  createSlote,
  mySloteForAdvocate,
  deactivateSlote,
  deleteSlote,
} = require("../../../Controller/User/Slot/slotController.js");

//middleware
const { verifyUserJWT } = require("../../../Middleware/verifyJWTToken.js");

router.use(verifyUserJWT, (req, res, next) => {
  if (req.user.role !== "Advocate") {
    return res.status(400).json({
      success: false,
      message: "You are not allowed to do this functionality!",
    });
  } else {
    next();
  }
});

router.post("/slot", createSlote);
router.get("/slot", mySloteForAdvocate);
router.put("/slot/:id", deactivateSlote);
router.delete("/slot/:id", deleteSlote);

module.exports = router;
