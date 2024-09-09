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
  categorySlug,
  parentCategorySlug,
} = require("../../Controller/Blog/categoryController");
const {
  addTag,
  getTag,
  updateTag,
  deleteTag,
  tagSlug,
} = require("../../Controller/Blog/tagsController");
const {
  createBlog,
  addAdditionalPic,
  deleteAdditionalPic,
  deleteFeaturedPic,
  addUpdateFeaturedPic,
  updateBlog,
  deleteBlog,
  blogSlug,
  getBlogs,
  getBlogBySlug,
} = require("../../Controller/Blog/blogController");

//middleware
const { verifyBloggerJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyBloggerJWT);

router.post("/categories", uploadImage.single("CategoryPic"), addCategories);
router.get("/categories", verifyBloggerJWT, getCategories);
router.put(
  "/categories/:id",
  uploadImage.single("CategoryPic"),
  updateCategories
);
router.delete("/categories/:id", verifyBloggerJWT, deleteCategories);

router.post(
  "/parentCategories",
  uploadImage.single("CategoryPic"),
  addParentCategories
);
router.get("/parentCategories", verifyBloggerJWT, getParentCategories);
router.put(
  "/parentCategories/:id",
  uploadImage.single("CategoryPic"),
  updateParentCategories
);
router.delete(
  "/parentCategories/:id",
  verifyBloggerJWT,
  deleteParentCategories
);
router.put("/categorySlug", categorySlug);
router.put("/parentCategorySlug", parentCategorySlug);

router.post("/tag", addTag);
router.get("/tag", verifyBloggerJWT, getTag);
router.put("/tag/:id", updateTag);
router.delete("/tag/:id", verifyBloggerJWT, deleteTag);
router.put("/tagSlug", tagSlug);

router.post(
  "/blog",
  uploadImage.fields([
    { name: "FeaturedPic", maxCount: 1 },
    { name: "AdditionalPic", maxCount: 20 },
  ]),
  createBlog
);
router.get("/blog", getBlogs);
router.get("/blog/:slug", getBlogBySlug);
router.put(
  "/featuredPic/:id",
  uploadImage.single("FeaturedPic"),
  addUpdateFeaturedPic
);
router.delete("/featuredPic/:id", deleteFeaturedPic);
router.put(
  "/additionalPic/:id",
  uploadImage.array("AdditionalPic", 20),
  addAdditionalPic
);
router.delete("/additionalPic/:id", deleteAdditionalPic);
router.put("/blog/:id", updateBlog);
router.delete("/blog/:id", deleteBlog);
router.put("/blogSlug", blogSlug);
module.exports = router;
