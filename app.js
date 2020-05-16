const mysql = require("mysql");
const inquirer = require("inquirer");
const pass = require("./private");
const cTable = require('console.table');

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: pass.private,
    database: "employee_tracker",
});

runPrompts();

function runPrompts() {
    inquirer
    .prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "userInput",
            choices: [
                "View All Employees", 
                "View All Employees By Department", 
                "View All Employees By Manager",
                "Add Employee",
                "Remove Employee",
                "Update Employee Role",
                "Update Employee Manager",
                "Exit"]
        }
    ])
    .then(function (data) {
        
        switch (data.userInput) {
            case "View All Employees":
                queryAll();
            break;
            case "Exit":
                connection.end();
            break;
        }
    });
}

function queryAll() {
    connection.query("SELECT * FROM employee", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.table(res);
        runPrompts();
    });
}
