class DirectoryUI {
	constructor(user, strings, settings, isService) {
		this.user = user;
		this.directory = new Directory(user);
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
			// buildfire.services.searchEngine.delete({ id: row.id, tag: "userDirectory"},e=>{});
			// buildfire.appData.delete(row.id,"userDirectory",e=>{});
			// return;

			const { data } = row;
			const { email, userId, badges } = data;

			let imageUrl = buildfire.auth.getUserPictureUrl({ email });
			imageUrl = buildfire.imageLib.cropImage(imageUrl, { width: 64, height: 64 });

			results.push({
				id: row.id,
				title: data.displayName,
				description: email,
				imageUrl,
				data,
				userId,
				badges
			});
		});

		return results;
	}

	promptUser(callback) {
		if (!this.user) return buildfire.auth.login();

		const { appId } = buildfire.getContext();
		const { autoEnlistTags, autoEnlistAll } = this.settings;

		const userTags = this.user.tags && this.user.tags[appId] ? this.user.tags[appId].map(tag => tag.tagName) : [];

		this.directory.checkUser((error, userObj) => {
			if (error) return console.error(error);
			if (userObj) return this.directory.updateUser();

			if (autoEnlistAll) {
				return this.directory.addUser(e => {
					if (e) return console.error(e);
					callback();
				});
			}

			if (autoEnlistTags && userTags) {
				if (autoEnlistTags.some(tag => userTags.indexOf(tag) > -1)) {
					return this.directory.addUser(e => {
						if (e) return console.error(e);
						callback();
					});
				}
			}

			this._showDialog('join', value => {
				if (value) {
					this.directory.addUser(e => {
						if (e) return console.error(e);
						callback();
					});
				}
			});
		});
	}

	handleAction(user) {
		const { actionItem } = this.settings;

		if (actionItem) {
			return buildfire.actionItems.execute(actionItem, console.error);
		}

		this.openPrivateMessage(user);
	}

	openPrivateMessage(targetUser) {
		if (!this.user) return buildfire.auth.login();

		const userIds = [this.user._id, targetUser.userId];
		userIds.sort();

		const queryString = `wid=${userIds[0]}|${userIds[1]}&wTitle=${encodeURIComponent(`${this.user.displayName} | ${targetUser.displayName}`)}`;

		buildfire.navigation.navigateToSocialWall({ queryString });
	}

	leaveDirectory(callback) {
		this._showDialog('leave', value => {
			if (value) {
				this.directory.removeUser(e => {
					if (e) return console.error(e);
					callback();
				});
			}
		});
	}

	_showDialog(type = 'join', callback) {
		let title = 'User Directory';
		let message = 'Would you like to join our user directory?';
		let cancelButtonText = 'No';
		let confirmButtonText = 'Yes';

		if (typeof this.strings !== 'undefined') {
			title = this.strings.get(`${type}Dialog.title`);
			message = this.strings.get(`${type}Dialog.message`);
			cancelButtonText = this.strings.get(`${type}Dialog.cancelButton`);
			confirmButtonText = this.strings.get(`${type}Dialog.confirmButton`);
		}

		const dialogOptions = {
			title,
			message,
			buttons: [
				{ text: cancelButtonText, key: 'no', type: 'default' },
				{ text: confirmButtonText, key: 'yes', type: 'success' }
			]
		};
		const handleResponse = (e, data) => {
			if (e) return console.error(e);
			callback(data && data.selectedButton && data.selectedButton.key == 'yes');
			localStorage.setItem('$$userDirectoryPrompt', 'true');
		};

		buildfire.notifications.showDialog(dialogOptions, handleResponse);
	}

	// static prompt(user, callback) {
	// 	const directory = new Directory(user)

	// 	directory.checkUser((error, userObj) => {
	// 		if (error) return console.error(error);
	// 		if (userObj) return directory.updateUser(userObj);

	// 		DirectoryUI._showDialog('join', value => {
	// 			if (value) {
	// 				directory.addUser(user, e => {
	// 					if (e) return console.error(e);
	// 					onAddUser();
	// 				});
	// 			}
	// 		});
	// 	});
	// }
}
