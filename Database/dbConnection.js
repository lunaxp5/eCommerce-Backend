import mongoose from "mongoose";

export function dbConnection() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("DB Connected Succesfully");
    })
    .catch((error) => {
      console.log("DB Failed to connect", error);
    });
}

//Use this is postman https://ecommerce-backend-codv.onrender.com/api/v1/auth/signup
