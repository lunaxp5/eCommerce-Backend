import slugify from "slugify";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { productModel } from "./../../../Database/models/product.model.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";

const addProduct = catchAsyncError(async (req, res, next) => {
  // console.log(req.files);
  req.body.imgCover = req.files.imgCover[0].filename;
  req.body.images = req.files.images.map((ele) => ele.filename);

  // console.log(req.body.imgCover, req.body.images);
  req.body.slug = slugify(req.body.title);
  const addProduct = new productModel(req.body);
  await addProduct.save();

  res.status(201).json({ message: "success", addProduct });
});

const getAllProducts = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(
    productModel.find({ quantity: { $gt: 0 } }),
    req.query
  )
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  const getAllProducts = await apiFeature.mongooseQuery;

  res
    .status(201)
    .json({ page: PAGE_NUMBER, message: "success", getAllProducts });
});
const getSpecificProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const getSpecificProduct = await productModel.findByIdAndUpdate(id);
  res.status(201).json({ message: "success", getSpecificProduct });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const updateProduct = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateProduct && res.status(201).json({ message: "success", updateProduct });

  !updateProduct && next(new AppError("Product was not found", 404));
});

const searchProducts = catchAsyncError(async (req, res, next) => {
  // Busca productos por nombre (title) usando el parámetro 'keyword' y paginación
  // Si no viene el parámetro limit, poner 10 por defecto
  if (!req.query.limit) req.query.limit = 10;
  let apiFeature = new ApiFeatures(
    productModel.find({ quantity: { $gt: 0 } }),
    req.query
  )
    .search()
    .pagination();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  const PAGE_LIMIT = parseInt(req.query.limit);

  // Contar el total de productos que cumplen la búsqueda
  const totalProducts = await productModel.countDocuments({
    quantity: { $gt: 0 },
    ...(req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: "i" } },
            { description: { $regex: req.query.keyword, $options: "i" } },
          ],
        }
      : {}),
  });
  const totalPages = Math.ceil(totalProducts / PAGE_LIMIT);
  const products = await apiFeature.mongooseQuery;
  res.status(200).json({
    currentPage: PAGE_NUMBER,
    totalPages,
    totalProducts,
    message: "success",
    getAllProducts: products,
  });
});

const deleteProduct = deleteOne(productModel, "Product");
export {
  addProduct,
  getAllProducts,
  searchProducts,
  getSpecificProduct,
  updateProduct,
  deleteProduct,
};
