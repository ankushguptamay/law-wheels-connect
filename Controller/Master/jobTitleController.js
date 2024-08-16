const {
  validateJobTitle,
} = require("../../Middleware/Validation/masterValidation");
const { JobTitle } = require("../../Model/Master/jobTitleModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addJobTitle = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateJobTitle(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const jobTitle = capitalizeFirstLetter(
      req.body.jobTitle.replace(/\s+/g, " ").trim()
    );

    const title = await JobTitle.findOne({ name: jobTitle });
    if (title) {
      return res.status(400).json({
        success: false,
        message: `${jobTitle} is already present!`,
      });
    }

    // Create job title
    await JobTitle.create({ name: jobTitle });
    res.status(200).json({
      success: true,
      message: "Job title added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getJobTitle = async (req, res) => {
  try {
    const title = await JobTitle.find();
    res.status(200).json({
      success: true,
      message: "Job Title fetched successfully!",
      data: title,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateJobTitle = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateJobTitle(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const jobTitle = capitalizeFirstLetter(
      req.body.jobTitle.replace(/\s+/g, " ").trim()
    );

    const title = await JobTitle.findOne({ _id: req.params.id });
    if (!title) {
      return res.status(400).json({
        success: false,
        message: `${jobTitle} is not present!`,
      });
    }

    if (jobTitle !== title.name) {
      const title = await JobTitle.findOne({
        name: jobTitle,
      });
      if (title) {
        return res.status(400).json({
          success: false,
          message: `${jobTitle} is already present!`,
        });
      }
    }

    // update
    await title.updateOne({ name: jobTitle });
    res.status(200).json({
      success: true,
      message: "Job Title updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteJobTitle = async (req, res) => {
  try {
    const title = await JobTitle.findOne({ _id: req.params.id });
    if (!title) {
      return res.status(400).json({
        success: false,
        message: `This job title is already present!`,
      });
    }

    // delete
    await title.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job Title deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
