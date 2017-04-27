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
    teamInfo: {},
    dareboostToken: {
        type: String,
        default:''
    }
});

module.exports = mongoose.model('SlackTeam', Schema);
