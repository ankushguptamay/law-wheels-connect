const express = require("express");
const router = express.Router();

const {
  getDictionary,
  updateDictionaryWord,
  deleteDictionaryWord,
  addDictionaryWord,
  getWordDetails,
} = require("../../Controller/Law_study/dictionaryController");
const {
  getArticleDetails,
  getChapterOrArticle,
  getPart,
  addArticle,
  updateArticle,
  deleteArticle,
  channgeArticleOrder,
} = require("../../Controller/Law_study/constitutionController");

// Dictionary
router.post("/dictionries", addDictionaryWord);
router.get("/dictionries", getDictionary);
router.get("/dictionries/:id", getWordDetails);
router.put("/dictionries/:id", updateDictionaryWord);
router.delete("/dictionries/:id", deleteDictionaryWord);

// Constitution
router.post("/articles", addArticle);
router.get("/parts", getPart);
router.get("/articles/:article_order", getArticleDetails);
router.get("/chapterOrArticle/:part_number_romanise", getChapterOrArticle);
router.put("/articles/:_id", updateArticle);
router.put("/reorder_articles/:_id", channgeArticleOrder);
router.delete("/articles/:_id", deleteArticle);

module.exports = router;
