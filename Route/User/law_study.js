const express = require("express");
const router = express.Router();

const {
  getDictionary,
  getWordDetails,
} = require("../../Controller/Law_study/dictionaryController");

const {
  addWordInSearch,
  myRecentWordSearchs,
  popularWordSearchs,
} = require("../../Controller/Law_study/dictionarySearchController");

// Dictionary
router.get("/dictionries", getDictionary);
router.get("/dictionries/:id", getWordDetails);

// Search
router.post("/addWordInSearch", addWordInSearch);
router.get("/myRecentWordSearchs", myRecentWordSearchs);
router.get("/popularWordSearchs", popularWordSearchs);

module.exports = router;
