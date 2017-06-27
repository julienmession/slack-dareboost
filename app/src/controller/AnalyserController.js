const SlackChannelItemList = require('../helper/SlackChannelItemList');
const Analysis = require('../model/Analysis');
const slackHelper = require('../helper/SlackHelper');
const SlackTeam = require('../model/SlackTeam');

function AnalyserController() {
    // create an instance of SlackChannelItemList to manage
    // dareboost analyses in a channel
    this.analysisChannelList = new SlackChannelItemList({
        ItemClass:Analysis,
        slackCommand:process.env.SLACK_COMMAND,
        title:'List of URLs to analyse',
        alwaysEditMode:true
    });
}

/**
 * loop on all slack teams to check if an analysis is needed
 * this path should be called with a cron task
 */
AnalyserController.prototype.warnTeams = function(callback) {
    var responses = [];
    SlackTeam.find({}).exec((err, teams) => {
        teams.forEach((team) => {
            this.warnTeam(team, (err, ret) => {
                if (err) {
                    responses.push(team.teamInfo.name + ' ' + err);
                } else {
                    responses.push(team.teamInfo.name + ' ' + ret);
                }
                if (responses.length == teams.length) {
                    // all responses received
                    callback(false, responses.join("\n<br/>"));
                }
            });
        });
    });
}

/**
 * loop on all analyses of a team and send a message to propose an analyse
 */
AnalyserController.prototype.warnTeam = function(team, callback) {
    var datenow = new Date();
    var cutoff = new Date(datenow.getTime() - parseInt(process.env.ANALYSIS_PEREMPTION_IN_SECONDS)*1000);
    console.log(cutoff);
    Analysis.find({slackTeamId:team.teamInfo.id, updatedAt: {$lt : cutoff}})
    .exec((err, analyses) => {
        // TODO manage err
        // TODO : no need to get access_token here, use teamId
        callback(false, analyses ? analyses.length : 0);
        analyses.forEach((analysis) => {
            var message = analysis.toChatMessage();
            // add params to send it
            message.text = "*Time to launch an analysis ?*\n" + message.text;
            slackHelper.sendBotMessage(message, null, (err, ret) => {
                //TODO : manage err
            });
        });
    });
}

/**
 * send a bot message with a Dareboost Tip for all recent analyses
 */
AnalyserController.prototype.sendTips = function(callback) {
    // find recent analyses with a report
    var responses = [];

    var datenow = new Date();
    var cutoff = new Date(datenow.getTime() - parseInt(process.env.ANALYSIS_PEREMPTION_IN_SECONDS)*1000);

    Analysis.find({lastReport: { $ne: null }, updatedAt: {$gt : cutoff}}).exec((err, analyses) => {
        analyses.forEach((analysis) => {
            var tipMessage = analysis.getRandomTip();
            responses.push(tipMessage);

            // TODO : build here the tip Slack message rather than in the analysis ?
            slackHelper.sendBotMessage(tipMessage, null, (err, ret) => {
                console.log('sendBotMessage', err, ret);
            });
        });
        //TODONOW : don't show urls in return
        return callback(false, JSON.stringify(responses));
    });
}

AnalyserController.prototype.getReportTip = function(analysisId, tipId, callback) {
    Analysis.find({_id:analysisId}).exec((err, analysis) => {
        callback(false, analysis.getTip(tipId));
    });
}

// Dareboost Token management
AnalyserController.prototype.saveDareboostToken = function(slackTeamId, token, callback) {
    slackHelper.setTeamData(slackTeamId, {dareboostToken:token}, callback);
}

AnalyserController.prototype.getDareboostToken = function (slackTeamId, callback) {
    slackHelper.getTeamData(slackTeamId, 'dareboostToken', callback);
}

// WebPageTest token management
AnalyserController.prototype.saveWPTToken = function (slackTeamId, token, callback) {
    console.log('saving WPT token');
    slackHelper.setTeamData(slackTeamId, {wptToken:token}, callback);
}

AnalyserController.prototype.getWPTToken = function (slackTeamId, callback) {
    slackHelper.getTeamData(slackTeamId, 'wptToken', callback);
}

/**
 * call when an action is performed on one of the list button
 */
AnalyserController.prototype.action = function (action, callback) {
    // console.log('action', action);

    switch (action.actions[0].name) {
        case 'tip':
        // TODONOW
        Analysis.findOne({_id: action.callback_id}).exec((err, analysis) => {
            if (err)
                return callback(err);
            var tipMessage = analysis.getRandomTip(1);
            slackHelper.sendBotMessage(tipMessage, null, (err, ret) => {
                // TODO : error management
            });
        });
        break;

        case 'tips':
        console.log('--- TIPS ---');
        Analysis.findOne({_id: action.callback_id}).exec((err, analysis) => {
            if (err) return callback(err);
            var tips = analysis.getTip(-1);
            console.log(tips);
        });
        break;
        
        case 'analyse':
        Analysis.findOne({_id: action.callback_id}).exec((err, analysis) => {
            if (err)
                return callback(err);
            this.analyse(analysis, callback);
        });
        break;

        default:
        this.analysisChannelList.action(action, callback);
    }
}

AnalyserController.prototype.addAnalysis = function (slackTeamId, channelId, slackUserId, text, callback) {
    var analysis = new Analysis({
        url        : text,
        slackTeamId: slackTeamId,
        channelId  : channelId,
        slackUserId: slackUserId
    });
    this.analysisChannelList.save(analysis, (err, json) => {
        if (err) {
            return callback(err);
        }
        console.log('addAnalysis', err, json);
        // return the list data with new item
        // callback(err, json);
        // launch the analysis
        this.analyse(analysis, callback);
    });
}

AnalyserController.prototype.launchAnalysis = function (analysisId, callback) {
    Analysis.findOne({_id: analysisId}).exec((err, analysis) => {
        if (err) {
            return callback(err);
        }
        return this.analyse(analysis, callback);
    });
}

/**
 * Start an analyse on dareboost
 */
AnalyserController.prototype.analyse = function (analysis, callback) {

    var self = this;

    // is there a dareboost token for this team ?
    this.getDareboostToken(analysis.slackTeamId, (err, dareboostToken) => {

        if (err || !dareboostToken) {
            return callback(new Error("No Dareboost token found !\nType '"
                + process.env.SLACK_COMMAND
                + " token YOUR_DAREBOOST_TOKEN' to save it"));
        }

        // TODO error managementt
        analysis.once('analysis', () => {
            this.analysisChannelList.toMessage({channelId:analysis.channelId}, false, (err, message) => {
                callback(false, message);
            });

            // when analysis is done, send message
            // TODO error management
            analysis.once('report', () => {
                // all is done on this analysis, cleanup
                analysis.removeAllListeners();
                var message = analysis.toChatMessage();
                callback(false, message);
            });
        });
        
        analysis.once('error', (err) => {
            console.log('###########', err);
            
            // all is done on this analysis, cleanup
            analysis.removeAllListeners();
            var message = analysis.toChatMessage();
            callback(err);
        });

        // start the analysis
        analysis.launch(dareboostToken);
    });
}

/**
 * Build the list of analyses attached to a channel
 */
AnalyserController.prototype.getAnalysisList = function (channelId, callback) {
    this.analysisChannelList.toMessage({channelId:channelId}, false, callback); 
}

module.exports = new AnalyserController();
