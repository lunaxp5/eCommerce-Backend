import { paymentMethodModel } from "../../../Database/models/paymentMethod.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import * as factor from "../../handlers/factor.js";

// 1. Create Payment Method
export const createPaymentMethod = catchAsyncError(async (req, res, next) => {
  const { name, details } = req.body;

  // Basic validation for required fields based on type
  if (name === "Transferencia") {
    if (
      !details.bankName ||
      !details.accountNumber ||
      !details.accountHolderName
    ) {
      return next(
        new AppError(
          "For Transferencia, bankName, accountNumber, and accountHolderName are required in details.",
          400
        )
      );
    }
  } else if (name === "Pago Movil") {
    if (!details.phoneNumber || !details.bankCode || !details.idNumber) {
      return next(
        new AppError(
          "For Pago Movil, phoneNumber, bankCode, and idNumber are required in details.",
          400
        )
      );
    }
  } else if (!details || Object.keys(details).length === 0) {
    // For other types or if details are generally required but empty
    return next(new AppError("Payment method details are required.", 400));
  }

  const paymentMethod = new paymentMethodModel({
    name,
    details,
  });
  await paymentMethod.save();
  res
    .status(201)
    .json({ message: "Payment method created successfully", paymentMethod });
});

// 2. Get All Payment Methods (Admin)
export const getAllPaymentMethods = factor.getAll(paymentMethodModel);

// 3. Get Active Payment Methods (User)
export const getActivePaymentMethods = catchAsyncError(
  async (req, res, next) => {
    const paymentMethods = await paymentMethodModel.find({ isActive: true });
    if (!paymentMethods.length) {
      return next(new AppError("No active payment methods found", 404));
    }
    res.status(200).json({
      message: "Success",
      count: paymentMethods.length,
      paymentMethods,
    });
  }
);

// 4. Get Specific Payment Method
export const getPaymentMethod = factor.getOne(paymentMethodModel);

// 5. Update Payment Method (Admin - to change details or isActive status)
export const updatePaymentMethod = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { name, details, isActive } = req.body;

  const paymentMethod = await paymentMethodModel.findById(id);
  if (!paymentMethod) {
    return next(new AppError("Payment method not found", 404));
  }

  // Basic validation for required fields if details are being updated
  if (details) {
    const currentName = name || paymentMethod.name; // Use new name if provided, else existing
    if (currentName === "Transferencia") {
      if (
        !details.bankName ||
        !details.accountNumber ||
        !details.accountHolderName
      ) {
        return next(
          new AppError(
            "For Transferencia, bankName, accountNumber, and accountHolderName are required in details.",
            400
          )
        );
      }
    } else if (currentName === "Pago Movil") {
      if (!details.phoneNumber || !details.bankCode || !details.idNumber) {
        return next(
          new AppError(
            "For Pago Movil, phoneNumber, bankCode, and idNumber are required in details.",
            400
          )
        );
      }
    } else if (Object.keys(details).length === 0) {
      return next(
        new AppError(
          "Payment method details cannot be empty if provided for update.",
          400
        )
      );
    }
  }

  const updatedPaymentMethod = await paymentMethodModel.findByIdAndUpdate(
    id,
    { name, details, isActive },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    message: "Payment method updated successfully",
    paymentMethod: updatedPaymentMethod,
  });
});

// 6. Delete Payment Method (Admin)
export const deletePaymentMethod = factor.deleteOne(paymentMethodModel);
