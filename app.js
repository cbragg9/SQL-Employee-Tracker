const mysql = require("mysql");
const inquirer = require("inquirer");
const pass = require("./private");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: pass.private,
    database: "employee_tracker",
});


connection.query("SELECT * FROM role", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    console.log(res);
    connection.end();
});