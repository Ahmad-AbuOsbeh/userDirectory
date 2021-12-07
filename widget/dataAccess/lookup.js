class Entry {
	constructor(user) {
		this.tag = '$$userDirectory';
		
		const { userId, displayName, email, firstName, lastName } = user;

		this.key = userId;
		this.title = displayName || email;
		this.description = email;
		this.keywords = `${firstName}, ${lastName}, ${displayName}, ${email}`;
		this.imageUrl = buildfire.auth.getUserPictureUrl({ userId });
		this.data = { userId };

		const { appId, pluginId, instanceId } = buildfire.getContext();

		this.id = `${appId}_${pluginId}_${instanceId}_${this.tag}_${userId}`;
	}
}

class Lookup {
	static get tag() {
		return '$$userDirectory';
	}

	/**
	 * Returns sections
	 * @param {Function} callback callback for handling response
	 */
	static search(options, callback) {
		const { searchText, pageIndex, pageSize } = options;
		const searchOptions = {
			searchText,
			pageIndex,
			pageSize,
			tag: this.tag
		};

		buildfire.services.searchEngine.search(searchOptions, (error, result) => {
			if (error) return callback(error, null);

			const userIds = result.hits.hits.map(hit => hit._source.data.userId);
			callback(null, userIds);
		});
	}

	/**
	 * Adds a sections
	 * @param {Object} data data of section to be added
	 * @param {Function} callback callback for handling response
	 */
	static add(userData, callback) {
		const entry = new Entry(userData);

		buildfire.services.searchEngine.save(entry, callback);
	}

	/**
	 * Updates a section
	 * @param {Object} data data of section to be updated
	 * @param {Function} callback callback for handling response
	 */
	static update(userData, callback) {

		const entry = new Entry(userData);
		buildfire.services.searchEngine.update(entry, callback);
	}

	/**
	 * Archives a section
	 * @param {Object} data data of member to be deleted
	 * @param {Function} callback callback for handling response
	 */
	static delete(userData, callback) {
		const entry = new Entry(userData);

		buildfire.services.searchEngine.delete(entry.id, callback);
	}

	static _clear() {
		const searchOptions = {
			searchText: '',
			tag: this.tag
		};

		buildfire.services.searchEngine.search(searchOptions, (e, result) => {
			result.hits.hits.forEach(hit => buildfire.services.searchEngine.delete({ id: hit._id, tag: this.tag }), console.error);
		});
	}
}
