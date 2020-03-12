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

		// const user = new User(userData);

		buildfire.appData.insert(userData, this.tag, (error, record) => {
			// buildfire.appData.insert(user.toJson(), this.tag, (error, record) => {
			if (error) return callback(error);

			callback(null, record);

			Lookup.add(userData, (error, result) => {
				if (error) return console.error('error adding user to lookup directory');
	
				console.log(result);
			});
		});
	}

	/**
	 * Updates a section
	 * @param {Object} data data of section to be updated
	 * @param {Function} callback callback for handling response
	 */
	static update(userData, callback) {
		// if (!userData.userId) return;
		// userData.lastUpdatedOn = new Date();
		// const user = new User(userData);

		const searchOptions = {
			// filter: {
				'_buildfire.index.string1': userData.userId
			// }
		};

		buildfire.appData.searchAndUpdate(searchOptions, userData, this.tag, callback);
	}

	/**
	 * Archives a section
	 * @param {Object} data data of member to be deleted
	 * @param {Function} callback callback for handling response
	 */
	static delete(userId, callback) {
		this.getByUserId(userId, (error, obj) => {
			buildfire.appData.delete(obj.id, this.tag, callback);
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

// class Users {

// 	static get searchEngine() {
// 		return window.buildfire.services.searchEngine;
// 	}

// 	static get appData() {
// 		return window.buildfire.appData;
// 	}

// 	static get TAG() {
// 		return 'users';
// 	}

// 	/**
// 	 * Returns sections
// 	 * @param {Function} callback callback for handling response
// 	 */
// 	static get(searchText = '', pageIndex = 0, pageSize, callback) {
// 		const searchOptions = {
// 			searchText,
// 			pageIndex,
// 			pageSize
// 		};
// 		this.searchEngine.search(searchOptions, (error, { hits }) => {
// 			if (error) return callback(error);
// 			// const records = hits.hits.map(({ _source }) => new User(_source.data));
// 			const records = hits.hits.map(({ _source }) => _source.data);
// 			return callback(null, records);
// 		});
// 	}

// 	/**
// 	 * Returns section with given id
// 	 * @param {String} id id of member to be retrieved
// 	 * @param {Function} callback callback for handling response
// 	 */
// 	static getById(id, callback) {
// 		this.searchEngine.getById(id, this.TAG, (error, record) => {
// 			if (error) return callback(error);

// 			return callback(null, new User(record));
// 		});
// 	}

// 	/**
// 	 * Adds a sections
// 	 * @param {Object} data data of section to be added
// 	 * @param {Function} callback callback for handling response
// 	 */
// 	static add(data, callback) {
// 		// data.createdBy = authManager.currentUser.email;
// 		data.createdOn = new Date();
// 		// data._buildfire.index = this.buildIndex(data);

// 		const obj = {
// 			tag: this.TAG,
// 			title: data.displayName,
// 			keywords: `${data.firstName}, ${data.lastName}`,
// 			data
// 		};

// 		this.searchEngine.insert(obj, (error, record) => {
// 			if (error) return callback(error);

// 			return callback(null, new User(record));
// 		});
// 	}

// 	/**
// 	 * Updates a section
// 	 * @param {Object} data data of section to be updated
// 	 * @param {Function} callback callback for handling response
// 	 */
// 	static set(data, callback) {
// 		data.lastUpdatedBy = authManager.currentUser.email;
// 		data.lastUpdatedOn = new Date();
// 		data._buildfire.index = this.buildIndex(data);

// 		this.searchEngine.update(data.id, data, this.TAG, (error, record) => {
// 			if (error) return callback(error);

// 			return callback(null, new User(record));
// 		});
// 	}

// 	/**
// 	 * Archives a section
// 	 * @param {Object} data data of member to be deleted
// 	 * @param {Function} callback callback for handling response
// 	 */
// 	static delete(data, callback) {
// 		data.deletedBy = authManager.currentUser.email;
// 		data.deletedOn = new Date();
// 		data.isActive = false;

// 		this.searchEngine.update(data.id, data, this.TAG, (error, record) => {
// 			if (error) return callback(error);

// 			return callback(null, new User(record));
// 		});
// 	}

// 	/**
// 	 * Builds index
// 	 * @param {Object} data data for which index will be built
// 	 */
// 	static buildIndex(data) {
// 		/**
//       * Example index
//       * const index = {
//         text: data.firstName + ' ' + data.lastName + ' ' + data.email,
//         string1: data.email
//        };
//       */
// 		const index = {};
// 		return index;
// 	}
// }
