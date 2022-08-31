const db = require('../db/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { validateTagName } = require('./utilsController/checkData');

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
  // `update usertags.usertags set tags=array_append(tags, 3) where user_id='010cf1f5-e4f2-4df8-989a-18694368c711'`;

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
