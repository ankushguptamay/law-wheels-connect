const mongoose = require("mongoose");

const { User } = require("../../Model/User/userModel");
const { OTP } = require("../../Model/otpModel");
const axios = require("axios");
const {
  validateUserRegistration,
  validateUserLogin,
  verifyMobileOTP,
  validateLicensePic,
  validateUpdateUser,
  validateRolePage,
  validateProfileVisible,
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

const {
  OTP_DIGITS_LENGTH,
  OTP_VALIDITY_IN_MILLISECONDS,
  SPRINT_AADHAR_PARTNER_ID,
  SPRINT_AADHAR_AUTHORISED_KEY,
  SPRINT_AADHAR_JWT_TOKEN,
} = process.env;

const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "profile";
const fs = require("fs");
const { Experience } = require("../../Model/User/Experience/experienceModel");
const { Education } = require("../../Model/User/Education/educationModel");
const {
  UserUpdationHistory,
} = require("../../Model/User/userUpdationHistoryModel");
const { Specialization } = require("../../Model/Master/specializationModel");
const {
  AdvocateReview,
} = require("../../Model/User/Review/advocateReviewModel");

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
      // Send Cookies
      sendToken(
        res,
        {
          _id: "67165fa7b1474b741db09d0a",
          name: "Tester For Play Store",
          email: "playstoretester@gmail.com",
          isLicenseVerified: false,
          mobileNumber: "1133557799",
          role: undefined,
        },
        200,
        `Welcome, Tester For Play Store`,
        "user"
      );
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
      "_id name email mobileNumber isLicenseVerified role"
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
    deleteSingleFile(req.file.path);
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
    deleteSingleFile(req.file.path);
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
    if (isLicensePic.licensePic) {
      if (isLicensePic.licensePic.fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          isLicensePic.licensePic.fileName
        );
      }
    }

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
      await deleteFileToBunny(bunnyFolderName, isCoverPic.coverPic.fileName);
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
    const role = req.query.role ? req.query.role : "Advocate";

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

    query.$and.push({ role });

    if (role === "Advocate") {
      query.$and.push({ isProfileVisible: true });
    }
    const [user, totalUser] = await Promise.all([
      User.find(query)
        .select(
          "name location profilePic headLine specialization language experience_year isProfileVisible createdAt"
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
      const [specialization, experiences, rating] = await Promise.all([
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

      transformData.push({
        _id: user[i]._id,
        name: user[i].name,
        location: user[i].location,
        profilePic: user[i].profilePic,
        headLine: user[i].headLine,
        specialization,
        isProfileVisible: user[i].isProfileVisible,
        language: user[i].language,
        experiences,
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
        },
      },
    ]);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This user in not present!",
      });
    }
    let transformData = user;

    if (user.role === "Nun") {
      transformData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        profession_nun_user: user.profession_nun_user,
        location: user.location,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        role: user.role,
        language: user.language,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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

exports.addAadharCard = async (req, res) => {
  try {
    const url =
      "https://uat.paysprint.in/sprintverify-uat/api/v1/verification/aadhaar_sendotp";

    const headers = {
      "Content-Type": "application/json",
      Token: SPRINT_AADHAR_JWT_TOKEN,
      accept: "application/json",
      authorisedkey: SPRINT_AADHAR_AUTHORISED_KEY,
    };

    const data = {
      id_number: req.body.aadharCardNumber,
    };
    console.log("HEEE");
    const verify = await axios.post(url, data, { headers });
    console.log(verify);
    // Final response
    res.status(200).send({
      success: true,
      message: "Added successfully!",
      data: verify.data,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err,
    });
  }
};

exports.verifyAadharOTP = async (req, res) => {
  try {
    const url =
      "https://uat.paysprint.in/sprintverify-uat/api/v1/verification/aadhaar_verifyotp";

    const headers = {
      "Content-Type": "application/json",
      Token: SPRINT_AADHAR_JWT_TOKEN,
      accept: "application/json",
      authorisedkey: SPRINT_AADHAR_AUTHORISED_KEY,
    };

    const data = {
      client_id: req.body.client_id,
      otp: req.body.otp,
      refid: req.body.refid,
    };
    console.log("HEEE");
    const verify = await axios.post(url, data, { headers });
    console.log(verify);
    // Final response
    res.status(200).send({
      success: true,
      message: "Added successfully!",
      data: verify.data,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err,
    });
  }
};
