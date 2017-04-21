/*jshint esversion: 6 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    slackId: {
        type: String,
        default: ''
    },
    channelId: {
        type: String,
        default: ''
    },
    text: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Link', Schema);
