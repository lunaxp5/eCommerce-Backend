import slugify from "slugify";
import { categoryModel } from "./../../../Database/models/category.model.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";

const addCategory = catchAsyncError(async (req, res, next) => {
  /* #swagger.tags = ['Category']
     #swagger.description = 'Endpoint to add a new category'
     #swagger.parameters['category'] = {
          in: 'body',
          description: 'Category information',
          required: true,
          schema: {
              type: 'object',
              required: ['name', 'Image'],
              properties: {
                  name: { type: 'string', example: 'Electronics' },
                  Image: { type: 'string', example: 'image.jpg' }
              }
          }
      }
     #swagger.responses[201] = {
          description: 'Category created successfully'
      }
     #swagger.responses[400] = {
          description: 'Bad request'
      }
  */
  console.log(req.file);
  req.body.image = req.file.filename;
  req.body.slug = slugify(req.body.name);
  const addcategory = new categoryModel(req.body);
  await addcategory.save();

  res.status(201).json({ message: "success", addcategory });
});

const getAllCategories = catchAsyncError(async (req, res, next) => {
  /* #swagger.tags = ['Category']
     #swagger.description = 'Endpoint to get all categories'
     #swagger.parameters['query'] = {
          in: 'query',
          description: 'Query parameters for filtering, pagination, etc.',
          required: false,
          type: 'object',
          properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              fields: { type: 'string', example: 'name,slug' },
              sort: { type: 'string', example: 'name' }
          }
      }
     #swagger.responses[200] = {
          description: 'A list of categories'
      }
     #swagger.responses[400] = {
          description: 'Bad request'
      }
  */

  let apiFeature = new ApiFeatures(categoryModel.find(), req.query)
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  let getAllCategories = await apiFeature.mongooseQuery;
  // getAllCategories = getAllCategories.map((element)=>{
  //   element.Image = `http://localhost:3000/category/${element.Image}`
  //   return element
  // })

  res
    .status(201)
    .json({ page: PAGE_NUMBER, message: "success", getAllCategories });
});

const updateCategory = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("REQ.BODY:", req.body);
    // Solo genera slug si name está presente
    if (req.body.name) {
      req.body.slug = slugify(req.body.name);
    }
    // Si se sube una nueva imagen, actualiza el campo image
    if (req.file && req.file.filename) {
      req.body.image = req.file.filename;
    }
    const updateCategory = await categoryModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    // Si hay imagen, actualiza la ruta completa
    if (updateCategory && updateCategory.image) {
      updateCategory.image = `${updateCategory.image}`;
    }
    if (updateCategory) {
      return res.status(201).json({ message: "success", updateCategory });
    } else {
      return next(new AppError("category was not found", 404));
    }
  } catch (err) {
    console.error("Error en updateCategory:", err);
    return res
      .status(500)
      .json({ message: "error", error: err.message, stack: err.stack });
  }
});

const deleteCategory = deleteOne(categoryModel, "category");
export { addCategory, getAllCategories, updateCategory, deleteCategory };
