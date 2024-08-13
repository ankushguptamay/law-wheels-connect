const {
  validateExperience,
} = require("../../Middleware/Validation/experienceValidation");
const { FirmCompany } = require("../../Model/Master/firmModel");
const { Experience } = require("../../Model/User/Experience/experienceModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addEducation = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateExperience(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { jobTitle, startDate, endDate, isRecent, isOngoing } = req.body;
    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store education
    await Experience.create({
      jobTitle,
      firmName,
      startDate,
      endDate,
      isRecent,
      isOngoing,
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Experience added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
