const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: async (text, params) => {
    const queryInsertUser = {
      text,
      values: params,
    };
    const res = await pool.query(queryInsertUser);
    return res;
  },

  selectQuery: async (baseName, selectingRows, keys, params) => {
    keys = keys || 0;
    params = params || 0;
    selectingRows = selectingRows || '*';
    let selectedRawsQuery = '';
    let selectedRawsQuerySliced = '';
    let keysQuery = '';

    for (let i = 0; i < selectingRows.length; i++) {
      selectedRawsQuery += `${selectingRows[i]},`;
    }
    if (keys && params) {
      keysQuery = 'where';
      for (let i = 0; i < keys.length; i++) {
        keysQuery += ` ${keys[i]}=$${i + 1} and`;
      }
      keysQuery = keysQuery.slice(0, -3);
    }
    selectedRawsQuerySliced = selectedRawsQuery.slice(0, -1);
    let text = `select ${selectedRawsQuerySliced} from usertags.${baseName} ${keysQuery}`;
    const queryInsertUser = {
      text,
      values: params,
    };
    const res = await pool.query(queryInsertUser);
    return res;
  },
};
