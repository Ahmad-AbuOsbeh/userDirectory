class Badge {
	constructor(data = {}) {
		this.id = data.id || this.getUUID();
		this.name = data.name;
		this.tag = data.tag;
		this.tagCount = data.tagCount;
		this.rank = data.rank || 0;
		this.imageUrl = data.imageUrl;
	}

	getUUID() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
	}

	toJson() {
		return {
			id: this.id,
			name: this.name,
			tag: this.tag,
			tagCount: this.tagCount,
			rank: this.rank,
			imageUrl: this.imageUrl,
			_buildfire: {
				index: {
					string1: this.id,
					array1: this.tag,
					text: this.name
				}
			}
		};
	}
}

class Badges {
	static get tag() {
		return '$$badges';
	}

	static get(callback) {
		var searchOptions = {
			sort: { rank: 1 }
		};

		buildfire.appData.search(searchOptions, this.tag, (error, results) => {
			if (error) return callback(error, null);

			callback(null, results.map(result => result.data));
		});
	}

	static add(badgeData, callback) {

		const badge = new Badge(badgeData);

		buildfire.appData.insert(badge.toJson(), this.tag, (error, record) => {
			if (error) return callback(error);

			callback(null, record);
		});
	}

	static getByBadgeId(badgeId, callback) {
		const searchOptions = {
			filter: {
				'_buildfire.index.string1': badgeId
			}
		};

		buildfire.appData.search(searchOptions, this.tag, (error, results) => {
			callback(error, (results || [])[0]);
		});
	}

	static delete(badgeId, callback) {
		this.getByBadgeId(badgeId, (error, obj) => {
			buildfire.appData.delete(obj.id, this.tag, callback);
		});
	}

	static update(badgeData, callback) {

		const badge = new Badge(badgeData);

		const searchOptions = {
			// filter: {
				'_buildfire.index.string1': badge.id
			// }
		};

		buildfire.appData.searchAndUpdate(searchOptions, badge.toJson(), this.tag, callback);
	}

	static computeUserBadges(user, callback) {
		const { appId } = buildfire.getContext();
		const userTags = user.tags ? user.tags[appId] : [];

		this.get((e, badges) => {
			if (e) return callback(e, null);

			const userBadges = [];

			badges.forEach(badge => {
				const match = userTags.find(userTag => {
					const hasTag = userTag.tagName === badge.tag;

					return hasTag && userTag.appliedCount >= badge.tagCount;
				});

				if (match) {
					userBadges.push(badge.id);
				}
			});

			callback(null, userBadges);
		});
	}
}
