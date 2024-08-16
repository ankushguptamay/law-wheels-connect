const express = require("express");
const router = express.Router();

const {
  addFirm,
  getFirm,
  deleteFirm,
  updateFirm,
} = require("../../Controller/Master/firm_companyCont");
const {
  addSchoolUniversity,
  getSchoolUniversity,
  updateSchoolUniversity,
  deleteSchoolUniversity,
} = require("../../Controller/Master/school_universityCont");
const {
  addJobTitle,
  getJobTitle,
  updateJobTitle,
  deleteJobTitle,
} = require("../../Controller/Master/jobTitleController");
const {
  addPracticeArea,
  getPracticeArea,
  updatePracticeArea,
  deletePracticeArea,
} = require("../../Controller/Master/practiceAreaCont");
const {
  addSkill,
  getSkill,
  updateSkill,
  deleteSkill,
} = require("../../Controller/Master/skillController");

//middleware
const { verifyAdminJWT } = require("../../Middleware/verifyJWTToken");
const uploadImage = require("../../Middleware/UploadFile/image");

router.use(verifyAdminJWT);

// practice area
router.post("/practiceArea", addPracticeArea);
router.get("/practiceArea", getPracticeArea);
router.put("/practiceArea/:id", updatePracticeArea);
router.delete("/practiceArea/:id", deletePracticeArea);

// Firm
router.post("/firm", uploadImage.single("FirmImage"), addFirm);
router.get("/firm", getFirm);
router.put("/firm/:id", uploadImage.single("FirmImage"), updateFirm);
router.delete("/firm/:id", deleteFirm);

// School
router.post(
  "/schoolUniversity",
  uploadImage.single("SchoolImage"),
  addSchoolUniversity
);
router.get("/schoolUniversity", getSchoolUniversity);
router.put(
  "/schoolUniversity/:id",
  uploadImage.single("SchoolImage"),
  updateSchoolUniversity
);
router.delete("/schoolUniversity/:id", deleteSchoolUniversity);

// Job title
router.post("/jobTitle", addJobTitle);
router.get("/jobTitle", getJobTitle);
router.put("/jobTitle/:id", updateJobTitle);
router.delete("/jobTitle/:id", deleteJobTitle);

// Job title
router.post("/skill", addSkill);
router.get("/skill", getSkill);
router.put("/skill/:id", updateSkill);
router.delete("/skill/:id", deleteSkill);

module.exports = router;
