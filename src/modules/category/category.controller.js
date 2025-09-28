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
  const { id } = req.params;
  const { name } = req.body;
  req.body.slug = slugify(req.body.name);
  const updateCategory = await categoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateCategory &&
    res.status(201).json({ message: "success", updateCategory });

  !updateCategory && next(new AppError("category was not found", 404));
});

const deleteCategory = deleteOne(categoryModel, "category");
export { addCategory, getAllCategories, updateCategory, deleteCategory };
