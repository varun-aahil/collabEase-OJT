const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: false
    },
    displayName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    image: {
        type: String
    }
}, {
    timestamps: true
});

// Add a pre-save middleware to set username if not provided
userSchema.pre('save', function(next) {
    if (!this.username) {
        // Use email as username if not provided
        this.username = this.email.split('@')[0];
    }
    next();
});

module.exports = mongoose.model('User', userSchema); 