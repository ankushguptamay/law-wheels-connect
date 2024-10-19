exports.isNunUser = async (req, res, next) => {
  try {
    if (req.user.role === "Nun") {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Unauthorized!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.isStudentUser = async (req, res, next) => {
  try {
    if (req.user.role === "Student") {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Unauthorized!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.isAdvocateUser = async (req, res, next) => {
  try {
    console.log(req.user);
    if (req.user.role === "Advocate") {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Unauthorized!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.isAdvocateVerified = async (req, res, next) => {
  try {
    if (req.user.role === "Advocate" && req.user.isLicenseVerified) {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Wait for license verification!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
