var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');
var request = require('then-request');

/**
 * Dareboost API client.
 * Every method calls the related API endpoint, and send back the response
 * @see https://www.dareboost.com/en/documentation-api
 */
class Client {
	constructor() {
		this.conf = {token: process.env.DAREBOOST_API_TOKEN};
	}
	
	/**
	 * Unique method that does the call to the API.
	 * Every other method from this class must call it to ensure that the call and the response are properly handled.
	 * /!\ Do not call this method directly
	 * @param {string} path API endpoint relative path
	 * @param {object} conf API endpoint settings
	 */
	async request(path, conf = {}) {
		try {
			return await request('POST', config.api_url + path, {json: Object.assign(conf, this.conf)})
				.getBody('utf8')
				.then(JSON.parse);
		} catch (e) {
			throw e;
		}
	}

	/**
	 * Analyse a page
	 * @see https://www.dareboost.com/en/documentation-api#analyse
	 * @param {object} conf 
	 */
	async launchAnalysis(conf) {
		conf = Object.assign(config.analysis.shared, conf);

		return this.request('analysis/launch', conf);
	}

	/**
	 * @see https://www.dareboost.com/en/documentation-api#result
	 * @param {string} reportId 
	 */
	async getAnalysisReport(reportId) {
		return this.request('analysis/report', {reportId: reportId});
	}
}

module.exports = Client;
