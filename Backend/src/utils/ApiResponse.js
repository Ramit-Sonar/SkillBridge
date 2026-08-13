/*
 * Standard success response envelope returned by API controllers.
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success", pagination = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    if (pagination) {
      this.pagination = pagination;
    }
  }
}

export { ApiResponse };
