const express = require("express");
const router = express.Router();

const {
  addFirm,
  deleteFirm,
  updateFirm,
} = require("../../Controller/Master/firm_companyCont");
const {
  addSchoolUniversity,
  updateSchoolUniversity,
  deleteSchoolUniversity,
} = require("../../Controller/Master/school_universityCont");
const {
  addJobTitle,
  updateJobTitle,
  deleteJobTitle,
} = require("../../Controller/Master/jobTitleController");
const {
  addPracticeArea,
  updatePracticeArea,
  deletePracticeArea,
} = require("../../Controller/Master/practiceAreaCont");
const {
  addSpecialization,
  updateSpecialization,
  deleteSpecialization,
} = require("../../Controller/Master/specializationCont");
const {
  addSkill,
  updateSkill,
  deleteSkill,
} = require("../../Controller/Master/skillController");

const uploadImage = require("../../Middleware/UploadFile/image");

// practice area
router.post("/practiceArea", addPracticeArea);
router.put("/practiceArea/:id", updatePracticeArea);
router.delete("/practiceArea/:id", deletePracticeArea);

// specialization
router.post("/specialization", addSpecialization);
router.put("/specialization/:id", updateSpecialization);
router.delete("/specialization/:id", deleteSpecialization);

// Firm
router.post("/firm", uploadImage.single("FirmImage"), addFirm);
router.put("/firm/:id", uploadImage.single("FirmImage"), updateFirm);
router.delete("/firm/:id", deleteFirm);

// School
router.post(
  "/schoolUniversity",
  uploadImage.single("SchoolImage"),
  addSchoolUniversity
);
router.put(
  "/schoolUniversity/:id",
  uploadImage.single("SchoolImage"),
  updateSchoolUniversity
);
router.delete("/schoolUniversity/:id", deleteSchoolUniversity);

// Job title
router.post("/jobTitle", addJobTitle);
router.put("/jobTitle/:id", updateJobTitle);
router.delete("/jobTitle/:id", deleteJobTitle);

// Job title
router.post("/skill", addSkill);
router.put("/skill/:id", updateSkill);
router.delete("/skill/:id", deleteSkill);

module.exports = router;
