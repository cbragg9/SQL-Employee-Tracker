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
    console.log("-----------------------");
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
                "Update Employee Role and/or Manager",
                "Remove Employee",
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
            case "View All Departments":
                queryDepartment("Query Only");
            break;
            case "View All Roles":
                queryRole("Query Only");
            break;
            case "Update Employee Role and/or Manager":
                queryRole("Update");
            break;
            case "Remove Employee":
                queryEmployee();
            break;
            case "Exit":
                connection.end();
            break;
        }
    });
}

// SQL Join for employee query
const joinAllEmployees = 
    `SELECT 
        e.id as ID, 
        e.first_name as First, 
        e.last_name as Last, 
        r.title as Title, 
        d.name as Dept,
        r.salary as Salary,
        CONCAT(m.first_name," ",m.last_name) as "Manager"
    FROM employee e
    JOIN role r ON e.role_id = r.id
    JOIN department d ON d.id = r.department_id
    LEFT JOIN employee m ON e.manager_id = m.id
    `;

// Display joined tables, add query filter if querying by department or by manager id (number)
function viewAllEmployees(data) {
    let query = joinAllEmployees;
    if (data.dept) {
        query = query + `WHERE d.name = "${data.dept}"`
    } else if (typeof data === "number") {
        query = query + `WHERE e.manager_id = "${data}"`
    }
    connection.query(query, function(err, res) {
        if (err) throw err;
        console.table(res);

        // If viewing by department
        if (data.dept) {
            getSalary(data.dept, res);
        }

        runPrompts();
    });
}

// Calculates the total utilized budget of the department if viewing by department
function getSalary(departmentName, res) {
    let salaryTotal = 0;
    for (var i = 0; i < res.length; i++) {
        salaryTotal += res[i].Salary;
    }
    console.log(`Total Salary in ${departmentName}: ${salaryTotal}`)
}


// Prompt department options
function viewEmployeesByDept() {
    connection.query("SELECT * FROM department", function(err, res) {
        if (err) throw err;
        let deptOptions = res.map(element => element.name);
        deptOptions.push("Return to Main");
        
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
            if (data.dept === "Return to Main") {
                runPrompts();
            } else {
                viewAllEmployees(data);
            }
        });
    });
}

// Prompt manager options, only prompts employees once (distinct) where manager id != null 
function viewEmployeesByManager() {

    let query = 
    `SELECT DISTINCT
        e.manager_id,
        CONCAT(m.first_name," ",m.last_name) as "Manager"
    FROM employee e
    LEFT JOIN employee m ON e.manager_id = m.id
    WHERE m.first_name IS NOT NULL`;

    connection.query(query, function(err, res) {
        if (err) throw err;
        let managerOptions = res.map(element => element.Manager);
        managerOptions.push("Return to Main");

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
            if (data.manager === "Return to Main") {
                runPrompts();
            } else {
                for (var i = 0; i < res.length; i++) {
                    if (data.manager === res[i].Manager) {
                        viewAllEmployees(res[i].manager_id);
                    }
                }
            }
        });
    });
}

// Loop through the database response to find the manager ID with matching first name of inquirer response
function getEmployeeID(employeeName, obj) {
    let employeeFirstAndLast = employeeName.split(" ");
    let employeeID = 0;
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].first_name === employeeFirstAndLast[0]) {
            employeeID = obj[i].id;
        }
    }

    if (employeeID === 0) {
        employeeID = null;
    }

    return employeeID;
}

// Prompt which database table to add to 
function addToDatabaseInquirer() {
    inquirer
    .prompt([
        {
            type: "list",
            message: "What would you like to add?",
            name: "addSelection",
            choices: ["Employee", "Department", "Role", "Return to Main"]
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
            queryEmployee("Add");
        } else if (data.addSelection === "Department") {
            insertIntoDepartment(data);
        } else if (data.addSelection === "Role") {
            queryDepartment();
        } else if (data.addSelection === "Return to Main") {
            runPrompts();
        }

    });
};

// Query EMPLOYEE table to get the potential manager names in an array, pass array forward
function queryEmployee(use) {
    connection.query(`SELECT * FROM employee_tracker.employee`, function(err, res) {
        if (err) throw err;
        let employeeList = [];
        res.forEach(employee => employeeList.push(employee.first_name + " " + employee.last_name));
        use === "Add" ? queryRole(employeeList, res) : removeEmployee(employeeList, res);

    });
}

// Query ROLE table to get the potential role choices in an array, pass array forward
function queryRole(employeeList, fullTable) {

    let query = 
    `SELECT
        r.id,
        r.title as Title,
        r.salary as Salary,
        d.name as Department
    FROM role r
    JOIN department d ON r.department_id = d.id`;

    connection.query(query, function(err, res) {
        if (err) throw err;
        let roleChoices = [];
        res.forEach(role => roleChoices.push(role.Title));

        if (employeeList === "Query Only") {
            console.table(res);
            runPrompts();
        } else if (employeeList === "Update") {
            updateRoleInquirer(roleChoices);
        } else {
            insertIntoEmployee(employeeList, roleChoices, fullTable);
        }
    });
}

