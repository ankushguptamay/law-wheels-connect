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
    otp: joi.string().length(6).required(),
  });
  return schema.validate(data);
};

exports.validateIsAdvocatePage = (data) => {
  const schema = joi.object().keys({
    isAdvocate: joi.boolean().required(),
    school_university: joi.string().min(3).max(30).optional(),
    startDate: joi
      .object({
        arg: joi.string().valid("month", "year"),
        value: joi.string(),
      })
      .pattern(
        /month/,
        joi
          .string()
          .valid(
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          )
      )
      .pattern(/year/, joi.string().length(4))
      .optional(),
    location: joi
      .object({
        arg: joi.string().valid("country", "state", "city"),
        value: joi.string(),
      })
      .required(),
    jobTitle: joi.string().min(3).optional(),
    firmName: joi.string().min(3).optional(),
  });
  return schema.validate(data);
};

exports.validateUpdateUser = (data) => {
  const schema = joi.object().keys({
    isAdvocate: joi.boolean().required(),
    location: joi
      .object({
        arg: joi.string().valid("country", "state", "city"),
        value: joi.string(),
      })
      .required(),
    isProfileVisible: joi.boolean().required(),
    bar_council_license_number: joi.string().optional(),
    headLine: joi.string().optional(),
    name: joi.string().min(3).required(),
  });
  return schema.validate(data);
};
