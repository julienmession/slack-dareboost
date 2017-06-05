/'*jshint esversion: 6 */

var util = require('util');
var mongoose = require('mongoose');
var request = require('request');
var ta = require('time-ago')();
var Report = require('./Report');
var dareboostHelper = require('../helper/DareboostHelper');

var Schema = mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    url: {
        type:String,
        default:'',
        validate: {
            validator: function(v) {
                // TODO : check that url contains a url
                // return /\d{3}-\d{3}-\d{4}/.test(v);
                return true;
            },
            message: '{VALUE} does not contain a valid URL'
        },
        required: [true, 'URL required']
    },
    status: {
        type:String,
        default:'pending',
    },
    slackUserId: {
        type:String,
        default:''
    },
    slackTeamId: {
        type:String,
        default:''
    },
    channelId: {
        type:String,
        default:''
    },
    reports: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report'
        }
    ],
    lastReport: {
        type: mongoose.Schema.Types.Mixed,
        default:null
    }
});

/**
 * return the tip corresponding to the index in the tips list
 */
Schema.methods.getTip = function(tipId, escapeHTML) {
    return dareboostHelper.getReportTip(this.lastReport, tipId, escapeHTML);
}

/**
 * format an analysis into a Slack attachment.
 * callback is not used... (TODO with huge impact on list management)
 */
Schema.methods.toAttachment = function(callback) {
    var attachment = {
        text       : this.url,
        callback_id: this._id,
    };
    if (this.lastReport) {
        var r = this.lastReport;
        attachment.text += ' - ' + dareboostHelper.reportToString(r);
        attachment.color = dareboostHelper.getReportColor(r);
    }
    if ('pending' === this.status) {
        attachment.text += "\nPending...\n";
    } else {
        attachment.text += " ("+ ta.ago(this.updatedAt)+")";
        attachment.actions = [
            this.getAnalyseButton(),
            this.getTipButton()
        ];
    }
    return attachment;
}

Schema.methods.getTipButton = function() {
    if (this.lastReport.tips) {
        return {"name": "tip", "text": "Tip", "type":"button", "value":"tip"};
    }
    return null;
}
Schema.methods.getAnalyseButton = function() {
    return {"name": "analyse", "text": "Analyse", "type":"button", "value":"analyse"};
}

Schema.methods.toChatMessage = function() {
    var message = {
        text   : this.url,
        channel: this.channelId,
        teamId : this.slackTeamId
    };
    var attachments = [];
    // add report
    if (this.lastReport) {
        var r = this.lastReport;
        message.text += ' - See the full report <'+dareboostHelper.getReportUrl(r)+'|here>';
        attachments = dareboostHelper.reportToAttachments(r);
    }
    // add analyse button
    attachment = {callback_id: this._id};
    if ('pending' === this.status) {
        attachment.text = "Pending...";
    } else {
        attachment.text = "Last analysis: "+ ta.ago(this.updatedAt);
        attachment.actions = [
            this.getAnalyseButton(),
            this.getTipButton(),
        ];
    }
    attachments.push(attachment);
    message.attachments = attachments;

    return message;
}

/**
 * return a tip from the lastReport
 */
Schema.methods.getRandomTip = function() {
    var message = {
            text       :'*Improve your Dareboost score on '+this.url + "*\n",
            channel    : this.channelId,
            teamId     : this.slackTeamId
    }
    if (this.lastReport && this.lastReport.tips) {
        var tips = this.lastReport.tips.filter(
            (tip) => {return tip.score != 100}
        );
        var tipIndex = Math.floor(Math.random() * tips.length);
        var tip = tips[tipIndex];
        
        message.text += tip.name 
            + " (score: " + tip.score + ")\n"
            + "<" + process.env.DOMAIN + "/tip/" + this._id + "-" + tipIndex + "|" + tip.name + ">\n"
            + dareboostHelper.formatTipAdvice(tip.advice);
    }
    
    return message;
}


/**
 * Launch a dareboost analysis
 *
 * POST https://www.dareboost.com/api/0.2/analysis/launch {
 * token: "", // String, The token to authenticate the user
 * lang: "", // String, Optional, The lang of the analysis.
 * // Default value: "en". Possible values: "en", "fr".
 * url: "", // String, The URL to analyze
 * -> {"status":200,"message":"OK","reportId":"57f77db30cf2f2c777547778"}
 */
Schema.methods.launch = function (token) {
    console.log('checkURL', this.url);
    var self = this;
    var postData = {url: this.url};
    // TODO : extract auth in url
    /* if (this.useAuth) {
        postData.basicAuth = {
            user: process.env.BASIC_AUTH_LOGIN,
            password: process.env.BASIC_AUTH_PWD
        };
    }
    */
 
    this.status = 'pending';
    this.save((err) => {
        this.startAnalysis(token, postData);
    });
};

Schema.methods.startAnalysis = function(token, postData) {

    // launch the analysis
    this.callDareboost(token, 'analysis/launch', postData, (err, body) => {
        
        if (err || !body.reportId) {
            this.status = 'error';
            this.save((error) => {
                return this.emit('error', err);
            });
        } else {
            this.emit('analysis');
            // get the report.
            setTimeout(() => {
                this.getDareboostReport(token, body.reportId);
            }, 10000);
        }
    });
}

/**
 * Retrieve Dareboost report.
 * If the analysis is still pending, wait the end of the process
 * and then emit 'report' event to notify listeners that the report is available
 */
Schema.methods.getDareboostReport = function (token, reportId) {
    console.log('getReport', reportId);
    this.callDareboost(token, 'analysis/report', {reportId: reportId}, (err, body) => {
        
        if (err) {
            this.status = 'error';
            this.save(function(err) {
                return this.emit('error', err);
            });
            return;
        }

        if (body.status == '202') {
            // the analysis is processing. Wait 10 sec to try again
            setTimeout(() => {
                console.log('setTimeout getReport');
                this.getDareboostReport(token, reportId);
            }, 10000);

        } else if (body.status == '200') {

            // analyses is finished, here is the report

            // create new report            
            var reportSummary = {
                summary  : body.report.summary,
                publicReportUrl: body.report.publicReportUrl,
                tips:[]
            };
            var report = new Report({
                reportId: reportId,
                analysis: this._id,
                report  : reportSummary,
            });
            report.save((err) => {
                if (err) {
                    return this.emit('error', err);
                }
            });

            // update the analysis : add report summary to list of reports
            // and replace the lastReport
            this.lastReport = body.report;
            this.reports.unshift(report._id);
            this.status = 'done';
            this.updatedAt = new Date();
            this.save((err) => {
                if (err) {
                    return this.emit('error', err);
                }
                this.emit('report');
            });
        } else {
            // error
            this.emit('error', new Error(body.status + ': ' + body.message));
        }
    });
}

Schema.methods.callDareboost = function (token, slug, postData, callback) {
    postData.token = token;
    request({
        uri: process.env.DAREBOOST_API_URL + slug,
        method: 'POST',
        json: postData,
    },
     (err, ret, body) => {
        console.log('callDareboost '+slug, err, ret.statusCode);
        if (err) {
            return callback(err, body);
        }
        return callback(false, body);
    });
}

var Analysis = mongoose.model('Analysis', Schema);
module.exports = Analysis;

