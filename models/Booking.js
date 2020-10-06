const mongoose = require('mongoose')

const Schema = mongoose.Schema

const bookingSchema = new Schema ({
    bookingReference: {type: String, required: true, unique: true},
    departureAirport: {type: String, required: true}, 
    arrivalAirport: {type: String, required: true}, 
    departureDate: {type: Date, required: true}, 
    departureTime: {type: String, required: true}, 
    arrivalDate: {type: Date, required: true}, 
    arrivalTime: {type:String, required: true},
    returnDate: {type: Date, required: true},
    returnTime: {type: String, required: true},
    latitude: {type: String, required: true},
    longitude: {type: String, required: true},
    user: {type: Schema.Types.ObjectId}
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking