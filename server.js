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
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 }
}));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For parsing JSON

// Static files middleware
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Authentication middleware
function studentAuth(req, res, next) {
  if (req.session && req.session.studentId) {
    next();
  } else {
    res.redirect('/stud_login');
  }
}

function facultyAuth(req, res, next) {
  if (req.session && req.session.facultyId) {
    next();
  } else {
    res.redirect('/faculty_login');
  }
}

function adminAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.redirect('/admin_login');
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

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

app.post('/faculty_login', (req, res) => {
  const enroll_id = req.body.enroll_id;
  const password = req.body.password;

  // Prepare and execute SQL query
  const sql = `SELECT * FROM faculty_login_cred WHERE Faculty_Id='${enroll_id}' AND Password='${password}'`;
  connection.query(sql, (error, results, fields) => {
    if (error) throw error;

    // Check if a row is returned
    if (results.length > 0) {
      // Valid login
      req.session.facultyId = enroll_id
      res.redirect('/fac_home');
    } else {
      // Invalid login
      console.log("Invalid username or password");
      res.send("Invalid username or password");
    }
  });
});

app.post('/admin_login', (req, res) => {
  const enroll_id = req.body.enroll_id;
  const password = req.body.password;

  // Check if the enrollment ID and password match the admin credentials
  if (enroll_id === 'admin' && password === 'admin@20') {
    // Valid login
    res.redirect('/admin_home');
  } else {
    // Invalid login
    console.log("Invalid username or password");
    res.send("Invalid username or password");
  }
});

app.get('/admin_head', (req, res) => {
  res.render('admin_head'); // Assuming admin_head.ejs is in your views directory
});

app.get('/admin_home', (req, res) => {

res.render('admin_home');

});

app.get('/fac_home', (req, res) => {

  res.render('fac_home');
  
  });
  app.get('/stud_home', (req, res) => {

    res.render('stud_home');
    
    });

app.get('/admin_stud', (req, res) => {

  res.render('admin_stud');
  
});

app.get('/stud_aquer', (req, res) => {

  res.render('stud_aquer');
  
});

app.get('/stud_fquer', (req, res) => {

  res.render('stud_fquer');
  
});

app.get('/stud_facfeed', (req, res) => {

  res.render('stud_facfeed');
  
});

app.get('/stud_feed', (req, res) => {

  res.render('stud_feed');
  
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

app.get('/admin_fac', (req, res) => {

  res.render('admin_fac');
  
});

app.get('/f_marks_success', (req, res) => {

  res.render('f_marks_success');
  
});

app.get('/f_att_success', (req, res) => {

  res.render('f_att_success');
  
});

app.get('/fac_reply/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  console.log("Roll No:", rollNo); // Check if rollNo is received correctly
  res.render('fac_reply', { rollNo: rollNo });
});

app.get('/admin_reply/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  console.log("Roll No:", rollNo); // Check if rollNo is received correctly
  res.render('admin_reply', { rollNo: rollNo });
});

app.post('/fac_send', (req, res) => {
  const rollNum = req.body.to;
  const message = req.body.message;
  const facultyId = req.session.facultyId;

  if (!facultyId) {
    res.redirect('/faculty_login');
    return;
  }

  const sql = "INSERT INTO fac_reply (Roll_No, Faculty_Id, Query) VALUES (?, ?, ?)";
  connection.query(sql, [rollNum, facultyId, message], (err, result) => {
    if (err) {
      console.error('Error inserting into reply table:', err);
      res.status(500).send('Error inserting into reply table');
      return;
    }

    console.log('Inserted into reply table');

    connection.query('DELETE FROM fac_quer WHERE Roll_No = ?', [rollNum], (err, result) => {
      if (err) {
        console.error('Error deleting query:', err);
        res.status(500).send('Error deleting query');
        return;
      }

      connection.query('SELECT * FROM fac_quer WHERE Faculty_Id = ?', [facultyId], (error, facQuerResults, fields) => {
        if (error) {
          console.error('Error selecting fac_quer:', error);
          res.status(500).send('Error selecting fac_quer');
          return;
        }

        connection.query('SELECT * FROM admin_reply WHERE Faculty_Id = ?', [facultyId], (err, adminReplyResults, fields) => {
          if (err) {
            console.error('Error selecting admin_reply:', err);
            res.status(500).send('Error selecting admin_reply');
            return;
          }

          console.log("Fac_quer Results:", facQuerResults);
          console.log("Admin_reply Results:", adminReplyResults);

          res.render('fac_que', { facQueries: facQuerResults, adminReplies: adminReplyResults });
        });
      });
    });
  });
});


