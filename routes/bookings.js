const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const path = require('path')
const Booking = require('../models/Booking')
const Activity = require('../models/Activity')
const checkLogin = require('../middleware/checkLogin')
const axios = require('axios')
const uploadCloud = require('../configs/cloudinary')

router.get('/', checkLogin, (req, res, next) => {
    Booking.find({user: req.session.currentUser._id}).sort({departureDate: 1})
        .then(bookings => {
            console.log(bookings)
             res.render('bookings/all-bookings', {bookings, user: req.session.currentUser.username})
        })
        .catch(e => {
            next(e)
        })
})

router.get('/add', checkLogin, (req, res, next) => {
    const user = req.session.currentUser
    res.render('bookings/booking-details', {user})
})

router.post('/add', checkLogin, (req, res, next) => {
    console.log(req.body)
    const {bookingReference, departureAirport, departureDate, departureTime, arrivalAirport, arrivalDate, arrivalTime, returnDate, returnTime, latitude, longitude} = req.body

    if (arrivalDate < departureDate) {
        res.render('bookings/booking-details', {errorMessage: 'The arrival date cannot be prior to the departure date.'})
    } else if (returnDate < arrivalDate) {
        res.render('bookings/booking-details', {errorMessage: 'The return date cannot be prior to the arrival date.'})
    } else if (returnDate < departureDate) {
        res.render('bookings/booking-details', {errorMessage: 'The return date cannot be prior to the departure date.' })
    } else {
    Booking.create({
        bookingReference,
        departureAirport,
        departureDate,
        departureTime,
        arrivalAirport,
        arrivalDate,
        arrivalTime,
        returnDate,
        returnTime,
        latitude,
        longitude,
        user: req.session.currentUser._id
    })
        .then(bookings => {
            return bookings.save()
        })
        .then(bookings => {
            res.redirect('/bookings')
        })
        .catch(error => {
            if (error instanceof mongoose.Error.ValidationError) {
                res.status(500).render('bookings/booking-details', {errorMessage: 'All fields are mandatory. Please provide your information.'})
            } else if (error.code === 11000) {
                res.status(500).render('bookings/booking-details', {errorMessage: 'Booking reference needs to be unique. This booking reference is already referred.'})
            } else {
                next(error)
            }
        })
    }
})

router.get('/:id', checkLogin, (req, res, next) => {
    const user = req.session.currentUser
    const { id } = req.params

    Booking.findById(id)
        .then(booking => {
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+things+to+do+in+${booking.arrivalAirport}&rankby=prominence&key=${process.env.MAPS_API_KEY}`
            const restaurantsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+restaurants+in+${booking.arrivalAirport}&rankby=prominence&key=${process.env.MAPS_API_KEY}`
            const hotelsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=best+hotels+in+${booking.arrivalAirport}&rankby=prominence&key=${process.env.MAPS_API_KEY}`
            return axios.get(url)
                .then((responseFromApi) => {
                    const activities = responseFromApi.data.results
                    const topActivities = activities.splice(0, 5)
                    console.log(topActivities)
                    return axios.get(restaurantsUrl)
                        .then((responseFromApi) => {
                            const restaurants = responseFromApi.data.results
                            const topRestaurants = restaurants.splice(0, 5)
                            console.log(topRestaurants)
                            return axios.get(hotelsUrl)
                                .then((responseFromApi) => {
                                    const hotels = responseFromApi.data.results
                                    const topHotels = hotels.splice(0, 5)
                                    console.log(topHotels)
                                    Activity.find({location: booking.arrivalAirport})
                                        .then((result) => {
                                            console.log(result)
                                                res.render("bookings/one-booking", {booking, topActivities, topRestaurants, topHotels, airportActivities : result, user })
                                            })
                                            .catch(e => {
                                                next(e)
                                            })
                                })
                                .catch(e => {
                                    next(e)
                                })
                        })
                        .catch(e => {
                            next(e)
                        })
                })
                .catch(e => {
                    next(e)
                })
        })
        .catch(e => {
            next(e)
        })
})

router.get('/:id/delete', checkLogin, (req, res, next) => {
    const { id } = req.params;
    Booking.findByIdAndRemove(id)
        .then((result) => {
        res.redirect('/bookings');
        })
        .catch(e=> {
        next(e);
        })
})

router.get('/:id/edit', checkLogin, (req, res, next) => {
    const user = req.session.currentUser
    const { id } = req.params;
    Booking.findById(id)
        .then((booking) => {
      res.render('bookings/edit', booking)
    })
    .catch(e => {
      next(e);
    });
});

router.post('/:id/edit', checkLogin, (req, res, next) => {
    const { bookingReference, departureAirport, departureDate, departureTime, arrivalAirport, arrivalDate, arrivalTime, returnDate, returnTime, latitude, longitude } = req.body;
    Booking.findByIdAndUpdate(
        { _id: req.params.id },
        { $set: { bookingReference, departureAirport, departureDate, departureTime, arrivalAirport, arrivalDate, arrivalTime, returnDate, returnTime, latitude, longitude} },
        { new: true }
    )
        .then((booking) => {
             console.log(booking);
            res.redirect('/bookings');
        })
        .catch(error => {
            next(error)
        })
});

router.get('/:id/add-activities', checkLogin, (req, res, next) => {
    const { id } = req.params;
    Booking.findById(id)
        .then((booking) => {
            res.render('bookings/add-activities', booking)
        })
        .catch(e => {
            next(e);
        })
})

router.post('/:id/add-activities', checkLogin, uploadCloud.single('picture'), (req, res, next) => {
    const { name, address, location, type } = req.body
    const { id } = req.params
    console.log(req.file)
    Activity.create({
            name,
            address,
            picture: req.file.path,
            location,
            type
        })
        .then((activities) => {
            return activities.save();
        })
        .then((activities) => {
            res.redirect(`/bookings/${id}`);
        })
        .catch(error => {
            if (error instanceof mongoose.Error.ValidationError) {
                res.status(500).render('bookings/add-activities', {errorMessage: 'All fields are mandatory. Please provide your information.'})
            } else {
                next(error)
            }
        })
})

router.get('/:id/delete-activity', checkLogin, (req, res, next) => {
    const { id } = req.params;
    Activity.findByIdAndRemove(id)
        .then((result) => {
            res.redirect('/bookings');
        })
        .catch(e => {
            next(e);
        })
})


module.exports = router;