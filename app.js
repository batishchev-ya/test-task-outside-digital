const express = require('express');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRoutes');
const tagRouter = require('./routes/tagRoutes');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

// app.enable('trust proxy');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use('/api/v1/tag', tagRouter);
app.use('/api/v1/', userRouter);

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

app.use(globalErrorHandler);
module.exports = app;
