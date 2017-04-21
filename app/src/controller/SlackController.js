const request = require('request');
const SlackTeam = require('../model/SlackTeam');
const Link = require('../model/Link'); 
const User = require('../model/User');
const noteHelper = require('../helper/NoteHelper');


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
            var authInfo = JSON.parse(body)
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
                        var slackTeam = new SlackTeam;
                        slackTeam.slackTeamId = teamInfo.id;
                        slackTeam.slackInfo   = authInfo;
                        slackTeam.teamInfo    = teamInfo;
                        slackTeam.save(function(err) {
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

SlackController.prototype.action = function(actions, callbackId, callback) {
    if (actions.length && actions[0].value) {
        switch(actions[0].value) {
            case 'del':
            Link.findOne({_id: callbackId}).exec().then(function(link) {
                if (!link) {
                    return callback('This link has already been deleted');
                }
                var channelId = link.channelId;
                link.remove(function(err) {
                    if (err) {
                        return callback('Error while deleting the note');
                    }
                    return noteHelper.getChannelNotes('Note removed !', channelId, false, false, callback);
                });
             });
             break;
           
             case 'edit':
                 return noteHelper.getChannelNotes('Edit notes', callbackId, true, false, callback);
             break;
             case 'cancel':
                 return noteHelper.getChannelNotes('Notes', callbackId, false, false, callback);
             break;
        }
    } else {
        callback('Unknown action');
    }
}

/**
 * manage link attached to a channel
 * @param slackUserId String 
 * @param channelId String
 * @param str String
 * @param Function callback
 */
SlackController.prototype.linkFromSlackCommand = function (slackUserId, channelId, str, callback) {
    console.log('linkFromSlackCommand', slackUserId, channelId, str);
    var self = this;
    if (str == 'help') {
        return callback(false, {
            text :
            "'/n' or '/n all' lists all entries attached to this channel\n" +
            "'/n MY TEXT' saves a simple free text\n" + 
            "'/n LABEL URL' saves a url with a label\n" +
            "'/n search MY SEARCHED TEXT' searches in your Google Drive documents"
        });
    }

    var editMode = (str == 'del' || str == 'admin' || str == 'edit');

    if (!str || 'all' == str || editMode) {
         
        return noteHelper.getChannelNotes('All notes', channelId, editMode, 'all' == str, callback);

    }
    else
    {
        return noteHelper.saveNote(str, channelId, slackUserId, callback);
    }
}

module.exports = new SlackController();
