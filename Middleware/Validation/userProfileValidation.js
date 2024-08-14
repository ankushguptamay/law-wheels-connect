const joi = require("joi");

exports.validateExperience = (data) => {
  const schema = joi.object().keys({
    jobTitle: joi.string().min(3).max(30).required(),
    firmName: joi.string().min(3).required(),
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
    endDate: joi.object().optional(),
    isRecent: joi.boolean().optional(),
    isOngoing: joi.boolean().optional(),
  });
  return schema.validate(data);
};

exports.validateEducation = (data) => {
  const schema = joi.object().keys({
    school_university: joi.string().min(3).max(30).required(),
    fieldOfStudy: joi.string().min(3).max(30).optional(),
    grade: joi.string().min(3).max(30).optional(),
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
    endDate: joi.object().optional(),
    activities: joi.string().min(20).max(1000).optional(),
    degreeType: joi.string().min(3).max(30).optional(),
    isRecent: joi.boolean().optional(),
    isOngoing: joi.boolean().optional(),
  });
  return schema.validate(data);
};

exports.validateUserSkill = (data) => {
  const schema = joi.object().keys({
    skillName: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateUserPracticeArea = (data) => {
  const schema = joi.object().keys({
    practiceArea: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateCertificate = (data) => {
  const schema = joi.object().keys({
    firmName: joi.string().required(),
    certificate_number: joi.string().optional(),
    certificate_name: joi.string().optional(),
    issueDate: joi.string().optional(),
  });
  return schema.validate(data);
};
