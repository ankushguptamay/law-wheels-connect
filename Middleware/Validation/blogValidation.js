const joi = require("joi");

exports.parentCategoriesValidation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    slug: joi.string().min(3).required(),
    sort_order: joi.number().optional(),
    description: joi.string().min(20).optional(),
  });
  return schema.validate(data);
};

exports.categoriesValidation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    slug: joi.string().min(3).required(),
    sort_order: joi.number().optional(),
    description: joi.string().min(20).optional(),
    parentBlogCatagories: joi.string().required(),
  });
  return schema.validate(data);
};

exports.tagValidation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    slug: joi.string().min(3).required(),
    description: joi.string().min(20).optional(),
  });
  return schema.validate(data);
};

exports.blogValidation = (data) => {
  const schema = joi.object().keys({
    slug: joi.string().min(3).required(),
    category: joi.array().optional(),
    tag: joi.array().optional(),
    title: joi.string().min(3).required(),
    content: joi.string().required(),
    excerpt: joi.string().optional(),
    readTime: joi.string().required(),
    publishDate: joi.string().required(),
    status: joi.string().valid("Draft", "Published").required(),
    description: joi.string().min(20).optional(),
  });
  return schema.validate(data);
};

exports.deleteAdditionalPicValidation = (data) => {
  const schema = joi.object().keys({
    additionalPicId: joi.string().required(),
  });
  return schema.validate(data);
};

exports.slugValidation = (data) => {
  const schema = joi.object().keys({
    slug: joi.string().min(3).required(),
  });
  return schema.validate(data);
};

exports.publishBlogValidation = (data) => {
  const schema = joi.object().keys({
    status: joi.string().valid("Draft", "Published", "Unpublish").required(),
  });
  return schema.validate(data);
};
