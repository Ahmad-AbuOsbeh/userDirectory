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

// class Report {
// 	constructor(data = {}) {
// 		this.id = data.id;
// 		this.type = data.type;
// 		this.target = data.target;
// 		this.reportedBy = data.reportedBy || [];
// 		this.createdOn = data.createdOn || null;
// 		this.createdBy = data.createdBy || null;
// 	}

// 	static getReports(filter, limit, sort) {
// 		let db = buildfire.publicData;

// 		return new Promise((resolve, reject) => {
// 			db.search(
// 				{
// 					filter,
// 					skip: 0,
// 					limit,
// 					sort
// 				},
// 				'reports',
// 				function(err, result) {
// 					if (err) {
// 						reject(err);
// 					} else {
// 						resolve(result);
// 					}
// 				}
// 			);
// 		});
// 	}

// 	getRowData() {
// 		return {
// 			type: this.type,
// 			reportedBy: this.reportedBy,
// 			target: this.target,
// 			createdOn: this.createdOn,
// 			createdBy: this.createdBy,
// 			_buildfire: {
// 				index: {
// 					text: this.title,
// 					array1: this.reportedBy
// 				}
// 			}
// 		};
// 	}

// 	save() {
// 		const report = this.getRowData();
// 		report.createdOn = new Date();

// 		return new Promise((resolve, reject) => {
// 			buildfire.publicData.insert(report, 'reports', (err, result) => {
// 				if (err) {
// 					reject(err);
// 				} else {
// 					// Analytics.trackAction(Analytics.events.TOPIC_CRETAED);
// 					resolve(result);
// 				}
// 			});
// 		});
// 	}

// 	update() {
// 		return new Promise((resolve, reject) => {
// 			// let topic = await this.getById(privacy, this.id);
// 			// if (topic && Object.keys(topic.data).length === 0) {
// 			//   resolve({
// 			//     code: "NOTFOUND",
// 			//     message: "Entry not found",
// 			//     ...topic
// 			//   })
// 			//   return;
// 			// }
// 			const report = this.getRowData();
// 			report.lastUpdatedOn = new Date();

// 			buildfire.publicData.update(this.id, topic, 'reports', (err, result) => {
// 				if (err) {
// 					reject(err);
// 				} else {
// 					resolve(result);
// 				}
// 			});
// 		});
// 	}

// 	report(userId, reason) {
// 		const report = {
// 			userId,
// 			reason,
// 			createdOn: new Date()
// 		};

// 		if (this && this.reportedBy) {
// 			this.reportedBy.push(report);
// 		}
// 		// Analytics.trackAction(Analytics.events.TOPIC_REPORTED);
// 		return this.update(privacy);
// 	}

// 	// delete() {
// 	// 	// let db = this.getDatasource(privacy);

// 	// 	return new Promise((resolve, reject) => {
// 	// 		if (!this.id) {
// 	// 			reject({
// 	// 				error: 'Missed Parameters',
// 	// 				message: 'You missed id parameter'
// 	// 			});
// 	// 		}

// 	// 		// let topic = await this.getById(privacy, this.id);
// 	// 		// if (topic && Object.keys(topic.data).length === 0) {
// 	// 		//   resolve({
// 	// 		//     code: "NOTFOUND",
// 	// 		//     message: "Entry not found",
// 	// 		//     ...topic
// 	// 		//   })
// 	// 		//   return;
// 	// 		// }

// 	// 		// if (privacy === 'public') {
// 	// 		// 	const filter = {
// 	// 		// 		'$json.parentTopicId': this.id
// 	// 		// 	};
// 	// 			const reports = await Reports.getReports(filter, 1);
// 	// 			if (reports && reports.length > 0) {
// 	// 				reject({
// 	// 					error: 'Unauthorized',
// 	// 					message: this.title + 'is not empty'
// 	// 				});
// 	// 			}
// 	// 		// }
// 	// 		// db.delete(this.id, "reports", (err, result) => {
// 	// 		//   if (err) {
// 	// 		//     reject(err);
// 	// 		//   } else {
// 	// 		//     Analytics.trackAction(Analytics.events.TOPIC_DELETED);
// 	// 		//     resolve(result);
// 	// 		//   }
// 	// 		// });
// 	// 		this.deletedOn = new Date();
// 	// 		this.update(privacy)
// 	// 			.then(result => {
// 	// 				Analytics.trackAction(Analytics.events.TOPIC_DELETED);
// 	// 				resolve(result);
// 	// 			})
// 	// 			.catch(err => {
// 	// 				reject(err);
// 	// 			});
// 	// 	});
// 	// }

// 	getById(reportId) {
// 		return new Promise((resolve, reject) => {
// 			buildfire.publicData.getById(reportId, 'reports', function(err, result) {
// 				if (err) {
// 					reject(err);
// 				} else {
// 					resolve(result);
// 				}
// 			});
// 		});
// 	}

// 	getDatasource(privacy) {
// 		let db = buildfire.publicData;
// 		if (privacy === 'private') {
// 			db = buildfire.userData;
// 		}
// 		return db;
// 	}
// }
