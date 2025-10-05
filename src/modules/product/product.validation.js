import Joi from "joi";

const addProductValidation = Joi.object({
  title: Joi.string().required().trim().min(3),
  imgCover: Joi.string(),
  images: Joi.array().items(Joi.string()),
  description: Joi.string().max(100).min(10).required().trim(),
  price: Joi.number().min(0).required().default(0),
  priceAfterDiscount: Joi.number().min(0).default(0),
  quantity: Joi.number().min(0).default(0),
  sold: Joi.number().min(0).default(0),
  category: Joi.string().hex().length(24).required(),
  subcategory: Joi.string().hex().length(24).allow(null, ""),
  brand: Joi.string().hex().length(24).allow(null, ""),
  ratingAvg: Joi.number().min(1).max(5).default(5).allow(null, ""),
  ratingCount: Joi.number().min(0).default(0).allow(null, ""),
  isPublic: Joi.boolean().default(false),
});

const getSpecificProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const updateProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
  imgCover: Joi.string(),
  images: Joi.array().items(Joi.string()),
  title: Joi.string().required().trim().min(3),
  description: Joi.string().max(100).min(10).trim(),
  price: Joi.number().min(0).default(0),
  priceAfterDiscount: Joi.number().min(0).default(0),
  quantity: Joi.number().min(0).default(0),
  sold: Joi.number().min(0).default(0),
  category: Joi.string().hex().length(24),
  subcategory: Joi.string().hex().length(24),
  brand: Joi.string().hex().length(24),
  ratingAvg: Joi.number().min(1).max(5),
  ratingCount: Joi.number().min(0),
});

const deleteProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addProductValidation,
  getSpecificProductValidation,
  updateProductValidation,
  deleteProductValidation,
};
