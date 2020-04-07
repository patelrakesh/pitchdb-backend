class CustomError extends Error {
  constructor (message, status) {
    super(message);
    Error.captureStackTrace(this, CustomError);
    this.status = status || 500;
  }
}

module.exports = CustomError;