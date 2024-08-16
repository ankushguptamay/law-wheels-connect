const joi = require("joi");

exports.validateFirm = (data) => {
  const schema = joi.object().keys({
    firmName: joi.string().min(3).required(),
  });
  return schema.validate(data);
};

exports.validateSchoolUniversity = (data) => {
  const schema = joi.object().keys({
    school_university: joi.string().min(3).required(),
  });
  return schema.validate(data);
};

exports.validateSkill = (data) => {
  const schema = joi.object().keys({
    skillName: joi.string().min(3).required(),
  });
  return schema.validate(data);
};

exports.validatePracticeArea = (data) => {
  const schema = joi.object().keys({
    practiceArea: joi.string().min(3).required(),
  });
  return schema.validate(data);
};
