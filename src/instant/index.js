var appRootDir = require('app-root-dir').get();
var config = require(appRootDir + '/dareboost.json');

const Analysis = require('./model/Analysis');

var analysis = new Analysis(config.url);

console.info(`Launching analysis for ${config.url}...`);
analysis.launch((body) => {
	analysis.reportId = body.reportId;
	console.info('Analysis launched.');
	analysis.waitForReport((report) => {
		console.info(`Analysis complete for ${config.url} :`);
		console.log(`SCORE: ${report.summary.score}`);
		console.log(`Load time: ${report.summary.loadTime/1000}s`);
		console.log(`HTTP requests : ${report.summary.requestsCount}`);
		console.log(`Page weight : ${report.summary.weight} bytes`);
		console.log(`More info at ${report.publicReportUrl}`);
	});
});
