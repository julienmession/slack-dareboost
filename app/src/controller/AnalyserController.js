const SlackChannelItemList = require('../helper/SlackChannelItemList');
const Analysis = require('../model/Analysis');
const slackHelper = require('../helper/SlackHelper');
const SlackTeam = require('../model/SlackTeam');

function AnalyserController() {
    // create an instance of SlackChannelItemList to manage
    // dareboost analyses in a channel
    this.analysisChannelList = new SlackChannelItemList({
        ItemClass:Analysis,
        slackCommand:process.env.DAREBOOST_COMMAND,
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
 * send a bot message for all old analyses 
 */
AnalyserController.prototype.sendTips = function(callback) {
    // find recent analyses : 7 days since last check
    var responses = [];
    Analysis.find({}).exec((err, analyses) => {
        analyses.forEach((analysis) => {
            var tipMessage = analysis.getRandomTip(1);
            responses.push(tipMessage);

            // TODO : build here the ip Slack message rather than in the analysis ?
            slackHelper.sendBotMessage(tipMessage, null, (err, ret) => {
            });
        });
        callback(false, responses.join("\n<br/>"));
    });
}

AnalyserController.prototype.getTip = function(analysisId, tipId, callback) {
    Analysis.find({_id:analysisId}).exec((err, analysis) => {
        console.log(analysis);
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

/**
 * call when an action is performed on one of the list button
 */
AnalyserController.prototype.action = function (action, callback) {
    console.log('action', action);
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
            return callback(new Error('No Dareboost token found !'));
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
            // all is done on this analysis, cleanup
            analysis.removeAllListeners();
            console.log('###########', err);
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
