class Widget {
	constructor() {
		this.listView = new buildfire.components.listView('listViewContainer', { enableAddButton: false, Title: '' });
		this.strings = new buildfire.services.Strings('en-us', stringsConfig);
		this.searchBar = new SearchBar('searchBar');
		this.emptyState = document.getElementById('emptyState');

		this.directoryUI = null;

		this.user = null;
		this.currentPageIndex = 0;
		this.inProgress = false;
		this.isInitialized = false;

		this.timer = null;
		this.settings = {
			autoEnlistAll: false,
			tagFilter: [],
			actionItem: null,
			badgePushNotifications: false,
			ranking: 'ALPHA_ASC',
		};

		this.init();
		this.initSearchBar();
		this.initListView();

		// buildfire.auth.onLogin(() => this.init());
		// buildfire.auth.onLogout(() => this.init());

		buildfire.auth.onLogin(() => location.reload());
		buildfire.auth.onLogout(() => location.reload());
		buildfire.datastore.onUpdate(() => location.reload());

		buildfire.messaging.onReceivedMessage = (msg) => {
			switch (msg.cmd) {
				case 'userAdded': {
					this.search();
					this.searchBar.shouldShowAddButton(false);
					this.searchBar.shouldShowOptionsButton(true);
					buildfire.appearance.titlebar.show();
					break;
				}
				case 'userUpdated': {
					this.directoryUI.directory.badges = [];
					this.search();
					this.searchBar.shouldShowAddButton(false);
					this.searchBar.shouldShowOptionsButton(true);
					buildfire.appearance.titlebar.show();
					break;
				}
				case 'refresh': {
					this.init();
					buildfire.appearance.titlebar.show();
					break;
				}
				case 'badgeUpdate': {
					this.init();
					this.directoryUI.hasAccess((error, hasAccess) => {
						if (error || !hasAccess) {
							return;
						}
						this.directoryUI.directory.checkUser((err, userObj) => {
							if (err) return console.error(err);
	
							if (userObj) {
								this.directoryUI.directory.updateUser(userObj, () => {
									this.search();
								});
							}
						});
					});
					buildfire.appearance.titlebar.show();
					break;
				}
				default: {
					break;
				}
			}
		};
	}

	init() {
		buildfire.appearance.titlebar.show();
		Promise.all([this.getUser(), this.getSettings(), this.getStrings()]).then(() => {
			this.strings.inject();

			this.isInitialized = true;

			this.directoryUI = new DirectoryUI(this.user, this.strings, this.settings);

			if (this.user) {
				this.directoryUI.hasAccess((error, hasAccess) => {
					if (error || !hasAccess) {
						this.searchBar.shouldShowAddButton(false);
						this.searchBar.shouldShowOptionsButton(false);
						return;
					}
					this.directoryUI.directory.checkUser((err, userObj) => {
						if (err) return console.error(err);
						this.searchBar.shouldShowAddButton(typeof userObj !== 'object' || !userObj.data.isActive);
						this.searchBar.shouldShowOptionsButton(typeof userObj == 'object' && userObj.data.isActive);

						if (userObj) {
							// setTimeout(() => {
							// 	this.directoryUI.directory.updateUser(userObj, () => {
							// 		this.search();
							// 	});
							// }, 60000);
						}
					});
				});
			} else {
				this.searchBar.shouldShowAddButton(true);
				this.searchBar.shouldShowOptionsButton(false);
			}

			this.searchBar.setDropdownItems([
				{
					text: this.strings.get('other.openProfile'),
					action: () => buildfire.auth.openProfile(),
				},
				{
					text: this.strings.get('other.leaveDirectory'),
					action: () => {
						this.directoryUI.leaveDirectory(() => {
							this.searchBar.shouldShowAddButton(true);
							this.searchBar.shouldShowOptionsButton(false);
							this.search();
						});
					},
				},
			]);

			this.search();
		});
	}

	initSearchBar() {
		this.searchBar.onChange = () => this.debounce();

		this.searchBar.onAddButtonClicked = () => {
			if (!this.user) return buildfire.auth.login();

			this.directoryUI.promptUser(true, () => {
				this.searchBar.shouldShowAddButton(false);
				this.searchBar.shouldShowOptionsButton(true);
				this.search();
			});
		};

		this.searchBar.onFavoritesButtonClicked = (value) => {
			// this.favoritesFilter = value;
			this.directoryUI.directory.filterFavorites = value;
			this.search();
		};

		this.searchBar.applyListeners();
	}

