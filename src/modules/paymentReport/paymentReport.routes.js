import express from "express";
import * as paymentReportController from "./paymentReport.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { objectIdSchema } from "../review/review.validation.js"; // Generic ID validation
// You might need to create specific validation schemas for payment reports
// import { createPaymentReportSchema, updatePaymentReportStatusSchema } from './paymentReport.validation.js';

const paymentReportRouter = express.Router();

// User routes
paymentReportRouter.post(
  "/",
  protectedRoutes,
  allowedTo("user"),
  // validate(createPaymentReportSchema), // Add validation for creating a report
  paymentReportController.createPaymentReport
);

paymentReportRouter.get(
  "/",
  protectedRoutes,
  allowedTo("user"),
  paymentReportController.getUserPaymentReports
);

// Admin routes
paymentReportRouter.get(
  "/all", // Differentiate from user's get all reports route
  protectedRoutes,
  allowedTo("admin"),
  paymentReportController.getAllPaymentReports
);

paymentReportRouter.patch(
  "/:id/status", // Using PATCH as it's a partial update of status
  protectedRoutes,
  allowedTo("admin"),
  validate(objectIdSchema), // Validate report ID format
  // validate(updatePaymentReportStatusSchema), // Add validation for updating report status
  paymentReportController.updatePaymentReportStatus
);

export default paymentReportRouter;
