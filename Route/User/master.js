const express = require("express");
const router = express.Router();

const { getFirm } = require("../../Controller/Master/firm_companyCont");
const {
  getSchoolUniversity,
} = require("../../Controller/Master/school_universityCont");
const { getJobTitle } = require("../../Controller/Master/jobTitleController");
const { getPracticeArea } = require("../../Controller/Master/practiceAreaCont");
const {
  getSpecialization,
} = require("../../Controller/Master/specializationCont");
const { getSkill } = require("../../Controller/Master/skillController");

// practice area
router.get("/practiceArea", getPracticeArea);
// specialization
router.get("/specialization", getSpecialization);
// Firm
router.get("/firm", getFirm);
// School
router.get("/schoolUniversity", getSchoolUniversity);
// Job title
router.get("/jobTitle", getJobTitle);
// Job title
router.get("/skill", getSkill);

module.exports = router;
