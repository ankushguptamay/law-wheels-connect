const express = require("express");
const router = express.Router();

const {
  addCategories,
  addParentCategories,
  getCategories,
  getParentCategories,
  updateCategories,
  updateParentCategories,
  deleteCategories,
  deleteParentCategories,
} = require("../../Controller/Blog/categoryController");
const {
  addTag,
  getTag,
  updateTag,
  deleteTag,
} = require("../../Controller/Blog/tagsController");
const { createBlog } = require("../../Controller/Blog/blogController");

//middleware
const { verifyBlogerJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyBlogerJWT);

router.post("/categories", uploadImage.single("CategoryPic"), addCategories);
router.get("/categories", verifyBlogerJWT, getCategories);
router.put(
  "/categories/:id",
  uploadImage.single("CategoryPic"),
  updateCategories
);
router.delete("/categories/:id", verifyBlogerJWT, deleteCategories);

router.post(
  "/parentCategories",
  uploadImage.single("CategoryPic"),
  addParentCategories
);
router.get("/parentCategories", verifyBlogerJWT, getParentCategories);
router.put(
  "/parentCategories/:id",
  uploadImage.single("CategoryPic"),
  updateParentCategories
);
router.delete("/parentCategories/:id", verifyBlogerJWT, deleteParentCategories);

router.post("/tag", addTag);
router.get("/tag", verifyBlogerJWT, getTag);
router.put("/tag/:id", updateTag);
router.delete("/tag/:id", verifyBlogerJWT, deleteTag);

// router.post(
//   "/blog",
//   uploadImage.fields([
//     { name: "FeaturedPic", maxCount: 1 },
//     { name: "AddititionalPic", maxCount: 20 },
//   ]),
//   createBlog
// );

module.exports = router;
