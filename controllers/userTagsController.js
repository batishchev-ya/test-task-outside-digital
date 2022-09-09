const db = require('../db/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createUserTags = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  // console.log(userUid);
  // console.log(req.body.tags);
  const tagIds = req.body.tags;

  const user = (
    await db.query('select uid from usertags.users where uid=$1', [userUid])
  ).rows[0];

  if (!user) {
    return next(
      new AppError({ message: 'User has been deleted', statusCode: 404 })
    );
  }

  const tags = (
    await db.query(
      'select id, name, sortorder from usertags.tags where id = any ($1)',
      [tagIds]
    )
  ).rows;

  if (tags.length != tagIds.length) {
    return next(new AppError({ message: 'No tag(s) founded' }));
  }

  const userTags = (
    await db.query(
      `select tags, user_id from usertags.usertags where user_id=$1 and tags=any($2)`,
      [userUid, tagIds]
    )
  ).rows[0];

  // console.log(userTags);
  if (userTags) {
    return next(
      new AppError({
        message: 'This tag(s) already belong to user',
        statusCode: 400,
      })
    );
  }

  await db.query(
    `insert into usertags.usertags values($1, unnest(ARRAY[$2::int[]]) ) 
  `,
    [userUid, tagIds]
  );

  const allTags = (
    await db.query(
      'select user_id,tags from usertags.usertags where user_id=$1',
      [userUid]
    )
  ).rows;

  return res.status(200).json({
    tags: allTags,
  });
});

exports.deleteUserTags = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  const tagId = req.params.id;

  const tag = (
    await db.query('select id from usertags.tags where id=$1', [tagId])
  ).rows[0];

  if (!tag) {
    return next(new AppError({ message: 'No tag found', statusCode: 404 }));
  }

  const userTag = (
    await db.query(
      'select tags from usertags.usertags where tags=$1 and user_id=$2',
      [tagId, userUid]
    )
  ).rows[0];

  if (!userTag) {
    return next(
      new AppError({
        message: 'This tag does not belong to you',
        statusCode: 404,
      })
    );
  }

  await db.query('delete from usertags.usertags where tags=$1 and user_id=$2', [
    tagId,
    userUid,
  ]);

  // TODO: make output as in test task
  // const tags = (await db.query('select id, creator, nickname from usertags.tags where creator'))

  // `with tag_ids as (select * from usertags.usertags where user_id='')
  // select id,name  from  usertags.tags where id in (select id from tag_ids)`

  const updatedListTags = (
    await db.query(
      `with tag_ids as (select tags from usertags.usertags where user_id=$1)
      select id,name, sortorder  from  usertags.tags where id in (select tags from tag_ids)`,
      [userUid]
    )
  ).rows;

  return res.status(200).json({
    tags: updatedListTags,
  });
});

exports.getMyTags = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;

  const tags = (
    await db.query(
      'select name, id, sortorder from usertags.tags where creator=$1',
      [userUid]
    )
  ).rows;

  return res.status(200).json({
    tags,
  });
});
