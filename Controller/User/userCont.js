const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const { User } = require("../../Model/User/userModel");
const { OTP } = require("../../Model/otpModel");
const {
  createAccessToken,
  createRefreshToken,
} = require("../../Util/jwtToken");
const { Experience } = require("../../Model/User/Experience/experienceModel");
const { Education } = require("../../Model/User/Education/educationModel");
const {
  UserUpdationHistory,
} = require("../../Model/User/userUpdationHistoryModel");
const { Specialization } = require("../../Model/Master/specializationModel");
const {
  AdvocateReview,
} = require("../../Model/User/Review/advocateReviewModel");
const { Connection } = require("../../Model/User/Connection/connectionModel");
const { Follow } = require("../../Model/User/Connection/followerModel");

const {
  validateUserRegistration,
  validateUserLogin,
  verifyMobileOTP,
  validateLicensePic,
  validateUpdateUser,
  validateRolePage,
  validateProfileVisible,
} = require("../../Middleware/Validation/userValidation");

const {
  deleteSingleFile,
  capitalizeFirstLetter,
} = require("../../Util/utility");
const {
  generateFixedLengthRandomNumber,
  sendOTPToMoblie,
} = require("../../Util/otp");

const { OTP_DIGITS_LENGTH, OTP_VALIDITY_IN_MILLISECONDS } = process.env;

const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const {
  UserDeleteRequestPlayStore,
} = require("../../Model/User/usedDeleteRequestFromPlayStoreModel");
const bunnyFolderName = "profile";

exports.getDetailsOfStudentAndAdvocate = async (req, res) => {
  try {
    // const user = await User.findOne({ email: req.user.email });
    const id = new mongoose.Types.ObjectId(req.user._id);
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
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "educations",
        },
      },
      {
        $lookup: {
          from: "experiences",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "experiences",
        },
      },
      {
        $lookup: {
          from: "userskills",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] }, // Match the user
                    { $eq: ["$isDelete", false] }, // Exclude deleted skills
                  ],
                },
              },
            },
          ],
          as: "userSkills",
        },
      },
      {
        $lookup: {
          from: "specializations",
          localField: "specialization",
          foreignField: "_id",
          as: "specialization",
        },
      },
      {
        $lookup: {
          from: "practiceareas",
          localField: "practiceArea",
          foreignField: "_id",
          as: "userPracticeAreas",
        },
      },
      {
        $lookup: {
          from: "advocatereviews",
          let: { advocate: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$advocate", "$$advocate"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "reviews",
        },
      },
      {
        $addFields: {
          totalReviews: { $size: "$reviews" },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $avg: "$reviews.rating" },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          reviews: 0, // Exclude the reviews array if you don't need it
          lastLogin: 0,
        },
      },
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

