class Users {
	static get tag() {
		return '$$userDirectory';
	}

	/**
	 * Returns sections
	 * @param {Function} callback callback for handling response
	 */
	static search(options, callback) {
		const { userIds, pageIndex, pageSize } = options;

		var searchOptions = {
			sort: { firstName: 1, lastName: 1 },
			page: pageIndex,
			pageSize
		};

		if (userIds) {
			searchOptions.filter = {
				'_buildfire.index.string1': { $in: userIds }
			};
		}

		buildfire.appData.search(searchOptions, this.tag, callback);
	}

	/**
	 * Returns section with given id
	 * @param {String} id id of member to be retrieved
	 * @param {Function} callback callback for handling response
	 */
	static getByUserId(userId, callback) {
		const searchOptions = {
			filter: {
				'$json.userId': {
					$eq: userId
				},
				'_buildfire.index.string1': userId
			}
		};

		buildfire.appData.search(searchOptions, this.tag, (error, results) => {
			callback(error, (results || [])[0]);
		});
	}

	/**
	 * Adds a sections
	 * @param {Object} data data of section to be added
	 * @param {Function} callback callback for handling response
	 */
	static add(userData, callback) {
		this.getByUserId(userData.userId, (err, userObj) => {
			if (!err && userObj) return console.error(userObj);

			buildfire.appData.insert(userData, this.tag, (error, record) => {
				if (error) return callback(error);

				callback(null, record);

				Lookup.add(userData, error => {
					if (error) return console.error('error adding user to lookup directory');

					Analytics.trackAction(Analytics.events.USER_JOINED.key);
				});
			});
		});
	}

	/**
	 * Updates a section
	 * @param {Object} data data of section to be updated
	 * @param {Function} callback callback for handling response
	 */
	static update(userData, callback) {
		console.error('UPDATING USER:', userData);
		const searchOptions = {
			'$json.userId': {
				$eq: userData.userId
			},
			'_buildfire.index.string1': userData.userId
		};

		buildfire.appData.searchAndUpdate(searchOptions, userData, this.tag, (error, result) => {
			console.error(error, result);
			callback(error, result);
		});
	}

	/**
	 * Archives a section
	 * @param {Object} data data of member to be deleted
	 * @param {Function} callback callback for handling response
	 */
	static delete(userId, callback) {
		this.getByUserId(userId, (error, obj) => {
			buildfire.appData.delete(obj.id, this.tag, callback);

			Analytics.trackAction(Analytics.events.USER_LEFT.key);
		});
	}

	/**
	 * Builds index
	 * @param {Object} data data for which index will be built
	 */
	static buildIndex(data) {
		/**
      * Example index 
      * const index = {
        text: data.firstName + ' ' + data.lastName + ' ' + data.email,
        string1: data.email
       };
      */
		const index = {};
		return index;
	}

	static _clear() {
		this.search({}, (e, users) => {
			users.forEach(usr => buildfire.appData.delete(usr.id, this.tag, console.error));
		});
	}
}
