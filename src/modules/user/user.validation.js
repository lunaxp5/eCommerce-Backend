import Joi from "joi";

const addUserValidation = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().required().trim(),
  password: Joi.string().required(),
});

const updateUserValidation = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email().trim(),
  currentPassword: Joi.string(),
});

const changeUserPasswordValidation = Joi.object({
  password: Joi.string().required(),
  id: Joi.string().hex().length(24).required(),
});

const deleteUserValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addUserValidation,
  updateUserValidation,
  changeUserPasswordValidation,
  deleteUserValidation,
};
