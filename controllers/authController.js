const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  validatePassword,
  validateEmail,
  validateNickname,
} = require('./utilsController/checkData');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const db = require('../db/index');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (id, statusCode, req, res) => {
  const token = signToken(id);

  res.cookie('jwt', token, {
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
  ).rows[0].uid;

  await db.query('insert into usertags.usertags(user_id) values($1);', [
    userUid,
  ]);

  // --------------------------------------------------------------------------------------------
  // const userUid = await db.query(
  //   `begin;
  // with uid_d as(
  // insert into usertags.users(email, password, nickname) values($1, $2, $3) RETURNING uid)
  // insert into usertags.usertags(user_id) select uid from uid_d;
  // commit;`,
  //   [email, passwordHashed, nickname]
  // );
  createSendToken(userUid, 200, req, res);
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

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const userUid = (
    await db.query('select uid from usertags.users where uid=$1', [decoded.id])
  ).rows[0].uid;

  if (!userUid) {
    return next(
      new AppError({ message: 'User has been deleted', statusCode: 404 })
    );
  }
  req.userUid = userUid;
  next();
});
