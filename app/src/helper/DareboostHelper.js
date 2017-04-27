function DareboostHelper() {};

DareboostHelper.prototype.formatReport = function(jsonReport) {
    var message = {}; 
    console.log(jsonReport);
    var report = jsonReport.report;
    var summary = report.summary;
    message.text = 'See the full report <'+report.publicReportUrl+'|here>';
    message.attachments = [];
    for (i in summary) {
        message.attachments.push({
            fallback: i + ': '+summary[i],
            text: i + ': '+summary[i]
        });
    }
    return message;
}

module.exports = new DareboostHelper;