app.post('/admin_send', (req, res) => {
  // Assuming you have access to rollnum and query values, retrieve them here
  const rollNum = req.body.to; // Change to req.body.to to match the HTML form
  const message = req.body.message;
  console.log("Roll No:", rollNum);
  console.log("Message:", message);
  const name = "admin";
  //const facultyId = req.session.facultyId;

  //if (!facultyId) {
      // Redirect or handle the case where faculty ID is not found in session
      //res.redirect('/faculty_login');
      //return;
  //}

  // Insert into the reply table
  const sql = "INSERT INTO admin_reply (Roll_No, Faculty_Id, Query) VALUES (?, ?, ?)";
  connection.query(sql, [name, rollNum,  message], (err, result) => {
      if (err) {
          console.error('Error inserting into reply table:', err);
          res.status(500).send('Error inserting into reply table');
          return;
      }
      console.log('Inserted into reply table');
      // Send some response if needed
      //res.send('Message sent successfully');
      
  connection.query('DELETE FROM admin_quer WHERE Faculty_Id = ?', [rollNum], (err, result) => {
    if (err) {
        console.error('Error deleting query:', err);
        res.status(500).send('Error deleting query');
    } else {
      connection.query('SELECT * FROM admin_quer', (error, results, fields) => {
        if (error) throw error;
    
        // Convert results to JSON
        //const jsonData = JSON.stringify(results);
        console.log(results);
        // Render admin_que.ejs template and pass jsonData to it
        res.render('admin_que', { queries: results });
      });
      
    }
});
  });

});

app.get('/stud_que', (req, res) => {
  // Fetch data from admin_quer table
  const studendId = req.session.studentId;

  if (!studendId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  connection.query('SELECT * FROM fac_reply where Roll_No= ?', [studendId], (error, results, fields) => {
    if (error) throw error;

    console.log(results);

    res.render('stud_que', { queries: results });
  });
});

app.delete('/sdelete-query/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  console.log(rollNo);
  connection.query('DELETE FROM fac_reply WHERE Faculty_Id = ?', [rollNo], (err, result) => {
      if (err) {
          console.error('Error deleting query:', err);
          res.status(500).send('Error deleting query');
      } else {
          console.log('Query deleted successfully');
          res.sendStatus(200);
      }
  });
});




app.get('/fac_que', (req, res) => {
  const facultyId = req.session.facultyId;

  if (!facultyId) {
    res.redirect('/faculty_login');
    return;
  }

  // Fetch data from fac_quer table
  connection.query('SELECT * FROM fac_quer WHERE Faculty_Id = ?', [facultyId], (error, facQuerResults, fields) => {
    if (error) throw error;

    // Fetch data from admin_reply table
    connection.query('SELECT * FROM admin_reply WHERE Faculty_Id  = ?', [facultyId], (err, adminReplyResults, fields) => {
      if (err) throw err;

      console.log("Fac_quer Results:", facQuerResults);
      console.log("Admin_reply Results:", adminReplyResults);

      res.render('fac_que', { facQueries: facQuerResults, adminReplies: adminReplyResults });
    });
  });
});


app.delete('/fdelete-query/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  console.log(rollNo);
  connection.query('DELETE FROM fac_quer WHERE Roll_No = ?', [rollNo], (err, result) => {
      if (err) {
          console.error('Error deleting query:', err);
          res.status(500).send('Error deleting query');
      } else {
          console.log('Query deleted successfully');
          res.sendStatus(200);
      }
  });
});

app.delete('/a_q_delete-query/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  console.log(rollNo);
  connection.query('DELETE FROM admin_reply WHERE Faculty_Id = ?', [rollNo], (err, result) => {
      if (err) {
          console.error('Error deleting query:', err);
          res.status(500).send('Error deleting query');
      } else {
          console.log('Query deleted successfully');
          res.sendStatus(200);
      }
  });
});

app.get('/admin_que', (req, res) => {
  // Fetch data from admin_quer table

  connection.query('SELECT * FROM admin_quer', (error, results, fields) => {
    if (error) throw error;

    // Convert results to JSON
    //const jsonData = JSON.stringify(results);
    console.log(results);
    // Render admin_que.ejs template and pass jsonData to it
    res.render('admin_que', { queries: results });
  });
});

