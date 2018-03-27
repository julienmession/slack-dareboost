const colors = require('colors/safe');

const ApiClient = require('./../api/Client');
const Report = require('./Report');

const MAX_TRIES = 20;
const TIME_BETWEEN_TRIES = 5000;

/**
 * Analysis is a succession of API calls in order to retrieve the analysis report of a page.
 * This calls start when a new instance of this class is created.
 */
class Analysis {
  constructor(conf) {
    this.apiClient = new ApiClient();

    try {
      this.start(conf);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Starts an analysis, then request the report
   * @param {object} conf 
   */
  async start(conf) {
    try {
      console.info(colors.bgCyan(`Starting analysis for ${conf.url}…`));

      const response = await this.apiClient.launchAnalysis(conf);

      if (!response.reportId) {
        throw new Error(`Dareboost says: ${response.message}"`)
      }

      this.requestReport(response.reportId);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Try to get the analysis report.
   * Do several tries, until:
   * - an error occurs
   * - the maximum number of allowed tries is reached
   * - the report has been successfully retrieved
   * @param {string} reportId 
   * @param {number} triesQty Number of consecutive tries
   */
  async requestReport(reportId, triesQty = 1) {
    if (triesQty > MAX_TRIES) {
      throw new Error('Timeout for report request.');
    }
    
    console.log(`Retrieving the analysis report (try #${triesQty})…`);

    try {
      const response = await this.apiClient.getAnalysisReport(reportId);

      /** @see https://www.dareboost.com/en/documentation-api#response */
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
