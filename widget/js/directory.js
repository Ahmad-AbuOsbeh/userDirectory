/**
 * @class Directory
 * Manages directory data
 */

class Directory {
	constructor(user, settings) {
		this.user = user ? new DirectoryUser(user) : null;
		this.settings = settings;
		this.badges = null;
		this.Favorites = null;

		this.favoritesList = null;
		this.filterFavorites = false;

		if (!this.user) return;

		if (!this.isService && typeof Favorites !== 'undefined') {
			this.Favorites = new Favorites(this.user);
			this.Favorites.get((error, favorites) => {
				if (error) return console.log(error);

				this.favoritesList = favorites;
			});
		}
	}

	addFavorite(userData, callback) {
		if (!this.user) return buildfire.auth.login({});
		if (typeof userData === 'string') {
			const userId = userData;
			userData = { userId };
		}

		this.Favorites.add(userData, (error, result) => {
			if (error) return callback(error);

			if (result.nModified && result.status === 'updated') {
				this.favoritesList.push(userData.userId);
			}

			callback(null, this.favoritesList);
		});
	}

	removeFavorite(userData, callback) {
		if (!this.user) return buildfire.auth.login({});

		this.Favorites.delete(userData, (error, result) => {
			if (error) return callback(error);

			if (result.nModified && result.status === 'updated') {
				this.favoritesList = this.favoritesList.filter(userId => userId !== userData.userId);
			}

			callback(null, this.favoritesList);
		});
	}

	getFavorites(callback) {
		if (!this.user) {
			return callback(null, []);
		}
		if (this.favoritesList && this.favoritesList.length) {
			return callback(null, this.favoritesList);
		}
		if (this.user && !this.isService && typeof Favorites !== 'undefined') {
			this.Favorites = new Favorites(this.user);
			this.Favorites.get((error, favorites) => {
				if (error) return callback(error, null);

				this.favoritesList = favorites;
				callback(null, this.favoritesList);
			});
		}
	}

	getBadges(callback) {
		if (this.badges && this.badges.length) {
			return callback(null, this.badges);
		}
		Badges.get((error, badges) => {
			if (error) return callback(error, null);

			this.badges = badges;
			callback(null, this.badges);
		});
	}

	search(searchText, pageIndex, pageSize, callback) {
		let userIds = null;

		const _search = () => {
			this.getFavorites(() => {
				this.getBadges(() => {
					Users.search({ userIds, pageIndex, pageSize }, (error, results) => {
						if (error) return callback(error, null);

						results = results.map(result => {
							if (this.user) {
								result.data.isFavorite = this.favoritesList.indexOf(result.data.userId) > -1;
							}
							if (result.data.badges.length) {
								const badges = [];
								result.data.badges = result.data.badges.map(badge => {
									// return({ ...badge, ...this.badges.find(b => b.id === badge.id) });
									const b = this.badges.find(b => b.id === badge.id);
									b.earned = badge.earned;
									return b;
								});
							}
							if (this.user && result.data.userId === this.user.userId) {
								return result;
							}
							result.data.action = {
								icon: result.data.isFavorite ? 'icon icon-star btn-primary' : 'icon icon-star-empty'
								// handler: item => {
								// if (item.isFavorite) {
								// 	return this.removeFavorite(item.data, (error, result) => {
								// 		if (!error) {
								// 			item.isFavorite = false;
								// 			item.action.icon = 'icon icon-star-empty';
								// 			item.update();
								// 		}
								// 	});
								// }
								// if (!item.isFavorite) {
								// 	return this.addFavorite(item.data, (error, result) => {
								// 		if (!error) {
								// 			item.isFavorite = true;
								// 			item.action.icon = 'icon icon-star';
								// 			item.update();
								// 		}
								// 	});
								// }
								// }
							};
							return result;
						});

						callback(null, results);
					});
				});
			});
		};

		if (searchText) {
			return Lookup.search({ searchText, pageIndex, pageSize }, (error, ids) => {
				userIds = ids;

				if (this.filterFavorites) {
					userIds = userIds.filter(id => this.favoritesList.indexOf(id) > -1);
				}

				_search();
			});
		}

		if (this.filterFavorites) {
			userIds = this.favoritesList;

			return _search();
		}

		_search();
	}

