const joi = require("joi");

exports.dictionaryWordValidation = (data) => {
  const schema = joi.object().keys({
    word: joi.string().min(3).required(),
    definition: joi.string().min(3).required(),
  });
  return schema.validate(data);
};
