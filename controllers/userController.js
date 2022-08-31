// const format = require('pg-format');
const bcrypt = require('bcryptjs');

const db = require('../db/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  validatePassword,
  validateEmail,
  validateNickname,
} = require('./utilsController/checkData');

exports.getUser = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  // TODO: make one query instead of two
  const user = (
    await db.query('select email, nickname from usertags.users where uid=$1', [
      userUid,
    ])
  ).rows[0];
  if (!user) {
    return next(
      new AppError({ message: 'No user founded wtih id', statusCode: 404 })
    );
  }
  const tags = (
    await db.query(
      'select id, name, sortorder from usertags.tags where creator=$1',
      [userUid]
    )
  ).rows;

  const result = {
    email: user.email,
    nickname: user.nickname,
    tags,
  };
  return res.status(200).json(result);
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { email, password, nickname } = req.body;
  const userUid = req.userUid;
  let stringQuery = '';
  let queryOptions = [];
  if (!email && !password && !nickname) {
    return next(
      new AppError({
        message: 'Please provide info for updating',
        statusCode: 400,
      })
    );
  }

  const user = (
    await db.query('select * from usertags.users where uid=$1', [userUid])
  ).rows[0];

  if (email) {
    if (!validateEmail(email)) {
      return next(new AppError({ message: 'Invalid email', statusCode: 400 }));
    }
    if (email == user.email) {
      return next(
        new AppError({ message: 'This email already exists', statusCode: 400 })
      );
    }
    queryOptions.push(email);
    stringQuery = `email=$${queryOptions.length},`;
  }

  if (password) {
    if (!validatePassword(password)) {
      return next(
        new AppError({
          message: 'Invalid password',
          statusCode: 400,
        })
      );
    }
    const passwordHashed = await bcrypt.hash(password, 12);
    queryOptions.push(passwordHashed);
    stringQuery += `password=$${queryOptions.length},`;
  }

  if (nickname) {
    if (!validateNickname(nickname)) {
      return next(
        new AppError({ message: 'Invalid nickname', statusCode: 400 })
      );
    }
    if (nickname == user.nickname) {
      return next(
        new AppError({
          message: 'This nickname already exists',
          statusCode: 400,
        })
      );
    }
    queryOptions.push(nickname);
    stringQuery += `nickname=$${queryOptions.length},`;
  }

  let stringQuerySliced = stringQuery.slice(0, -1);
  queryOptions.push(userUid);
  stringQuerySliced += ` where uid=$${queryOptions.length}`;

  const finalStringQuery =
    'update usertags.users set ' + stringQuerySliced + 'returning *';
  const updatedRows = (await db.query(finalStringQuery, queryOptions)).rows[0];

  return res.status(200).json({
    email: updatedRows.email,
    nickname: updatedRows.nickname,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  const deletedRows = (
    await db.query('delete from usertags.users where uid=$1', [userUid])
  ).rows[0];

  req.userUid = undefined;

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({
    status: 'success',
  });
});
