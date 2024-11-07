const {
  validateExperience,
} = require("../../Middleware/Validation/userProfileValidation");
const { FirmCompany } = require("../../Model/Master/firmModel");
const { JobTitle } = require("../../Model/Master/jobTitleModel");
const { Experience } = require("../../Model/User/Experience/experienceModel");
const {
  ExperienceUpdationHistory,
} = require("../../Model/User/Experience/experienceUpdationHistoryModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addExperience = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateExperience(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { startDate, endDate, isRecent, isOngoing, description } = req.body;
    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );
    const jobTitle = capitalizeFirstLetter(
      req.body.jobTitle.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Create this job title if not exist
    await JobTitle.findOneAndUpdate(
      { name: jobTitle },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Change according to isOngoing and isRecent
    if (isOngoing) {
      await Experience.updateMany(
        { isDelete: false, user: req.user._id },
        { $set: { isOngoing: false, isRecent: false } }
      );
    } else if (isRecent) {
      await Experience.updateMany(
        { isDelete: false, user: req.user._id },
        { $set: { isOngoing: false, isRecent: false } }
      );
    }
    // Store experience
    await Experience.create({
      jobTitle,
      firmName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isRecent,
      isOngoing,
      description,
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

exports.getMyExperience = async (req, res) => {
  try {
    const experience = await Experience.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Experience fetched successfully!",
      data: experience,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getExperienceById = async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Experience fetched successfully!",
      data: experience,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateExperience(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { startDate, endDate, isRecent, isOngoing, description } = req.body;
    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );
    const jobTitle = capitalizeFirstLetter(
      req.body.jobTitle.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await JobTitle.findOneAndUpdate(
      { name: jobTitle },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const _id = req.params.id;

    const experience = await Experience.findOne({
      _id,
      isDelete: false,
    });
    if (!experience) {
      return res.status(400).json({
        success: false,
        message: "This experience is not present!",
      });
    }

    // Change according to isOngoing and isRecent
    if (isOngoing) {
      await Experience.updateMany(
        { isDelete: false, user: req.user._id },
        { $set: { isOngoing: false, isRecent: false } }
      );
    } else if (isRecent) {
      await Experience.updateMany(
        { isDelete: false, user: req.user._id },
        { $set: { isOngoing: false, isRecent: false } }
      );
    }

    // Store History
    if (req.user.role === "Advocate" && req.user.isProfileVisible) {
      await ExperienceUpdationHistory.create({
        jobTitle: experience.jobTitle,
        firmName: experience.firmName,
        startDate: experience.startDate,
        endDate: experience.endDate,
        user: req.user._id,
        experience: experience._id,
        isRecent: experience.isRecent,
        isOngoing: experience.isOngoing,
        description: experience.description,
      });
    }

    // Update Collection
    await experience.updateOne({
      jobTitle,
      firmName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isRecent,
      isOngoing,
      description,
    });
    res.status(200).json({
      success: true,
      message: "Experience Updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteExperience = async (req, res) => {
  try {
    // return;
    const _id = req.params.id;

    const experience = await Experience.findOne({
      _id,
      isDelete: false,
    });
    if (!experience) {
      return res.status(400).json({
        success: false,
        message: "This experience is not present!",
      });
    }

    // Update is
    if (req.user.role === "Advocate" && req.user.isProfileVisible) {
      await experience.updateOne({
        isDelete: true,
        deleted_at: new Date(),
      });
    } else {
      await ExperienceUpdationHistory.deleteMany({
        user: req.user._id,
        experience: experience._id,
      });
      await experience.deleteOne();
    }
    res.status(200).json({
      success: true,
      message: "Experience deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
