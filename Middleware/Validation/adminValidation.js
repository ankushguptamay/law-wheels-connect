const joi = require("joi");

exports.validateAdminRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    password: joi
      .string()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?& ]{8,}$")
      )
      .required()
      .min(8)
      .max(20),
  });
  return schema.validate(data);
};

exports.validateAdminLogin = (data) => {
  const schema = joi.object().keys({
    email: joi.string().email().required().label("Email"),
    password: joi
      .string()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?& ]{8,}$")
      )
      .required()
      .min(8)
      .max(20),
  });
  return schema.validate(data);
};
