const colors = require('colors/safe');

class Report {
	constructor(report) {
		this.summary = report.summary;
		this.publicReportUrl = report.publicReportUrl;
	}

	display() {
		console.info(colors.green(`Analysis complete:`));
		console.log(colors.bgGreen(colors.black(`SCORE: ${this.summary.score}`)));
		console.log(colors.bgGreen(colors.black(`Load time: ${this.summary.loadTime/1000}s`)));
		console.log(colors.bgGreen(colors.black(`HTTP requests: ${this.summary.requestsCount}`)));
		console.log(colors.bgGreen(colors.black(`Page weight: ${this.summary.weight} bytes`)));

		console.log(colors.green(`More info at ${this.publicReportUrl}`));
		console.info("\n");
	}
}

module.exports = Report;
