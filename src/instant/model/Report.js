const colors = require('colors/safe');

/**
 * Represent a report object
 */
class Report {
	constructor(report) {
		this.report = report;
	}

	/**
	 * Displays the report information using the console
	 */
	display() {
		console.info(colors.green(`Analysis complete:`));
		console.log(colors.bgGreen(colors.black(`SCORE: ${this.report.summary.score}`)));
		console.log(colors.bgGreen(colors.black(`Load time: ${this.report.summary.loadTime/1000}s`)));
		console.log(colors.bgGreen(colors.black(`HTTP requests: ${this.report.summary.requestsCount}`)));
		console.log(colors.bgGreen(colors.black(`Page weight: ${this.report.summary.weight} bytes`)));

		console.log(colors.green(`More info at ${this.report.publicReportUrl}`));
		console.info("\n");
	}
}

module.exports = Report;
