const { Education } = require("../../Model/User/Education/educationModel");
const {
  EducationUpdationHistory,
} = require("../../Model/User/Education/educationUpdationHistoryModel");
const {
  SchoolUniversity,
} = require("../../Model/Master/school_universityModel");
const {
  validateEducation,
} = require("../../Middleware/Validation/educationValidation");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addEducation = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateEducation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {
      degreeType,
      fieldOfStudy,
      grade,
      startDate,
      endDate,
      activities,
      isRecent,
      isOngoing,
    } = req.body;
    const school_university = capitalizeFirstLetter(
      req.body.school_university.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await SchoolUniversity.findOneAndUpdate(
      { name: school_university },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store education
    await Education.create({
      school_university,
      degreeType,
      fieldOfStudy,
      grade,
      startDate,
      endDate,
      activities,
      isRecent,
      isOngoing,
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Education added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyEducation = async (req, res) => {
  try {
    const education = await Education.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Education fetched successfully!",
      data: education,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getEducationById = async (req, res) => {
  try {
    const education = await Education.findOne({
      _id: req.params.id,
    }).populate("user");
    res.status(200).json({
      success: true,
      message: "Education fetched successfully!",
      data: education,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateEducation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      degreeType,
      fieldOfStudy,
      grade,
      startDate,
      endDate,
      activities,
      isRecent,
      isOngoing,
    } = req.body;
    const school_university = capitalizeFirstLetter(
      req.body.school_university.replace(/\s+/g, " ").trim()
    );
    const _id = req.params.id;

    const education = await Education.findOne({
      _id,
    });
    if (!education) {
      return res.status(400).json({
        success: false,
        message: "This education is not present!",
      });
    }
    // Create this firm if not exist
    await SchoolUniversity.findOneAndUpdate(
      { name: school_university },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store History
    await EducationUpdationHistory.create({
      school_university: education.school_university,
      degreeType: education.degreeType,
      fieldOfStudy: education.fieldOfStudy,
      grade: education.grade,
      startDate: education.startDate,
      endDate: education.endDate,
      activities: education.activities,
      user: req.user._id,
      education: education._id,
      isRecent: education.isRecent,
      isOngoing: education.isOngoing,
    });

    // Update Collection
    await education.updateOne({
      school_university,
      degreeType,
      fieldOfStudy,
      grade,
      startDate,
      endDate,
      activities,
      isRecent,
      isOngoing,
    });
    res.status(200).json({
      success: true,
      message: "Education Updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteEducation = async (req, res) => {
  try {
    // return;
    const _id = req.params.id;

    const education = await Education.findOne({
      _id,
      isDelete: false,
    });
    if (!education) {
      return res.status(400).json({
        success: false,
        message: "This education is not present!",
      });
    }
    // Update is
    await education.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Education deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
