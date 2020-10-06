const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/User')

router.get('/signup', (req, res, next) => {
    res.render('auth/signup');
});

router.post('/signup', (req, res, next) => {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
        res.render('auth/signup', {errorMessage: 'All fields are mandatory. Please provide your username, email and password.'})
    }

    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/
    if (!regex.test(password)) {
        res.status(500).render('auth/signup', {errorMessage: 'Password needs to have at least 6 characters and must contain at least one number, one lowercase and one uppercase letter.'})
        return
    }
    
    bcrypt.hash(password, 10)
        .then(hashedPassword => {
            return User.create({
                username,
                email,
                password: hashedPassword
            })
        })
        .then(userFromDB => {
            console.log(userFromDB)
            res.render('auth/user-created')
        })
        .catch(error => {
            if (error instanceof mongoose.Error.ValidationError) {
                res.status(500).render('auth/signup', {errorMessage: error.message})
            } else if (error.code === 11000) {
                res.status(500).render('auth/signup', {errorMessage: 'Username and email need to be unique. Either username or email is already used.'})
            } else {
                next(error)
            }
        })
})

router.get('/login', (req, res, next) => {
    res.render('auth/login');
});

router.post('/login', (req, res, next) => {
    const {email, password} = req.body

    if (!email || !password) {
        res.render('auth/login', {errorMessage: 'Please enter both email and password.'})
        return
    }

    User.findOne({ email })
        .then(user => {
            if(!user) {
                res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.'})
                return
            } else if (bcrypt.compareSync(password, user.password)) {
                req.session.currentUser = user
                res.redirect('/')
            } else {
                res.send('Password is incorrect')
            }
        })
        .catch(e => {
            next(e)
        })
})

router.post("/logout", (req, res, next) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;