class Badges {
	static get tag() {
		return '$$badges';
	}

	static get(callback) {
		buildfire.appData.get(this.tag, (error, result) => {
			if (!result.id) return this.init(callback);
			if (error) return callback(error, null);

			// buildfire.appData.delete(result.id, this.tag, console.error);
			callback(null, result.data.badges);
		});
	}

	static init(callback) {
		const obj = {
			badges: [
				{
					id: this.getUUID(),
					tag: 'admin',
					tagCount: 5,
					name: 'Super Admin',
					imageUrl: 'https://via.placeholder.com/150'
				}
			],
			_buildfire: {
				index: {
					string1: '$$badges'
				}
			}
		};
		buildfire.appData.save(obj, this.tag, callback);
	}

	static add(badge, callback) {
		const search = {
			'_buildfire.index.string1': '$$badges'
		};

		badge.id = this.getUUID();

		const update = {
			$push: {
				badges: badge
			}
		};

		buildfire.appData.searchAndUpdate(search, update, this.tag, callback);
	}

	static delete(badge, callback) {
		const search = {
			'_buildfire.index.string1': '$$badges'
		};

		const update = {
			$pull: {
				badges: badge
			}
		};

		buildfire.appData.searchAndUpdate(search, update, this.tag, callback);
	}

	static computeUserBadges(user, callback) {
		const { appId } = buildfire.getContext();

		const userTags = user.tags[appId];

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

	static getUUID() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
	}
}

