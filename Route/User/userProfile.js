const express = require("express");
const router = express.Router();

const {
  addEducation,
  getEducationById,
  getMyEducation,
  updateEducation,
  softDeleteEducation,
} = require("../../Controller/User/educationCont");
const {
  addExperience,
  getExperienceById,
  getMyExperience,
  updateExperience,
  softDeleteExperience,
} = require("../../Controller/User/experienceController");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyUserJWT);

// Education
router.post("/education", addEducation);
router.get("/education/:id", getEducationById);
router.get("/education", getMyEducation);
router.put("/education/:id", updateEducation);
router.delete("/softEducation/:id", softDeleteEducation);

// Experience
router.post("/experience", addExperience);
router.get("/experience/:id", getExperienceById);
router.get("/experience", getMyExperience);
router.put("/experience/:id", updateExperience);
router.delete("/softExperience/:id", softDeleteExperience);

module.exports = router;
