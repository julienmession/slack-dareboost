var mongoose = require('mongoose');

var Schema = mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    slackTeamId: {
        type: String,
        default: ''
    },
    authInfo: {},
    teamInfo: {}
});

module.exports = mongoose.model('SlackTeam', Schema);
