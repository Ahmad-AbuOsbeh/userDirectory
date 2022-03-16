class Keys {
	static get userSubtitleShowModeKeys() {
		return {
			SHOW_EMAIL: {
				key: 'SHOW_EMAIL',
				title: 'Show Email'
      },
      SHOW_PHONE_NUMBER: {
				key: 'SHOW_PHONE_NUMBER',
				title: 'Show Phone Number'
      },
      HIDE: {
				key: 'HIDE',
				title: 'Hide Subtitle'
			}
		};
	}
	static get screenNameKeys() {
		return {
			LIST: {
				key: 'LIST',
				title: 'List'
			},
			MAP: {
				key: 'MAP',
				title: 'Map'
			},
			MAPLIST: {
				key: 'MAPLIST',
				title: 'List'
			}
		};
	}

	static get iconTypes() {
		return {
			IMG: {
				key: 'IMG',
				title: 'Image'
			},
			ICON: {
				key: 'ICON',
				title: 'Icon'
			},
		};
	};

	static get categoryTypes() {
		return {
			BIRTHDATE: {
				key: 'BIRTHDATE',
				title: 'DOB Filter'
			},
			MULTI: {
				key: 'MULTI',
				title: 'Multi-select filter'
			},
		};
	};

	static get sortByKeys() {
		return {
			MANUAL: {
				key: 'MANUAL',
				title: 'Manual'
			},
			NEWEST: {
				key: 'NEWEST',
				title: 'Newest'
			},
			OLDEST: {
				key: 'OLDEST',
				title: 'Oldest'
			},
		};
	};
}
