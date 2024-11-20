const joi = require("joi");

exports.validateAdvocateReview = (data) => {
  const schema = joi.object().keys({
    rating: joi.number().greater(0).less(6).required(),
    message: joi.string().optional(),
    advocate: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateNotGiveReview = (data) => {
  const schema = joi.object().keys({
    advocate: joi.string().required(),
  });
  return schema.validate(data);
};

exports.validateUpdateAdvocateReview = (data) => {
  const schema = joi.object().keys({
    rating: joi.number().greater(0).less(6).required(),
    reviewId: joi.string().required(),
    message: joi.string().optional(),
  });
  return schema.validate(data);
};

exports.validateDeleteAdvocateReviewMessage = (data) => {
  const schema = joi.object().keys({
    reviewId: joi.string().required(),
  });
  return schema.validate(data);
};
