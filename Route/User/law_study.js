const express = require("express");
const router = express.Router();

const {
  getDictionary,
  getWordDetails,
} = require("../../Controller/Law_study/dictionaryController");

// Dictionary
router.get("/dictionries", getDictionary);
router.get("/dictionries/:id", getWordDetails);

module.exports = router;
