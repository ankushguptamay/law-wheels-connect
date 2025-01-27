const {
  validateUserSkill,
} = require("../../Middleware/Validation/userProfileValidation");
const { Skill } = require("../../Model/Master/skillModel");
const { UserSkill } = require("../../Model/User/userSkillModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addSkill = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserSkill(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Capitalize First Letter
    const skills = req.body.skillName.map((skill) =>
      capitalizeFirstLetter(skill.replace(/\s+/g, " ").trim())
    );

    for (const skillName of skills) {
      // Create this skill if not exist
      await Skill.findOneAndUpdate(
        { name: skillName },
        { updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Store user skill
      await UserSkill.create({
        skillName,
        user: req.user._id,
      });
    }

    // Final Response
    res.status(200).json({
      success: true,
      message: "Skill added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMySkill = async (req, res) => {
  try {
    const skill = await UserSkill.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Skill fetched successfully!",
      data: skill,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const skill = await UserSkill.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Skill fetched successfully!",
      data: skill,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteSkill = async (req, res) => {
  try {
    // return;
    const _id = req.params.id;

    const skill = await UserSkill.findOne({
      _id,
      isDelete: false,
    });
    if (!skill) {
      return res.status(400).json({
        success: false,
        message: "This skill is not present!",
      });
    }
    // Update is
    await skill.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Skill deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
