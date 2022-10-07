const conn = require("../models/db.js");

exports.test_api = (req, res) => {
    res.send({message: "Controller test passed"})
}

exports.health_check = (req, res) => {
    res.send({message: "Not implemented"})
}

exports.get_classes = (req, res) => {
    res.send({message: "Not implemented"})
}

exports.get_class = (req, res) => {
    res.send({message: "Not implemented"})
}