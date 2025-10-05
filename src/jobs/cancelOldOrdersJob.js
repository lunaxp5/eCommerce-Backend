import cron from "node-cron";
import mongoose from "mongoose";
import { orderModel } from "../../Database/models/order.model.js";
import { productModel } from "../../Database/models/product.model.js";
import { OrderStatus } from "../../utils/constants.js";
import dotenv from "dotenv";

dotenv.config();

async function restoreStockAndCancelOrders() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("No MongoDB URI found in env");
  await mongoose.connect(uri);
  const now = new Date();
  const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

  const orders = await orderModel.find({
    status: OrderStatus.PENDING_PAYMENT,
    createdAt: { $lte: twentyMinutesAgo },
  });

  for (const order of orders) {
    for (const item of order.cartItems) {
      await productModel.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { new: true }
      );
    }
    // Update only the status and cancelledAt fields to avoid validation errors
    await orderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          status: OrderStatus.EXPIRED,
          cancelledAt: new Date(),
        },
      }
    );
    console.log(`Orden ${order._id} cancelada y stock restaurado.`);
  }

  await mongoose.disconnect();
}

// Ejecuta cada 5 minutos
cron.schedule("*/5 * * * *", () => {
  console.log("Ejecutando tarea de cancelación de órdenes...");
  restoreStockAndCancelOrders().catch(console.error);
});
