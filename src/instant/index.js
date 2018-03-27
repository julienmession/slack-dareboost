const appRootDir = require('app-root-dir').get();
const config = require(appRootDir + '/dareboost.json');

const Analysis = require('./model/Analysis');

config.analysis.list.forEach((conf) => {
	new Analysis(conf);
});