// Query DEPARTMENT table to get the potential department names in an array, pass array forward
function queryDepartment(input) {
    connection.query(`SELECT * FROM employee_tracker.department`, function(err, res) {
        if (err) throw err;

        if (input === "Query Only") {
            console.table(res);
            runPrompts();
        } else {
            let departmentChoices = [];
            res.forEach(department => departmentChoices.push(department.name));
            insertIntoRole(departmentChoices);
        }
    });
}

// ADD NEW EMPLOYEE: Use the manager and role names in Inquirer, then insert into employee table with responses
function insertIntoEmployee(managers, roles, fullTable) {
    managers.push("null");
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
        console.log(roles);
        console.log(managers);

        let managerID = null;
        if (data.managerChoice != "null") {
            managerID = getEmployeeID(data.managerChoice, fullTable);
        }
        let roleID = roles.indexOf(data.roleChoice) + 1;
        let query = 
        `INSERT INTO employee_tracker.employee (first_name, last_name, role_id, manager_id) 
        VALUES ("${data.firstName}", "${data.lastName}", ${roleID}, ${managerID})`

        connection.query(query, function(err, res) {
            if (err) throw err;
            console.log(`Added ${data.firstName} ${data.lastName} to employees list.`);
            viewAllEmployees(data);
        });
    });
}

// ADD NEW DEPARTMENT: Use the inquirer response to insert into department table
function insertIntoDepartment(data) {
    connection.query(`INSERT INTO employee_tracker.department (name) VALUES ('${data.deptName}')`, function(err, res) {
        if (err) throw err;
        console.log(`Added ${data.deptName} to departments list.`);
    });
    queryDepartment("Query Only");
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
        queryRole("Query Only");
    });
}

// UPDATE ROLE : Prompt user for the employee to update and their new role
function updateRoleInquirer(rolesArray) {
    connection.query(`SELECT * FROM employee_tracker.employee`, function(err, res) {
        if (err) throw err;

        let employeeArray = res.map(employee => employee.first_name + " " + employee.last_name);
        employeeArray.push("null");

        inquirer
        .prompt([
            {
                type: "list",
                message: "Whose role do you want to update?",
                name: "employeeChoice",
                choices: employeeArray
            },
            {
                type: "list",
                message: "What is the employee's new role?",
                name: "roleChoice",
                choices: rolesArray
            },
            {
                type: "list",
                message: "Who is their new manager?",
                name: "newManagerChoice",
                choices: employeeArray
            }
        ])
        .then(function (data) {
            let employeeID = getEmployeeID(data.employeeChoice, res);
            let managerID = getEmployeeID(data.newManagerChoice, res);
            getRoleID(data.roleChoice, employeeID, managerID);
        });
    });
}

// UPDATE ROLE : Find the role ID that will be used in the SQL query
function getRoleID(roleName, employeeID, managerID) {
    connection.query(`SELECT * FROM employee_tracker.role`, function(err, res) {
        let roleID = 0;
        for (var i = 0; i < res.length; i++) {
            if (res[i].title === roleName) {
                roleID = res[i].id;
            }
        }

        updateEmployeeSQL(roleID, employeeID, managerID)
    });
}

// UPDATE ROLE : Make the SQL Query to update an employee's role and/or manager
function updateEmployeeSQL(roleID, employeeID, managerID) {
    let query = `
    UPDATE employee_tracker.employee
    SET role_id = ${roleID}, manager_id = ${managerID}
    WHERE id = ${employeeID}`

    connection.query(query, function(err, res) {
        if (err) throw err;
        console.log(`Updated Employee Role.`);
        runPrompts();
    });
}

// REMOVE EMPLOYEE: Use the manager and role names in Inquirer, then insert into employee table with responses
function removeEmployee(employeeList, fullTable) {
    employeeList.push("Return to Main");
    inquirer
    .prompt([        
    {
        type: "list",
        message: "What employee do you want to remove?",
        name: "removeEmployee",
        choices: employeeList
    },
    ])
    .then(function (data) {

        if (data.removeEmployee === "Return to Main") {
            runPrompts();
        } else {
            let employeeID = getEmployeeID(data.removeEmployee, fullTable);

            let query = 
            `DELETE FROM employee WHERE id = ${employeeID}`;

            connection.query(query, function(err, res) {
                if (err) throw err;
                console.log(`Removed ${data.removeEmployee} from the list.`);
                viewAllEmployees(fullTable);
            });
        }

    });
}