import Joi from "joi";
import mongoose from "mongoose"; // Necesitarás mongoose para validar ObjectId

// Definición de isValidObjectId
const isValidObjectId = (value, helpers) => {
  // Comprueba si el valor es un ObjectId válido de MongoDB
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid"); // Devuelve un error de Joi si no es válido
  }
  return value; // Devuelve el valor si es válido
};

const addReviewValidation = Joi.object({
  text: Joi.string().trim().required(),
  productId: Joi.string()
    .custom(isValidObjectId, "MongoDB ObjectId validation")
    .required(), // Puedes usarla aquí también si es necesario
  rate: Joi.number().default(1),
});

const getSpecificReviewValidation = Joi.object({
  id: Joi.string()
    .custom(isValidObjectId, "MongoDB ObjectId validation")
    .required(),
});

const updateReviewValidation = Joi.object({
  id: Joi.string()
    .custom(isValidObjectId, "MongoDB ObjectId validation")
    .required(),
  text: Joi.string().trim(),
  rate: Joi.number(),
});

const deleteReviewValidation = Joi.object({
  id: Joi.string()
    .custom(isValidObjectId, "MongoDB ObjectId validation")
    .required(),
});

export const objectIdSchema = Joi.object({
  id: Joi.string()
    .custom(isValidObjectId, "MongoDB ObjectId validation") // Ahora isValidObjectId está definida
    .required(),
});

export {
  addReviewValidation,
  getSpecificReviewValidation,
  updateReviewValidation,
  deleteReviewValidation,
};
