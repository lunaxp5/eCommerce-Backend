import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { cartModel } from "../../../Database/models/cart.model.js";
import { productModel } from "../../../Database/models/product.model.js";
import { orderModel } from "../../../Database/models/order.model.js";
import { userModel } from "../../../Database/models/user.model.js";
import { paymentMethodModel } from "../../../Database/models/paymentMethod.model.js"; // Assuming you have this model

import Stripe from "stripe";
const stripe = new Stripe(
  "sk_test_51NV8e0HVbfRYk4SfG3Ul84cabreiXkPbW1xMugwqvU9is2Z2ICEafTtG6NHLIUdFVIjkiRHYmAPKxCLsCpoU2NnN00LVpHcixz"
);

// Helper function to check stock and update it
async function checkAndUpdateStock(cartItems) {
  for (let item of cartItems) {
    const product = await productModel.findById(item.product);
    if (!product || product.quantity < item.quantity) {
      throw new AppError(
        `Product ${
          product?.name || item.product
        } is out of stock or quantity unavailable.`,
        400
      );
    }
  }
  // If all products are available, decrement stock
  // This should be done atomically if possible, or within a transaction in a replica set environment
  for (let item of cartItems) {
    await productModel.findByIdAndUpdate(
      item.product,
      { $inc: { quantity: -item.quantity, sold: item.quantity } },
      { new: true } // ensure to get the updated document if needed, though not strictly necessary here
    );
  }
}

export const createOrder = catchAsyncError(async (req, res, next) => {
  const { cartId, billingDetails, shippingAddress, paymentMethodId } = req.body;
  const userId = req.user._id; // Assuming user ID is available from auth middleware

  // Validate that shippingAddress is provided and has the required fields
  if (
    !shippingAddress ||
    !shippingAddress.address ||
    !shippingAddress.name ||
    !shippingAddress.phone
  ) {
    // Changed from Spanish to English
    return next(
      new AppError(
        "Shipping address with address, name, and phone is required.",
        400
      )
    ); // Changed from Spanish to English
  }

  const cart = await cartModel.findById(cartId).populate("cartItems.product");
  if (!cart || cart.user.toString() !== userId.toString()) {
    return next(new AppError("Cart not found or does not belong to user", 404));
  }
  if (cart.cartItems.length === 0) {
    return next(new AppError("Cannot create order from an empty cart", 400));
  }

  // Verify payment method
  const paymentMethod = await paymentMethodModel.findById(paymentMethodId);
  if (!paymentMethod) {
    return next(new AppError("Invalid payment method ID", 400));
  }
  if (!paymentMethod.isActive) {
    return next(new AppError("Selected payment method is not active", 400));
  }

  // Check and update stock
  try {
    await checkAndUpdateStock(cart.cartItems);
  } catch (error) {
    return next(error);
  }

  // Prepare order items with historical pricing and naming
  const orderItems = cart.cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.name, // Store current name
    quantity: item.quantity,
    price: item.product.priceAfterDiscount || item.product.price, // Store current price
  }));

  const totalOrderPrice = cart.totalPriceAfterDiscount || cart.totalPrice;

  // Determine billing details
  let finalBillingDetails = {}; // Default to empty object

  if (billingDetails && Object.keys(billingDetails).length > 0) {
    // If billingDetails are provided in the request body
    finalBillingDetails = billingDetails;
    // Optionally, save/update user's billing details
    await userModel.findByIdAndUpdate(
      userId,
      { billingDetails: finalBillingDetails }, // Save the provided details
      { new: true, runValidators: true }
    );
  } else {
    // If no billingDetails in request body, try to use user's saved details
    const user = await userModel.findById(userId);
    if (
      user &&
      user.billingDetails &&
      Object.keys(user.billingDetails).length > 0
    ) {
      finalBillingDetails = user.billingDetails;
    }
    // If user also doesn't have billingDetails, finalBillingDetails remains {}
  }

  const order = new orderModel({
    user: userId,
    cartItems: orderItems,
    totalOrderPrice,
    billingDetails: finalBillingDetails,
    shippingAddress: shippingAddress, // Directly use the provided shippingAddress
    paymentMethod: paymentMethodId,
    status: "pendingPayment",
    // expiresAt will be set by the pre-save hook
  });

  await order.save();

  // Optionally, clear the cart after order creation
  // await cartModel.findByIdAndDelete(cartId);

  res.status(201).json({
    message:
      "Order created successfully. You have 20 minutes to complete the payment.",
    order,
  });
});

