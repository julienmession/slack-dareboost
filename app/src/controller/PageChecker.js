const request = require('request');

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
PageChecker.prototype.checkURL = function (url, useAuth, callback) {
    var self = this;
    /* var postData = {url: url};
    if (useAuth) {
        postData.basicAuth = {
            user: process.env.BASIC_AUTH_LOGIN,
            password: process.env.BASIC_AUTH_PWD
        };
    }
    this.callDareboost('analysis/launch', postData, function(err, body) {
        if (err || !body.reportId) {
            return callback('Error while launching the Dareboost analysis');
        }
        console.log("reportId = "+body.reportId);
        self.getReport(body.reportId, callback);
    });
    */
    self.getReport('58f7e8b70cf28ebd23547a35', callback);
}

PageChecker.prototype.getReport = function (reportId, callback) {
    this.callDareboost('analysis/report', {reportId: reportId}, function(err, body) {
        callback(err, body);
    });
}

PageChecker.prototype.callDareboost = function (slug, postData, callback) {
    postData.token = process.env.DAREBOOST_TOKEN;
    request({
        uri: process.env.DAREBOOST_API_URL + slug,
        method: 'POST',
        json: postData,
        },
        function (err, res, body) {
            if (err || res.statusCode != 200) {
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
