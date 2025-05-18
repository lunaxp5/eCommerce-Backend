import Joi from "joi";

const transferDetailsSchema = Joi.object({
  bankName: Joi.string().min(2).required(),
  accountNumber: Joi.string().min(5).required(), // Basic validation, can be more specific
  accountHolderName: Joi.string().min(2).required(),
  swiftCode: Joi.string().optional(), // Optional
  referenceInfo: Joi.string().optional(), // Optional, e.g., order ID placeholder
});

const pagoMovilDetailsSchema = Joi.object({
  phoneNumber: Joi.string().min(7).required(), // Basic validation
  bankCode: Joi.string().min(2).required(), // e.g., 0102 for Banco de Venezuela
  idNumber: Joi.string().min(5).required(), // National ID or RIF
  concept: Joi.string().optional(), // Optional, e.g., order ID placeholder
});

export const createPaymentMethodSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  details: Joi.when("name", {
    is: "Transferencia",
    then: transferDetailsSchema.required(),
    otherwise: Joi.when("name", {
      is: "Pago Movil",
      then: pagoMovilDetailsSchema.required(),
      otherwise: Joi.object().required(), // Or some default schema if other types are allowed
    }),
  }),
  isActive: Joi.boolean().optional(),
});

export const updatePaymentMethodSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  details: Joi.when("name", {
    is: "Transferencia",
    then: transferDetailsSchema.optional(),
    otherwise: Joi.when("name", {
      is: "Pago Movil",
      then: pagoMovilDetailsSchema.optional(),
      otherwise: Joi.object().optional(),
    }),
  }).optional(), // Details itself is optional for update
  isActive: Joi.boolean().optional(),
  id: Joi.string().hex().length(24).required(), // for params
});

export const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
