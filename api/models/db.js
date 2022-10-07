const mysql = require("mysql2");
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.STATUS === 'development' ? 'localhost' : process.env.HOST,
    user: 'root',
    password: process.env.SQL_PASS,
    database: process.env.DB_NAME
});

connection.connect(error => {
    if (error) throw error;
    console.log("Connected to database.")
});

module.exports = connection