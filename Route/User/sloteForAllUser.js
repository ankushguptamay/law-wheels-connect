const express = require("express");
const router = express.Router();

const {
  sloteForUser,
  bookASlote,
  mySloteForUser,
  sloteByIdForUser,
} = require("../../Controller/User/Slot/slotController.js");

router.get("/slotForUser/:advocate", sloteForUser);
router.post("/bookSlot", bookASlote);
router.get("/myBookSlot", mySloteForUser);
router.get("/bookSlot/:id", sloteByIdForUser);

module.exports = router;
