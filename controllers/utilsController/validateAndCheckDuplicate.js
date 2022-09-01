const db = require('../../db/index');
const AppError = require('../../utils/appError');
const {
  validateEmail,
  validateNickname,
  validateTagName,
} = require('./validateTemplates');

exports.validateAndDuplicateCheck = async (data, dataType, baseName) => {
  let validateFunction;

  if (dataType == 'email') {
    validateFunction = validateEmail;
  }
  if (dataType == 'nickname') {
    validateFunction = validateNickname;
  }
  if (dataType == 'tag') {
    validateFunction = validateTagName;
  }

  if (!validateFunction(data)) {
    return { message: `Invalid ${dataType}`, statusCode: 400 };
  }
  const oldData = (
    await db.query(
      `select uid from usertags.${baseName} where ${dataType}=$1`,
      [data]
    )
  ).rows[0];
  if (oldData) {
    return {
      message: `This ${dataType} already exists`,
      statusCode: 400,
    };
  }
  // return 1;
  return { message: 'Correct data' };
};
