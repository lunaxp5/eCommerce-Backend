export const globalErrorHandling = (err, req, res, next) => {
  // Must be last middleware
  const code = err.statuscode || 500;
  const response = {
    status: "fail",
    message: err.message || "Internal Server Error",
  };
  if (err.field) {
    response.field = err.field;
  }
  if (process.env.MODE === "dev") {
    response.stack = err.stack;
  }
  res.status(code).json(response);
};
