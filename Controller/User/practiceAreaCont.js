const {
  validateUserPracticeArea,
} = require("../../Middleware/Validation/userProfileValidation");
const { PracticeArea } = require("../../Model/Master/practiceAreaModel");
const { UserPracticeArea } = require("../../Model/User/areaOfPracticeModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addPracticeArea = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserPracticeArea(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const practiceArea = capitalizeFirstLetter(
      req.body.practiceArea.replace(/\s+/g, " ").trim()
    );
    // Create this practice Area if not exist
    await PracticeArea.findOneAndUpdate(
      { name: practiceArea },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store user practice Area
    await UserPracticeArea.create({
      practiceArea,
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Practice area added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyPracticeArea = async (req, res) => {
  try {
    const practice = await UserPracticeArea.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Practice Area fetched successfully!",
      data: practice,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPracticeAreaById = async (req, res) => {
  try {
    const practice = await UserPracticeArea.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Practice area fetched successfully!",
      data: practice,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeletePracticeArea = async (req, res) => {
  try {
    // return;
    const _id = req.params.id;

    const practice = await UserPracticeArea.findOne({
      _id,
      isDelete: false,
    });
    if (!practice) {
      return res.status(400).json({
        success: false,
        message: "This practice area is not present!",
      });
    }
    // Update is
    await practice.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Practice area deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
