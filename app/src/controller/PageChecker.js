const request = require('request');
const dareboostHelper = require('../helper/DareboostHelper');

function PageChecker() {}

/*
 POST https://www.dareboost.com/api/0.2/analysis/launch {
 // required parameters
 token: "", // String, The token to authenticate the user
 lang: "", // String, Optional, The lang of the analysis.
 // Default value: "en". Possible values: "en", "fr".
 url: "", // String, The URL to analyze
 }
 -> {"status":200,"message":"OK","reportId":"57f77db30cf2f2c777547778"}
*/
PageChecker.prototype.checkURL = function (token, url, useAuth, callback) {
    console.log('checkURL', url);
    var self = this;
    var postData = {url: url};
    if (useAuth) {
        postData.basicAuth = {
            user: process.env.BASIC_AUTH_LOGIN,
            password: process.env.BASIC_AUTH_PWD
        };
    }
    // launch the analysis
    this.callDareboost(token, 'analysis/launch', postData, function(err, body) {
        if (err || !body.reportId) {
            console.log(err, body);
            var message = body.message ? body.message : 'analysis aborted';
            return callback('Dareboost error: ' + message);
        }
        console.log("reportId = "+body.reportId);
        // get the report.
        setTimeout(function() {
            self.getReport(token, body.reportId, callback);
        }, 5000);
    });
    // debug
    // this.getReport('58f7e8b70cf28ebd23547a35', callback);
}

PageChecker.prototype.getReport = function (token, reportId, callback) {
    var self = this;
    console.log('getReport', reportId);
    this.callDareboost(token, 'analysis/report', {reportId: reportId}, function(err, body) {
        console.log('getReport response : ', reportId, err, body);
        if (err) {
            return callback(err);
        }
        if (body.status == '202') {
            // the analysis is processing. Wait 5 sec to try again
            setTimeout(function() {
                console.log('setTimeout getReport');
                self.getReport(token, reportId, callback);
            }, 5000);
            // return callback(false, {status:'inprogress', message: {response_type: 'ephemeral', text: 'Analysis in progress...'+Math.random()}});
        } else if (body.status == '200') {
            var message = dareboostHelper.formatReport(body);
            message.response_type = 'ephemeral';
            return callback(false, {status:'ok', message: message});
        } else {
            // error
            return callback('Error ' + body.status + ': ' + body.message);
        }
    });
}

PageChecker.prototype.formatReport = function (jsonReport) {
    return jsonReport;
}

PageChecker.prototype.callDareboost = function (token, slug, postData, callback) {
    postData.token = token;
    request({
        uri: process.env.DAREBOOST_API_URL + slug,
        method: 'POST',
        json: postData,
        },
        function (err, ret, body) {
            console.log('callDareboost '+slug, err, ret.statusCode);
            if (err || ret.statusCode != 200) {
                return callback(err);
            }
            return callback(false, body);
        }
    );
}

module.exports = new PageChecker();

/*
$reportId = $reportDataStr = false;
if ($launchDataStr) {
    $launchData = json_decode($launchDataStr);
    if ($launchData->status == '200' && $launchData->message == 'OK') {
        $reportDataStr = file_get_contents('report.json');//call_dareboost('analysis/report', array('reportId' => $launchData->reportId));
    }
}


if ($reportDataStr) {
    $reportData = json_decode($reportDataStr);
    if ($reportData->status == '200' && $reportData->message == 'OK') {
        $summary = $reportData->report->summary;
        $items = $reportData->report->tips;
        $w3cValidators = $reportData->report->w3cValidators;
        $reportDataStr;
    }
}


function compareIssues($a, $b) {
    return $a->score > $b->score ? 1 : ($a->score < $b->score ? -1 : ($a->priority < $b->priority ? 1 : -1));
}
usort($items, "compareIssues");

foreach ($items as $item) {
    echo '<h2>'.$item->name.'</h2>';
    echo '<p>score : '.$item->score.'</p>';
    echo '<p>priority : '.$item->priority.'</p>';
}
*/
