class Analytics {
	static get events() {
		return {
			USER_JOINED: {
				key: 'USER_JOINED',
				title: 'User Joined',
				description: 'Occurs when a user joins the directory'
			},
			USER_LEFT: {
				key: 'USER_LEFT',
				title: 'User Left',
				description: 'Occurs when a user leaves the directory'
			},
			USER_REPORTED: {
				key: 'USER_REPORTED',
				title: 'User Reported',
				description: 'Occurs when a user is reported'
			},
			REPORT_RESOLVED: {
				key: 'REPORT_RESOLVED',
				title: 'Report Resolved',
				description: 'Occurs when a report is resolved'
			}
		};
	}

	static init() {
		for (const event in this.events) {
      const { key, title, description } = this.events[event];

			this.registerEvent(title, key, description, false);
		}
	}

	static registerEvent(title, key, description, silentNotification) {
		buildfire.analytics.registerEvent(
			{
				title,
				key,
				description
			},
			{
				silentNotification
      },
      console.error
		);
	}

	static trackAction(key, aggregationValue) {
		let metData = {};
		if (aggregationValue) {
			metData._buildfire = { aggregationValue };
		}
		buildfire.analytics.trackAction(key, metData);
	}
}
