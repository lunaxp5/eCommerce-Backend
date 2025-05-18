import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Payment method name is required"],
      trim: true,
      unique: [true, "Payment method name must be unique"],
      minlength: [2, "Too short payment method name"],
    },
    // Details will store specific information for each payment method
    // For 'Transferencia': { bankName, accountNumber, accountHolderName, swiftCode, referenceInfo }
    // For 'Pago Movil': { phoneNumber, bankCode, idNumber, concept }
    details: {
      type: mongoose.Schema.Types.Mixed, // Allows for flexible object structure
      required: [true, "Payment method details are required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: Add a slug for user-friendly URLs if needed
    // slug: {
    //   type: String,
    //   lowercase: true,
    // },
  },
  { timestamps: true }
);

export const paymentMethodModel = mongoose.model(
  "PaymentMethod",
  paymentMethodSchema
);
