const conn = require("../models/db.js");

// Helper function to get all professor's students
const get_all_student_ids = (professorID) => {
  // Making this a promise allows the queries to be run asyncronously
  return new Promise((resolve, reject) => {
    const query1 = "SELECT professor_class_instance.class_id FROM professor_class_instance WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A';"
    
    // First query gets a list of the professor's classes
    conn.query(query1, professorID, function(err1, result1) {
      if (err1) {
        reject(err1)
      }
      if (result1.length === 0) {
        reject("No active classes")
      }
  
      const classIds = result1
      let query2 = "SELECT DISTINCT student_class_info.student_id FROM student_class_info WHERE student_class_info.class_id = ?;"
  
      // If the classes list contains more than one class, add another or clause to the query
      if (classIds.length > 1) {
        query2 = result1.reduce(() => {
          query2 += "or student_class_info.class_id = ?"
        })
      }
  
      // The second query returns an array of unique student id's in all of the professor's classes
      conn.query(query2, classIds, function(err2, result2) {
        if (err2) {
          reject(err2)
        } if (!result2) {
          reject("No students found")
        }
        resolve(result2)
      })
    })
  })
}

exports.get_students_by_class = (req, res) => {
  const classID = req.params.classID
  const sql = "SELECT student_info.name, student_info.username, student_info.password_changed, student_info.last_sign_in FROM student_info JOIN student_class_info USING(student_id) WHERE student_class_info.class_id = ? ORDER BY name DESC;"
  conn.query(sql, classID, function(err, result) {
    if (err) res.send({error: err})
    res.send({message: result})
  })
};

exports.get_class = (req, res) => {
  const classID = req.params.classID
  const professorID = req.body.professorID
  const sql = "SELECT class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number, class_info.student_signin_count, class_info.total_student_count FROM class_info JOIN professor_class_instance USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A'  AND class_info.class_id = ? LIMIT 0, 1;"
  
  conn.query(sql, [professorID, classID], function(err, result) {
    if (err){
      return res.send({error: err})
    } 
    if (result.length === 0) {
      return res.send({error: 404})
    }
    res.send({message: result[0]})
  })
};

exports.get_classes = (req, res) => {
  const professorID = req.body.professorID
  if (!professorID) {
    return res.send({error: 400})
  }
  const sql = "SELECT class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number, class_info.student_signin_count, class_info.total_student_count FROM class_info JOIN professor_class_instance USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A';"
  conn.query(sql, professorID, function(err, result) {
    if (err){
      return res.send({error: err})
    } 
    if (result.length === 0) {
      return res.send({error: 404})
    }
    res.send({message: result})
  })
};

exports.test_api = (req, res) => {
  res.send({ message: "Controller test passed" });
};

exports.health_check = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_logins = (req, res) => {
  const professorID = req.body.professorID;
  get_all_student_ids(professorID)
    .then(ids => res.send({message: ids}))
    .catch(err => res.send({error: err}))
  
  // Need to implement getting the logins
};

// exports.get_failed_logins = (req, res) => {
//   const professorID = req.body.professorID;
//   get_all_student_ids(professorID)
//     .then(ids => res.send({message: ids}))
//     .catch(err => res.send({error: err}))

//   // Need to implement getting the logins
// };

exports.get_recent_logs = (req, res) => {
  const professorID = req.body.professorID
  get_all_student_ids(professorID)
    .then(ids => res.send({message: ids}))
    .catch(err => res.send({error: err}))

  // Need to implement getting the logins
};

exports.get_logins_by_class = (req, res) => {
  const days = req.body.days
  const classID = req.params.classID
  const sql = "SELECT student_class_info.student_id FROM student_class_info WHERE student_class_info.class_id = ?;"

  conn.query(sql, classID, function(err, result) {
    if (err) {
      return res.send({error: err})
    }

    res.send({message: result})
  })
}