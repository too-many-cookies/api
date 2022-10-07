const conn = require("../models/db.js");

exports.test_api = (req, res) => {
  res.send({ message: "Controller test passed" });
};

exports.health_check = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_classes = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_class = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_successful_logins = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_failed_logins = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_recent_logs = (req, res) => {
  res.send({ message: "Not implemented" });
};

exports.get_students_by_class = (req, res) => {
  res.send({ message: "Not implemented" });
};
