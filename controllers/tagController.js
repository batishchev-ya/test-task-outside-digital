const db = require('../db/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { validateTagName } = require('./utilsController/validateTemplates');
// TODO: Make function for duplication checking and validating data (email, nickname, etc...)

exports.createTag = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  const { name, sortorder } = req.body;

  let optionsQuery = [];
  let stringQueryColumns = '';
  let stringQueryValues = '';

  optionsQuery.push(userUid);
  if (!name) {
    return next(
      new AppError({ message: 'Please provide name for tag', statusCode: 400 })
    );
  }
  if (!validateTagName(name)) {
    return next(
      new AppError({
        message: 'Please provide correct tag name',
        statusCode: 400,
      })
    );
  }
  const oldTag = (
    await db.query('select name from usertags.tags where name=$1', [name])
  ).rows[0];
  if (oldTag) {
    return next(
      new AppError({ message: 'This tag already exists', statusCode: 400 })
    );
  }

  optionsQuery.push(name);
  if (sortorder) {
    stringQueryColumns = ', sortorder';
    stringQueryValues = ', $3';
    optionsQuery.push(sortorder);
  }

  const queryString =
    'insert into usertags.tags(creator, name' +
    stringQueryColumns +
    ') values($1,$2' +
    stringQueryValues +
    ') returning id, name, sortorder';

  const newTag = (await db.query(queryString, optionsQuery)).rows[0];
  console.log(newTag.id);

  await db.query(
    'update usertags.usertags set tags=array_append(tags, $1) where user_id=$2',
    [newTag.id, userUid]
  );
  return res.status(200).json({
    id: newTag.id,
    name: newTag.name,
    sortorder: newTag.sortorder,
  });
});

exports.getTag = catchAsync(async (req, res, next) => {
  const tagId = req.params.id;
  console.log(tagId);
  const tag = (
    await db.query(
      'select creator, name, sortorder from usertags.tags where id=$1',
      [tagId]
    )
  ).rows[0];

  if (!tag) {
    return next(
      new AppError({ message: 'No tag founded with this Id', statusCode: 400 })
    );
  }

  const creator = (
    await db.query('select nickname, uid from usertags.users where uid=$1', [
      tag.creator,
    ])
  ).rows[0];

  return res.status(200).json({
    creator,
    name: tag.name,
    sortorder: tag.sortorder,
  });
});

exports.updateTag = catchAsync(async (req, res, next) => {
  const { sortorder, name } = req.body;
  console.log(sortorder);
  const tagId = req.params.id;
  const userUid = req.userUid;
  let stringQuery = '';
  let optionsQuery = [];

  const tag = (
    await db.query('select id, creator from usertags.tags where id=$1', [tagId])
  ).rows[0];
  if (!tag) {
    return next(
      new AppError({ message: ' No tag founded with this id', statusCode: 400 })
    );
  }

  if (tag.creator != userUid) {
    return next(new AppError({ message: 'Only creator of tag can update it' }));
  }

  if (!name && sortorder == undefined) {
    return next(
      new AppError({
        message: 'Please provide data for updating',
        statusCode: 400,
      })
    );
  }
  if (name) {
    if (!validateTagName(name)) {
      return next(
        new AppError({
          message: 'Please provide correct tag name',
          statusCode: 400,
        })
      );
    }
    const oldTag = (
      await db.query('select name from usertags.tags where name=$1', [name])
    ).rows[0];
    if (oldTag) {
      return next(
        new AppError({ message: 'This tag already exists', statusCode: 400 })
      );
    }
    optionsQuery.push(name);
    stringQuery += `name=$${optionsQuery.length},`;
  }

  if (sortorder != undefined) {
    // TODO: Make Validator for sortorder
    if (!Number.isInteger(sortorder)) {
      return next(
        new AppError({ message: 'sortorder is not int type', statusCode: 400 })
      );
    }
    optionsQuery.push(sortorder);
    stringQuery += `sortorder=$${optionsQuery.length},`;
  }

  let stringQuerySliced = stringQuery.slice(0, -1);
  optionsQuery.push(tagId);
  stringQuerySliced += ` where id=$${optionsQuery.length} `;

  const finalStringQuery =
    'update usertags.tags set ' +
    stringQuerySliced +
    'returning name, sortorder';
  console.log(finalStringQuery);
  console.log(optionsQuery);
  const updatedRows = (await db.query(finalStringQuery, optionsQuery)).rows[0];

  const creator = (
    await db.query('select nickname, uid from usertags.users where uid=$1', [
      tag.creator,
    ])
  ).rows[0];

  return res.status(200).json({
    creator,
    name: updatedRows.name,
    sortorder: updatedRows.sortorder,
  });
});
