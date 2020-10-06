const mongoose = require('mongoose')

const Schema = mongoose.Schema

const activitySchema = new Schema ({
  bookingId: mongoose.Schema.Types.ObjectId,
  name: {type: String, required: true},
  address: {type: String, required: true},
  picture: {type: String, required: true},
  location: {type: String, required: true}
})

const Activity = mongoose.model('Activity', activitySchema)

module.exports = Activity