const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    authId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    expire: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Auth', authSchema);