import express from "express";
import * as product from "./product.controller.js";
import { validate, validateParams } from "../../middlewares/validate.js";
import {
  addProductValidation,
  deleteProductValidation,
  getSpecificProductValidation,
  updateProductValidation,
} from "./product.validation.js";
import { uploadMultipleFiles } from "../../../multer/multer.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const productRouter = express.Router();

let arrFields = [
  { name: "imgCover", maxCount: 1 },
  { name: "images", maxCount: 20 },
];

productRouter
  .route("/")
  .post(
    protectedRoutes,
    allowedTo("admin"),
    uploadMultipleFiles(arrFields, "products"),
    validate(addProductValidation),
    product.addProduct
  )
  .get(product.getAllProducts);

// Endpoint para búsqueda de productos por nombre con paginación
productRouter.get("/search", product.searchProducts);

productRouter
  .route("/:id")
  .put(
    protectedRoutes,
    allowedTo("admin"),
    validate(updateProductValidation),
    product.updateProduct
  )
  .delete(
    protectedRoutes,
    allowedTo("admin"),
    validate(deleteProductValidation),
    product.deleteProduct
  )
  .get(
    validateParams(getSpecificProductValidation),
    product.getSpecificProduct
  );

export default productRouter;
