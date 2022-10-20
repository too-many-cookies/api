const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.STATUS === "development" ? "localhost" : process.env.HOST,
  user: process.env.STATUS === "development" ? "root" : process.env.USER,
  password: process.env.SQL_PASS,
  database: process.env.DB_NAME,
  waitForConnection: true,
  connectionLimit: 100,
  queueLimit: 0,
});

module.exports = pool;
