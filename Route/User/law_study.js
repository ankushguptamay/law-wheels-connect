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
router.get("/articles/:article_order", getArticleDetails);
router.get("/chapterOrArticle/:part_number_romanise", getChapterOrArticle);

module.exports = router;
