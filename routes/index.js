var express = require('express');
var router = express.Router();
var users = require('./users')
var connection = require('./../connection/connection.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


module.exports = router;