	initListView() {
		this.listView.onItemClicked = (item, e) => {
			if (!item.data.userId) return;

			this.renderUserModal(item);
		};

		this.listView.onItemActionClicked = (item, e) => {
			if (!item.data.userId) return;
			if (item.data.isFavorite) {
				return this.directoryUI.directory.removeFavorite(item.data, (error, result) => {
					if (!error) {
						item.data.isFavorite = false;
						item.action.icon = 'icon glyphicon glyphicon-star-empty';
						item.update();
					}
				});
			}
			if (!item.data.isFavorite) {
				return this.directoryUI.directory.addFavorite(item.data, (error, result) => {
					if (!error) {
						item.data.isFavorite = true;
						item.action.icon = 'icon glyphicon glyphicon-star btn-primary';
						item.update();
					}
				});
			}
		};
	}

	reportUser(userId) {
		const options = {
			title: 'Reason of Report',
			multiSelect: false,
			listItems: [
				{
					text: 'Inappropriate Profile Image',
					value: 'profileImage',
				},
				{
					text: 'Harrassment',
					value: 'harrassment',
				},
				{
					text: 'Spamming',
					value: 'spam',
				},
				{
					text: 'Fraud',
					value: 'fraud',
				},
			],
			confirmButton: {
				text: 'Send',
				value: 'send',
			},
		};

		const callback = (error, result) => {
			if (error) return console.error(error);

			if (result.cancelled || !result.selected[0]) return;

			Reports.reportUser(userId, this.user._id, result.selected[0].value, (error, result) => {
				let text = 'User reported';

				if (error) text = 'Error reporting user';

				buildfire.components.toast.showToastMessage({ text });
			});
		};

		if (!this.user) {
			return buildfire.auth.login();
		}

		buildfire.input.showListDialog(options, callback);
	}

