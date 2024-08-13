const express = require("express");
const router = express.Router();

const {
  addEducation,
  getEducationById,
  getMyEducation,
  updateEducation,
  softDeleteEducation,
} = require("../../Controller/User/educationCont");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyUserJWT);

router.post("/education", addEducation);
router.get("/education/:id", getEducationById);
router.get("/education", getMyEducation);
router.put("/education/:id", updateEducation);
router.delete("/softEducation/:id", softDeleteEducation);

module.exports = router;
