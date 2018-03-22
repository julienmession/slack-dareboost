var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');
var request = require('sync-request');

class Dareboost {
	static request(path, data) {
		data.token = process.env.DAREBOOST_API_TOKEN;
		var response = request('POST', config.api_url + path, { json: data });

		return {
			status: response.statusCode,
			body: JSON.parse(response.body.toString('UTF-8')),
		};
	}
}

module.exports = Dareboost;
