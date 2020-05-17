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

connection.connect(function(err) {
    if (err) throw err;
    runPrompts();
})

function runPrompts() {
    console.log("New Request Initialized");
    console.log("-----------------------");
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
                viewAllEmployees(data);
            break;
            case "View All Employees By Department":
                viewEmployeesByDept();
            break;
            case "View All Employees By Manager":
                viewEmployeesByManager();
            break;
            case "Exit":
                connection.end();
            break;
        }
    });
}

function viewAllEmployees(data) {
    let query = innerJoinAllEmployees;
    if (data.dept) {
        query = query + `WHERE department.name = "${data.dept}"`
    } else if (data.manager) {
        query = query + `WHERE employee.manager_id = "${data.manager}"`
    }
    connection.query(query, function(err, res) {
        if (err) throw err;
        console.table(res);
        runPrompts();
    });
}

function viewEmployeesByDept() {
    connection.query("SELECT * FROM department", function(err, res) {
        if (err) throw err;
        let deptOptions = res.map(element => element.name);
        
        inquirer
        .prompt([
            {
                type: "list",
                message: "Which department would you like to see?",
                name: "dept",
                choices: deptOptions
            }
        ])
        .then(function (data) {
            viewAllEmployees(data);
        });
    });
}

// Need to fix
function viewEmployeesByManager() {
    connection.query("SELECT * FROM employee WHERE manager_id IS NULL", function(err, res) {
        if (err) throw err;
        let managerOptions = res.map(element => element.first_name + " " +  element.last_name);
        
        inquirer
        .prompt([
            {
                type: "list",
                message: "By which manager?",
                name: "manager",
                choices: managerOptions
            }
        ])
        .then(function (data) {
            viewAllEmployees(data);
        });
    });
}

// SQL Join for employee query
const innerJoinAllEmployees = 
`SELECT 
    employee.id as ID, 
    employee.first_name as First, 
    employee.last_name as Last, 
    role.title as Title, 
    department.name as Dept,
    role.salary as Salary,
    employee.manager_id as "Manager ID"
FROM employee
INNER JOIN role ON employee.role_id = role.id
INNER JOIN department ON department.id = role.department_id
`