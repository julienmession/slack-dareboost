/*jshint esversion: 6 */

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    slackId: {
        type: String,
        default: ''
    },
    googleDriveToken: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('User', userSchema);
