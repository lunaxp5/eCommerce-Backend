import express from "express";
import * as paymentMethodController from "./paymentMethod.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { validate, validateParams } from "../../middlewares/validate.js"; // Assuming you have a validation middleware
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  objectIdSchema,
} from "./paymentMethod.validation.js"; // Assuming validation schemas

const paymentMethodRouter = express.Router();

// User routes
paymentMethodRouter.get(
  "/active",
  paymentMethodController.getActivePaymentMethods
);

// Admin routes
paymentMethodRouter
  .route("/")
  .post(
    protectedRoutes,
    allowedTo("admin"),
    validate(createPaymentMethodSchema), // Add validation if you have it
    paymentMethodController.createPaymentMethod
  )
  .get(
    protectedRoutes,
    allowedTo("admin"),
    paymentMethodController.getAllPaymentMethods
  );

paymentMethodRouter
  .route("/:id")
  .get(
    protectedRoutes,
    validateParams(objectIdSchema), // Add validation for ID
    paymentMethodController.getPaymentMethod
  )
  .put(
    protectedRoutes,
    allowedTo("admin"),
    validate(updatePaymentMethodSchema), // Add validation
    paymentMethodController.updatePaymentMethod
  )
  .delete(
    protectedRoutes,
    allowedTo("admin"),
    validate(objectIdSchema), // Add validation for ID
    paymentMethodController.deletePaymentMethod
  );

export default paymentMethodRouter;
