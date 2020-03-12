class Widget {
	constructor() {
		this.listView = new ListView('listViewContainer', { enableAddButton: false, Title: '' });
		this.searchBar = new SearchBar('searchBar', {});
		this.strings = new buildfire.services.Strings('en-us', stringsConfig);
		this.drawer = new Drawer('drawer');

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

			const { className } = e.srcElement;

			switch (className) {
				case 'icon icon-star-empty': {
					this.directoryUI.directory.addFavorite(item.data, (error, status) => {
						if (!error) {
							item.isFavorite = true;
							item.update();
						}
					});
					break;
				}
				case 'icon icon-star': {
					this.directoryUI.directory.removeFavorite(item.data, (error, status) => {
						if (!error) {
							item.isFavorite = false;
							item.update();

							if (this.directoryUI.directory.filterFavorites) {
								this.search();
							}
						}
					});
					break;
				}
				default: {
					// open drawer
					// const richContent = `

					// `;

					const options = {
						header: `
						<div class="media">
							<div class="media-left">
								<div onclick="widget.directoryUI.directory.addFavorite('${item.data.userId}')">
									<img class="media-object" style="min-width: 100px; height: 100px;" src="https://via.placeholder.com/200" alt="..." />
								</div>
							</div>
							<div class="media-body">
								<h4 class="media-heading">Media heading</h4>
								Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus.
							</div>
						</div>
						`,
						tabs: [
							{
								tab: `<span class="icon icon-star"></span>`,
								content: `<ul>
								<li>1</li>
								<li>2</li>
								<li>2</li>
							</ul>`
							},
							{
								tab: `<span class="icon icon-star"></span>`,
								content: `<ul>
								<li>1</li>
								<li>2</li>
								<li>2</li>
							</ul>`
							}
						]
					};

					this.drawer.open(options);
					break;
				}
			}
			// if (e.srcElement.className == 'icon icon-ellipsis') {
			// 	this.directoryUI.handleAction(item.data);
			// }
		};
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
