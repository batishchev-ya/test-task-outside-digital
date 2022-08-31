const AppError = require('../utils/appError');

module.exports = (err, req, res, next) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  let error;
  if (err.name == 'TokenExpiredError') {
    error = new AppError({
      message: 'Your token has been expired',
      statusCode: 401,
    });
  }
  if (err.name == 'JsonWebTokenError') {
    error = new AppError({
      message: 'Invalid token',
      statusCode: 401,
    });
  }
  error = err;
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};
