const { response } = require("express");
const pool = require("../models/db.js");

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

  let loggedDays = [
    new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
    new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    new Date(Date.now() - 86400000).toISOString().split("T")[0],
    new Date(Date.now()).toISOString().split("T")[0],
  ];
  let daySuccesses = [0, 0, 0, 0, 0];
  let dayFailures = [0, 0, 0, 0, 0];

  result.forEach((item) => {
    resp.recent.push(item);
    if (item.successful == "Y") {
      resp.totals.successful++;
      daySuccesses[loggedDays.indexOf(format_date(item.timestamp))]++;
    }
    if (item.successful == "N") {
      resp.totals.failed++;
      dayFailures[loggedDays.indexOf(format_date(item.timestamp))]++;
    }
  });

  loggedDays.sort((a, b) => {
    if (new Date(a) > new Date(b)) {
      return 1;
    }
    return -1;
  });

  loggedDays.forEach((item) => {
    resp.days.push({ day: item, successful: 0, failed: 0 });
  });

  daySuccesses.forEach((item, index) => {
    resp.days[index].successful = item;
  });

  dayFailures.forEach((item, index) => {
    resp.days[index].failed = item;
  });

  return resp;
};

exports.login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const sql =
    "SELECT professor_id, username, password FROM professor_info WHERE username = ?";
  pool.query(sql, username, function (err, result) {
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
  pool.query(sql, classID, function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    if (!result || result.length === 0) {
      return res.send({
        error: `No students found in class with ID:${classID}`,
      });
    }

    const usernames = result.map((user) => {
      return user.username;
    });

    let sql2 =
      "SELECT COUNT(logs.username) as 'num_logins', (SELECT MAX(timestamp) FROM logs WHERE logs.username = student_info.username) AS 'last_sign_in', student_info.username FROM student_info LEFT JOIN logs USING(username) WHERE username IN (?";
    if (result.length > 1) {
      result.reduce(() => {
        sql2 += ", ?";
      });
    }

    sql2 += ") GROUP BY student_info.username;";

    pool.query(sql2, usernames, function (err2, result2) {
      if (err2) {
        return res.send({ error: err2 });
      }

      const finalResult = result.map((student) => {
        const instantiated =
          result2.find((item) => item.username === student.username)
            .num_logins > 0;
        const last_sign_in = result2.find(
          (item) => item.username === student.username
        ).last_sign_in;
        return { ...student, instantiated, last_sign_in };
      });
      res.send({ message: finalResult });
    });
  });
};

exports.get_class = (req, res) => {
  const classID = req.params.classID;
  const professorID = req.body.professorID;
  const sql =
    "SELECT class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number FROM class_info JOIN professor_class_instance USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A'  AND class_info.class_id = ? LIMIT 0, 1;";

  pool.query(sql, [professorID, classID], function (err, result) {
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
    "SELECT COUNT(student_class_info.student_id) AS 'total_student_count', class_info.class_id, class_info.name, class_info.class_code, class_info.class_section_number FROM class_info JOIN professor_class_instance USING(class_id) JOIN student_class_info USING(class_id) WHERE professor_class_instance.professor_id = ? AND professor_class_instance.active = 'A' GROUP BY student_class_info.class_id;";
  pool.query(sql, professorID, function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    if (result.length === 0) {
      return res.status(404).send({ error: "No classes found." });
    }

    const sql2 =
      "SELECT COUNT(logs.username) AS 'logins', student_info.username, student_class_info.class_id FROM student_info LEFT JOIN logs USING(username) JOIN student_class_info USING(student_id) JOIN professor_class_instance USING (class_id) WHERE professor_id = ? GROUP BY student_info.username, student_class_info.class_id;";
    pool.query(sql2, professorID, function (err2, result2) {
      if (err2) {
        return res.send({ error: err2 });
      }
      if (result2.length === 0) {
        return res.status(404).send({ error: "No classes found." });
      }

      let finalResult = result.map((row) => {
        return { ...row, students_instantiated: 0 };
      });

      result2.forEach((row) => {
        if (row.logins > 0) {
          finalResult.find((f) => f.class_id === row.class_id)
            .students_instantiated++;
        }
      });

      res.send({ message: finalResult });
    });
  });
};

exports.test_api = (req, res) => {
  res.send({ message: "Controller test passed." });
};

exports.health_check = (req, res) => {
  res.status(200).send({ message: "OK" });
};

exports.get_logins = (req, res) => {
  const professorID = req.body.professorID;
  const dates = req.body.dates
    ? req.body.dates.map((date) => date + "00:00:00")
    : [
        new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0] +
          " 00:00:00",
        new Date(Date.now()).toISOString().split("T")[0] + " 23:59:59",
      ];

  const query = `SELECT DISTINCT logs.log_id,
  logs.username,
  logs.successful,
  student_info.student_id,
  student_info.name,
  logs.timestamp
FROM logs
JOIN student_info USING (username)
JOIN student_class_info USING (student_id)
JOIN class_info USING (class_id)
JOIN professor_class_instance USING (class_id)
WHERE logs.timestamp BETWEEN ? AND ?
AND professor_id = ?
ORDER BY logs.timestamp DESC;`;

  pool.query(query, [...dates, professorID], function (err, result) {
    if (err) {
      return res.send({ error: err });
    }
    const resp = format_log_response(result);
    res.send({ message: resp });
  });
};

exports.get_logins_by_class = (req, res) => {
  const classID = req.params.classID;
  const dates = req.body.dates
    ? req.body.dates.map((date) => date + "00:00:00")
    : [
        new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0] +
          " 00:00:00",
        new Date(Date.now()).toISOString().split("T")[0] + " 23:59:59",
      ];
  const query1 = `SELECT logs.log_id, 
      logs.username, 
      logs.successful, 
      student_info.student_id, 
      logs.timestamp 
    FROM logs JOIN student_info USING(username) 
      JOIN student_class_info USING(student_id) 
    WHERE logs.timestamp BETWEEN ? AND ? AND class_id = ?;`;

  pool.query(query1, [...dates, classID], function (err1, result1) {
    if (err1) {
      return res.send({ error: err1 });
    }
    if (!result1 || result1.length === 0) {
      return res.send({ error: "No students found." });
    }

    const resp = format_log_response(result1);

    res.send({ message: resp });
  });
};
