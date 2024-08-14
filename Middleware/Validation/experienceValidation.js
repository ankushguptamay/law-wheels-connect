const joi = require("joi");

exports.validateExperience = (data) => {
  const schema = joi.object().keys({
    jobTitle: joi.string().min(3).max(30).required(),
    firmName: joi.string().min(3).max(30).required(),
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