exports.getDetailsOfNunUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).select(
      "_id name email mobileNumber profession_nun_user location profilePic coverPic role language createdAt updatedAt"
    );

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
    // Only for testing
    if (mobileNumber === "1133557799") {
      const token = createAccessToken(
        "user",
        "playstoretester@gmail.com",
        "67165fa7b1474b741db09d0a"
      );
      const refreshToken = createRefreshToken(
        "user",
        "67165fa7b1474b741db09d0a"
      );
      return res.status(200).json({
        success: true,
        AccessToken: token,
        refreshToken,
        user: {
          _id: "67165fa7b1474b741db09d0a",
          name: "Tester For Play Store",
          email: "playstoretester@gmail.com",
          isLicenseVerified: false,
          mobileNumber: "1133557799",
          role: undefined,
        },
        message: `Welcome, Tester For Play Store`,
      });
    }
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
    const user = await User.findOne(
      {
        $and: [{ mobileNumber: mobileNumber }, { _id: isOtp.receiverId }],
      },
      "_id name email mobileNumber isLicenseVerified role lastLogin"
    );
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "No Details Found. Register Now!",
      });
    }
    // is email otp expired?
    const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
    if (isOtpExpired) {
      await OTP.deleteMany({ receiverId: isOtp.receiverId });
      return res.status(400).send({
        success: false,
        message: `OTP expired!`,
      });
    }
    await OTP.deleteMany({ receiverId: isOtp.receiverId });

    const refreshToken = createRefreshToken("user", user._id);
    // Update user
    if (!user.isMobileNumberVerified) {
      await user.updateOne({
        isMobileNumberVerified: true,
        lastLogin: new Date(),
        refreshToken,
      });
    } else {
      await user.updateOne({ lastLogin: new Date(), refreshToken });
    }

    const token = createAccessToken("user", user.email, user._id);
    res.status(200).json({
      success: true,
      AccessToken: token,
      refreshToken,
      user,
      message: `Welcome, ${user.name}`,
    });
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
    deleteSingleFile(req.file.path);
    const profilePic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    if (isProfilePic?.profilePic?.fileName) {
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
    deleteSingleFile(req.file.path);
    const coverPic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    if (isCoverPic?.coverPic?.fileName) {
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
        message: "Upload your bar council id image!",
      });
    }

    const { error } = validateLicensePic(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { bar_council_license_number, licenseIssueYear } = req.body;
    const isLicensePic = await User.findOne({ _id: req.user._id });

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);
    const licensePic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    // Storing History
    if (isLicensePic.isLicenseVerified || isLicensePic.isProfileVisible) {
      await UserUpdationHistory.create({
        bar_council_license_number: isLicensePic.bar_council_license_number,
        licenseIssueYear: isLicensePic.licenseIssueYear,
        isLicenseVerified: isLicensePic.isLicenseVerified,
        licensePic: isLicensePic.licensePic,
        user: req.user._id,
      });
    } else {
      if (isLicensePic?.licensePic?.fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          isLicensePic.licensePic.fileName
        );
      }
    }

    await isLicensePic.updateOne({
      bar_council_license_number,
      licenseIssueYear: new Date(licenseIssueYear),
      isLicenseVerified: false,
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

// exports.isAdvocatePage = async (req, res) => {
//   try {
//     // Body Validation
//     const { error } = validateIsAdvocatePage(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message,
//       });
//     }
//     const {
//       isAdvocate,
//       school_university,
//       startDate,
//       jobTitle,
//       firmName,
//       location,
//     } = req.body;

//     // Validate body
//     let newJobTitle = null,
//       newFirmName = null,
//       newSchool_university = null,
//       codePreFix = "LWUN",
//       message = "user";
//     if (isAdvocate) {
//       if (jobTitle && firmName) {
//         newJobTitle = capitalizeFirstLetter(
//           jobTitle.replace(/\s+/g, " ").trim()
//         );
//         newFirmName = capitalizeFirstLetter(
//           firmName.replace(/\s+/g, " ").trim()
//         );
//         message = "advocate";
//         codePreFix = "LWUA";
//         // Create this firm if not exist
//         await FirmCompany.findOneAndUpdate(
//           { name: newFirmName }, // Query
//           { updatedAt: new Date() }, // update
//           { upsert: true, new: true, setDefaultsOnInsert: true } // Options
//         );
//         // Create this job title if not exist
//         await JobTitle.findOneAndUpdate(
//           { name: newJobTitle }, // Query
//           { updatedAt: new Date() }, // update
//           { upsert: true, new: true, setDefaultsOnInsert: true } // Options
//         );
//         // Create Advocate Experience
//         await Experience.create({
//           isRecent: true,
//           firmName: newFirmName,
//           jobTitle: newJobTitle,
//           user: req.user._id,
//         });
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Please select required fields!",
//         });
//       }
//     } else if (isAdvocate == false) {
//       if (school_university && startDate) {
//         newSchool_university = capitalizeFirstLetter(
//           school_university.replace(/\s+/g, " ").trim()
//         );
//         message = "student";
//         codePreFix = "LWUS";
//         // Create this university if not exist
//         await SchoolUniversity.findOneAndUpdate(
//           { name: newSchool_university },
//           { updatedAt: new Date() },
//           { upsert: true, new: true, setDefaultsOnInsert: true }
//         );
//         // Create Student Education
//         await Education.create({
//           isRecent: true,
//           user: req.user._id,
//           school_university: newSchool_university,
//           startDate,
//         });
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Please select required fields!",
//         });
//       }
//     }

//     // generate User code
//     let code;
//     const query = new RegExp("^" + codePreFix);
//     const isUserCode = await User.find({ userCode: query }).sort({
//       createdAt: 1,
//     });
//     console.log(isUserCode);
//     if (isUserCode.length == 0) {
//       code = codePreFix + 1000;
//     } else {
//       let lastCode = isUserCode[isUserCode.length - 1];
//       let lastDigits = lastCode.userCode.substring(4);
//       let incrementedDigits = parseInt(lastDigits, 10) + 1;
//       code = codePreFix + incrementedDigits;
//     }
//     // Update user
//     await User.findOneAndUpdate(
//       {
//         _id: req.user._id,
//       },
//       { isAdvocate: isAdvocate, location: location, userCode: code }
//     );
//     // Final response
//     res.status(200).send({
//       success: true,
//       message: `Welcome ${message}!`,
//     });
//   } catch (err) {
//     res.status(500).send({
//       success: false,
//       message: err.message,
//     });
//   }
// };

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
      location,
      headLine,
      language,
      experience_year,
      total_cases,
      specialization,
      profession_nun_user,
      practiceArea,
    } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );

    // Update user
    if (req.user.role === "Advocate" && req.user.isProfileVisible) {
      await UserUpdationHistory.create({
        location,
        headLine,
        language,
        experience_year,
        total_cases,
        specialization,
        profession_nun_user,
        practiceArea,
        user: req.user._id,
      });
    }

    await User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      {
        location,
        headLine,
        name,
        language,
        experience_year,
        total_cases,
        specialization,
        profession_nun_user,
        practiceArea,
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
    if (isProfilePic?.profilePic?.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isProfilePic.profilePic.fileName
      );
    }
    const profilePic = { fileName: undefined, url: undefined };
    await isProfilePic.updateOne({ profilePic });
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
    if (isCoverPic?.coverPic?.fileName) {
      await deleteFileToBunny(bunnyFolderName, isCoverPic.coverPic.fileName);
    }
    const coverPic = { fileName: undefined, url: undefined };
    await isCoverPic.updateOne({ coverPic });
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
    if (isLicensePic?.licensePic?.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        isLicensePic.licensePic.fileName
      );
    }
    const licensePic = { fileName: undefined, url: undefined };

    // Storing History
    if (isLicensePic.isLicenseVerified || isLicensePic.isProfileVisible) {
      await UserUpdationHistory.create({
        bar_council_license_number: isLicensePic.bar_council_license_number,
        licenseIssueYear: isLicensePic.licenseIssueYear,
        isLicenseVerified: isLicensePic.isLicenseVerified,
        licensePic: isLicensePic.licensePic,
        user: req.user._id,
      });
    }

    await isLicensePic.updateOne({
      licensePic: licensePic,
      isLicenseVerified: false,
      bar_council_license_number: null,
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

exports.rolePage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRolePage(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { role } = req.body;

    let codePreFix, message;
    if (role === "Advocate") {
      message = "advocate";
      codePreFix = "LWUA";
    } else if (role === "Student") {
      message = "student";
      codePreFix = "LWUS";
    } else {
      codePreFix = "LWUN";
      message = "user";
    }

    // generate User code
    const today = new Date();
    today.setMinutes(today.getMinutes() + 330);
    const day = today.toISOString().slice(8, 10);
    const year = today.toISOString().slice(2, 4);
    const month = today.toISOString().slice(5, 7);
    let userCode,
      lastDigits,
      startWith = `${codePreFix}${day}${month}${year}`;
    const query = new RegExp("^" + startWith);
    const isUserCode = await User.findOne({ userCode: query }).sort({
      createdAt: -1,
    });
    if (!isUserCode) {
      lastDigits = 1;
    } else {
      lastDigits = parseInt(isUserCode.userCode.substring(10)) + 1;
    }
    userCode = `${startWith}${lastDigits}`;
    while (await User.findOne({ userCode })) {
      userCode = `${startWith}${lastDigits++}`;
    }
    // Update user
    await User.findOneAndUpdate({ _id: req.user._id }, { role, userCode });
    // Final response
    res.status(200).send({
      success: true,
      message: `Welcome ${message}!`,
      data: { ...req.user._doc, role },
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const { search } = req.query;
    const role = req.query.role;

    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { $and: [{ _id: { $nin: [req.user._id] } }] };
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      query.$and.push({ name: startWith });
    }

    // Role condition
    if (role && role === "Advocate") {
      query.$and.push({ role });
      query.$and.push({ isProfileVisible: true });
    } else if (role) {
      query.$and.push({ role });
    } else {
      query.$and.push({ role: { $exists: true, $ne: null } });
    }

    const [user, totalUser] = await Promise.all([
      User.find(query)
        .select(
          "name role location profilePic headLine specialization language experience_year isProfileVisible createdAt"
        )
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform Data
    const transformData = [];
    for (let i = 0; i < user.length; i++) {
      let specialization, experiences, rating;
      if (user[i].role === "Advocate") {
        const [aSpecialization, aExperiences, aRating] = await Promise.all([
          Specialization.find({ _id: { $in: user[i].specialization } })
            .sort({ createAt: -1 })
            .limit(1),
          Experience.find({ user: user[i]._id, isRecent: true }).limit(1),
          AdvocateReview.aggregate([
            { $match: { isDelete: false, advocate: user[i]._id } },
            {
              $group: {
                _id: "$advocate", // Group by advocate ID
                averageRating: { $avg: "$rating" }, // Calculate the average rating
                totalReviews: { $sum: 1 }, // Optional: Count total reviews
              },
            },
            {
              $project: { _id: 0, averageRating: 1, totalReviews: 1 },
            },
          ]),
        ]);
        specialization = aSpecialization;
        experiences = aExperiences;
        rating = aRating;
      }

      const [connection, follow] = await Promise.all([
        Connection.findOne({
          $or: [
            { sender: req.user._id, receiver: user[i]._id },
            { sender: user[i]._id, receiver: req.user._id },
          ],
        }),
        Follow.findOne({
          follower: req.user._id,
          followee: user[i]._id,
        }),
      ]);

      transformData.push({
        _id: user[i]._id,
        name: user[i].name,
        role: user[i].role,
        location: user[i].location,
        profilePic: user[i].profilePic,
        headLine: user[i].headLine,
        specialization,
        isProfileVisible: user[i].isProfileVisible,
        language: user[i].language,
        experiences,
        experience_year: user[i].experience_year,
        createdAt: user[i].createdAt,
        rating: rating ? rating[0] : null,
        connection: connection || null,
        follow: follow || null,
      });
    }

    const totalPages = Math.ceil(totalUser / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
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
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "educations",
        },
      },
      {
        $lookup: {
          from: "experiences",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "experiences",
        },
      },
      {
        $lookup: {
          from: "userskills",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$userId"] }, // Match the user
                    { $eq: ["$isDelete", false] }, // Exclude deleted skills
                  ],
                },
              },
            },
          ],
          as: "userSkills",
        },
      },
      {
        $lookup: {
          from: "specializations",
          localField: "specialization",
          foreignField: "_id",
          as: "specialization",
        },
      },
      {
        $lookup: {
          from: "practiceareas",
          localField: "practiceArea",
          foreignField: "_id",
          as: "userPracticeAreas",
        },
      },
      {
        $lookup: {
          from: "advocatereviews",
          let: { advocate: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$advocate", "$$advocate"] },
                    { $eq: ["$isDelete", false] },
                  ],
                },
              },
            },
          ],
          as: "reviews",
        },
      },
      {
        $addFields: {
          totalReviews: { $size: "$reviews" },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $avg: "$reviews.rating" },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          reviews: 0, // Exclude the reviews array if you don't need it
          lastLogin: 0,
        },
      },
    ]);

    if (!user[0]) {
      return res.status(400).json({
        success: false,
        message: "This user in not present!",
      });
    }

    const [connection, follow] = await Promise.all([
      Connection.findOne({
        $or: [
          { sender: req.user._id, receiver: user[0]._id },
          { sender: user[0]._id, receiver: req.user._id },
        ],
      }),
      Follow.findOne({
        follower: req.user._id,
        followee: user[0]._id,
      }),
    ]);

    let transformData = {
      ...user[0],
      connection: connection || null,
      follow: follow || null,
    };

    if (user[0].role === "Nun") {
      transformData = {
        _id: user[0]._id,
        name: user[0].name,
        email: user[0].email,
        location: user[0].location || null,
        mobileNumber: user[0].mobileNumber,
        profession_nun_user: user[0].profession_nun_user || null,
        location: user[0].location,
        profilePic: user[0].profilePic || null,
        coverPic: user[0].coverPic || null,
        role: user[0].role,
        language: user[0].language || null,
        createdAt: user[0].createdAt,
        updatedAt: user[0].updatedAt,
        connection: connection || null,
        follow: follow || null,
      };
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully!",
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.isProfileVisible = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateProfileVisible(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { isProfileVisible } = req.body;
    const user = await User.findOne({ _id: req.user._id });
    if (isProfileVisible) {
      // Experience
      const isRecentExperience = await Experience.findOne({
        user: req.user._id,
        isRecent: true,
      });
      if (!isRecentExperience) {
        return res.status(400).send({
          success: false,
          message: "NOEXPERIENCE!",
        });
      }

      // Education
      const isRecentEducation = await Education.findOne({
        user: req.user._id,
        isRecent: true,
      });
      if (!isRecentEducation) {
        return res.status(400).send({
          success: false,
          message: "NOEDUCATION!",
        });
      }

      // License, here we r not checking isLicense verified
      if (user.licensePic) {
        if (!user.licensePic.url) {
          return res.status(400).send({
            success: false,
            message: "NOLICENSE!",
          });
        }
      } else {
        return res.status(400).send({
          success: false,
          message: "NOLICENSE!",
        });
      }
    }
    // Storing When user changed their profile visibility
    await UserUpdationHistory.create({
      user: req.user._id,
      isProfileVisible: user.isProfileVisible,
    });
    // Update user
    await User.findOneAndUpdate({ _id: req.user._id }, { isProfileVisible });
    // Final response
    res.status(200).send({
      success: true,
      message: "Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllUserForAdmin = async (req, res) => {
  try {
    const { search, role } = req.query;

    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { $and: [] };
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      const mobileMatch = new RegExp("^" + search);
      query.$and.push({
        $or: [
          { name: startWith },
          { mobileNumber: mobileMatch },
          { email: startWith },
        ],
      });
    }

    if (role) {
      query.$and.push({ role });
    } else {
      query.$and.push({
        $or: [{ role: { $exists: false } }, { role: null }],
      });
    }

    const [user, totalUser] = await Promise.all([
      User.find(query)
        .select(
          "name email role mobileNumber profilePic headLine language experience_year isProfileVisible userCode createdAt"
        )
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform Data
    const transformData = [];
    for (let i = 0; i < user.length; i++) {
      const [rating] = await Promise.all([
        AdvocateReview.aggregate([
          { $match: { isDelete: false, advocate: user[i]._id } },
          {
            $group: {
              _id: "$advocate", // Group by advocate ID
              averageRating: { $avg: "$rating" }, // Calculate the average rating
              totalReviews: { $sum: 1 }, // Optional: Count total reviews
            },
          },
          {
            $project: { _id: 0, averageRating: 1, totalReviews: 1 },
          },
        ]),
      ]);

      transformData.push({
        _id: user[i]._id,
        name: user[i].name,
        email: user[i].email,
        mobileNumber: user[i].mobileNumber,
        userCode: user[i].userCode,
        role: user[i].role,
        profilePic: user[i].profilePic,
        headLine: user[i].headLine,
        isProfileVisible: user[i].isProfileVisible,
        language: user[i].language,
        experience_year: user[i].experience_year,
        createdAt: user[i].createdAt,
        rating: rating[0],
      });
    }

    const totalPages = Math.ceil(totalUser / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteMyRecordFromPlayStore = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, mobileNumber, name } = req.body;

    const user = await User.findOne({ $or: [{ email }, { mobileNumber }] });

    if (!user) {
      // Create this if not exist
      await UserDeleteRequestPlayStore.findOneAndUpdate(
        { $or: [{ email }, { mobileNumber }] },
        {
          $setOnInsert: { email, mobileNumber }, // Set these values only on insert
          updatedAt: new Date(),
          name,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(400).json({
        success: false,
        message: "These credentials are not present on our application!",
      });
    } else {
      const data = await UserDeleteRequestPlayStore.findOne({
        $or: [{ email }, { mobileNumber }],
      });
      if (data) {
        if (!data?.user) {
          await UserDeleteRequestPlayStore.updateOne(
            { _id: data._id },
            { user: user._id, updatedAt: new Date() }
          );
        }
        return res.status(400).json({
          success: false,
          message: "These credentials are not present on our application!",
        });
      } else {
        await UserDeleteRequestPlayStore.create({
          name,
          email,
          mobileNumber,
          user: user._id,
        });
        // Send final success response
        res.status(200).send({
          success: true,
          message: `Your records deleted Successfully`,
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res
      .status(401)
      .send({ success: false, message: "Refresh token required!" });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH_KEY_USER
    );
    const user = await User.findById(decoded._id);

    if (!user || user?.refreshToken !== refreshToken) {
      return res.status(403).send({ success: false, message: "Unauthorized!" });
    }

    const token = createAccessToken("user", user.email, user._id);

    res.status(200).json({ success: true, AccessToken: token, refreshToken });
  } catch (err) {
    res.status(403).send({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { refreshToken: undefined });
    res.status(200).json({ success: true, message: "Loged out successfully" });
  } catch (err) {
    res.status(403).send({ success: false, message: err.message });
  }
};