app.delete('/adelete-query/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo;
  connection.query('DELETE FROM admin_quer WHERE Roll_No = ?', [rollNo], (err, result) => {
      if (err) {
          console.error('Error deleting query:', err);
          res.status(500).send('Error deleting query');
      } else {
          console.log('Query deleted successfully');
          res.sendStatus(200);
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


app.post('/fac-form', (req, res) => {
  const formData = req.body;

  // Insert the form data into the database
  const sql = 'INSERT INTO faculty_login_cred (Faculty_Id, Name, Email, Branch, Subject, Password, Experience) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [
    formData.Roll_No,
    formData.Name,
    formData.Email,
    formData.Branch,
    formData.Subject,
    formData.Password,
    formData.Experience
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
      throw err;
    }
    console.log('Data inserted into database');
    //res.redirect('/a_fac_success');
  });

  res.redirect('/a_fac_success');
});

app.get('/a_stud_success', (req, res) => {
  res.render('a_stud_success'); // Assuming admin_head.ejs is in your views directory
});

app.get('/a_fac_success', (req, res) => {
  res.render('a_fac_success'); // Assuming admin_head.ejs is in your views directory
});


app.get('/fac_head', (req, res) => {
  res.render('fac_head'); // Assuming admin_head.ejs is in your views directory
});

app.get('/fac_marks', (req, res) => {

  res.render('fac_marks');
  
});

app.post('/mark-form', (req, res) => {
  const formData = req.body;
  let sql, values;

  if (formData.Branch === 'CSE') {
    sql = 'UPDATE cse_marks SET ' + formData.Sub_name + ' = ? WHERE Roll_No = ? ';
    values = [
      formData.Marks,
      formData.Roll_No
    ];
  } else if (formData.Branch === 'ECE') {
    sql = 'UPDATE ece_marks SET ' + formData.Sub_name + ' = ? WHERE Roll_No = ? ';
    values = [
      formData.Marks,
      formData.Roll_No
    ];
  } else {
    return res.status(400).send('Invalid branch');
  }

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      return res.status(500).send('Error inserting data into database');
    }
    console.log('Data inserted into database');
    res.redirect('/f_marks_success');
  });
});

app.get('/admin_res', (req, res) => {

  res.render('admin_res');
  
});

app.get('/fac_req', (req, res) => {

  res.render('fac_req');
  
});

app.get('/s_form_success', (req, res) => {

  res.render('s_form_success');
  
});

app.get('/f_admin_success', (req, res) => {

  res.render('f_admin_success');
  
});

