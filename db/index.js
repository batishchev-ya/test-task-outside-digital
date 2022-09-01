const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
exports.query = async (text, params) => {
  const queryInsertUser = {
    text,
    values: params,
  };
  const res = await pool.query(queryInsertUser);
  return res;
};
