class DirectoryUI {
	constructor(user, strings, settings) {
		this.user = user;
		this.directory = new Directory(user, strings, settings);
		this.strings = strings || new buildfire.services.Strings('en-us', stringsConfig);
		this.settings = settings;
	}

	search(searchText, pageIndex, pageSize, callback) {
		this.directory.search(searchText, pageIndex, pageSize, (error, results) => {
			if (error) return callback(error, []);

			callback(null, this.handleResults(results));
		});
	}

	handleResults(data) {
		let results = [];

		data.forEach((row, i) => {
			const { data } = row;
			const { displayName, email, userId, badges, isFavorite, action, phoneNumber } = data;

			let imageUrl = buildfire.auth.getUserPictureUrl({ userId });

			let badgesHTML = '';
			badges.sort((a, b) => a.rank - b.rank);
			badges.forEach((badge) => {
				badgesHTML += `
					<div class="badge">
						<img src="${buildfire.imageLib.cropImage(badge.imageUrl, { size: 'xxs', aspect: '1:1' })}" />
					</div>
				`;
			});

      let subtitle = '';

      if (
        (
          !this.settings.userSubtitleShowMode || 
          this.settings.userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key
        ) &&
        (
          email && 
          email.length > 0 &&
          email.indexOf('facebook') === -1 && 
          email.indexOf('twitter') === -1
        )
      ) {
        subtitle = email;
      }

      if (this.settings.userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_PHONE_NUMBER.key && phoneNumber) {
        subtitle = phoneNumber;
      }

			let title = displayName ? displayName : 'Someone';

			if (this.settings.ranking && ['BADGE_COUNT', 'TAG_COUNT'].indexOf(this.settings.ranking) > -1) {
				title = (`
					<div class="listViewItemTitle-ranked">
						<h2 class="listViewItemTitle-ranked__rank">#${i + 1}</h2>
						<h5 class="listViewItemTitle-ranked__title">${displayName}</h5>
					</div>
				`);
			}

			results.push({
				id: row.id,
				title,
				subtitle,
				description: badgesHTML,
				imageUrl,
				data,
				userId,
				badges,
				isFavorite,
				action,
			});
		});

		return results;
	}

	hasAccess(callback) {
		const { tagFilter } = this.settings;

		if (!tagFilter || !tagFilter.length) {
			return callback(null, true);
		}

		buildfire.auth.getCurrentUser((error, user = {}) => {
			if (error) return callback(error, null);

			const { appId } = buildfire.getContext();

			const userTags = user.tags && user.tags[appId] ? user.tags[appId].map((tag) => tag.tagName) : [];

			return callback(
				null,
				tagFilter.some((tag) => userTags.indexOf(tag) > -1)
			);
		});
	}

	promptUser(force, callback) {
		if (!this.user) return buildfire.auth.login();

		const { _id } = this.user || {};

		const { autoEnlistAll } = this.settings;

		this.hasAccess((err, hasAccess) => {
			if (err || !hasAccess) return;

			this.directory.checkUser((error, userObj) => {
				if (error) return console.error(error);
				if (userObj && userObj.data && userObj.data.isActive)
					return this.directory.updateUser(userObj, () => {
						buildfire.messaging.sendMessageToWidget({ cmd: 'userUpdated' });
					});

				if (!force && localStorage.getItem(`$$userDirectoryPrompt-${_id}`)) {
					return;
				}

				if (autoEnlistAll) {
					return this.directory.addUser((e) => {
						if (e) return console.error(e);
						callback();
					});
				}

				this._showDialog('join', (value) => {
					if (value) {
						this.directory.addUser((e) => {
							if (e) return console.error(e);
							callback();
						});
					}
				});
			});
		});
	}

	autoUpdateUser() {
		if (this.autoUpdater) {
			clearInterval(this.autoUpdater);
			this.autoUpdater = null;
		}

		const update = () => {
			this.directory.checkUser((error, userObj) => {
				if (!error && userObj) {
					this.directory.updateUser(userObj, (usr) => {
						buildfire.messaging.sendMessageToWidget({ cmd: 'userUpdated', data: usr });
					});
				}
			});
		};

		this.autoUpdater = setInterval(() => {
			update();
		}, 3e5); // 5 min

		buildfire.auth.onUpdate && buildfire.auth.onUpdate(event => {
			update();
		}, true);


	}

	handleAction(user = {}) {
		const { actionItem } = this.settings;

		if (actionItem) {
			if (!actionItem.queryString) {
				actionItem.queryString = `&dld=${JSON.stringify(user)}`;
			} else {
				const params = ['userId', 'email', 'displayName', 'firstName', 'lastName'];

				// const currentUser = this.directory.user || {};

				params.forEach((param) => {
					actionItem.queryString = actionItem.queryString.replace(`{{${param}}}`, user[param]);
				});
			}

			return buildfire.actionItems.execute(actionItem, () => {});
		}

		this.openPrivateMessage(user);
	}

	openPrivateMessage(targetUser) {
		if (!this.user) return buildfire.auth.login();

		const userIds = [this.user._id, targetUser.userId];
		userIds.sort();

		const queryString = `wid=${userIds[0]}${userIds[1]}`;

    const options = {
      title: `${this.user.displayName ? this.user.displayName : 'Someone'} | ${targetUser.displayName ? targetUser.displayName : 'Someone'}`,
      pluginTypeOrder: this.settings.navigateToCwByDefault ? ['community', 'premium_social', 'social'] : ['premium_social', 'social', 'community'],
      queryString
    };

		buildfire.navigation.navigateToSocialWall(options);
	}

	leaveDirectory(callback) {
		this._showDialog('leave', (value) => {
			if (value) {
				this.directory.removeUser((e) => {
					if (e) return console.error(e);
					callback();
				});
			}
		});
	}

	_showDialog(type = 'join', callback) {
		if (typeof this.strings == 'undefined') return;

		const title = this.strings.get(`${type}Dialog.title`);
		const subtitle = this.strings.get(`${type}Dialog.message`);
		const cancelButtonText = this.strings.get(`${type}Dialog.cancelButton`);
		const confirmButtonText = this.strings.get(`${type}Dialog.confirmButton`);

		const dialogOptions = {
			title,
			subtitle,
			showDismissButton: true,
			action: {
				handler: JSON.stringify(() => {}),
				title: confirmButtonText,
			},
			richContent: `
				<style>
					.rich-content {
						display: none;
					}
				</style>
			`,
		};

		const handleResponse = (error, result) => {
			if (error) return console.error(error);

			const { _id } = this.user || {};
			if (result && result.buttonType) {
				callback(result.buttonType === 'action');
				localStorage.setItem(`$$userDirectoryPrompt-${_id}`, 'true');
			}
		};

		buildfire.components.popup.display(dialogOptions, handleResponse);
	}
}
