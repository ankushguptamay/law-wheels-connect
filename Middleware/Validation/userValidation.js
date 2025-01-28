const joi = require("joi");

exports.validateUserRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
  });
  return schema.validate(data);
};

exports.validateUserLogin = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
  });
  return schema.validate(data);
};

exports.verifyMobileOTP = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    otp: joi.string().length(4).required(),
  });
  return schema.validate(data);
};

// exports.validateIsAdvocatePage = (data) => {
//   const schema = joi.object().keys({
//     isAdvocate: joi.boolean().required(),
//     school_university: joi.string().min(3).max(30).optional(),
//     startDate: joi
//       .object({
//         arg: joi.string().valid("month", "year"),
//         value: joi.string(),
//       })
//       .pattern(
//         /month/,
//         joi
//           .string()
//           .valid(
//             "January",
//             "February",
//             "March",
//             "April",
//             "May",
//             "June",
//             "July",
//             "August",
//             "September",
//             "October",
//             "November",
//             "December"
//           )
//       )
//       .pattern(/year/, joi.string().length(4))
//       .optional(),
//     location: joi
//       .object({
//         arg: joi.string().valid("country", "state", "city"),
//         value: joi.string(),
//       })
//       .pattern(/country/, joi.string())
//       .pattern(/state/, joi.string())
//       .pattern(/city/, joi.string())
//       .required(),
//     jobTitle: joi.string().min(3).optional(),
//     firmName: joi.string().min(3).optional(),
//   });
//   return schema.validate(data);
// };

exports.validateLicensePic = (data) => {
  const schema = joi.object().keys({
    bar_council_license_number: joi.string().required(),
    licenseIssueYear: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateUpdateUser = (data) => {
  const schema = joi.object().keys({
    location: joi
      .object({
        arg: joi.string().valid("country", "state", "city"),
        value: joi.string(),
      })
      .pattern(/country/, joi.string())
      .pattern(/state/, joi.string())
      .pattern(/city/, joi.string())
      .required(),
    headLine: joi.string().optional(),
    name: joi.string().min(3).required(),
    language: joi.array().optional(),
    experience_year: joi.number().optional(),
    total_cases: joi.number().optional(),
    specialization: joi.array().optional(),
    profession_nun_user: joi.string().optional(),
    practiceArea: joi.array().optional(),
  });
  return schema.validate(data);
};

exports.connectionRequest = (data) => {
  const schema = joi.object().keys({
    userId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.getMyConnection = (data) => {
  const schema = joi.object().keys({
    status: joi.string().valid("pending", "accepted").required(),
    search: joi.string().optional(),
  });
  return schema.validate(data);
};

exports.acceptConnect = (data) => {
  const schema = joi.object().keys({
    accept: joi.boolean().required(),
    connectId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.profileViewer = (data) => {
  const schema = joi.object().keys({
    userId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.sloteValidation = (data) => {
  const schema = joi.object().keys({
    timeInMin: joi.number().required(),
    startDate: joi.string().required(),
    endDate: joi.string().required(),
    times: joi.array().required(),
    serviceType: joi.array().required(),
  });
  return schema.validate(data);
};

exports.sloteForUserValidation = (data) => {
  const schema = joi.object().keys({
    advocate: joi.string().required(),
    date: joi.string().optional(),
  });
  return schema.validate(data);
};

exports.validateRolePage = (data) => {
  const schema = joi.object().keys({
    role: joi.string().valid("Advocate", "Student", "Nun").required(),
  });
  return schema.validate(data);
};

exports.bookSloteValidation = (data) => {
  const schema = joi.object().keys({
    client_legal_issue: joi.string().min(20).max(1000).required(),
    sloteId: joi.string().required(),
    client_meeting_type: joi
      .string()
      .valid("Audio", "Video", "Visit")
      .required(),
  });
  return schema.validate(data);
};

exports.validateProfileVisible = (data) => {
  const schema = joi.object().keys({
    isProfileVisible: joi.boolean().required(),
  });
  return schema.validate(data);
};

exports.cancelSloteValidation = (data) => {
  const schema = joi.object().keys({
    sloteId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.rescheduleSloteValidation = (data) => {
  const schema = joi.object().keys({
    oldSloteId: joi.string().required(),
    newSloteId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateAadharVerification = (data) => {
  const schema = joi.object().keys({
    client_id: joi.string().required(),
    aadharOTP: joi.string().length(6).required(),
  });
  return schema.validate(data);
};
