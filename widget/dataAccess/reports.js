class Report {
	constructor(data = {}) {
		this.id = data.id;
		this.userId = data.userId;
		this.reports = data.reports || [];
		this.tag = '$$reports';
	}

	toJSON() {
		const { userId, reports } = this;
		return {
			userId,
			reports,
			_buildfire: {
				index: {
					string1: this.userId,
					array1: this.reports.map(report => report.reportedBy)
				}
			}
		};
	}

	addReport(reportedBy, reason, callback) {
		this.reports.push({
			id: this.getUUID(),
			reportedBy,
			reason,
			reportedOn: Date.now()
		});
		this.save(callback);

		Analytics.trackAction(Analytics.events.USER_REPORTED.key);
	}

	resolveReport(id, callback) {
		this.reports = this.reports.filter(report => report.id !== id);

		if (this.reports.length) {
			this.save(callback);
		} else {
			this.delete(callback);
		}

		Analytics.trackAction(Analytics.events.REPORT_RESOLVED.key);
	}

	getUUID() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
	}

	save(callback) {
		if (this.id) {
			buildfire.appData.update(this.id, this.toJSON(), this.tag, callback);
		} else {
			buildfire.appData.insert(this.toJSON(), this.tag, (error, result) => {
				if (error) return callback(error, null);

				this.id = result.id;
				callback(null, result);
			});
		}
	}

	delete(callback) {
		if (!this.id) return callback(null, { status: 'deleted' });

		buildfire.appData.delete(this.id, this.tag, callback);
	}
}

class Reports {
	static get tag() {
		return '$$reports';
	}

	static search(page, pageSize, callback) {
		const searchOptions = {
			page,
			pageSize,
			sort: { 'reports.length': 1 }
		};

		buildfire.appData.search(searchOptions, this.tag, callback);
	}

	static reportUser(userId, reportedBy, reason, callback = console.error) {
		if (!userId || !reportedBy || !reason) {
			return callback('Invalid parameters', null);
		}

		this.getByUserId(userId, (error, result) => {
			if (error) {
				return callback(error, null);
			}
			if (!result) {
				result = { data: {} };
			}

			result.data.id = result.id;
			result.data.userId = userId;

			const report = new Report(result.data);

			report.addReport(reportedBy, reason, callback);
		});
	}

	static resolveReport(userId, reportId, callback = console.error) {
		if (!userId || !reportId) {
			return callback('Invalid parameters', null);
		}

		this.getByUserId(userId, (error, result) => {
			if (!result || !result.id) {
				error = 'Could not locate user';
			}
			if (error) {
				return callback(error, null);
			}

			result.data.id = result.id;
			result.data.userId = userId;

			const report = new Report(result.data);

			report.resolveReport(reportId, callback);
		});
	}

	static getByUserId(userId, callback) {
		const searchOptions = {
			filter: {
				'_buildfire.index.string1': userId
			}
		};

		buildfire.appData.search(searchOptions, this.tag, (error, results) => {
			callback(error, (results || [])[0]);
		});
	}
}
