const {
  validateSpecialization,
} = require("../../Middleware/Validation/masterValidation");
const { Specialization } = require("../../Model/Master/specializationModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addSpecialization = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSpecialization(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );

    const special = await Specialization.findOne({ name });
    if (special) {
      return res.status(400).json({
        success: false,
        message: `${name} is already present!`,
      });
    }

    // Create
    await Specialization.create({ name });
    res.status(200).json({
      success: true,
      message: "Specialization added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSpecialization = async (req, res) => {
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
      Specialization.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Specialization.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalArea / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      message: "Specialization fetched successfully!",
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

exports.updateSpecialization = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSpecialization(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );

    const area = await Specialization.findOne({ _id: req.params.id });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: `${name} is not present!`,
      });
    }

    if (name !== area.name) {
      const area = await Specialization.findOne({ name });
      if (area) {
        return res.status(400).json({
          success: false,
          message: `${name} is already present!`,
        });
      }
    }

    // update
    await area.updateOne({ name });
    res.status(200).json({
      success: true,
      message: "Specialization updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteSpecialization = async (req, res) => {
  try {
    const area = await Specialization.findOne({ _id: req.params.id });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: `This specialization is already present!`,
      });
    }

    // delete
    await area.deleteOne();

    res.status(200).json({
      success: true,
      message: "Specialization deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
