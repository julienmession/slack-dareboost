const colors = require('colors/safe');

const ApiClient = require('./../api/Client');
const Report = require('./Report');

const MAX_TRIES = 20;
const TIME_BETWEEN_TRIES = 5000;

class Analysis {
  constructor(conf) {
    this.apiClient = new ApiClient();

    try {
      this.start(conf);
    } catch (e) {
      throw e;
    }
  }

  async start(conf) {
    var response;
    
    try {
      response = await this.apiClient.launchAnalysis(conf);

      if (!response.reportId) {
        throw new Error(`Dareboost says: ${response.message}"`)
      }

      this.requestReport(response.reportId);
    } catch (e) {
      throw e;
    }
  }

  async requestReport(reportId, triesQty = 1) {
    if (triesQty > MAX_TRIES) {
      throw new Error('Timeout for report request.');
    }

    try {
      console.log(`Trying to get the report #${triesQty}`);
      const response = await this.apiClient.getAnalysisReport(reportId);

      switch (response.status) {
        case 202:
          console.log(`Dareboost says: #${response.message}`);

          setTimeout(() => {
            try {
              this.requestReport(reportId, ++triesQty);
            } catch (e) {
              throw e;
            }
          }, TIME_BETWEEN_TRIES);
          break;
  
        case 200:
          const report = new Report(this, this.reportId, response.report);
          
          this.displaysReport(report);
          break;
      
        default:
          throw new Error(`Dareboost says: ${response.message}`);
          break;
      }
    } catch (e) {
      throw e;
    }
  }

  displaysReport(report) {
		console.info(colors.green(`Analysis complete:`));
		console.log(colors.bgGreen(colors.black(`SCORE: ${report.summary.score}`)));
		console.log(colors.bgGreen(colors.black(`Load time: ${report.summary.loadTime/1000}s`)));
		console.log(colors.bgGreen(colors.black(`HTTP requests: ${report.summary.requestsCount}`)));
		console.log(colors.bgGreen(colors.black(`Page weight: ${report.summary.weight} bytes`)));

		console.log(colors.green(`More info at ${report.publicReportUrl}`));
		console.info("\n");
  }
}

module.exports = Analysis;