app.post('/result-form', (req, res) => {
  // Fetch all records from the database
  connection.query("SELECT * FROM cse_marks", (err, results) => {
      if (err) {
          console.error('Error fetching data from database: ', err);
          res.status(500).send('Error fetching data from database');
          return;
      }

      if (results.length === 0) {
          res.status(404).send('No records found in the database');
          return;
      }

      // Iterate over each record
      results.forEach((record) => {
          const { Roll_No, NNDL, WT, CNS, Cgpa } = record;
          let cgpaFloat = parseFloat(Cgpa);

          // Check if CGPA is a valid number
          if (isNaN(cgpaFloat)) {
              console.error(`Invalid CGPA value for Roll No. ${Roll_No}`);
              return;
          }

          console.log(`Roll_No: ${Roll_No}, NNDL: ${NNDL}, WT: ${WT}, CNS: ${CNS}, CGPA: ${cgpaFloat}`);

          // Convert NNDL, WT, CNS, and CGPA to numbers
          const NNDL_Num = parseFloat(NNDL);
          const WT_Num = parseFloat(WT);
          const CNS_Num = parseFloat(CNS);
          const oldCGPA = parseFloat(Cgpa);

          // Check if any of the values are NaN
          if (isNaN(NNDL_Num) || isNaN(WT_Num) || isNaN(CNS_Num) || isNaN(oldCGPA)) {
              console.error(`One or more values are NaN for Roll No. ${Roll_No}`);
              return;
          }

          const getPoints = (marks) => {
              const marksInt = parseInt(marks);
              if (marksInt > 90) return 10;
              else if (marksInt > 80) return 9;
              else if (marksInt > 70) return 8;
              else if (marksInt > 60) return 7;
              else if (marksInt > 50) return 6;
              else if (marksInt >= 35) return 5;
              else return 0; // Fail
          };

          // Perform calculations and update CGPA for each record
          const NNDL_Points = getPoints(NNDL_Num);
          const WT_Points = getPoints(WT_Num);
          const CNS_Points = getPoints(CNS_Num);
          const newCGPA = (NNDL_Points + WT_Points + CNS_Points) / 3;
          const averageCGPA = (oldCGPA + newCGPA) / 2;

          // Update CGPA in the database for the current record
          connection.query("UPDATE cse_marks SET CGPA = ? WHERE Roll_No = ?", [averageCGPA, Roll_No], (err, result) => {
              if (err) {
                  console.error('Error updating CGPA for Roll No. ', Roll_No, ': ', err);
              } else {
                  console.log("CGPA updated successfully for Roll No. ", Roll_No);
              }
          });
          connection.query("UPDATE student_login_cred SET CGPA = ? WHERE Roll_No = ?", [averageCGPA, Roll_No], (err, result) => {
            if (err) {
                console.error('Error updating CGPA for Roll No. ', Roll_No, ': ', err);
            } else {
                console.log("CGPA updated successfully for Roll No. ", Roll_No);
            }
        });
      });
  });

  connection.query("SELECT * FROM ece_marks", (err, results) => {
      if (err) {
          console.error('Error fetching data from database: ', err);
          res.status(500).send('Error fetching data from database');
          return;
      }

      if (results.length === 0) {
          res.status(404).send('No records found in the database');
          return;
      }

      // Iterate over each record
      results.forEach((record) => {
          const { Roll_No, MPI, DLD, SS, Cgpa } = record;
          let cgpaFloat = parseFloat(Cgpa);

          // Check if CGPA is a valid number
          if (isNaN(cgpaFloat)) {
              console.error(`Invalid CGPA value for Roll No. ${Roll_No}`);
              return;
          }

          console.log(`Roll_No: ${Roll_No}, MPI: ${MPI}, DLD: ${DLD}, SS: ${SS}, CGPA: ${cgpaFloat}`);

          // Convert NNDL, WT, CNS, and CGPA to numbers
          const NNDL_Num = parseFloat(MPI);
          const WT_Num = parseFloat(DLD);
          const CNS_Num = parseFloat(SS);
          const oldCGPA = parseFloat(Cgpa);

          // Check if any of the values are NaN
          if (isNaN(NNDL_Num) || isNaN(WT_Num) || isNaN(CNS_Num) || isNaN(oldCGPA)) {
              console.error(`One or more values are NaN for Roll No. ${Roll_No}`);
              return;
          }

          const getPoints = (marks) => {
              const marksInt = parseInt(marks);
              if (marksInt > 90) return 10;
              else if (marksInt > 80) return 9;
              else if (marksInt > 70) return 8;
              else if (marksInt > 60) return 7;
              else if (marksInt > 50) return 6;
              else if (marksInt >= 35) return 5;
              else return 0; // Fail
          };

          // Perform calculations and update CGPA for each record
          const NNDL_Points = getPoints(NNDL_Num);
          const WT_Points = getPoints(WT_Num);
          const CNS_Points = getPoints(CNS_Num);
          const newCGPA = (NNDL_Points + WT_Points + CNS_Points) / 3;
          const averageCGPA = (oldCGPA + newCGPA) / 2;

          // Update CGPA in the database for the current record
          connection.query("UPDATE ece_marks SET CGPA = ? WHERE Roll_No = ?", [averageCGPA, Roll_No], (err, result) => {
              if (err) {
                  console.error('Error updating CGPA for Roll No. ', Roll_No, ': ', err);
              } else {
                  console.log("CGPA updated successfully for Roll No. ", Roll_No);
              }
          });
          connection.query("UPDATE student_login_cred SET CGPA = ? WHERE Roll_No = ?", [averageCGPA, Roll_No], (err, result) => {
            if (err) {
                console.error('Error updating CGPA for Roll No. ', Roll_No, ': ', err);
            } else {
                console.log("CGPA updated successfully for Roll No. ", Roll_No);
            }
        });
      });
  });

  connection.query("SELECT * FROM cse_marks", (err, cseResults) => {
    if (err) {
      console.error('Error fetching CSE data from database: ', err);
      res.status(500).send('Error fetching CSE data from database');
      return;
    }

    // Fetch data for ECE students
    connection.query("SELECT * FROM ece_marks", (err, eceResults) => {
      if (err) {
        console.error('Error fetching ECE data from database: ', err);
        res.status(500).send('Error fetching ECE data from database');
        return;
      }

      // Render admin_res.ejs and pass fetched data
      res.render('admin_finres', { cseData: cseResults, eceData: eceResults });
    });
  });
});
app.get('/fac_att', (req, res) => {
  connection.query("SELECT * FROM cse_att", (err, cseAttendance) => {
    if (err) {
      console.error('Error fetching CSE data from database: ', err);
      res.status(500).send('Error fetching CSE data from database');
      return;
    }

    // Render the 'fac_att' view with the fetched CSE attendance data
    res.render('fac_att', { cseAtt: cseAttendance });
  });
});

