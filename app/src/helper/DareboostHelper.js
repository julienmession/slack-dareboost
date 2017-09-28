function DareboostHelper () {
    this.summaryFormats = {
        score: {
            label: 'Score',
            unit: '%',
            factor: 1,
            levels: {green: [80, 100], orange: [70, 80], red: [60, 70]},
            tip : 'At least 80%'
        },
        loadTime: {
            label: 'Load Time',
            unit: 's',
            factor: '0.001',
            levels: {green: [0, 2000], orange: [2000, 3000], red: [3000, 4000]},
            tip: 'Less thant 2 sec'
        },
        weight: {
            label: 'Weight',
            unit: 'KB',
            factor: 0.001,
            levels: {green :[0, 500], orange:[500, 1000], red: [1000, 2000]},
            tip: 'Less than 500 KB'
        },
        requestsCount: {
            label: 'Requests Count',
            unit: '',
            factor: 1,
            levels: {green: [0, 15], orange: [15, 30], red: [40, 60]},
            tip : 'Less than 15'
        },
        speedIndex: {
            label: 'Speed Index',
            unit: '',
            factor: 1,
            levels: {green: [0, 2000], orange: [2000, 4500], red: [4500, 8000]},
            tip : 'Should be less than 1000, but below 3500 is acceptable'
        },
        firstByte: {
            label: 'Time To First Byte',
            unit: 'ms',
            factor: 1,
            levels: {green: [0, 2000], orange: [2000, 4500], red: [4500, 8000]},
            tip : 'Should be less than 200ms'
        },
        startRender: {
            label: 'Start Render',
            unit: 'ms',
            factor: 1,
            levels: {green: [0, 2000], orange: [2000, 4000], red: [4000, 6000]},
            tip : 'Should be less than 2000ms'
        }
    }
    this.colors = {green: '#40FF40', orange: '#FFA500', red: '#FF1010', black: '#000000'}
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

    // console.log('FORMAT ->', format);
    if (key === 'speedIndex') console.log('SPEED INDEX VALUE ->', value);
    
    var color = 'black';
    for (var c in format.levels) {
        if (value > format.levels[c][0] && value <= format.levels[c][1]) {
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
 * Replace HTML tags into Slack markdown
 */
DareboostHelper.prototype.formatTipAdvice = function(str) {
    str = str.replace(/<\/?(div|p)([^>]*)>/g, "\n")
    .replace(/<br\/?>/g, "\n")
    .replace(/<\/?pre[^>]*>/g, "```") // long code
    .replace(/<\/?img[^>]*src="([^"]*)"[^>]*>/g, '$1') //bold
    .replace(/<\/?h[1-5]>/g, "*") //bold
    .replace(/<\/?strong[^>]*>/g, "*") // bold
    .replace(/<\/?code[^>]*>/g, "`") // bold
    .replace(/<a .*href="([^"]*)".*>([^<]*)<\/a>/g, '<$1|$2>')
    .replace(/<\/?ul>/g, "").replace(/<li>/g, "  - ").replace(/<\/li>/g, "\n") // replace ul li
    return str;
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
    console.log(report.summary);
    var summary = report.summary;
    var attachments = [
        this.formatReportValue('score', summary.score),
        this.formatReportValue('loadTime', summary.loadTime),
        this.formatReportValue('weight', summary.weight),
        this.formatReportValue('requestsCount', summary.requestsCount),
        this.formatReportValue('speedIndex', summary.speedIndex),
        this.formatReportValue('firstByte', summary.firstByte),
        this.formatReportValue('startRender', summary.startRender)
    ];
    return attachments;
}

/**
 * return the tip of a report corresponding to the tipId
 */
DareboostHelper.prototype.getReportTip = function(report, tipId, escapeHTML) {
    // TODO : format the output according to escapeHTML value
    var tips = report.tips.filter(
        (tip) => {return tip.score != 100}
    );
    if (tipId >= 0) {
        if (tips[tipId]) {
            return tips[tipId].advice;
        }
    } else {
        return tips;
    }
    return 'No Tip';
}

module.exports = new DareboostHelper();
