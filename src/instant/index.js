// read params in .env file
require('dotenv').config();

const Analysis = require('./model/Analysis');

var url = 'http://www.google.com';
var analysis = new Analysis(url);

console.info(`Launching analysis for ${url}...`);
analysis.launch((body) => {
	analysis.reportId = body.reportId;
	console.info('Analysis launched.');
	analysis.waitForReport((report) => {
		console.info(`Analysis complete for ${url} :`);
		console.log(`SCORE: ${report.summary.score}`);
		console.log(`Load time: ${report.summary.loadTime/1000}s`);
		console.log(`HTTP requests : ${report.summary.requestsCount}`);
		console.log(`Page weight : ${report.summary.weight} bytes`);
		console.log(`More info at ${report.publicReportUrl}`);
	});
});
