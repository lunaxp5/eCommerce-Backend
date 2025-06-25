import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { orderModel } from "../../../Database/models/order.model.js";
import { paymentReportModel } from "../../../Database/models/paymentReport.model.js";
import { paymentMethodModel } from "../../../Database/models/paymentMethod.model.js"; // Import paymentMethodModel

export const createPaymentReport = catchAsyncError(async (req, res, next) => {
  const {
    orderId,
    paymentMethodId, // Changed from paymentMethod to paymentMethodId
    transactionReference,
    amount,
    paymentDate,
    notes,
  } = req.body;
  const userId = req.user._id;

  const order = await orderModel.findById(orderId);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  if (order.user.toString() !== userId.toString()) {
    return next(
      new AppError("You can only report payments for your own orders", 403)
    );
  }
  if (order.status !== "pendingPayment") {
    return next(
      new AppError(
        `Order is no longer pending payment. Current status: ${order.status}`,
        400
      )
    );
  }

  // Verify payment method ID
  const paymentMethodExists = await paymentMethodModel.findById(
    paymentMethodId
  );
  if (!paymentMethodExists) {
    return next(new AppError("Payment method not found", 404));
  }
  if (!paymentMethodExists.isPayableManually) {
    // Assuming a field to check if it's a manual payment type
    return next(
      new AppError(
        "This payment method is not eligible for manual reporting.",
        400
      )
    );
  }

  // Check if a report for this transaction already exists
  const existingReport = await paymentReportModel.findOne({
    transactionReference,
  });
  if (existingReport) {
    return next(
      new AppError(
        "A payment report with this transaction reference already exists.",
        409
      )
    );
  }

  const paymentReport = new paymentReportModel({
    order: orderId,
    user: userId,
    paymentMethod: paymentMethodId, // Use paymentMethodId
    transactionReference,
    amount,
    paymentDate,
    notes,
    status: "pendingVerification",
  });

  await paymentReport.save();

  // Cambiar el estado de la orden a 'paymentReported' cuando el usuario reporta el pago
  order.status = "paymentReported";
  await order.save();

  res.status(201).json({
    message: "Payment report submitted successfully. It will be verified soon.",
    paymentReport,
  });
});

export const getUserPaymentReports = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const reports = await paymentReportModel
    .find({ user: userId })
    .populate("order paymentMethod"); // Added paymentMethod to populate
  res.status(200).json({ reports });
});

// Admin: Get all payment reports
export const getAllPaymentReports = catchAsyncError(async (req, res, next) => {
  const reports = await paymentReportModel
    .find()
    .populate("order user", "name email")
    .populate("paymentMethod"); // Added paymentMethod to populate
  res.status(200).json({ reports });
});

// Admin: Update payment report status (verify/reject)
export const updatePaymentReportStatus = catchAsyncError(
  async (req, res, next) => {
    const reportId = req.params.id;
    const { status, rejectionReason } = req.body; // status: "verified" or "rejected"
    const adminId = req.user._id;

    if (!["verified", "rejected"].includes(status)) {
      return next(new AppError("Invalid status provided.", 400));
    }
    if (status === "rejected" && !rejectionReason) {
      return next(
        new AppError(
          "Rejection reason is required when rejecting a report.",
          400
        )
      );
    }

    const report = await paymentReportModel.findById(reportId);
    if (!report) {
      return next(new AppError("Payment report not found", 404));
    }
    if (report.status !== "pendingVerification") {
      return next(new AppError(`Report is already ${report.status}.`, 400));
    }

    report.status = status;
    report.verifiedBy = adminId;
    report.verifiedAt = Date.now();
    if (status === "rejected") {
      report.rejectionReason = rejectionReason;
    }

    await report.save();

    // If verified, update the corresponding order
    if (status === "verified") {
      const order = await orderModel.findById(report.order);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = "paid"; // Or "processing" if that's your next step
        order.expiresAt = null; // Payment completed, remove expiration
        await order.save();
      } else {
        // This case should ideally not happen if data integrity is maintained
        console.error(
          `Order ${report.order} not found for verified payment report ${report._id}`
        );
        // Potentially create a notification for admins or a logging mechanism
      }
    }

    res.status(200).json({ message: `Payment report ${status}`, report });
  }
);
