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

// Main Prompts
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
                "Add Employee, Department, or Role",
                "View All Departments",
                "View All Roles",
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
            case "Add Employee, Department, or Role":
                addToDatabaseInquirer();
            break;
            case "Exit":
                connection.end();
            break;
        }
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
`;

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

// Prompt which database table to add to 
function addToDatabaseInquirer() {
    inquirer
    .prompt([
        {
            type: "list",
            message: "What would you like to add?",
            name: "addSelection",
            choices: ["Employee", "Department", "Role"]
        },
        {
            type: "input",
            message: "What is the new Department Name?",
            name: "deptName",
            when: (answers => answers.addSelection === "Department")
        }
    ])
    .then(function (data) {

        if (data.addSelection === "Employee") {
            queryEmployee();
        } else if (data.addSelection === "Department") {
            insertIntoDepartment(data);
        } else if (data.addSelection === "Role") {
            queryDepartment();
        }

    });
};

// Query EMPLOYEE table to get the potential manager names in an array, pass array forward
function queryEmployee() {
    connection.query(`SELECT * FROM employee_tracker.employee`, function(err, res) {
        if (err) throw err;
        let managerChoices = [];
        res.forEach(employee => managerChoices.push(employee.first_name + " " + employee.last_name));
        queryRole(managerChoices);
    });
}

// Query ROLE table to get the potential role choices in an array, pass array forward
function queryRole(managerChoices) {
    connection.query(`SELECT * FROM employee_tracker.role`, function(err, res) {
        if (err) throw err;
        let roleChoices = [];
        res.forEach(role => roleChoices.push(role.title));
        insertIntoEmployee(managerChoices, roleChoices);
    });
}

// Query DEPARTMENT table to get the potential department names in an array, pass array forward
function queryDepartment() {
    connection.query(`SELECT * FROM employee_tracker.department`, function(err, res) {
        if (err) throw err;
        let departmentChoices = [];
        res.forEach(department => departmentChoices.push(department.name));
        insertIntoRole(departmentChoices);
    });
}

// ADD NEW EMPLOYEE: Use the manager and role names in Inquirer, then insert into employee table with responses
function insertIntoEmployee(managers, roles) {
    inquirer
    .prompt([        
    {
        type: "input",
        message: "What is the new employee's FIRST name?",
        name: "firstName",
    },
    {
        type: "input",
        message: "What is the new employee's LAST name?",
        name: "lastName",
    },
    {
        type: "list",
        message: "What is the new employee's ROLE?",
        name: "roleChoice",
        choices: roles
    },
    {
        type: "list",
        message: "Who is the employee's MANAGER?",
        name: "managerChoice",
        choices: managers
    },
    ])
    .then(function (data) {

        let roleID = roles.indexOf(data.roleChoice) + 1;
        let managerID = managers.indexOf(data.managerChoice) + 1;
        let query = 
        `INSERT INTO employee_tracker.employee (first_name, last_name, role_id, manager_id) 
        VALUES ("${data.firstName}", "${data.lastName}", ${roleID}, ${managerID})`

        connection.query(query, function(err, res) {
            if (err) throw err;
            console.log(`Added ${data.firstName} ${data.lastName} to employees list.`);
        });
        connection.query("SELECT * FROM employee_tracker.employee", function(err, res) {
            if (err) throw err;
            console.table(res);
            runPrompts();
        });
    });
}

// ADD NEW DEPARTMENT: Use the inquirer response to insert into department table
function insertIntoDepartment(data) {
    connection.query(`INSERT INTO employee_tracker.department (name) VALUES ('${data.deptName}')`, function(err, res) {
        if (err) throw err;
        console.log(`Added ${data.deptName} to departments list.`);
    });
    connection.query("SELECT * FROM employee_tracker.department", function(err, res) {
        if (err) throw err;
        console.table(res);
        runPrompts();
    });
}

// ADD NEW ROLE: Use the department names in Inquirer, then insert into employee table with responses
function insertIntoRole(departments) {
    inquirer
    .prompt([
        {
            type: "input",
            message: "What is the new Role TITLE?",
            name: "roleTitle",
        },
        {
            type: "input",
            message: "What is the new Role SALARY?",
            name: "roleSalary",
        },
        {
            type: "list",
            message: "What DEPARTMENT is in the new Role in?",
            name: "roleDepartment",
            choices: departments
        }
    ])
    .then(function (data) {

        let departmentID = departments.indexOf(data.roleDepartment) + 1;
        let query = `INSERT INTO employee_tracker.role (title, salary, department_id) 
        VALUES ("${data.roleTitle}", ${data.roleSalary}, ${departmentID})`;

        connection.query(query, function(err, res) {
            if (err) throw err;
            console.log(`Added ${data.roleTitle} to role list.`);
        });
        connection.query("SELECT * FROM employee_tracker.role", function(err, res) {
            if (err) throw err;
            console.table(res);
            runPrompts();
        });
    });
}