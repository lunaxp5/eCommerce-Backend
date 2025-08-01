import { AppError } from "../utils/AppError.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const firstError = error.details[0];
      return next(new AppError(firstError.message, 400, firstError.path[0]));
    } else {
      next();
    }
  };
};
