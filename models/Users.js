const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    authType: {
        type: String,
        enum: ['email', 'google', 'twitter', 'facebook'],
        required: true
    },
    userId: { // uuid -> email | googleId | twitterId | facebookId
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true
    },
    password: {
        type: String,
        trim: true
    },
    roomName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);