const joi = require("joi");

exports.validateTextPost = (data) => {
  const schema = joi.object().keys({
    content: joi.string().min(3).required(),
    hash_tag: joi.array().optional(),
  });
  return schema.validate(data);
};

exports.addMediaPost = (data) => {
  const schema = joi.object().keys({
    content: joi.string().min(3).optional(),
    hash_tag: joi.array().optional(),
  });
  return schema.validate(data);
};

exports.addPollPost = (data) => {
  const schema = joi.object().keys({
    content: joi.string().min(3).optional(),
    hash_tag: joi.array().optional(),
    poll: joi
      .object({
        arg: joi
          .string()
          .valid(
            "question",
            "option1",
            "option2",
            "option3",
            "option4",
            "expireIn"
          ),
        value: joi.string(),
      })
      .pattern(/question/, joi.string().required())
      .pattern(/option1/, joi.string().required())
      .pattern(/option2/, joi.string().required())
      .pattern(/option3/, joi.string())
      .pattern(/option4/, joi.string())
      .pattern(/expireIn/, joi.string())
      .required(),
  });
  return schema.validate(data);
};

exports.addCelebratePost = (data) => {
  const schema = joi.object().keys({
    content: joi.string().min(3).required(),
    hash_tag: joi.array().required(),
    person: joi.array().required(),
  });
  return schema.validate(data);
};

exports.deleteMediaPost = (data) => {
  const schema = joi.object().keys({
    mediaFileId: joi.string().required(),
  });
  return schema.validate(data);
};
