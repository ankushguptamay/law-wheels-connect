const joi = require("joi");

exports.dictionaryWordValidation = (data) => {
  const schema = joi.object().keys({
    word: joi.string().min(3).required(),
    definition: joi.string().min(3).required(),
  });
  return schema.validate(data);
};

exports.articleValidation = (data) => {
  const schema = joi.object().keys({
    part_number: joi.number().required(),
    part_number_romanise: joi.string().required(),
    part_title: joi.string().required(),
    chapter_number: joi.string().required(),
    chapter_title: joi.string().required(),
    article_type: joi.string().required(),
    article_order: joi.number().required(),
    article_number: joi.string().required(),
    article_title: joi.string().required(),
    article_content: joi.string().required(),
    extras: joi
      .array()
      .items(
        joi.object({
          ponit_number: joi.number().required(),
          point_content: joi.number().required(),
        })
      )
      .min(1)
      .optional(),
  });
  return schema.validate(data);
};

exports.articleUpdateValidation = (data) => {
  const schema = joi.object().keys({
    part_number: joi.number().required(),
    part_number_romanise: joi.string().required(),
    part_title: joi.string().required(),
    chapter_number: joi.string().required(),
    chapter_title: joi.string().required(),
    article_type: joi.string().required(),
    article_number: joi.string().required(),
    article_title: joi.string().required(),
    article_content: joi.string().required(),
    extras: joi
      .array()
      .items(
        joi.object({
          ponit_number: joi.number().required(),
          point_content: joi.number().required(),
        })
      )
      .min(1)
      .optional(),
  });
  return schema.validate(data);
};