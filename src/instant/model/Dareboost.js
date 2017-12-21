var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');
var request = require('sync-request');

class Dareboost {
	static request(path, data) {
		data.token = config.dareboost_api_token;
		var response = request('POST', config.dareboost_api_url + path, { json: data });

		return {
			status: response.statusCode,
			body: JSON.parse(response.body.toString('UTF-8')),
		};
	}
}

module.exports = Dareboost;
