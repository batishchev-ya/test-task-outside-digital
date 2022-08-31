class AppError extends Error {
  constructor(params) {
    super(params.message);
    this.statusCode = params.statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
  }
}

module.exports = AppError;
