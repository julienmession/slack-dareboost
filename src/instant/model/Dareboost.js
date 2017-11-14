var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');
var request = require('request');

class Dareboost {
	static request(path, data, callback) {
		data.token = config.dareboost_token;
		request({
				uri: config.dareboost_api_url + path,
				method: 'POST',
				json: data,
		},
		(err, ret, body) => {
				if (err) {
						return callback(err, body);
				}
				return callback(false, body);
		});
	}
}

module.exports = Dareboost;
