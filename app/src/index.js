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

    if (command != '/dareboost' || process.env.SLACK_APP_VERIFICATION_TOKEN != req.body.token || !req.body.user_id) {
        res.send('Wrong command, missing arguments');
    }

    var slackUserId = req.body.user_id;
    var text = req.body.text ? req.body.text : '';
    var channelId = req.body.channel_id ? req.body.channel_id : '';

    if (text) {

        pageCheckerController.checkURL('http://code.fabernovel.com', true, function (err, ret) {
            if (err) {
                return res.send(err);
            }
            return res.send(ret);
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
    pageCheckerController.checkURL('http://code.fabernovel.com', true, function (err, ret) {
        if (err) {
            return res.send(err);
        }
        return res.send(ret);
    });
});

app.get('/test', function (req, res) {
    res.send(
        noteHelper.findLinks('https://buzzaka.atlassian.net/secure/RapidBoard.jspa?rapidView=64&view=planning.nodetail')
    );
});

app.listen(port, function () {
  console.log('Example app listening on port '+port)
});
