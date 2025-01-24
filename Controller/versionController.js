const { AppVersion } = require("../Model/versionModel");

exports.addUpdateVersion = async (req, res) => {
  try {
    const version = req.body.version;
    // Create this App Version if not exist
    await AppVersion.findOneAndUpdate(
      { version },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: "Version added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getLatestVersion = async (req, res) => {
  try {
    const version = await AppVersion.find().sort({ updatedAt: -1 }).limit(1);

    res.status(200).json({
      success: true,
      message: "Latest version successfully!",
      data: version,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
