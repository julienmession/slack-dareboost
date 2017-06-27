const request = require('request');
const SlackTeam = require('../model/SlackTeam');
const User = require('../model/User');
const slackHelper = require('../helper/SlackHelper');

function SlackController() {}

SlackController.prototype.getSlackButton = function() {
    return '<a href="https://slack.com/oauth/authorize?&client_id=' + 
        process.env.SLACK_APP_CLIENT_ID +
        '&scope=' + process.env.SLACK_APP_SCOPE + 
        '"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>';
}

SlackController.prototype.auth = function(code, callback) {
    if (code) {
        var accessURL = process.env.DOMAIN + '/slack/auth/redirect';
        var options = {
            uri: process.env.SLACK_OAUTH_ACCESS_URL +
                '?code=' + code +
                '&client_id=' + process.env.SLACK_APP_CLIENT_ID +
                '&client_secret=' + process.env.SLACK_APP_CLIENT_SECRET+
                '&redirect_uri=' + accessURL,
            method: 'GET'
        }
        request(options.uri, function (err, res, body) {
            var authInfo = JSON.parse(body);
            if (!authInfo.ok){
                return callback("Error: \n"+JSON.stringify(authInfo));
            } else {
                // retrieve slack team info 
                request.post(
                    'https://slack.com/api/team.info',
                    {form: {token: authInfo.access_token}},
                    function (err, res, body) {
                        if (err || res.statusCode != 200) {
                            return callback(err);
                        }
                        var teamInfo = JSON.parse(body).team;
                        // save Slack Team info

                        SlackTeam.findOneAndUpdate({
                            slackTeamId : teamInfo.id
                        },
                        {
                            slackTeamId : teamInfo.id,
                            authInfo    : authInfo,
                            teamInfo    : teamInfo
                        },
                        {upsert:true},
                        function(err) {
                           if (err) {
                               return callback('SlackTeam not saved');
                           } else {
                               callback(false, 'https://' + teamInfo.domain + '.slack.com');
                           }
                        });
                    }
                );
            }
        });
    } else {
       return callback('Missing arguments');
    }
}

module.exports = new SlackController();
