const {
  validateFirm,
} = require("../../Middleware/Validation/masterValidation");
const { FirmCompany } = require("../../Model/Master/firmModel");
const {
  capitalizeFirstLetter,
  deleteSingleFile,
} = require("../../Util/utility");

exports.addFirm = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateFirm(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );

    const firm = await FirmCompany.findOne({ name: firmName });
    if (firm) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `${firmName} is already present!`,
      });
    }

    let data = { name: firmName };
    if (req.file) {
      data = {
        name: firmName,
        firmPic: {
          fileName: req.file.filename,
          url: req.file.path,
        },
      };
    }
    // Create this firm if not exist
    await FirmCompany.create(data);
    res.status(200).json({
      success: true,
      message: "Firm added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getFirm = async (req, res) => {
  try {
    const frim = await FirmCompany.find();
    res.status(200).json({
      success: true,
      message: "Firm fetched successfully!",
      data: frim,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateFirm = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateFirm(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );

    const firm = await FirmCompany.findOne({ _id: req.params.id });
    if (!firm) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `${firmName} is not present!`,
      });
    }

    if (firmName !== firm.name) {
      const firm = await FirmCompany.findOne({ name: firmName });
      if (firm) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `${firmName} is already present!`,
        });
      }
    }

    let updateData = { name: firmName };
    if (req.file) {
      updateData = {
        name: firmName,
        firmPic: {
          fileName: req.file.filename,
          url: req.file.path,
        },
      };
      if (firm.firmPic.url) {
        deleteSingleFile(firm.firmPic.url);
      }
    }

    // update
    await firm.updateOne(updateData);
    res.status(200).json({
      success: true,
      message: "Firm updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteFirm = async (req, res) => {
  try {
    const firm = await FirmCompany.findOne({ _id: req.params.id });
    if (!firm) {
      return res.status(400).json({
        success: false,
        message: `This firm is already present!`,
      });
    }

    if (firm.firmPic.url) {
      deleteSingleFile(firm.firmPic.url);
    }

    // delete
    await firm.deleteOne();

    res.status(200).json({
      success: true,
      message: "Firm deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
