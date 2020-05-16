USE employee_tracker;

INSERT INTO department (name)
VALUES ("Sales"), ("Engineering"), ("Finance"), ("Legal");

INSERT INTO role (title, salary, department_id)
VALUES
	("Sales Lead", 100000, 1),
    ("Salesperson", 80000, 1),
    ("Software Engineer", 120000, 2),
    ("Lead Engineer", 150000, 2),
    ("Accountant", 125000, 3),
    ("Head Accountant", 150000, 3),
    ("Lawyer", 175000, 4),
    ("Legal Team Lead", 200000, 4);
    
    
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
	("John", "Doe", 1, null),
    ("Mike", "Chan", 2, 1),
    ("Ashley", "Rodriguez", 2, 1),
    ("Kevin", "Tupik", 3, 5),
    ("Malia", "Brown", 4, null),
    ("Sarah", "Lourd", 5, 7),
    ("Tom", "Allen", 6, null),
    ("Tammer", "Galal", 7, 10),
    ("Eduard", "Cantrell", 7, 10),
    ("Kya", "Holt", 8, null),
    ("Maci", "Esparza", 3, 5),
    ("Ryder", "Rawlings", 5, 7);
    
    