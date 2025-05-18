import mongoose from "mongoose";

const paymentReportSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Types.ObjectId,
      ref: "order",
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    paymentMethod: {
      type: mongoose.Types.ObjectId, // Changed from String
      ref: "paymentMethod", // Added reference to paymentMethod model
      required: true,
    },
    transactionReference: {
      // e.g., confirmation number from bank transfer or Pago Movil
      type: String,
      required: true,
      unique: true, // To prevent duplicate reports for the same transaction
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    notes: String, // Optional notes from the user
    status: {
      type: String,
      enum: ["pendingVerification", "verified", "rejected"],
      default: "pendingVerification",
    },
    rejectionReason: String, // If status is "rejected"
    verifiedBy: {
      type: mongoose.Types.ObjectId,
      ref: "user", // Admin who verified/rejected
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

export const paymentReportModel = mongoose.model(
  "paymentReport",
  paymentReportSchema
);
