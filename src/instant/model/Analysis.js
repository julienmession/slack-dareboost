const Dareboost = require('./Dareboost');
const Report = require('./Report');

var MAX_TRIES = 20;
var TIME_BETWEEN_TRIES = 5000;

class Analysis {
  constructor(url) {
    this.url = url;
  }

  launch(callback) {
    var data = {
      url: this.url,
      visualMetrics: true,
    };

    Dareboost.request('analysis/launch', data, (err, body) => {
      if (err || !body.reportId) {
        throw new Error(`Analysis was not able to be lauched for "${this.url}"`)
      } else {
        callback(body);
      }
    });
  }

  waitForReport(callback, currentTry = 1) {
    if (currentTry > MAX_TRIES) {
      throw new Error('Timeout for report request.');
    }

    this.requestReport((body) => {
      if (body.status == '202') {
          setTimeout(() => {
            this.waitForReport(callback, currentTry + 1);
          }, TIME_BETWEEN_TRIES);
      } else if (body.status == '200') {
          callback(new Report(this, this.reportId, body.report));
      } else {
        throw new Error('Error during report request: error ' + body.status);
      }
    });
  }

  requestReport(callback) {
    Dareboost.request('analysis/report', {reportId: this.reportId}, (err, body) => {
      if (err) {
        throw new Error('Error during report request: error ' + body.status)
      }

      callback(body);
    });
  }
}

module.exports = Analysis;
