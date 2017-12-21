/*jshint esversion: 6 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Analysis = require('./Analysis');

var schema = Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    analysis: {
        type: Schema.Types.ObjectId,
        ref: 'Analysis'
    },
    reportId: {
        type: String,
        default: ''
    },
    report: {}
});

module.exports = mongoose.model('Report', schema);
