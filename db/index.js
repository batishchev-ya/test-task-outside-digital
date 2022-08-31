const { Pool } = require('pg');

exports.query = async (text, params) => {
  const pool = new Pool({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const queryInsertUser = {
    text,
    values: params,
  };
  const res = await pool.query(queryInsertUser);
  return res;
};
