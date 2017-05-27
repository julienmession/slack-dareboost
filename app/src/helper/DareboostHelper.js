function DareboostHelper () {
    this.summaryFormats = {
        score: {
            label: 'Score',
            unit: '%',
            factor: 1,
            levels: {green: [85, 100], orange: [70, 85]},
            tip : 'At least 85%'
        },
        loadTime: {
            label: 'Load Time',
            unit: 's',
            factor: '0.001',
            levels: {green: [0, 1000], orange: [1000, 2000]},
            tip: 'Less thant 1 sec'
        },
        weight: {
            label: 'Weight',
            unit: 'KB',
            factor: 0.001,
            levels: {green :[0, 500], orange:[500, 2000]},
            tip: 'Less than 500 KB'
        },
        requestsCount: {
            label: 'Requests Count',
            unit: '',
            factor: 1,
            levels: {green: [0, 20], orange: [20, 40]},
            tip : 'Less than 20'
        },
    }
    this.colors = {green: '#40FF40', orange: '#FFA500', red: '#FF1010'}
}

/**
 * format a report into a single text
 */
DareboostHelper.prototype.reportToString = function (report) {
    var reportStr = '<' + this.getReportUrl(report) + '|See full report here>';
    var scoreInfo = this.formatReportValue('score', report.summary.score);
    var loadInfo  = this.formatReportValue('loadTime', report.summary.loadTime);
    reportStr += "\n" + scoreInfo.value + ' - '+loadInfo.value;
    return reportStr;
}

DareboostHelper.prototype.getReportColor = function(report) {
    var scoreInfo = this.formatReportValue('score', report.summary.score);
    return scoreInfo.color;
}

DareboostHelper.prototype.formatReportValue = function(key, value) {
    var format = this.summaryFormats[key];
    
    var color = 'red';
    for (var c in format.levels) {
        if (value > format.levels[c] && value <= format.levels[c]) {
            color = c;
            break;
        }
    }
    var value = Math.round(value * format.factor) + ' ' + format.unit;
    var title = format.label + ': '+value;
    return {
        fallback: title,
        title   : title,
        value   : value,
        color   :this.colors[color],
        text    : color == 'green' ? '' : format.tip
    };
}

/**
 * return the public url to consult the report on the dareboost website
 */
DareboostHelper.prototype.getReportUrl = function(report) {
    return report.publicReportUrl;
}

/**
 * Format a dareboost report into Slack attachments
 */
DareboostHelper.prototype.reportToAttachments = function(report) {
    var summary = report.summary;
    var attachments = [
        this.formatReportValue('score', summary.score),
        this.formatReportValue('loadTime', summary.loadTime),
        this.formatReportValue('weight', summary.weight),
        this.formatReportValue('requestsCount', summary.requestsCount)
    ];
    return attachments;
}

/**
 * return the tip of a report corresponding to the tipId
 */
DareboostHelper.prototype.getReportTip = function(report, tipId) {
    // TODO : format the output
    if (report.tips[tipId]) {
        return report.tips[tipId].advice;
    }
    return 'No Tip';
}

module.exports = new DareboostHelper();