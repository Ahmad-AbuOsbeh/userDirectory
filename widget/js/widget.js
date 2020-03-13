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

			this.renderUserModal(item.data);
		};

		this.listView.onItemActionClicked = (item, e) => {
			if (!item.data.userId) return;
			if (item.isFavorite) {
				return this.directoryUI.directory.removeFavorite(item.data, (error, result) => {
					if (!error) {
						item.isFavorite = false;
						item.action.icon = 'icon icon-star-empty';
						item.update();
					}
				});
			}
			if (!item.isFavorite) {
				return this.directoryUI.directory.addFavorite(item.data, (error, result) => {
					if (!error) {
						item.isFavorite = true;
						item.action.icon = 'icon icon-star';
						item.update();
					}
				});
			}
		};
	}

	renderUserModal(user) {
		const { displayName, email } = user;
		const options = {
			header: `
				<div class="user-container">
					<div class="avatar">
						<img src="https://via.placeholder.com/100" />
					</div>

					<div class="user-info-holder">
						<h2 class="user-title">${displayName}</h2>
						<h4 class="user-subtitle">${email}</h4>
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
							text: 'Message User',
							callback: () => this.directoryUI.handleAction(user)
						},
						{
							id: 'favorites',
							icon: 'icon icon-star-empty',
							text: 'Add To Favorites',
							callback: e => {
								this.directoryUI.directory.addFavorite(user, (error, result) => {
									if (!error) {
										e.target.querySelectorAll('.icon')[0].classList.replace('icon-star-empty', 'icon-star');
									}
								});
							}
						},
						{
							id: 'report',
							icon: 'icon icon-star-empty',
							text: 'Report User',
							callback: () => console.error('!!TODO: report user')
						}
					]
				},
				{
					header: `<span class="icon icon-star"></span>`,
					content: `
						<div class="well-lg">
							<h1>tab 2</h1>
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

	getFavorites() {}

	openDrawer(user) {}

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

			this.markFavorites(this.directoryUI.directory.favorites);

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
