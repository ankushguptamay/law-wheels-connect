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
const {
  addCertificate,
  getCertificateById,
  getMyCertificate,
  updateCertificate,
  softDeleteCertificate,
} = require("../../Controller/User/certificateCont");
const {
  addSkill,
  getSkillById,
  getMySkill,
  softDeleteSkill,
} = require("../../Controller/User/skillCont");
const {
  addPracticeArea,
  getMyPracticeArea,
  getPracticeAreaById,
  softDeletePracticeArea,
} = require("../../Controller/User/practiceAreaCont");
const {
  addMedia,
  getMyMedia,
  getMediaById,
  softDeleteMedia,
} = require("../../Controller/User/mediaController");
const {
  postImpression,
  getPostImpression,
} = require("../../Controller/User/Analytics/postImpressionCont");
const {
  profileViewer,
  getProfileViewer,
  getAnalytics,
} = require("../../Controller/User/Analytics/profileViewCont");

//middleware
const { verifyUserJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyUserJWT);

// Education
router.post("/education", addEducation);
router.get("/education/:id", getEducationById);
router.get("/education", getMyEducation);
router.put("/education/:id", updateEducation);
router.delete("/education/:id", softDeleteEducation); // soft delete

// Experience
router.post("/experience", addExperience);
router.get("/experience/:id", getExperienceById);
router.get("/experience", getMyExperience);
router.put("/experience/:id", updateExperience);
router.delete("/experience/:id", softDeleteExperience); // soft delete

// Certificate
router.post("/certificate", addCertificate);
router.get("/certificate/:id", getCertificateById);
router.get("/certificate", getMyCertificate);
router.put("/certificate/:id", updateCertificate);
router.delete("/certificate/:id", softDeleteCertificate); // soft delete

// skill
router.post("/skill", addSkill);
router.get("/skill/:id", getSkillById);
router.get("/skill", getMySkill);
router.delete("/skill/:id", softDeleteSkill); // soft delete

// practice area
router.post("/practiceArea", addPracticeArea);
router.get("/practiceArea/:id", getPracticeAreaById);
router.get("/practiceArea", getMyPracticeArea);
router.delete("/practiceArea/:id", softDeletePracticeArea); // soft delete

// media
router.post("/media", uploadImage.single("MediaPic"), addMedia);
router.get("/media/:id", getMediaById);
router.get("/media", getMyMedia);
router.delete("/media/:id", softDeleteMedia); // soft delete

// Profile View
router.post("/profileViewer", profileViewer);
router.get("/profileViewer", getProfileViewer);

// Post Impression
router.post("/postImpression", postImpression);
router.get("/postImpression", getPostImpression);

router.get("/getAnalytics", getAnalytics);

module.exports = router;
