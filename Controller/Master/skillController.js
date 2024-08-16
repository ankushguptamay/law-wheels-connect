const {
  validateSkill,
} = require("../../Middleware/Validation/masterValidation");
const { Skill } = require("../../Model/Master/skillModel");
const {
  capitalizeFirstLetter,
  deleteSingleFile,
} = require("../../Util/utility");

exports.addSkill = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSkill(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const skillName = capitalizeFirstLetter(
      req.body.skillName.replace(/\s+/g, " ").trim()
    );

    const skill = await Skill.findOne({ name: skillName });
    if (skill) {
      return res.status(400).json({
        success: false,
        message: `${skillName} is already present!`,
      });
    }

    // Create skill
    await Skill.create({ name: skillName });
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

exports.getSkill = async (req, res) => {
  try {
    const skill = await Skill.find();
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

exports.updateSkill = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSkill(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const skillName = capitalizeFirstLetter(
      req.body.skillName.replace(/\s+/g, " ").trim()
    );

    const skill = await Skill.findOne({ _id: req.params.id });
    if (!skill) {
      return res.status(400).json({
        success: false,
        message: `${skillName} is not present!`,
      });
    }

    if (skillName !== skill.name) {
      const skill = await Skill.findOne({
        name: skillName,
      });
      if (skill) {
        return res.status(400).json({
          success: false,
          message: `${skillName} is already present!`,
        });
      }
    }

    // update
    await skill.updateOne({ name: skillName });
    res.status(200).json({
      success: true,
      message: "Skill updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id });
    if (!skill) {
      return res.status(400).json({
        success: false,
        message: `This skill is already present!`,
      });
    }

    // delete
    await skill.deleteOne();

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