// Route to handle form submission
// Route to handle form submission
app.post('/att-form', (req, res) => {
  const { Roll_No, Branch, total_classes, absentees } = req.body;

  // Update attendance for absent students
  absentees.forEach(rollNo => {
      const updateAbsentQuery = `
          UPDATE cse_att
          SET Classes_Attended = Classes_Attended + 0,
              Total_Classes = Total_Classes + ?,
              Attendance = (Classes_Attended / Total_Classes) * 100
          WHERE Roll_No = ?
      `;

      connection.query(updateAbsentQuery, [total_classes, rollNo], (error, results, fields) => {
          if (error) {
              console.error(`Error updating attendance for absent Roll No: ${rollNo}`, error);
          } else {
              console.log(`Attendance updated for absent Roll No: ${rollNo}`);
              const branch ="CSE";

              // After updating cse_att, update student_login_cred for this Roll_No
              const updateLoginQuery = `
                UPDATE student_login_cred
                SET Attendance = (SELECT Attendance FROM cse_att WHERE Roll_No = ?)
                WHERE Roll_No = ? and Branch  = ?
              `;
              
              connection.query(updateLoginQuery, [rollNo, rollNo, branch], (error, results, fields) => {
                if (error) {
                  console.error(`Error updating student_login_cred for Roll No: ${rollNo}`, error);
                } else {
                  console.log(`student_login_cred updated for Roll No: ${rollNo}`);
                }
              });
          }
      });
  });

  // Update attendance for unmarked students
  const updateUnmarkedQuery = `
      UPDATE cse_att
      SET Classes_Attended = Classes_Attended + ?,
          Total_Classes = Total_Classes + ?,
          Attendance = (Classes_Attended / Total_Classes) * 100
      WHERE Roll_No NOT IN (?)
  `;

  connection.query(updateUnmarkedQuery, [total_classes, total_classes, absentees], (error, results, fields) => {
      if (error) {
          console.error('Error updating attendance for unmarked students', error);
      } else {
          console.log('Attendance updated for unmarked students');
          const branch ="CSE";
          // After updating cse_att for unmarked students, update student_login_cred for each unmarked student
          const updateLoginQuery = `
            UPDATE student_login_cred
            SET Attendance = (SELECT Attendance FROM cse_att WHERE Roll_No = student_login_cred.Roll_No)
            WHERE Roll_No NOT IN (?)  and Branch = ?
          `;
          
          connection.query(updateLoginQuery, [absentees,branch], (error, results, fields) => {
            if (error) {
              console.error('Error updating student_login_cred for unmarked students', error);
            } else {
              console.log('student_login_cred updated for unmarked students');
            }
          });
      }
  });

  res.redirect('/f_att_success');
});


app.get('/fac_details', (req, res) => {
  connection.query("SELECT * FROM cse_att", (err, cseAttendance) => {
    if (err) {
      console.error('Error fetching CSE data from database: ', err);
      res.status(500).send('Error fetching CSE data from database');
      return;
    }

    // Render the 'fac_att' view with the fetched CSE attendance data
    res.render('fac_details', { cseData: cseAttendance });
  });
});




// Route to handle faculty profile
app.get('/fac_prof', (req, res) => {
  const facultyId = req.session.facultyId;

  if (!facultyId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/faculty_login');
    return;
  }

  // Prepare and execute SQL query to fetch faculty details based on the stored faculty ID
  const sql = `SELECT * FROM faculty_login_cred WHERE Faculty_Id='${facultyId}'`;
  
  connection.query(sql, (err, facultyDetails, fields) => {
    if (err) {
      console.error('Error fetching faculty data from database: ', err);
      res.status(500).send('Error fetching faculty data from database');
      return;
    }

    // Check if a row is returned
    if (facultyDetails.length > 0) {
      // Render the 'fac_prof' view with the fetched faculty data
      res.render('fac_prof', { facultyData: facultyDetails[0] });
    } else {
      // Faculty not found
      console.log("Faculty not found");
      res.send("Faculty not found");
    }
  });
});

