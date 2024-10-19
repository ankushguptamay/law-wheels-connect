const mongoose = require("mongoose");

const { User } = require("../../Model/User/userModel");
const { OTP } = require("../../Model/otpModel");
const {
  SchoolUniversity,
} = require("../../Model/Master/school_universityModel");
const { Experience } = require("../../Model/User/Experience/experienceModel");
const { FirmCompany } = require("../../Model/Master/firmModel");
const { Education } = require("../../Model/User/Education/educationModel");

const {
  validateUserRegistration,
  validateUserLogin,
  verifyMobileOTP,
  validateIsAdvocatePage,
  validateUpdateUser,
} = require("../../Middleware/Validation/userValidation");

const { sendToken } = require("../../Util/features");
const {
  deleteSingleFile,
  capitalizeFirstLetter,
} = require("../../Util/utility");
const {
  generateFixedLengthRandomNumber,
  sendOTPToMoblie,
} = require("../../Util/otp");
const { JobTitle } = require("../../Model/Master/jobTitleModel");

const { OTP_DIGITS_LENGTH, OTP_VALIDITY_IN_MILLISECONDS } = process.env;

const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "profile";
const fs = require("fs");

exports.getUser = async (req, res) => {
  try {
    // const user = await User.findOne({ email: req.user.email });
    var id = new mongoose.Types.ObjectId(req.user._id);
    const user = await User.aggregate([
      {
        $match: {
          _id: {
            $eq: id,
          },
        },
      },
      {
        $lookup: {
          from: "educations",
          localField: "_id",
          foreignField: "user",
          as: "educations",
        },
      },
      {
        $lookup: {
          from: "experiences",
          localField: "_id",
          foreignField: "user",
          as: "experiences",
        },
      },
      //   },
      // },
      // {
      //   $project: {
      //     experiences: 1,
      //     experiences: {
      //       $project: { _id: 1 },
      //     },
      //   },
      // },
    ]);

    res.status(200).json({
      success: true,
      message: "User fetched successfully!",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.register = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, mobileNumber } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );

    const isUser = await User.findOne({
      $or: [{ email: email }, { mobileNumber: mobileNumber }],
    });
    if (isUser) {
      return res.status(400).json({
        success: false,
        message: "These credentials are already present!",
      });
    }

    const user = await User.create({ name, email, mobileNumber });

    // Generate OTP for Email
    const otp = generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // Sending OTP to mobile number
    await sendOTPToMoblie(mobileNumber, otp);

    //  Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: user._id,
    });
    // Send final success response
    res.status(200).send({
      success: true,
      message: `OTP send successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      data: { mobileNumber: mobileNumber },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.loginByMobile = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { mobileNumber } = req.body;

    const isUser = await User.findOne({ mobileNumber });
    if (!isUser) {
      return res.status(400).send({
        success: false,
        message: "NOTPRESENT!", // Redirect to register page, where only name and email field will open
        data: { mobileNumber: mobileNumber },
      });
    }

    // Generate OTP for Email
    const otp = generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // Sending OTP to mobile number
    await sendOTPToMoblie(mobileNumber, otp);

    //  Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: isUser._id,
    });

    // Send final success response
    res.status(200).send({
      success: true,
      message: `OTP send successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      data: { mobileNumber: mobileNumber },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyMobileOTP = async (req, res) => {
  try {
    // Validate body
    const { error } = verifyMobileOTP(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { mobileNumber, otp } = req.body;
    // Is Email Otp exist
    const isOtp = await OTP.findOne({
      otp: otp,
    });
    if (!isOtp) {
      return res.status(400).send({
        success: false,
        message: `Invalid OTP!`,
      });
    }
    // Checking is user present or not
    const user = await User.findOne({
      $and: [{ mobileNumber: mobileNumber }, { _id: isOtp.receiverId }],
    });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "No Details Found. Register Now!",
      });
    }
    // is email otp expired?
    const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
    if (isOtpExpired) {
      await OTP.deleteOne({ receiverId: isOtp.receiverId });
      return res.status(400).send({
        success: false,
        message: `OTP expired!`,
      });
    }
    await OTP.deleteOne({ receiverId: isOtp.receiverId });
    // Update user
    if (!user.isMobileNumberVerified) {
      await user.updateOne({ isMobileNumberVerified: true });
    }
    // Send Cookies
    sendToken(res, user, 200, `Welcome, ${user.name}`, "user");
  } catch (err) {
    res.status(500).send({
      success: false,
      err: err.message,
    });
  }
};

