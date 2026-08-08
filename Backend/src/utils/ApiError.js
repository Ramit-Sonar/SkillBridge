/*
 * Standard API error shape used by controllers and middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], errorCode = "") {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
