var request = require('request');

class Dareboost {
	static request(path, data, callback) {
		data.token = process.env.DAREBOOST_TOKEN;
		request({
				uri: process.env.DAREBOOST_API_URL + path,
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
