const mongoose = require('mongoose');

const socialAuthSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['login', 'signup'],
        required: true
    },
    socialSessionId: {
        type: String,
        required: true
    },
    roomName: {
        type: String
    },
    expire: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('SocialAuth', socialAuthSchema);