import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: [true, "Order must belong to a user"],
    },
    cartItems: [
      {
        product: { type: mongoose.Types.ObjectId, ref: "product" },
        name: String, // To store product name at the time of order
        quantity: Number,
        price: Number, // To store price at the time of order
      },
    ],
    totalOrderPrice: Number,
    billingDetails: {
      name: { type: String }, // razonSocial -> name
      address: { type: String }, // direccion -> address
      phone: { type: String }, // telefono -> phone
      dni: { type: String }, // Documento Nacional de Identidad
    },
    shippingAddress: {
      address: { type: String, required: true }, // direccion -> address
      reference: String, // puntoReferencia -> reference
      name: { type: String, required: true }, // nombreQuienRecibe -> name
      phone: { type: String, required: true }, // telefonoQuienRecibe -> phone
    },
    paymentMethod: {
      type: mongoose.Types.ObjectId,
      ref: "paymentMethod", // Reference to your PaymentMethod model
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pendingPayment",
        "paymentReported", // Nuevo estado para cuando el usuario reporta el pago
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "expired",
      ],
      default: "pendingPayment",
    },
    expiresAt: {
      type: Date, // To store when the order payment window closes
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  // Set expiration time for 20 minutes from creation
  if (this.isNew && this.status === "pendingPayment") {
    this.expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  }
  next();
});

export const orderModel = mongoose.model("order", orderSchema);
