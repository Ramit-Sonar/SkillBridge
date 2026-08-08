/*
 * Sends a consistent JSON error response for controller and middleware failures.
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode >= 500 ? "Internal Server Error" : err.message;

  if (!isProduction && statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    statusCode,
    success: false,
    errorCode: err.errorCode || undefined,
    message,
    errors: isProduction && statusCode >= 500 ? [] : err.errors || [],
  });
};

export { globalErrorHandler };