exports.addUpdateProfilePic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload a profile image!",
      });
    }
    const isProfilePic = await User.findOne({
      _id: req.user._id,
    });

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(file.path);
    const profilePic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    if (isProfilePic.profilePic.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isProfilePic.profilePic.fileName
      );
    }

    await isProfilePic.updateOne({
      profilePic: profilePic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "Profile pic added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.addUpdateCoverPic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload an image!",
      });
    }
    const isCoverPic = await User.findOne({
      _id: req.user._id,
    });

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(file.path);
    const coverPic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    if (isCoverPic.coverPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isCoverPic.coverPic.fileName);
    }

    await isCoverPic.updateOne({
      coverPic: coverPic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "Cover pic added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.addUpdateLicensePic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload an image!",
      });
    }
    const isLicensePic = await User.findOne({
      _id: req.user._id,
    });

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(file.path);
    const licensePic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    if (isLicensePic.licensePic.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isLicensePic.licensePic.fileName
      );
    }

    await isLicensePic.updateOne({
      licensePic: licensePic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "License pic added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.isAdvocatePage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateIsAdvocatePage(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {
      isAdvocate,
      school_university,
      startDate,
      jobTitle,
      firmName,
      location,
    } = req.body;

    // Validate body
    let newJobTitle = null,
      newFirmName = null,
      newSchool_university = null,
      codePreFix = "LWUN",
      message = "user";
    if (isAdvocate) {
      if (jobTitle && firmName) {
        newJobTitle = capitalizeFirstLetter(
          jobTitle.replace(/\s+/g, " ").trim()
        );
        newFirmName = capitalizeFirstLetter(
          firmName.replace(/\s+/g, " ").trim()
        );
        message = "advocate";
        codePreFix = "LWUA";
        // Create this firm if not exist
        await FirmCompany.findOneAndUpdate(
          { name: newFirmName }, // Query
          { updatedAt: new Date() }, // update
          { upsert: true, new: true, setDefaultsOnInsert: true } // Options
        );
        // Create this job title if not exist
        await JobTitle.findOneAndUpdate(
          { name: newJobTitle }, // Query
          { updatedAt: new Date() }, // update
          { upsert: true, new: true, setDefaultsOnInsert: true } // Options
        );
        // Create Advocate Experience
        await Experience.create({
          isRecent: true,
          firmName: newFirmName,
          jobTitle: newJobTitle,
          user: req.user._id,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Please select required fields!",
        });
      }
    } else if (isAdvocate == false) {
      if (school_university && startDate) {
        newSchool_university = capitalizeFirstLetter(
          school_university.replace(/\s+/g, " ").trim()
        );
        message = "student";
        codePreFix = "LWUS";
        // Create this university if not exist
        await SchoolUniversity.findOneAndUpdate(
          { name: newSchool_university },
          { updatedAt: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // Create Student Education
        await Education.create({
          isRecent: true,
          user: req.user._id,
          school_university: newSchool_university,
          startDate,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Please select required fields!",
        });
      }
    }

    // generate User code
    let code;
    const query = new RegExp("^" + codePreFix);
    const isUserCode = await User.find({ userCode: query }).sort({
      createdAt: 1,
    });
    console.log(isUserCode);
    if (isUserCode.length == 0) {
      code = codePreFix + 1000;
    } else {
      let lastCode = isUserCode[isUserCode.length - 1];
      let lastDigits = lastCode.userCode.substring(4);
      let incrementedDigits = parseInt(lastDigits, 10) + 1;
      code = codePreFix + incrementedDigits;
    }
    // Update user
    await User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      { isAdvocate: isAdvocate, location: location, userCode: code }
    );
    // Final response
    res.status(200).send({
      success: true,
      message: `Welcome ${message}!`,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateUser(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {
      isAdvocate,
      location,
      isProfileVisible,
      bar_council_license_number,
      headLine,
    } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    // Update user
    await User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      {
        isAdvocate,
        location,
        isProfileVisible,
        headLine,
        bar_council_license_number,
        name,
      }
    );
    // Final response
    res.status(200).send({
      success: true,
      message: "Updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteProfilePic = async (req, res) => {
  try {
    const isProfilePic = await User.findOne({
      _id: req.user._id,
    });
    if (isProfilePic.profilePic.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isProfilePic.profilePic.fileName
      );
    }
    const profilePic = {
      fileName: null,
      url: null,
    };
    await isProfilePic.updateOne({
      profilePic: profilePic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "Profile pic deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteCoverPic = async (req, res) => {
  try {
    const isCoverPic = await User.findOne({
      _id: req.user._id,
    });
    if (isCoverPic.coverPic.fileName) {
      await deleteFileToBunny(isCoverPic.coverPic.fileName);
    }
    const coverPic = {
      fileName: null,
      url: null,
    };
    await isCoverPic.updateOne({
      coverPic: coverPic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "Cover pic deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteLicensePic = async (req, res) => {
  try {
    const isLicensePic = await User.findOne({
      _id: req.user._id,
    });
    if (isLicensePic.licensePic.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isLicensePic.licensePic.fileName
      );
    }
    const licensePic = {
      fileName: null,
      url: null,
    };
    await isLicensePic.updateOne({
      licensePic: licensePic,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "License pic deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
