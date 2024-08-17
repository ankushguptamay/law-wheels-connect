const {
  validatePracticeArea,
} = require("../../Middleware/Validation/masterValidation");
const { PracticeArea } = require("../../Model/Master/practiceAreaModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addPracticeArea = async (req, res) => {
  try {
    // Body Validation
    const { error } = validatePracticeArea(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const practiceArea = capitalizeFirstLetter(
      req.body.practiceArea.replace(/\s+/g, " ").trim()
    );

    const area = await PracticeArea.findOne({ name: practiceArea });
    if (area) {
      return res.status(400).json({
        success: false,
        message: `${practiceArea} is already present!`,
      });
    }

    // Create area
    await PracticeArea.create({ name: practiceArea });
    res.status(200).json({
      success: true,
      message: "Practice Area added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPracticeArea = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = {};
    if (req.query.search) {
      const startWith = new RegExp("^" + req.query.search.toLowerCase(), "i");
      query = { name: startWith };
    }
    const [area, totalArea] = await Promise.all([
      PracticeArea.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      PracticeArea.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalArea / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      message: "Practice Area fetched successfully!",
      data: area,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updatePracticeArea = async (req, res) => {
  try {
    // Body Validation
    const { error } = validatePracticeArea(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const practiceArea = capitalizeFirstLetter(
      req.body.practiceArea.replace(/\s+/g, " ").trim()
    );

    const area = await PracticeArea.findOne({ _id: req.params.id });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: `${practiceArea} is not present!`,
      });
    }

    if (practiceArea !== area.name) {
      const area = await PracticeArea.findOne({
        name: practiceArea,
      });
      if (area) {
        return res.status(400).json({
          success: false,
          message: `${practiceArea} is already present!`,
        });
      }
    }

    // update
    await area.updateOne({ name: practiceArea });
    res.status(200).json({
      success: true,
      message: "Practice Area updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deletePracticeArea = async (req, res) => {
  try {
    const area = await PracticeArea.findOne({ _id: req.params.id });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: `This practice area is already present!`,
      });
    }

    // delete
    await area.deleteOne();

    res.status(200).json({
      success: true,
      message: "Practice Area deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
