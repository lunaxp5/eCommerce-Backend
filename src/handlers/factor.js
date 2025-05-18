import { AppError } from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import { ApiFeatures } from "../utils/ApiFeatures.js"; // Asumiendo que tienes una clase ApiFeatures para paginación, filtrado, etc.

export const deleteOne = (model, name) => {
  return catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const document = await model.findByIdAndDelete(id); // No necesitas {new: true} para delete

    if (!document) {
      return next(
        new AppError(`${name || "Document"} not found with id ${id}`, 404)
      );
    }

    // Para ser consistentes, si 'name' se provee, úsalo en la respuesta.
    // O simplemente un mensaje genérico de éxito.
    const responseKey = name || "document";
    res.status(200).json({ message: "success", [responseKey]: document }); // Cambiado a 200 OK o 204 No Content si prefieres no devolver el doc
  });
};

export const getAll = (model, modelName) => {
  return catchAsyncError(async (req, res, next) => {
    let filter = {};
    if (req.filterObj) {
      // Si tienes filtros específicos pasados por un middleware previo
      filter = req.filterObj;
    }
    // Contar documentos totales para paginación
    const totalDocuments = await model.countDocuments(filter);

    // Construir características de API (paginación, filtrado, ordenamiento, selección de campos)
    const apiFeatures = new ApiFeatures(model.find(filter), req.query)
      .paginate()
      .filter()
      .sort()
      .search(modelName) // Asumiendo que tu search puede tomar el nombre del modelo para buscar en campos específicos
      .fields();

    const documents = await apiFeatures.mongooseQuery;

    res.status(200).json({
      message: "Success",
      results: documents.length,
      paginationData: {
        // Opcional: información de paginación
        currentPage: apiFeatures.page,
        limit: apiFeatures.limit,
        numberOfPages: Math.ceil(totalDocuments / apiFeatures.limit),
        totalDocuments,
      },
      data: documents,
    });
  });
};

export const getOne = (model, modelName, populationOptions) => {
  return catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let query = model.findById(id);

    if (populationOptions) {
      query = query.populate(populationOptions);
    }

    const document = await query;

    if (!document) {
      return next(
        new AppError(`${modelName || "Document"} not found with id ${id}`, 404)
      );
    }
    const responseKey = modelName || "data"; // Or "document" or a singular version of modelName
    res.status(200).json({ message: "Success", [responseKey]: document });
  });
};
