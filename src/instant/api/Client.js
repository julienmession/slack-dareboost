var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');
var request = require('then-request');

class Client {
	constructor(conf) {
		this.conf = {token: process.env.DAREBOOST_API_TOKEN};
	}
	
	async request(path, conf = {}) {
		try {
			return await request('POST', config.api_url + path, {json: Object.assign(conf, this.conf)})
				.getBody('utf8')
				.then(JSON.parse);
		} catch (e) {
			throw e;
		}
	}

	async launchAnalysis(conf) {
		conf = Object.assign(config.analysis.shared, conf);

		return this.request('analysis/launch', conf);
	}

	async getAnalysisReport(reportId) {
		return this.request('analysis/report', {reportId: reportId});
	}
}

module.exports = Client;
