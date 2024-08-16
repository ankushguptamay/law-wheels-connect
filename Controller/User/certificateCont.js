const {
  validateCertificate,
} = require("../../Middleware/Validation/userProfileValidation");
const { FirmCompany } = require("../../Model/Master/firmModel");
const {
  Certificate,
} = require("../../Model/User/Cretificate/certificateModel");
const {
  CertificateUpdationHistory,
} = require("../../Model/User/Cretificate/certificateUpdationHistoryModel");
const { capitalizeFirstLetter } = require("../../Util/utility");

exports.addCertificate = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateCertificate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { certificate_number, certificate_name, issueDate } = req.body;
    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store certificate
    await Certificate.create({
      certificate_name,
      certificate_number,
      firmName,
      issueDate,
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Certificate added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Certificate fetched successfully!",
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Certificate fetched successfully!",
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateCertificate = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateCertificate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { certificate_number, certificate_name, issueDate } = req.body;
    const firmName = capitalizeFirstLetter(
      req.body.firmName.replace(/\s+/g, " ").trim()
    );
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const _id = req.params.id;

    const certificate = await Certificate.findOne({
      _id,
      isDelete: false,
    });
    if (!certificate) {
      return res.status(400).json({
        success: false,
        message: "This certificate is not present!",
      });
    }
    // Create this firm if not exist
    await FirmCompany.findOneAndUpdate(
      { name: firmName },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Store History
    await CertificateUpdationHistory.create({
      certificate_name: certificate.certificate_name,
      certificate_number: certificate.certificate_number,
      firmName: certificate.firmName,
      issueDate: certificate.issueDate,
      user: req.user._id,
      certificate: certificate._id,
    });

    // Update Collection
    await certificate.updateOne({
      certificate_name,
      certificate_number,
      firmName,
      issueDate,
    });
    res.status(200).json({
      success: true,
      message: "Certificate Updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteCertificate = async (req, res) => {
  try {
    // return;
    const _id = req.params.id;

    const certificate = await Certificate.findOne({
      _id,
      isDelete: false,
    });
    if (!certificate) {
      return res.status(400).json({
        success: false,
        message: "This certificate is not present!",
      });
    }
    // Update is
    await certificate.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
