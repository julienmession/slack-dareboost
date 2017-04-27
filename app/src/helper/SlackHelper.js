const request = require ('request');
const SlackTeam = require('../model/SlackTeam');

function SlackHelper() {}

SlackHelper.prototype.formatResponse = function(command, text, err, str) {
  if (err) {
    return err;
  }
  return str;
}

SlackHelper.prototype.setTeamData = function(slackTeamId, data, callback) {
    SlackTeam.findOneAndUpdate({'slackTeamId' : slackTeamId}, { $set: data }, callback);
}

SlackHelper.prototype.getTeamData = function(slackTeamId, attr, callback) {
    SlackTeam.findOne({slackTeamId:slackTeamId}, function (err, slackTeam) {
        console.log('getTeamData ' + slackTeamId, err, slackTeam);
        callback(err, slackTeam[attr]);
    }); 
}

SlackHelper.prototype.sendResponse = function(responseURL, jsonPostData, callback) {
    console.log('sendResponse', jsonPostData);
    request({
        uri: responseURL,
        method: 'POST',
        json: jsonPostData,
        },
        function (err, res, body) {
            if (err || res.statusCode != 200) {
                return callback(err);
            }
            return callback(false, body);
        }
    );
}

module.exports = new SlackHelper();
