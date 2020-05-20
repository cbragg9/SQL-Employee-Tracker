# SQL-Employee-Tracker (MySQL)
## A CLI employee management system using Node.js, Inquirer, and MySQL. 

## Watch the full DEMO: https://youtu.be/YPeN6KEYjOI

![CLI Example](./screenshot.jpg)  

## Script Features  
-SQL Schema and Seeds initialized database with 3 tables (employees, roles, departments)  
-Inner and Left SQL JOINS to later display in console  
-Inquirer/Switch Case to route user input to Javascript functions        
-CRUD Create, Read, Update, and Delete Query's from SQL tables   

## User Story  
As a business owner  
I want to be able to view and manage the departments, budgets, roles, and employees in my company  
So that I can organize and plan my business  

## Latest Commit  
-Updated ReadMe  
-Added functionality to remove employees  

## Previous Commits  
-Department name shows up in instead of department id when viewing all roles  
-Managers listed by distinct manager_id instead of not null  
-Abbreviated SQL query  
-Manager name provided by Left Join instead of JS function  
-Added more options to return to main prompt  
-Adding or updating employees can now have null managers    
-Created functions to replace Manager ID with Manager names   
-Added update manager when employee role is updated  
-Added update employee roles  
-Calculated total salary when viewing by department  
-Fixed view by manager  
-Added view all departments and roles  
-Modified query for DRY  
-Added insert into departments, roles, employees tables  
-Added search queries by all, by department, and by manager  
-Required npm console table for CLI formatting  
-Added Inquirer prompts  
-Added test query function and exit option    
-Connected to localhost MySQL  
-Added SQL schema and seeds  
-Added package.json  
-Created template files  