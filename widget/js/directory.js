/**
 * @class Directory
 * Manages directory data
 */

class Directory {
	constructor(user, strings, settings) {
		this.user = user ? new DirectoryUser(user) : null;
		this.strings = strings;
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
				buildfire.components.toast.showToastMessage({ text: this.strings.get('infoMessages.added') });
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
				buildfire.components.toast.showToastMessage({ text: this.strings.get('infoMessages.removed') });
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
		// if (this.badges && this.badges.length) {
		// 	return callback(null, this.badges);
		// }
		Badges.get((error, badges) => {
			if (error) return callback(error, null);

			this.badges = badges;
			callback(null, this.badges);
		});
	}

	search(searchText, pageIndex, pageSize, callback) {
		let userIds = null;
		// this.badges = [];
		const _search = () => {
			this.getFavorites(() => {
				this.getBadges((err, badges) => {
					if (err) console.error(err);

					const { ranking } = this.settings;
					Users.search({ userIds, pageIndex, pageSize, ranking }, (error, results) => {
						if (error) return callback(error, null);

						results = results.map(result => {
							if (this.user) {
								result.data.isFavorite = this.favoritesList.indexOf(result.data.userId) > -1;
							}
							if (result.data.badges.length) {
								if (!this.badges.length) {
									debugger;
								}
								result.data.badges = result.data.badges.filter(badge => {
									return this.badges.find(b => b.id === badge.id);
								});
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
								icon: result.data.isFavorite ? 'icon glyphicon glyphicon-star btn-primary' : 'icon glyphicon glyphicon-star-empty'
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

		buildfire.components.toast.showToastMessage({ text: 'Joined Directory' });

		Users.add(this.user.toJson(), callback);
	}

	checkUser(callback) {
		if (!this.user) return;

		Users.getByUserId(this.user.userId, (error, result) => {
			if (error) return callback(error, false);

			callback(null, result);
		});
	}

	updateUser(userObj, onUpdate) {
		if (!this.user) return;

		buildfire.auth.getCurrentUser((error, user) => {
			if (error) return console.error(error);

			Badges.computeUserBadges(user, (err, badgeIds) => {
				if (err) return console.error(err);

				// this.badges = [];

				this.getBadges(() => {
					let hasUpdate = false;

					this.user.badges = userObj.data.badges.filter(b => badgeIds.indexOf(b.id) > -1);

					if (this.user.badges.length !== userObj.data.badges.length) {
						hasUpdate = true;
					} else {
						this.user.badges = this.user.badges.filter(b => {
							const match = this.badges.find(badge => badge.id === b.id);
							
							if (!match) hasUpdate = true;

							return this.badges.find(badge => badge.id === b.id);
						});
					}

					let newBadges = [];

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

					if (this.user.userId !== user._id) {
						return;
					}

					updateQueue.forEach(key => {
						if (userObj.data[key] !== user[key]) {
							this.user[key] = user[key];
							hasUpdate = true;
						}
					});

					const { appId } = buildfire.getContext();
					const userTags = user.tags && user.tags[appId] ? user.tags[appId] : [];

					if (userTags.length !== userObj.data.tags.length) {
						this.user.tags = userTags;
						hasUpdate = true;
					} else if (userTags.length) {
						userTags.forEach(tag => {
							if (!userObj.data.tags.some(t => t.tagName === tag.tagName)) {
								this.user.tags = userTags;
								hasUpdate = true;
							}
						});
					}

					if (!hasUpdate) return;

					Users.update(this.user.toJson(), (e, res) => {
						if (e) {
							return buildfire.components.toast.showToastMessage({ text: 'user not updated' });
						}
						if (res && res.status === 'updated' && res.nModified === 1) {
							if (newBadges.length) {

								const badges = newBadges.map(badge => {
									const b = this.badges.find(b => b.id === badge.id);
									b.earned = badge.earned;
									return b;
								});
								if (this.settings.badgePushNotifications) {
									this.sendNewBadgePN(userObj, badges);
								}
		
								const richContent = `
								<div class="center-content active-user">
								<h4 class="title text-center">New Badge${badges.length > 1 ? 's' : ''} Received!</h4>
								${badges.length > 1 ? this.renderMultipleBadges(badges) : renderSingleBadge(badges[0])}
								</div>
								${this.getModalStyles()}
								`;
		
								buildfire.components.popup.display({ richContent }, console.error);
							}
						}
						if (onUpdate) onUpdate(this.user);
					});
					Lookup.update(this.user.toJson(), console.log);
				});

				function renderSingleBadge(badge) {
					const { name, imageUrl } = badge;
					return `
						<div class="badge-user">
							<img src="${imageUrl}" alt="">
						</div>
						<p>${name}</p>

					`;
				}
			});
		});
	}

	sendNewBadgePN(user, badges) {
		const { email, displayName, userId } = user.data;

		const { instanceId } = buildfire.getContext();
		const imgUrl = buildfire.auth.getUserPictureUrl({ email });
		const inAppMessage = `
			<div class="center-content">
				<div class="avatar">
					<img src="${imgUrl}" alt="">
				</div>
				<p>${displayName}</p>

				<h4 class="title text-center">
					${badges.length > 1 ? 'Received New Badges!' : 'Received a New Badge!'}
				</h4>
	
				${
					badges.length > 1
						? this.renderMultipleBadges(badges)
						: `<div class="badge-user">
						<img src="${badges[0].imageUrl}" alt="">
					</div>
					<p class="caption">${badges[0].name}</p>`
				}
			</div>
			${this.getModalStyles()}
		`;

		const options = {
			title: `${displayName || email} has earned ${badges.length > 1 ? 'new badges!' : 'a new badge!'}`,
			text: `${displayName || email} has earned ${badges.length > 1 ? 'new badges!' : 'a new badge!'}`,
			inAppMessage,
			groupName: '$$userDirectory',
			queryString: userId,
			actionItem: {
				action: 'linkToApp',
				instanceId
			}
		};

		// date format!!!
		// PN exclude user

		buildfire.notifications.pushNotification.schedule(options, (e, d) => {
			if (e) console.error(e, options, d);
		});
	}

	renderMultipleBadges(badges) {
		return `
			<div class="badges-grid">
			${badges
				.map(badge => {
					return `
					<div class="grid-item">
						<div class="user-badge">
							<img src="${badge.imageUrl}" alt="">
							<!-- <span class="badge-count successBackgroundTheme">999</span> -->
						</div>
						<h5>${badge.name}</h5>
						<!-- <p class="caption">${new Date(badge.earned).toLocaleDateString()}</p> -->
					</div>
				`;
				})
				.join(' ')}
			</div>
		`;
	}

	getModalStyles() {
		return `
			<style> 
				.center-content{
						font-size: 16px;
						display: flex;
						flex-direction: column;
						align-items: center;
						padding: 1em 0;
					}
					.center-content.active-user .badge-user,
					.center-content.active-user .badge-user img{
						width: 5em;
						height: 5em;
					}
					.center-content.active-user .badge-user{
						margin: 1em;
					}
					.badge-user{
						width: 3em;
						height: 3em;
						border-radius: .5em;
						overflow: hidden;
					}
					.center-content .badge-user{
						margin: .5em;
					}
					.badge-user img{
						width: 3em;
						height: 3em;
						border-radius: .5em;
						overflow: hidden;
						object-fit: cover;
					}
					.center-content .avatar{
						margin: .5em;
					}
					.center-content .avatar,
					.center-content .avatar img{
						width: 4.5em;
						height: 4.5em;
						overflow: hidden;
						border-radius: 50%;
						margin-bottom: .75em;
					}
					.center-content .avatar img{
						object-fit: cover;
					}
					/* Grid Styling Start */
					.badges-grid{
						font-size: 16px;
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						grid-column-gap: .75em;
						grid-row-gap: 1.5em;
						padding: 1em .5em;
						padding-bottom: calc(1em + env(safe-area-inset-bottom));
					}
					.badges-grid .grid-item{
						display: flex;
						flex-direction: column;
						align-items: center;
						text-align: center;
					}
					.badges-grid .user-badge{
						border-radius: .25em;
						width: 4em;
						height: 4em;
						position: relative;
					}
					.badges-grid .grid-item h5{
						margin: .75em 0 .125em 0;
						font-weight: bold;
						word-break: break;
					}
					.badges-grid .user-badge img{
						border-radius: .25em;
						width: 4em;
						height: 4em;
						object-fit: cover;
						overflow: hidden;
					}
					.user-badge .badge-count{
						display: block;
						background-color: rgba(120, 120, 120, 0.5);
						color: #fff;
						border-radius: 1em;
						position: absolute;
						top: -.75em;
						right: calc(0% - .75em);
						padding: .25em .5em;
						text-align: left;
					}
					.caption{
						font-size: .75em;
						opacity: .75;
						margin: 0;
					}
					@media(min-width: 700px){
						.badges-grid{
							grid-template-columns: repeat(4, 1fr);
						}
					}
				</style>
			`;
	}

	removeUser(callback) {
		if (!this.user) return;

		buildfire.notifications.pushNotification.unsubscribe({ groupName: '$$userDirectory' }, console.log);

		buildfire.components.toast.showToastMessage({ text: 'Left Directory' });

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
