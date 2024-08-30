const joi = require("joi");

exports.parentCategoriesValidation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    slug: joi.string().min(3).required(),
    sort_order: joi.number().optional(),
    description: joi.number().optional(),
  });
  return schema.validate(data);
};

exports.categoriesValidation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    slug: joi.string().min(3).required(),
    sort_order: joi.number().optional(),
    description: joi.number().optional(),
    parentBlogCatagories: joi.string().required(),
  });
  return schema.validate(data);
};

exports.tagValidation = (data) => {
    const schema = joi.object().keys({
      name: joi.string().min(3).required(),
      slug: joi.string().min(3).required(),
      description: joi.number().optional()
    });
    return schema.validate(data);
  };