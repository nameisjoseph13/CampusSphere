const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');

const app = express();
const port = 3001;

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student_info_system'
});

// Handle POST request for login
app.post('/stud_login', (req, res) => {
    const enroll_id = req.body.enroll_id;
    const password = req.body.password;
    console.log(req.path);
    // Prepare and execute SQL query
    const sql = `SELECT * FROM student_login_cred WHERE Roll_No='${enroll_id}' AND Password='${password}'`;
    connection.query(sql, (error, results, fields) => {
      if (error) throw error;
  
      // Check if a row is returned
      if (results.length > 0) {
        // Valid login
        req.session.studentId = enroll_id
        res.redirect('/stud_home');
      } else {
        // Invalid login
        console.log("Invalid username or password");
        res.send("Invalid username or password");
      }
    });
  });


app.post('/stud-form', (req, res) => {
    const formData = req.body;
  
    // Insert the form data into the database
    const sql = 'INSERT INTO student_login_cred (Roll_No, Name, Email, Branch, Year, Section, Password, Attendance, CGPA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      formData.Roll_No,
      formData.Name,
      formData.Email,
      formData.Branch,
      formData.Year,
      formData.Section,
      formData.Password,
      formData.Attendance,
      formData.Cgpa
    ];
  
    connection.query(sql, values, (err, result) => {
      if (err) {
        res.status(500).send('Error inserting data into database');
        throw err;
      }
      console.log('Data inserted into database');
      
    });
  
    const att = 'INSERT INTO cse_att (Roll_No, Name, Classes_Attended, Total_Classes, Attendance) VALUES (?,?,?,?,?)';
    const att_values = [
      formData.Roll_No,
      formData.Name,
      "0", "0", "0"
    ];
    connection.query(att, att_values, (err, result) => {
      if (err) {
        res.status(500).send('Error inserting data into database');
        throw err;
      }
      console.log('Data inserted into database');
      //res.status(200).send('Form submitted successfully');
    });
  
    const marks = 'INSERT INTO cse_marks (Roll_No, Name, NNDL, WT, CNS, Cgpa, BackLogs) VALUES (?,?,?,?,?,?,?)';
    const marks_values = [
      formData.Roll_No,
      formData.Name,
      "0", "0", "0","0", "0"
    ];
    connection.query(marks, marks_values, (err, result) => {
      if (err) {
        res.status(500).send('Error inserting data into database');
        throw err;
      }
      console.log('Data inserted into database');
      res.redirect('/a_stud_success');
    });
    
  
  });

app.get('/admin_home', (req, res) => {

    res.render('admin_home');
    
    });

app.get('/admin_det', (req, res) => {
  // Fetch all records from the database

  connection.query("SELECT * FROM student_login_cred", (err, cseResults) => {
    if (err) {
      console.error('Error fetching CSE data from database: ', err);
      res.status(500).send('Error fetching CSE data from database');
      return;
    }

    // Fetch data for ECE students
    connection.query("SELECT * FROM faculty_login_cred", (err, eceResults) => {
      if (err) {
        console.error('Error fetching ECE data from database: ', err);
        res.status(500).send('Error fetching ECE data from database');
        return;
      }

      // Render admin_res.ejs and pass fetched data
      res.render('admin_det', { cseData: cseResults, eceData: eceResults });
    });
  });
});

