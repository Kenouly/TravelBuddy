const express = require('express');
const checkLogin = require('../middleware/checkLogin');
const User = require('../models/User');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  const user = req.session.currentUser
  res.render('index', {user});
});

module.exports = router;
