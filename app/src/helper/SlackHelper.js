const request = require('request');
const SlackTeam = require('../model/SlackTeam');

function SlackHelper() { }

SlackHelper.sendBotInvitationMessage = function (responseUrl, callback) {
    if (!responseUrl)
        return;

    return slackHelper.sendResponse(responseUrl, {
        // TODO change this message
        text: 'Please invite @' + process.env.SLACK_BOT_NAME + ' in this channel to let him chat with you'
    }, (err, ret) => {
        callback(err);
    });
}

/**
 * send a bot message via post.chat call
 * if the message can't be sent, use the fallback url to send a warning message
 */
SlackHelper.prototype.sendBotMessage = function (message, fallbackResponseUrl, callback) {

    if (!message.channel) {
        throw new Error('sendBotMessage : channel is mandatory');
    }

    if (message.teamId) {
        // replace teamId by access token
        return this.getAccessToken(message.teamId, (err, accessToken) => {
            message.token = accessToken;
            delete message.teamId;
            this.sendBotMessage(message, fallbackResponseUrl, callback);
        });
    }

    if (!message.token)
        throw new Error('sendBotMessage : channel is mandatory');

    // complete the message
    if (!message.as_user)
        message.as_user = true;
    if (!message.username)
        message.username = process.env.SLACK_BOT_NAME;
    message.attachments = JSON.stringify(message.attachments);

    console.log('################################### sendBotMessage', message);

    request({
        uri: process.env.SLACK_API_CHAT_URL,
        qs: message
    },
        (err, res, body) => {
            body = JSON.parse(body);
            if (err) {
                return callback(err);
            } else if (!body.ok) {
                switch (body.error) {
                    // TODO : check another errors
                    // channel_not_found may be caused by a try to write in a private channel 
                    case 'channel_not_found':
                    default:
                        return this.sendBotInvitationMessage(fallbackResponseUrl, callback);
                }
            }
            return callback(false, body);
        }
    );
}

SlackHelper.prototype.getAccessToken = function (teamId, callback) {
    SlackTeam.findOne({ slackTeamId: teamId }).exec( (err, slackTeam) => {
        // TODO manage err
        callback(err, !err ? slackTeam.authInfo.bot.bot_access_token : null);
    });
}

// TODO : delete this one
SlackHelper.prototype.formatResponse = function (command, text, err, str) {
    if (err) {
        return err;
    }
    return str;
}

SlackHelper.prototype.setTeamData = function (slackTeamId, data, callback) {
    SlackTeam.findOneAndUpdate({ 'slackTeamId': slackTeamId }, { $set: data }, callback);
}

SlackHelper.prototype.getTeamData = function (slackTeamId, attr, callback) {
    SlackTeam.findOne({ slackTeamId: slackTeamId }, (err, slackTeam) => {
        console.log('getTeamData ' + slackTeamId, err, slackTeam);
        callback(err, slackTeam[attr]);
    });
}

SlackHelper.prototype.sendResponse = function (responseURL, jsonPostData, callback) {
    console.log('sendResponse', jsonPostData);
    request({
        uri: responseURL,
        method: 'POST',
        json: jsonPostData,
    },
    (err, res, body) => {
        if (err || res.statusCode != 200) {
            return callback(err);
        }
        return callback(false, body);
    });
}

module.exports = new SlackHelper();