app.get('/stud_head', (req, res) => {
  res.render('stud_head'); // Assuming admin_head.ejs is in your views directory
});

app.get('/stud_prof', (req, res) => {
  const studentId = req.session.studentId;
  if (!studentId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  // Prepare and execute SQL query to fetch faculty details based on the stored faculty ID
  const sql = `SELECT * FROM student_login_cred WHERE Roll_No='${studentId}'`;
  
  connection.query(sql, (err, studentDetails, fields) => {
    if (err) {
      console.error('Error fetching faculty data from database: ', err);
      res.status(500).send('Error fetching faculty data from database');
      return;
    }

    // Check if a row is returned
    if (studentDetails.length > 0) {
      // Render the 'fac_prof' view with the fetched faculty data
      res.render('stud_prof', { studentData: studentDetails[0] });
    } else {
      // Faculty not found
      console.log("Student not found");
      res.send("Student not found");
    }
  });
});

app.post('/aquery-form', (req, res) => {
  const formData = req.body;

  const studentId = req.session.studentId;
  if (!studentId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  // Insert the form data into the database
  const sql = 'INSERT INTO admin_quer (Roll_No, Name, Query) VALUES (?, ?, ?)';
  const values = [
    studentId,
    formData.Name,
    formData.Message
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
      throw err;
    }
    console.log('Data inserted into database');
    res.status(200).send('Form submitted successfully');
  });
});

app.post('/fquery-form', (req, res) => {
  const formData = req.body;

  const studentId = req.session.studentId;
  if (!studentId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  // Insert the form data into the database
  const sql = 'INSERT INTO fac_quer (Roll_No, Faculty_Id, Name, Query) VALUES (?, ?, ?, ?)';
  const values = [
    studentId,
    formData.FacultyId,
    formData.Name,
    formData.Message
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
      throw err;
    }
    console.log('Data inserted into database');
    //res.status(200).send('Form submitted successfully');
    res.redirect('/s_form_success');
  });
});

app.post('/f_a_query-form', (req, res) => {
  const formData = req.body;

  const facultyId = req.session.facultyId;
  if (!facultyId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/faculty_login');
    return;
  }

  // Insert the form data into the database
  const sql = 'INSERT INTO admin_quer (Roll_No, Name, Query) VALUES (?, ?, ?)';
  const values = [
    facultyId,
    formData.Name,
    formData.Message
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
      throw err;
    }
    console.log('Data inserted into database');
    res.redirect('/f_admin_success');
  });
});

app.get('/stud_marks', (req, res) => {
  const studentId = req.session.studentId;
  if (!studentId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  // Prepare and execute SQL query to fetch faculty details based on the stored faculty ID
  const sql = `SELECT * FROM cse_marks WHERE Roll_No='${studentId}'`;
  
  connection.query(sql, (err, studentDetails, fields) => {
    if (err) {
      console.error('Error fetching faculty data from database: ', err);
      res.status(500).send('Error fetching faculty data from database');
      return;
    }

    // Check if a row is returned
    if (studentDetails.length > 0) {
      // Render the 'fac_prof' view with the fetched faculty data
      res.render('stud_marks', { studentData: studentDetails[0] });
    } else {
      // Faculty not found
      console.log("Student not found");
      res.send("Student not found");
    }
  });
});

app.get('/stud_att', (req, res) => {
  const studentId = req.session.studentId;
  if (!studentId) {
    // Redirect or handle the case where faculty ID is not found in session
    res.redirect('/stud_login');
    return;
  }

  // Prepare and execute SQL query to fetch faculty details based on the stored faculty ID
  const sql = `SELECT * FROM cse_att WHERE Roll_No='${studentId}'`;
  
  connection.query(sql, (err, studentDetails, fields) => {
    if (err) {
      console.error('Error fetching faculty data from database: ', err);
      res.status(500).send('Error fetching faculty data from database');
      return;
    }

    // Check if a row is returned
    if (studentDetails.length > 0) {
      // Render the 'fac_prof' view with the fetched faculty data
      res.render('stud_att', { studentData: studentDetails[0] });
    } else {
      // Faculty not found
      console.log("Student not found");
      res.send("Student not found");
    }
  });
});
///stud_login
app.get('/login', (req, res) => {
  res.render('login');
});
// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

