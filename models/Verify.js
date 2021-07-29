const mongoose = require('mongoose');

const verifySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    code: {
        type: Number,
        required: true
    },
    expire: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Verify', verifySchema);