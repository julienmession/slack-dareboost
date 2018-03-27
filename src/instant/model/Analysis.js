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
          const report = new Report(response.report);

          report.display();
          break;
      
        default:
          throw new Error(`Dareboost says: ${response.message}`);
          break;
      }
    } catch (e) {
      throw e;
    }
  }
}

module.exports = Analysis;
