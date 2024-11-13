const express = require("express");
const router = express.Router();

const {
  sloteForUser,
  bookASlote,
  mySloteForUser,
  sloteByIdForUser,
  cancelSloteForUser,
  rescheduleSloteForUser,
} = require("../../Controller/User/Slot/slotController.js");

router.get("/slotForUser/:advocate", sloteForUser);
router.post("/bookSlot", bookASlote);
router.get("/myBookSlot", mySloteForUser);
router.get("/bookSlot/:id", sloteByIdForUser);
router.put("/cancelSlot", cancelSloteForUser);
router.put("/rescheduleSlot", rescheduleSloteForUser);

module.exports = router;
