const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    context: String,
    firstName: String,
    lastName: String,
    local: String,
    timezone: String,
    gender: String,
    countdownDate: Number,
    nextUpdate: Number
});

module.exports = mongoose.model('User', userSchema);