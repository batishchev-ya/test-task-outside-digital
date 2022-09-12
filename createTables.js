const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
});

(async () => {
  await pool.query(`DROP TABLE IF EXISTS usertags.tags`);
  await pool.query(`drop table if exists usertags.users`);
  await pool.query(`drop table if exists usertags.usertags`);
  await pool.query(`drop schema if exists usertags`);
  await pool.query(`CREATE SCHEMA IF NOT EXISTS usertags`);
  await pool.query(`CREATE TABLE usertags.users (
  uid uuid UNIQUE DEFAULT gen_random_uuid() ,
  email character varying(100) NOT NULL,
  password character varying(100) NOT NULL,
  nickname character varying(30) NOT NULL,
  PRIMARY KEY (uid)
  ) ;`);

  await pool.query(`CREATE TABLE usertags.tags (
    id SERIAL,
    creator uuid,
    name varchar(40),
    sortorder int DEFAULT 0,
    CONSTRAINT my_constraint
    FOREIGN KEY (creator)
    REFERENCES usertags.users(uid)
    ) ;`);

  await pool.query(`CREATE TABLE usertags.usertags (
      user_id uuid,
      tags int,
      unique(user_id, tags)
  
    ) ;`);
})();
