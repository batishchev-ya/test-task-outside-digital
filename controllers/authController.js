const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  validatePassword,
  validateEmail,
  validateNickname,
} = require('./utilsController/validateTemplates');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const db = require('../db/index');

const signToken = (id, secret, expiresIn) => {
  return jwt.sign({ id }, secret, {
    expiresIn: expiresIn,
  });
};

const createSendToken = (id, statusCode, req, res) => {
  const token = signToken(
    id,
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN
  );

  const refreshToken = signToken(
    id,
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN
  );

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwaded-proto'] === 'https',
  });

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwaded-proto'] === 'https',
  });

  res.status(statusCode).json({
    token,
    expiresIn: process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000,
  });
};

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password, nickname } = req.body;
  if (!validateEmail(email)) {
    return next(new AppError({ message: 'Invalid email', statusCode: 400 }));
  }
  if (!validatePassword(password)) {
    return next(new AppError({ message: 'Invalid password', statusCode: 400 }));
  }
  if (!validateNickname(nickname)) {
    return next(new AppError({ message: 'Invalid nickname', statusCode: 400 }));
  }
  const user = (
    await db.query(
      'select * from usertags.users where email=$1 or nickname=$2',
      [email, nickname]
    )
  ).rows[0];
  if (user) {
    return next(
      new AppError({
        message: 'This email or nickname already exists',
        statusCode: 400,
      })
    );
  }

  const passwordHashed = await bcrypt.hash(password, 12);

  const userUid = (
    await db.query(
      'insert into usertags.users(email, password, nickname) values ($1, $2, $3) returning uid;',

      [email, passwordHashed, nickname]
    )
  ).rows[0];

  createSendToken(userUid.uid, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!validatePassword(password)) {
    return next(
      new AppError({
        message: 'Invalid password',
        statusCode: 400,
      })
    );
  }

  const user = (
    await db.query('select uid, password from usertags.users where email=$1', [
      email,
    ])
  ).rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(
      new AppError({ message: 'Incorrect email or password', statusCode: 401 })
    );
  }
  createSendToken(user.uid, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError({ message: 'You are not logged in', statusCode: 401 })
    );
  }

  console.log(req.cookies);
  console.log(token);

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const userUid = (
    await db.query('select uid from usertags.users where uid=$1', [decoded.id])
  ).rows[0];

  if (!userUid) {
    return next(
      new AppError({ message: 'User has been deleted', statusCode: 404 })
    );
  }
  req.userUid = userUid.uid;
  next();
});

exports.refresh = catchAsync(async (req, res, next) => {
  let refreshToken;
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError({ message: 'You are not logged in', statusCode: 401 })
    );
  }

  if (req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken) {
    return next(
      new AppError({
        message: 'You are not allowed to refresh your session',
        statusCode: 401,
      })
    );
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (decoded.id) {
      return res.status(401).json({ message: 'You are still logged in' });

      // return next(
      //   new AppError({ message: 'You are still logged in', statusCode: 400 })
      // );
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      try {
        const decodedRefresh = await promisify(jwt.verify)(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );

        const userUid = (
          await db.query('select uid from usertags.users where uid=$1', [
            decodedRefresh.id,
          ])
        ).rows[0];

        if (!userUid) {
          return next(
            new AppError({ message: 'User has been deleted', statusCode: 404 })
          );
        }
        console.log(userUid.uid);
        req.userUid = userUid.uid;
        createSendToken(userUid.uid, 200, req, res);
      } catch (err) {
        console.log(err);
      }
    }
  }
});
