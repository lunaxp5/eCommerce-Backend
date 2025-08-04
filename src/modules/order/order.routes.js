import express from "express";
import * as orderController from "./order.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { validate, validateParams } from "../../middlewares/validate.js";
import { objectIdSchema } from "../review/review.validation.js"; // Assuming you might use a generic objectIdSchema
// You might need to create specific validation schemas for order creation and updates
// import { createOrderSchema, updateOrderStatusSchema } from './order.validation.js';

const orderRouter = express.Router();

// User routes
orderRouter.post(
  "/",
  protectedRoutes,
  allowedTo("user"),
  // validate(createOrderSchema), // Add validation for creating an order
  orderController.createOrder
);

orderRouter.get(
  "/",
  protectedRoutes,
  allowedTo("user"),
  orderController.getUserOrders
);

orderRouter.get(
  "/:id",
  protectedRoutes,
  allowedTo("user", "admin"), // Allow admin to also get specific orders if needed
  validateParams(objectIdSchema), // Validate order ID format
  orderController.getSpecificOrder
);

// Admin routes
orderRouter.get(
  "/all", // Differentiate from user's get all orders route
  protectedRoutes,
  allowedTo("admin"),
  orderController.getAllOrders
);

orderRouter.put(
  "/:id/status",
  protectedRoutes,
  allowedTo("admin"),
  // validate(objectIdSchema), // Validate order ID format
  // validate(updateOrderStatusSchema), // Add validation for updating order status
  orderController.updateOrderStatus
);

// Stripe webhook for online payments - This should be a public route, Stripe needs to access it
orderRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Stripe requires the raw body
  orderController.createOnlineOrder
);

// Route for creating a checkout session (could be user or admin depending on your flow)
orderRouter.post(
  "/:id/checkout-session",
  protectedRoutes,
  allowedTo("user"), // Or whichever role is appropriate
  validate(objectIdSchema), // Validate cart ID or order ID depending on your setup
  orderController.createCheckOutSession
);

export default orderRouter;
