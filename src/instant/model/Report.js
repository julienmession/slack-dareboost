class Report {
	constructor(analysis, reportId, report) {
		this.analysis = analysis;
		this.reportId = reportId;
		this.summary = report.summary;
		this.publicReportUrl = report.publicReportUrl;
	}
}

module.exports = Report;
