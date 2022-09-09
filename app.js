const express = require('express');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRoutes');
const tagRouter = require('./routes/tagRoutes');
const userTagsRouter = require('./routes/userTagsRouter');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const app = express();

// app.enable('trust proxy');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use('/api/v1/tag', tagRouter);
app.use('/api/v1/user/tag', userTagsRouter);
app.use('/api/v1/', userRouter);

app.all('*', (req, res, next) => {
  return next(
    new AppError({
      message: `Can't find ${req.originalUrl} on this server!`,
      statusCode: 404,
    })
  );
});

app.use(globalErrorHandler);
module.exports = app;
