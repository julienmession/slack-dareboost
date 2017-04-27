// read params in .env file
require('dotenv').config();

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

//require the body-parser nodejs module
bodyParser = require('body-parser'),
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

const db = require('./db');
const slackController = require('./controller/SlackController');
const slackHelper = require('./helper/SlackHelper');
const pageCheckerController = require('./controller/PageChecker');
const noteHelper = require('./helper/NoteHelper');

app.get('/slack/button', function (req, res) {
    res.send(slackController.getSlackButton());
});

/**
 * Called by Slack after the user has accepted the APP.
 * 'code' value is given in GET
 * use this code variable to retrieve app credentials from Slack
 */
app.get('/slack/auth/redirect', function (req, res) {
    return slackController.auth(req.query.code, function(err, slackURL) {
        if (err) {
            return res.send(err);
        } else {
            // redirect to slack team
            return res.redirect(slackURL);
        }
    });
});

app.post('/slack/command/dareboost', function (req, res) {
    if (!req.body.command) {
        throw new Error('Missing Command');
    }
    console.log(req.body);
  
    var command = req.body.command ? req.body.command : '';

    if (command != process.env.DAREBOOST_COMMAND || process.env.SLACK_APP_VERIFICATION_TOKEN != req.body.token || !req.body.user_id) {
        res.send('Wrong command, missing arguments');
    }

    var slackUserId = req.body.user_id;
    var text = req.body.text ? req.body.text : '';
    var channelId = req.body.channel_id ? req.body.channel_id : '';

    // save the team dareboost token
    if (text.indexOf('token') == 0) {
        var token = text.replace(/\b(token|\b\s)*/, '');
        if (!token) {
            return res.send('use \'' + process.env.DAREBOOST_COMMAND + ' token YOUR-DAREBOOST-TOKEN\' to save your token');
        }
        slackController.saveDareboostToken(req.body.team_id, token, function(err, str) {
            if (err) {
                return res.send('Error : token not saved');
            }
            return res.send('Token Saved ! Add your first URL to test with \''+process.env.DAREBOOST_COMMAND+' YOUR-URL\'');
        });
    } else if (text == 'help') {
        res.send('TODO');
    } else if (text) {

        // is there a dareboost token for this team ?
        slackHelper.getTeamData(req.body.team_id, 'dareboostToken', function(err, dareboostToken) {
            if (err || !dareboostToken) {
                return res.send('No Dareboost token found ! TODO');
            }
       
            // Analysis may take a long time, so send a response right now.
            // Another responses will come later.
            res.json({text: 'Launch Analysis'});
            pageCheckerController.checkURL(dareboostToken, text, true, function (err, json) {
                console.log(err, json);
                if (err) {
                    return slackHelper.sendResponse(req.body.response_url, {text: err}, function(err, ret) {
                        console.log(err, ret);
                    });
                }
                // send only one response directly.
                // analysis is in progress or finished, use the response_url given by slack to update the status
                return slackHelper.sendResponse(req.body.response_url, json.message, function(err, ret) {
                    console.log(err, ret);
                });
            });
        });

    } else {
        slackController.linkFromSlackCommand(slackUserId, channelId, text, function(err, json) {
            if (err) {
                return res.send(err);
            }
            return res.json(json);
        });
    }
});

app.post('/slack/action', function (req, res) {
    params = JSON.parse(req.body.payload);
    slackController.action(params.actions, params.callback_id, function(err, ret) {
        if (err) {
            return res.send(err);
        }
        return res.json(ret);
    });
});

app.get('/dareboost-test', function (req, res) {
    //pageCheckerController.checkURL('http://code.fabernovel.com', true, function (err, ret) {
    pageCheckerController.getReport('57f36eef0cf2f2c777535fe2', '5900d3550cf28ebd2359d0d8', function (err, json) {
        if (err) {
            return res.send(err);
        }
        return res.json(json);
    });
});

app.get('/test', function (req, res) {
    var text = 'token UAHFA73981hafeihaef';
    res.send(text.replace(/\b(token|\b\s)*/, ''));
});

app.listen(port, function () {
  console.log('Example app listening on port '+port)
});
