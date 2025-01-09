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

const {
  getArticleDetails,
  getChapterOrArticle,
  getPart,
} = require("../../Controller/Law_study/constitutionController");

// Dictionary
router.get("/dictionries", getDictionary);
router.get("/dictionries/:id", getWordDetails);

// Dictionary Search
router.post("/addWordInSearch", addWordInSearch);
router.get("/myRecentWordSearchs", myRecentWordSearchs);
router.get("/popularWordSearchs", popularWordSearchs);

// Constitution
router.get("/parts", getPart);
router.get("/articles", getArticleDetails);
router.get("/chapterOrArticle/:part_number_romanise", getChapterOrArticle);

module.exports = router;

[{_id:"h33h9h98h",order:1},{_id:"h33h9h98e",order:3},{_id:"h33h9h98g",order:2},{_id:"h33h9h986",order:4}]