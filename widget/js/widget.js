class Widget {
	constructor() {
		this.listView = new buildfire.components.listView('listViewContainer', { enableAddButton: false, Title: '' });
		this.searchBar = new SearchBar('searchBar', {});
		this.strings = new buildfire.services.Strings('en-us', stringsConfig);
		this.drawer = new buildfire.components.drawer('drawer');

		this.directoryUI = null;

		this.user = null;
		this.currentPageIndex = 0;
		this.inProgress = false;
		this.isInitialized = false;

		this.timer = null;
		this.settings = {
			autoEnlistAll: false,
			autoEnlistTags: [],
			actionItem: null,
			badgePushNotifications: false
		};

		this.init();
		this.initSearchBar();
		this.initListView();

		buildfire.auth.onLogin(() => this.init());
		buildfire.auth.onLogout(() => this.init());

		buildfire.messaging.onReceivedMessage = ({ cmd }) => {
			switch (cmd) {
				case 'userAdded': {
					this.search();
					this.searchBar.shouldShowAddButton(false);
					break;
				}
				case 'refresh': {
					this.init();
					break;
				}
				default: {
					break;
				}
			}
		};
	}

	init() {
		Promise.all([this.getUser(), this.getSettings(), this.getStrings()]).then(() => {
			this.strings.inject();

			this.isInitialized = true;

			this.directoryUI = new DirectoryUI(this.user, this.strings, this.settings);

			if (this.user) {
				this.directoryUI.directory.checkUser((err, userObj) => {
					if (err) return console.error(err);
					this.searchBar.shouldShowAddButton(typeof userObj !== 'object');
				});
			}

			this.search();
		});
	}

	initSearchBar() {
		this.searchBar.onChange = () => this.debounce();

		this.searchBar.onAddButtonClicked = () => {
			if (!this.user) return buildfire.auth.login();

			this.directoryUI.promptUser(() => {
				this.searchBar.shouldShowAddButton(false);
				this.search();
			});
		};

		this.searchBar.onOptionsButtonClicked = () => {
			if (!this.user) return;
			this.directoryUI.leaveDirectory(() => {
				this.searchBar.shouldShowAddButton(true);
				this.search();
			});
		};

		this.searchBar.onFavoritesButtonClicked = value => {
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
						item.action.icon = 'icon icon-star-empty';
						item.update();
					}
				});
			}
			if (!item.data.isFavorite) {
				return this.directoryUI.directory.addFavorite(item.data, (error, result) => {
					if (!error) {
						item.data.isFavorite = true;
						item.action.icon = 'icon icon-star btn-primary';
						item.update();
					}
				});
			}
		};
	}

	reportUser(userData) {
		window.location = `mailto:${email}?subject=${encodeURIComponent()}&body=${encodeURIComponent()}`;
	}

	renderUserModal(item) {
		const { imageUrl, data } = item;
		const { displayName, email, badges } = data;
		const { actionItem } = this.settings;
		const options = {
			header: `
				<div class="user-container">
					<div class="avatar">
						<img src="${imageUrl}" />
					</div>

					<div class="user-info-holder ellipsis">
						<h4 class="user-title whiteTheme">${displayName}</h4>
						<p class="user-subtitle whiteTheme">${email}</p>
					</div>
				</div>
			`,
			tabs: [
				{
					header: `<span class="icon icon-star"></span>`,
					content: [
						{
							id: 'action',
							icon: 'icon icon-star',
							text: actionItem ? actionItem.title : 'Message User',
							callback: () => this.directoryUI.handleAction(data)
						},
						{
							id: 'favorites',
							icon: data.isFavorite ? 'icon icon-star' : 'icon icon-star-empty',
							text: data.isFavorite ? 'Remove From Favorites' : 'Add To Favorites',
							callback: e => {
								if (data.isFavorite) {
									this.directoryUI.directory.removeFavorite(data, (error, result) => {
										if (!error) {
											e.target.querySelectorAll('.icon')[0].classList.replace('icon-star', 'icon-star-empty');
											e.target.querySelectorAll('.list-item-text')[0].innerHTML = 'Add To Favorites';
											data.isFavorite = false;
											item.data.isFavorite = false;
											item.action.icon = 'icon icon-star-empty';
											item.update();
										}
									});
								} else {
									this.directoryUI.directory.addFavorite(data, (error, result) => {
										if (!error) {
											e.target.querySelectorAll('.icon')[0].classList.replace('icon-star-empty', 'icon-star');
											e.target.querySelectorAll('.list-item-text')[0].innerHTML = 'Remove From Favorites';
											data.isFavorite = true;
											item.data.isFavorite = true;
											item.action.icon = 'icon icon-star btn-primary';
											item.update();
										}
									});
								}
							}
						},
						{
							id: 'report',
							icon: 'glyphicon glyphicon-warning-sign',
							text: 'Report User',
							callback: () => this.reportUser(data)
						}
					]
				},
				{
					header: `<span class="icon icon-star"></span>`,
					content: `
					<div class="badges-grid">
						${badges.length ?
								badges.map(badge => {
								return `
								<div class="grid-item">
									<div class="user-badge">
										<img src="${badge.imageUrl}" alt="">
										<span class="badge-count successBackgroundTheme">999</span>
									</div>
									<h5>${badge.name}</h5>
									<p class="caption">15 Feb 2020</p>
								</div>
								`;
							}).join(' ')
						: (`
							<div>no badges yet!</div>
						`)
					}
					</div>
					`
				}
			]
		};

		this.drawer.open(options);
	}

	getUser() {
		return new Promise(resolve => {
			buildfire.auth.getCurrentUser((error, user) => {
				if (error) console.error(error);
				this.user = user || null;

				resolve();
			});
		});
	}

	getSettings() {
		return new Promise(resolve => {
			Settings.get()
				.then(settings => {
					this.settings = settings;
					resolve();
				})
				.catch(() => resolve(null));
		});
	}

	getStrings() {
		return new Promise(resolve => {
			this.strings
				.init()
				.then(resolve)
				.catch(() => resolve(null));
		});
	}

	markFavorites(favorites) {
		this.listView.items.forEach(item => {
			if (typeof item.isFavorite !== 'undefined') return;

			item.isFavorite = (favorites || []).indexOf(item.data.userId) > -1;
			item.update();
		});
	}

	search(index = 0) {
		if (index == 0) {
			this.listView.container.onscroll = e => {
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
		});
	}

	debounce() {
		if (this.tmr) clearTimeout(this.tmr);
		this.tmr = setTimeout(() => this.search(), 500);
	}
}
