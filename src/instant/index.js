const appRootDir = require('app-root-dir').get();
const colors = require('colors/safe');
const config = require(appRootDir + '/dareboost.json');

const Analysis = require('./model/Analysis');

config.analysis.list.forEach((conf) => {
	console.info(colors.bgCyan(`Starting analysis for ${conf.url}...`));

	new Analysis(conf);
});
