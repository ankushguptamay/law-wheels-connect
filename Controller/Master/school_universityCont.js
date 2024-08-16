const {
  validateSchoolUniversity,
} = require("../../Middleware/Validation/masterValidation");
const {
  SchoolUniversity,
} = require("../../Model/Master/school_universityModel");
const {
  capitalizeFirstLetter,
  deleteSingleFile,
} = require("../../Util/utility");

exports.addSchoolUniversity = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSchoolUniversity(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const school_university = capitalizeFirstLetter(
      req.body.school_university.replace(/\s+/g, " ").trim()
    );

    const school = await SchoolUniversity.findOne({ name: school_university });
    if (school) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `${school_university} is already present!`,
      });
    }

    let data = { name: school_university };
    if (req.file) {
      data = {
        name: school_university,
        image: {
          fileName: req.file.filename,
          url: req.file.path,
        },
      };
    }
    // Create School University
    await SchoolUniversity.create(data);
    res.status(200).json({
      success: true,
      message: "School/University added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSchoolUniversity = async (req, res) => {
  try {
    const school = await SchoolUniversity.find();
    res.status(200).json({
      success: true,
      message: "School/University fetched successfully!",
      data: school,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateSchoolUniversity = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSchoolUniversity(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const school_university = capitalizeFirstLetter(
      req.body.school_university.replace(/\s+/g, " ").trim()
    );

    const school = await SchoolUniversity.findOne({ _id: req.params.id });
    if (!school) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `${school_university} is not present!`,
      });
    }

    if (school_university !== school.name) {
      const school = await SchoolUniversity.findOne({
        name: school_university,
      });
      if (school) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `${school_university} is already present!`,
        });
      }
    }

    let updateData = { name: school_university };
    if (req.file) {
      updateData = {
        name: school_university,
        image: {
          fileName: req.file.filename,
          url: req.file.path,
        },
      };
      if (school.image.url) {
        deleteSingleFile(school.image.url);
      }
    }

    // update
    await school.updateOne(updateData);
    res.status(200).json({
      success: true,
      message: "School/University updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteSchoolUniversity = async (req, res) => {
  try {
    const school = await SchoolUniversity.findOne({ _id: req.params.id });
    if (!school) {
      return res.status(400).json({
        success: false,
        message: `This school/university is already present!`,
      });
    }

    if (school.image.url) {
      deleteSingleFile(school.image.url);
    }

    // delete
    await school.deleteOne();

    res.status(200).json({
      success: true,
      message: "School/University deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
