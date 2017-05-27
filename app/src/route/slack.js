var express = require('express')
var router = express.Router()
var slackController = require('../controller/SlackController')
var slackHelper = require('../helper/SlackHelper')
var analyserController = require('../controller/AnalyserController')

/**
 * loop on all teams, send bot message suggesting to launch analyses
 */
router.get('/warn-teams', (req, res) => {
    analyserController.warnTeams((err, ret) => {
        res.send(ret);
    });
});

/**
 * Loop on all teams, send bot message with tips associated with the last analyses
 */
router.get('/tips', (req, res) => {
    analyserController.sendTips((err, ret) => {
        res.send(ret);
    });
});

/**
 * Loop on all teams, send bot message with tips associated with the last analyses
 */
router.get('/tip/:analysisId-:tipId', (req, res) => {
    analyserController.getTip(req.params.analysisId, req.params.tipId, (ret) => {
        res.send(ret);
    });
});

/**
 * Show the slack button
 */
router.get('/button', (req, res) => {
    res.send(slackController.getSlackButton());
});

/**
 * Called by Slack after the user has accepted the APP.
 * 'code' value is given in GET
 * use this code variable to retrieve app credentials from Slack
 */
router.get('/auth/redirect', (req, res) => {
    return slackController.auth(req.query.code, (err, slackURL) => {
        if (err) {
            return res.send(err);
        } else {
            // redirect to slack team
            return res.redirect(slackURL);
        }
    });
});

/**
 * Command from Slack
 */
router.post('/command/dareboost', (req, res) => {

    if (!req.body.command) {
        throw new Error('Missing Command');
    }
  
    var command = req.body.command ? req.body.command : '';

    if (command != process.env.DAREBOOST_COMMAND ||
        process.env.SLACK_APP_VERIFICATION_TOKEN != req.body.token ||
        ! req.body.user_id ||
        ! req.body.channel_id ||
        ! req.body.response_url ||
        ! req.body.team_id) {
        res.send('Wrong command, missing arguments');
    }

    var slackUserId = req.body.user_id;
    var text = req.body.text ? req.body.text : '';
    var channelId = req.body.channel_id;
    var teamId = req.body.team_id;
    var responseUrl = req.body.response_url;
    
    // save the team dareboost token
    if (text.indexOf('token') == 0) {
        var token = text.replace(/\b(token|\b\s)*/, '');
        if (!token) {
            return res.send('use \'' + process.env.DAREBOOST_COMMAND + ' token YOUR-DAREBOOST-TOKEN\' to save your token');
        }
        analyserController.saveDareboostToken(teamId, token, (err) => {
            if (err) {
                return res.send('Error : token not saved');
            }
            return res.send('Token Saved ! Add your first URL to test with \''+process.env.DAREBOOST_COMMAND+' YOUR-URL\'');
        });
    } else if (text == 'help') {
        // display the command help
        res.send('TODO');
    } else if (text) {
        // add analysis on this text (= URL)

        // Analysis may take a long time, so send a response right now.
        // Another responses will come later.
        res.send('URL added, now let @'+process.env.SLACK_BOT_NAME+' do his job');

        analyserController.addAnalysis(teamId, channelId, slackUserId, text, (err, json) => {

            if (err) {
                return slackHelper.sendResponse(responseUrl, {text: err}, (err, ret) => {
                    console.log(err, ret);
                });
            }
            var message = {text:json.text, attachments:json.attachments};
            message.channel = channelId;
            message.teamId  = teamId;

            slackHelper.sendBotMessage(message, responseUrl, (err) => {
                if (err)
                    console.log('sendBotMessage', err);
            });
        });

    } else {
        res.send('');
        analyserController.getAnalysisList(channelId, (err, json) => {
            console.log('MESSAGE', json);
            if (err) { 
                return slackHelper.sendResponse(responseUrl, {text: err});
            }

            var message = {text:json.text, attachments:json.attachments};
            message.channel = channelId;
            message.teamId  = teamId;

            slackHelper.sendBotMessage(message, responseUrl, (err) => {
                if (err)
                    console.log('sendBotMessage', err);
            });
        });
    }
});

router.post('/action', (req, res) => {
    params = JSON.parse(req.body.payload);
    // send nothing now, let callback be called later to sed response via slack response_url
    res.send("");

    analyserController.action(params, (err, json) => {
        if (err) {
            return slackHelper.sendResponse(params.response_url, {text: err}, (err, ret) => {
                console.log(err, ret);
            });
        }
        // send only one response directly.
        // analysis is in progress or finished, use the response_url given by slack to update the status
        return slackHelper.sendResponse(params.response_url, json, (err, ret) => {
            console.log(err, ret);
        });
    });
});

module.exports = router