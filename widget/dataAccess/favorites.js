class Favorites {
	constructor(user) {
		if (!user) throw new Error('no user provided to favorites');
		this.user = user;
		this.tag = '$$favorites';
	}

	/**
	 * Returns sections
	 * @param {Function} callback callback for handling response
	 */
	get(callback) {
		// if (!this.checkUser()) return;

		const options = {
			filter: {
				'_buildfire.index.string1': this.user.userId
			}
		};
		buildfire.appData.search(options, this.tag, (error, results) => {
			if (error) return callback(error, null);

			if (!results || !results.length) {
				const obj = {
					favorites: [],
					userId: this.user.userId,
					_buildfire: {
						index: {
							string1: this.user.userId
						}
					}
				};
				buildfire.appData.insert(obj, this.tag, (error, results) => {
					if (error) return callback(error, null);
					const favorites = results[0] && results[0].data ? results[0].data.favorites : [];

					callback(null, favorites);
				});
			} else {
				callback(error, results[0].data.favorites);
			}
		});
	}

	/**
	 * Adds a sections
	 * @param {Object} data data of section to be added
	 * @param {Function} callback callback for handling response
	 */
	add(targetUser, callback) {
		// if (!this.checkUser()) return;

		const options = {
			'_buildfire.index.string1': this.user.userId
		};

		const update = {
			$push: {
				favorites: targetUser.userId
			}
		};

		buildfire.appData.searchAndUpdate(options, update, this.tag, callback);
	}

	/**
	 * Archives a section
	 * @param {Object} data data of member to be deleted
	 * @param {Function} callback callback for handling response
	 */
	delete(targetUser, callback) {
		// if (!this.checkUser()) return;

		const options = {
			'_buildfire.index.string1': this.user.userId
		};

		const update = {
			$pull: {
				favorites: targetUser.userId
			}
		};

		buildfire.appData.searchAndUpdate(options, update, this.tag, callback);
	}
}