	renderUserModal(item) {
		if (!buildfire.components || !buildfire.components.drawer) return;
		const { imageUrl, data } = item;
		const { displayName, email, badges, phoneNumber } = data;
    const { actionItem, userSubtitleShowMode } = this.settings;
    
    let subtitle = '';

      if (
        (
          !userSubtitleShowMode || 
          userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key
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

      if (userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_PHONE_NUMBER.key && phoneNumber) {
        subtitle = phoneNumber;
      }

		const options = {
			header: `
				<div class="avatar">
					<img src="${imageUrl}" onerror="this.src=window._appRoot+'media/avatar.png'" />
				</div>

				<div class="user-info-holder ellipsis">
					<h4 class="user-title whiteTheme ellipsis">${displayName ? displayName : 'Someone'}</h4>
					<p class="user-subtitle ellipsis">${subtitle}</p>
				</div>
			`,
			tabs: [],
		};

		if (this.user && item.data.userId === this.user._id) {
			options.tabs.push({
				text: `<span class="glyphicon glyphicon-user"></span>`,
				listItems: [
					{
						id: 'openProfile',
						icon: 'glyphicon glyphicon-circle-arrow-right',
						text: this.strings.get('other.openProfile'),
					},
					{
						id: 'leaveDirectory',
						icon: 'glyphicon glyphicon-remove-circle',
						text: this.strings.get('other.leaveDirectory'),
					},
				],
			});
		} else {
			options.tabs.push({
				text: `<span class="glyphicon glyphicon-user"></span>`,
				listItems: [
					{
						id: 'action',
						icon: 'glyphicon glyphicon-circle-arrow-right',
						text: actionItem ? actionItem.title : this.strings.get('other.messageUser'),
					},
					{
						id: 'favorite',
						icon: data.isFavorite ? 'icon icon-star' : 'icon icon-star-empty',
						text: data.isFavorite ? this.strings.get('other.removeFromFavorites') : this.strings.get('other.addToFavorites'),
					},
					{
						id: 'report',
						icon: 'glyphicon glyphicon-warning-sign',
						text: this.strings.get('other.reportUser'),
					},
				],
			});
		}

		options.tabs.push({
			text: `<span class="glyphicon glyphicon-tags"></span>`,
			content: `
			<div class="badges-grid">

				${
					badges.length
						? badges
								.map((badge) => {
									return `
											<div class="grid-item">
												<div class="user-badge">
													<img src="${badge.imageUrl}" alt="">
													${badge.appliedCount ? `<span class="badge-count successBackgroundTheme">${badge.appliedCount}</span>` : ''}
												</div>
												<h5>${badge.name}</h5>
												<p class="caption">${new Date(badge.earned).toLocaleDateString()}</p>
											</div>
									`;
								})
								.join(' ')
						: `<div class="empty-state-text"><span>no badges yet!</span></div>`
				}
				</div>

			<style>
				.empty-state-text{
					text-transform: capitalize;
					text-align: center;
					font-size: 14px;
					padding: 24px;
					opacity: .7;
					min-height: 80px;
					display: flex;
					align-items:center;
				}
				.badges-grid{
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					grid-column-gap: .75rem;
					grid-row-gap: 1.5rem;
					padding: 1rem .5rem;
					padding-bottom: calc(1rem + env(safe-area-inset-bottom));
				}
				.badges-grid .grid-item{
					display: flex;
					flex-direction: column;
					align-items: center;
					text-align: center;
				}
				.badges-grid .user-badge{
					border-radius: .25rem;
					width: 4rem;
					height: 4rem;
					position: relative;
				}
				.badges-grid .grid-item h5{
					margin: .75rem 0 .125rem 0;
					font-weight: bold;
					word-break: break;
				}
				.badges-grid .user-badge img{
					border-radius: .25rem;
					width: 4rem;
					height: 4rem;
					object-fit: cover;
					overflow: hidden;
				}
				.user-badge .badge-count{
					display: block;
					background-color: rgba(120, 120, 120, 0.5);
					color: #fff;
					border-radius: 1rem;
					position: absolute;
					top: -.75rem;
					right: calc(0% - .75rem);
					padding: .25rem .5rem;
					text-align: left;
				}
				.caption{
					font-size: .75rem;
					opacity: .75;
					margin: 0;
				}
				@media(min-width: 700px){
					.badges-grid{
						grid-template-columns: repeat(4, 1fr);
					}
				}
			</style>
			`,
		});

		const callback = (error, result) => {
			if (error) return console.error(error);

			const { id } = result;

			switch (id) {
				case 'openProfile': {
					buildfire.components.drawer.closeDrawer();
					setTimeout(() => {
						buildfire.auth.openProfile();
					}, 100);
					break;
				}
				case 'leaveDirectory': {
					this.directoryUI.leaveDirectory(() => {
						this.directoryUI.hasAccess((error, hasAccess) => {
							if (error || !hasAccess) {
								this.searchBar.shouldShowAddButton(false);
								this.searchBar.shouldShowOptionsButton(false);
							} else {
								this.searchBar.shouldShowAddButton(true);
								this.searchBar.shouldShowOptionsButton(false);
							}
							this.search();
						});
					});
					buildfire.components.drawer.closeDrawer();
					break;
				}
				case 'action': {
					buildfire.components.drawer.closeDrawer();
					setTimeout(() => {
						this.directoryUI.handleAction(data);
					}, 100);
					break;
				}
				case 'favorite': {
					if (data.isFavorite) {
						this.directoryUI.directory.removeFavorite(data, (error, result) => {
							if (!error) {
								data.isFavorite = false;
								item.data.isFavorite = false;
								item.action.icon = 'icon glyphicon glyphicon-star-empty';
								item.update();
							}
						});
					} else {
						this.directoryUI.directory.addFavorite(data, (error, result) => {
							if (!error) {
								data.isFavorite = true;
								item.data.isFavorite = true;
								item.action.icon = 'icon glyphicon glyphicon-star btn-primary';
								item.update();
							}
						});
					}
					buildfire.components.drawer.closeDrawer();
					break;
				}
				case 'report': {
					this.reportUser(data.userId);
					buildfire.components.drawer.closeDrawer();
					break;
				}
				default:
					buildfire.components.drawer.closeDrawer();
					break;
			}
		};

		buildfire.components.drawer.openBottomDrawer(options, callback);
	}

	getUser() {
		return new Promise((resolve) => {
			this.user = null;

			buildfire.auth.getCurrentUser((error, user) => {
				if (error) console.error(error);
				this.user = user || null;

				resolve();
			});
		});
	}

	getSettings() {
		return new Promise((resolve) => {
			Settings.get()
				.then((settings) => {
					this.settings = settings;
					resolve();
				})
				.catch(() => resolve(null));
		});
	}

	getStrings() {
		return new Promise((resolve) => {
			this.strings
				.init()
				.then(resolve)
				.catch(() => resolve(null));
		});
	}

	markFavorites(favorites) {
		this.listView.items.forEach((item) => {
			if (typeof item.isFavorite !== 'undefined') return;

			item.isFavorite = (favorites || []).indexOf(item.data.userId) > -1;
			item.update();
		});
	}

	search(index = 0) {
		buildfire.appearance.titlebar.show();
		if (index == 0) {
			this.listView.container.onscroll = (e) => {
				const { scrollTop, clientHeight, scrollHeight } = this.listView.container;

				if (!this.inProgress && scrollTop + clientHeight > scrollHeight * 0.8) {
					this.currentPageIndex++;
					this.search(this.currentPageIndex);
				}
			};
		}

		this.inProgress = true;
		this.currentPageIndex = index;
		buildfire.spinner.show();

		this.directoryUI.search(this.searchBar.value, this.currentPageIndex, 15, (error, results) => {
			buildfire.spinner.hide();
			if (index == 0) this.listView.clear();
			if (error) return console.error(error);

			this.listView.loadListViewItems(results);

			this.inProgress = false;

			if (results.length == 0) {
				this.listView.container.onscroll = null;
			}

			if (widget.listView.container.childElementCount < 1) {
				this.emptyState.classList.add('active');
			} else {
				this.emptyState.classList.remove('active');
			}
		});
	}

	debounce() {
		if (this.tmr) clearTimeout(this.tmr);
		this.tmr = setTimeout(() => this.search(), 500);
	}
}