	addUser(callback) {
		if (!this.user) return;

		buildfire.notifications.pushNotification.subscribe({ groupName: '$$userDirectory' }, console.log);

		Users.add(this.user.toJson(), callback);
	}

	checkUser(callback) {
		if (!this.user) return;

		Users.getByUserId(this.user.userId, (error, result) => {
			if (error) return callback(error, false);

			callback(null, result);
		});
	}

	updateUser(userObj) {
		if (!this.user) return;

		buildfire.auth.getCurrentUser((error, user) => {
			if (error) return console.error(error);

			Badges.computeUserBadges(user, (err, badgeIds) => {
				if (err) return console.error(err);
				let hasUpdate = false;
				this.user.badges = userObj.data.badges.filter(b => badgeIds.indexOf(b.id) > -1);
				if (this.user.badges.length !== userObj.data.badges.length) {
					hasUpdate = true;
				}

				const newBadges = [];

				badgeIds.forEach(badgeId => {
					if (!userObj.data.badges.some(badge => badge.id === badgeId)) {
						const newBadge = {
							id: badgeId,
							earned: Date.now()
						};

						this.user.badges.push(newBadge);
						newBadges.push(newBadge);
						hasUpdate = true;
					}
				});

				const updateQueue = ['displayName', 'email', 'firstName', 'lastName'];

				updateQueue.forEach(key => {
					if (this.user[key] !== user[key]) {
						this.user[key] = user[key];
						hasUpdate = true;
					}
				});

				if (newBadges.length && this.settings.badgePushNotifications) {
					this.getBadges(() => {
						this.sendNewBadgePN(userObj, newBadges[0]);
					});
				}
				if (!hasUpdate) return;

				Users.update(this.user.toJson(), console.error);
				Lookup.update(this.user.toJson(), console.error);
			});
		});
	}

	sendNewBadgePN(user, newBadge) {
		const { email, displayName, userId } = user.data;
		const badge = this.badges.find(badge => badge.id === newBadge.id);

		const imgUrl = buildfire.auth.getUserPictureUrl({ email });
		const inAppMessage = `
			<div class="center-content">
				<div class="avatar">
					<img src="${imgUrl}" alt="">
				</div>
				<p>${displayName}</p>
				<h4 class="title text-center">Received a New Badge!</h4>
				<div class="badge-user">
					<img src="${badge.imageUrl}" alt="">
				</div>
				<p class="caption">${badge.name}</p>
			</div>
			<style> 
				.center-content{
						display: flex;
						flex-direction: column;
						align-items: center;
						padding: 1rem 0;
					}
					.center-content.active-user .badge-user,
					.center-content.active-user .badge-user img{
						width: 5rem;
						height: 5rem;
					}
					.center-content.active-user .badge-user{
						margin: 1rem;
					}
					.badge-user{
						width: 3rem;
						height: 3rem;
						border-radius: .5rem;
						overflow: hidden;
					}
					.center-content .badge-user{
						margin: .5rem;
					}
					.badge-user img{
						width: 3rem;
						height: 3rem;
						border-radius: .5rem;
						overflow: hidden;
						object-fit: cover;
					}
					.center-content .avatar{
						margin: .5rem;
					}
					.center-content .avatar,
					.center-content .avatar img{
						width: 4.5rem;
						height: 4.5rem;
						overflow: hidden;
						border-radius: 50%;
						margin-bottom: .75rem;
					}
					.center-content .avatar img{
						object-fit: cover;
					}
			</style>
		`;

		const options = {
			title: `${displayName} has earned a new badge!`,
			text: `${displayName} has earned a new badge!`,
			inAppMessage,
			groupName: '$$userDirectory',
			queryString: userId
		};

		buildfire.notifications.pushNotification.schedule(options, console.error);
	}

	removeUser(callback) {
		if (!this.user) return;

		buildfire.notifications.pushNotification.unsubscribe({ groupName: '$$userDirectory' }, console.log);

		Users.delete(this.user.userId, callback);
	}

	_clear() {
		Lookup._clear();
		Users._clear();
	}

	_insertDummyData() {
		const users = dummyData.getRandomNames(users => {
			users.forEach(user => {
				Users.add(new DirectoryUser(user).toJson(), console.error);
			});
		});
	}
}