export const getUserOrders = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const orders = await orderModel
    .find({ user: userId })
    .populate("cartItems.product paymentMethod");
  res.status(200).json({ orders });
});

export const getSpecificOrder = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.id;
  const userId = req.user._id; // Or admin check

  const order = await orderModel
    .findOne({ _id: orderId, user: userId })
    .populate("cartItems.product paymentMethod");
  // Admin might need to find any order: await orderModel.findById(orderId).populate(...);

  if (!order) {
    return next(
      new AppError(
        "Order not found or you do not have permission to view it",
        404
      )
    );
  }
  res.status(200).json({ order });
});

// Placeholder for admin to get all orders
export const getAllOrders = catchAsyncError(async (req, res, next) => {
  const orders = await orderModel
    .find()
    .populate("user cartItems.product paymentMethod");
  res.status(200).json({ orders });
});

// Placeholder for updating order status (e.g., by admin)
export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.id;
  const { status } = req.body; // e.g., "paid", "shipped", "delivered", "cancelled"

  const order = await orderModel.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  if (status === "paid" && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.expiresAt = null; // Payment completed, remove expiration
    await order.save();
  }
  res.status(200).json({ message: "Order status updated", order });
});

// Function to cancel expired orders (could be run by a cron job)
export const cancelExpiredOrders = async () => {
  const now = new Date();
  const expiredOrders = await orderModel.find({
    status: "pendingPayment",
    expiresAt: { $lte: now },
  });

  if (expiredOrders.length > 0) {
    console.log(`Found ${expiredOrders.length} expired orders to cancel.`);
    for (const order of expiredOrders) {
      order.status = "expired";
      await order.save();
      // Add stock back
      for (const item of order.cartItems) {
        await productModel.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity, sold: -item.quantity },
        });
      }
      console.log(`Order ${order._id} cancelled and stock restored.`);
    }
  } else {
    console.log("No expired orders found.");
  }
};

// Example of setting up a simple interval check (not for production, use a proper cron job tool)
// setInterval(cancelExpiredOrders, 60 * 1000); // Check every minute

export const createCheckOutSession = catchAsyncError(async (req, res, next) => {
  let cart = await cartModel.findById(req.params.id);
  if (!cart) return next(new AppError("Cart was not found", 404));

  console.log(cart);

  let totalOrderPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalPrice;

  let sessions = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: totalOrderPrice * 100,
          product_data: {
            name: req.user.name,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://github.com/AbdeIkader",
    cancel_url: "https://www.linkedin.com/in/abdelrahman-abdelkader-259781215/",
    customer_email: req.user.email,
    client_reference_id: req.params.id,
    metadata: req.body.shippingAddress,
  });

  res.json({ message: "success", sessions });
});

export const createOnlineOrder = catchAsyncError(async (request, response) => {
  const sig = request.headers["stripe-signature"].toString();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      "whsec_fcatGuOKvXYUQoz5NWSwH9vaqdWXIWsI"
    );
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type == "checkout.session.completed") {
    card(event.data.object, response);
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }
});

async function card(e, res) {
  let cart = await cartModel.findById(e.client_reference_id);

  if (!cart) return next(new AppError("Cart was not found", 404));

  let user = await userModel.findOne({ email: e.customer_email });
  const order = new orderModel({
    userId: user._id,
    cartItem: cart.cartItem,
    totalOrderPrice: e.amount_total / 100,
    shippingAddress: e.metadata.shippingAddress,
    paymentMethod: "card",
    isPaid: true,
    paidAt: Date.now(),
  });

  await order.save();

  if (order) {
    let options = cart.cartItem.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
      },
    }));

    await productModel.bulkWrite(options);

    await cartModel.findOneAndDelete({ userId: user._id });

    return res.status(201).json({ message: "success", order });
  } else {
    next(new AppError("Error in cart ID", 404));
  }
}
