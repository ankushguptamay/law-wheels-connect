const express = require("express");
const router = express.Router();

const {
  getDictionary,
  updateDictionaryWord,
  deleteDictionaryWord,
  addDictionaryWord,
  getWordDetails,
} = require("../../Controller/Law_study/dictionaryController");

// Dictionary
router.post("/dictionries", addDictionaryWord);
router.get("/dictionries", getDictionary);
router.get("/dictionries/:id", getWordDetails);
router.put("/dictionries/:id", updateDictionaryWord);
router.delete("/dictionries/:id", deleteDictionaryWord);

module.exports = router;
