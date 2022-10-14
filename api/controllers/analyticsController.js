const { response } = require("express");
const conn = require("../models/db.js");

const format_date = (date) => {
  return date.toISOString().split("T")[0];
};

// Helper function to parse log information
const format_log_response = (result) => {
  let resp = {
    totals: {
      successful: 0,
      failed: 0,
    },
    days: [],
    recent: [],
  };

  let loggedDays = [];
  let daySuccesses = [];
  let dayFailures = [];

  result.forEach((item) => {
    resp.recent.push(item);
    if (loggedDays.indexOf(format_date(item.timestamp)) === -1) {
      loggedDays.push(format_date(item.timestamp));
      daySuccesses.push(0);
      dayFailures.push(0);
    }
    if (item.successful == "Y") {
      resp.totals.successful++;
      daySuccesses[loggedDays.indexOf(format_date(item.timestamp))]++;
    }
    if (item.successful == "N") {
      resp.totals.failed++;
      dayFailures[loggedDays.indexOf(format_date(item.timestamp))]++;
    }

    // dayTotals[loggedDays.indexOf(format_date(item.timestamp))]++
  });

  loggedDays.forEach((item) => {
    resp.days.push({ day: item, succesful: 0, failed: 0 });
  });

  daySuccesses.forEach((item, index) => {
    resp.days[index].succesful = item;
  });

  dayFailures.forEach((item, index) => {
    resp.days[index].failed = item;
  });

  return resp;
};

// Helper function to get all professor's students
const get_all_student_ids = (professorID) => {
  // Making this a promise allows the queries to be run asyncronously
  return new Promise((resolve, reject) => {
    const query1 =
      "SELECT professor_class_instance.class_id FROM professor_class_instance WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A';";

    // First query gets a list of the professor's classes
    conn.query(query1, professorID, function (err1, result1) {
      if (err1) {
        reject(err1);
      }
      if (!result1 || result1.length === 0) {
        reject("No active classes.");
      }

      const classIds = result1.map((item) => item.class_id);
      let query2 =
        "SELECT DISTINCT student_class_info.student_id FROM student_class_info WHERE student_class_info.class_id = ?";

      // If the classes list contains more than one class, add another or clause to the query
      if (classIds.length > 1) {
        result1.reduce(() => {
          query2 += " or student_class_info.class_id = ?";
        });
      }

      query2 += ";";
      // The second query returns an array of unique student id's in all of the professor's classes
      conn.query(query2, classIds, function (err2, result2) {
        if (err2) {
          reject(err2);
        }
        if (!result2) {
          reject("No students found.");
        }
        resolve(result2);
      });
    });
  });
};

exports.login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const sql =
    "SELECT professor_id, username, password FROM professor_info WHERE username = ?";
  conn.query(sql, username, function (err, result) {
    if (err) {
      return res.send({ error: err });
    }

    const user = result[0];
    if (!user) {
      return res.send({ error: "Username not found." });
    }
    if (!user.password) {
      return res.send({ error: "User not initialized." });
    }
    if (password !== user.password) {
      return res.send({ error: "Incorrect password." });
    }

    res.send({
      message: {
        user: username,
        userId: user.professor_id,
      },
    });
  });
};

exports.get_students_by_class = (req, res) => {
  const classID = req.params.classID;
  const sql =
    "SELECT student_info.name, student_info.username FROM student_info JOIN student_class_info USING(student_id) WHERE student_class_info.class_id = ? ORDER BY name DESC;";
  conn.query(sql, classID, function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    res.send({ message: result });
  });
};

exports.get_class = (req, res) => {
  const classID = req.params.classID;
  const professorID = req.body.professorID;
  const sql =
    "SELECT class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number, class_info.student_signin_count, class_info.total_student_count FROM class_info JOIN professor_class_instance USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A'  AND class_info.class_id = ? LIMIT 0, 1;";

  conn.query(sql, [professorID, classID], function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    if (result.length === 0) {
      return res.status(404).send({ error: "No classes found." });
    }
    res.send({ message: result[0] });
  });
};

exports.get_classes = (req, res) => {
  const professorID = req.body.professorID;
  if (!professorID) {
    return res.status(400).send({ error: "No ID found in request." });
  }
  const sql =
    "SELECT class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number, class_info.student_signin_count, class_info.total_student_count FROM class_info JOIN professor_class_instance USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A';";
  conn.query(sql, professorID, function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    if (result.length === 0) {
      return res.status(404).send({ error: "No classes found." });
    }
    res.send({ message: result });
  });
};

exports.test_api = (req, res) => {
  res.send({ message: "Controller test passed." });
};

exports.health_check = (req, res) => {
  res.status(200).send({ message: "OK" });
};

exports.get_logins = (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const professorID = req.body.professorID;
  const dates = req.body.dates
    ? req.body.dates
    : [
        new Date(Date.now()).toISOString().split("T")[0],
        new Date(Date.now() - 86400000).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
      ];

  get_all_student_ids(professorID)
    .then((ids) => {
      const idArr = ids.map((id) => id.student_id);
      let query =
        "SELECT logs.log_id, logs.username, logs.successful, student_info.student_id, logs.timestamp FROM logs JOIN student_info USING(username) WHERE (logs.timestamp = ?";
      if (dates.length > 1) {
        dates.reduce(() => {
          query += " OR logs.timestamp = ?";
        });
      }

      query += ") AND (student_info.student_id = ?";

      if (idArr.length > 1) {
        idArr.reduce(() => {
          query += " OR student_info.student_id = ?";
        });
      }

      query += ");";

      conn.query(query, [...dates, ...idArr], function (err, result) {
        if (err) {
          return res.send({ error: err });
        }
        const resp = format_log_response(result);
        res.send({ message: resp });
      });
    })
    .catch((err) => res.send({ error: err }));
};

exports.get_logins_by_class = (req, res) => {
  const classID = req.params.classID;
  const dates = req.body.dates
    ? req.body.dates
    : [
        new Date(Date.now()).toISOString().split("T")[0],
        new Date(Date.now() - 86400000).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
      ];
  const query1 =
    "SELECT student_class_info.student_id FROM student_class_info WHERE student_class_info.class_id = ?;";

  // First query gets the student list for the class
  conn.query(query1, classID, function (err1, result1) {
    if (err1) {
      return res.send({ error: err1 });
    }
    if (!result1 || result1.length === 0) {
      return res.send({ error: "No students found." });
    }

    const students = result1.map((st) => st.student_id);
    let query2 =
      "SELECT logs.successful, logs.username, logs.timestamp FROM logs JOIN student_info USING(username) WHERE (logs.timestamp = ?";
    if (dates.length > 1) {
      dates.reduce(() => {
        query2 += " OR logs.timestamp = ?";
      });
    }

    query2 += ") AND (student_info.student_id = ?";

    if (students.length > 1) {
      students.reduce(() => {
        query2 += " OR student_info.student_id = ?";
      });
    }

    query2 += ");";
    conn.query(query2, [...dates, ...students], function (err2, result2) {
      if (err2) {
        return res.send({ error: err2 });
      }

      const resp = format_log_response(result2);

      res.send({ message: resp });
    });
  });
};
