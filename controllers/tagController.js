const db = require('../db/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { validateTagName } = require('./utilsController/validateTemplates');
const APIFeatures = require('../utils/APIFeatures');
// TODO: Make function for duplication checking and validating data (email, nickname, etc...)

exports.createTag = catchAsync(async (req, res, next) => {
  const userUid = req.userUid;
  const { name, sortorder } = req.body;

  const optionsQuery = [];
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
  const oldTag = (await db.selectQuery('tags', ['name'], ['name'], [name]))
    .rows[0];
  // await db.selectQuery(['name'], 'tags', ['name'], [name]);
  if (oldTag) {
    return next(
      new AppError({ message: 'This tag already exists', statusCode: 400 })
    );
  }

  optionsQuery.push(name);
  if (sortorder != undefined) {
    stringQueryColumns = ', sortorder';
    stringQueryValues = ', $3';
    optionsQuery.push(sortorder);
  }
  // TODO: make template string instaed of Concatenation
  const queryString =
    'insert into usertags.tags(creator, name' +
    stringQueryColumns +
    ') values($1,$2' +
    stringQueryValues +
    ') returning id, name, sortorder';

  await db.query('Begin');
  const newTag = (await db.query(queryString, optionsQuery)).rows[0];
  // console.log(newTag.id);

  // await db.query(
  //   'insert into usertags.usertags(tags, user_id ) values($1,$2)',
  //   [newTag.id, userUid]
  // );
  await db.query('Commit');

  return res.status(200).json({
    id: newTag.id,
    name: newTag.name,
    sortorder: newTag.sortorder,
  });
});

exports.getTag = catchAsync(async (req, res, next) => {
  const tagId = req.params.id;
  // console.log(tagId);

  const tag = (
    await db.query(
      `select json_build_object(
        'id',usertags.tags.id,
        'name',usertags.tags.name,
        'creator' , json_build_object(
          'uid',usertags.users.uid,
          'nickname', usertags.users.nickname
        )  
      ) 	from usertags.tags 
      join usertags.users ON tags.creator = users.uid
      where tags.id=$1`,
      [tagId]
    )
  ).rows[0];

  if (!tag) {
    return next(
      new AppError({ message: 'No tag founded with this Id', statusCode: 400 })
    );
  }

  const tagProcessed = tag.json_build_object;
  return res.status(200).json(tagProcessed);
});

exports.getAllTags = catchAsync(async (req, res, next) => {
  const queryRaw = req.query;
  const queryString = new APIFeatures(queryRaw).getQueryString();
  // const queryString = query.query();
  // console.log(queryString);
  // const tags = (
  //   await db.query(
  //     `select id, name, creator, sortorder from usertags.tags ${queryString}`
  //   )
  // ).rows;

  // ------------
  // const tags = (
  //   await db.query(`select json_build_object(
  //     'id',usertags.tags.id,
  //   'name',usertags.tags.name,
  //   'creator' , json_build_object(
  //     'uid',usertags.users.uid,
  //     'nickname', usertags.users.nickname
  //   )
  // ) 	from usertags.tags
  //   join usertags.users ON tags.creator = users.uid ${queryString}`)
  // ).rows;
  // -------
  const tags = (
    await db.query(`select json_build_object(

    'data', json_agg(tags1)) as all_tags

    from(				
      select json_build_object(
      'id',usertags.tags.id,
      'name',usertags.tags.name,
      'creator' , json_build_object(
        'uid',usertags.users.uid,
        'nickname', usertags.users.nickname
      )  
    ) 	tags1
    from usertags.tags 
    join usertags.users ON tags.creator = users.uid
    ${queryString} ) s `)
  ).rows[0];

  const tagsProcessed = tags.all_tags;
  let jsonResponse = tagsProcessed;
  jsonResponse.meta = {
    quantity: tagsProcessed.data.length,
    length: req.query.length,
    offset: req.query.offset,
  };
  // const tags = (
  //   await db.query(`select id,  name, sortorder, (uid, nickname) as creator from usertags.tags t
  //   inner join usertags.users u ON u.uid = t.creator`)
  // ).rows;

  // 'SELECT * from usertags.users limit 2 order by nickname asc offset 4'
  // 'SELECT * from usertags.tags  order by name limit 4 OFFSET 3'
  // 'select * from usertags.tags where creator='e097e7ff-9b34-4503-a91d-6eb6e982e562''

  // return res.status(200).json({
  //   data: tags,
  //   meta: {
  //     offset: req.query.offset,
  //     length: req.query.length,
  //     quantity: tags.length,
  //   },
  // });

  return res.status(200).json(jsonResponse);
});

exports.updateTag = catchAsync(async (req, res, next) => {
  const { sortorder, name } = req.body;
  // console.log(sortorder);
  const tagId = req.params.id;
  const userUid = req.userUid;
  let stringQuery = '';
  let optionsQuery = [];

  const tag =
    // await db.query('select id, creator from usertags.tags where id=$1', [tagId])
    (await db.selectQuery('tags', ['id', 'creator'], ['id'], [tagId])).rows[0];

  if (!tag) {
    return next(
      new AppError({ message: ' No tag founded with this id', statusCode: 404 })
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
    const oldTag =
      // await db.query('select name from usertags.tags where name=$1', [name])
      (await db.selectQuery('tags', ['name'], ['name'], [name])).rows[0]
        .rows[0];
    // TODO: return not 'return next(new AppError)' but 'return new AppError' and if main function 'if(err)=>next(err)'
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
  // console.log(finalStringQuery);
  // console.log(optionsQuery);
  const updatedRows = (await db.query(finalStringQuery, optionsQuery)).rows[0];

  const creator =
    // await db.query('select nickname, uid from usertags.users where uid=$1', [
    //   tag.creator,
    // ])
    (await db.selectQuery('users', ['nickname', 'uid'], ['uid'], [tag.creator]))
      .rows[0];

  return res.status(200).json({
    creator,
    name: updatedRows.name,
    sortorder: updatedRows.sortorder,
  });
});

exports.deleteTag = catchAsync(async (req, res, next) => {
  // console.log(req.params.id);
  const deletingTagId = req.params.id;

  const deletingTag = (
    await db.query('select id from usertags.tags where id=$1', [deletingTagId])
  ).rows[0];

  if (!deletingTag) {
    return next(
      new AppError({
        message: 'Can not find tag with this Id',
        statusCode: 404,
      })
    );
  }

  await db.query('Begin');
  await db.query('delete from usertags.tags where id=$1', [deletingTagId]);
  await db.query('delete from usertags.usertags where tags=$1', [
    deletingTagId,
  ]);
  await db.query('Commit');

  return res.status(200).json({
    statuc: 'success',
  });
});
