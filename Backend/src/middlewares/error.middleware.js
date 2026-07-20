/**
 * Sends a consistent JSON error response for controller and middleware failures.
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || [],
  });
};

export { globalErrorHandler };
