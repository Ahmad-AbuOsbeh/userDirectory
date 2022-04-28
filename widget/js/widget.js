class Widget {
  constructor() {
    this.usersView = new buildfire.components.gridView('listViewContainer', { enableAddButton: false, Title: '' });
    this.cityListView = new buildfire.components.gridView('mapListContent', { enableAddButton: false, Title: '' });
    this.strings = new buildfire.services.Strings('en-us', stringsConfig);
    this.emptyState = document.getElementById('emptyState');
    this.currentScreen = Keys.screenNameKeys.LIST.key;
    this.directoryUI = null;
    this.activeFilters = null;
    this.searchFilters = {};
    this.user = null;
    this.currentPageIndex = 0;
    this.inProgress = false;
    this.isInitialized = false;
    this.moveToResultsOnMap = false;
    this.isFilterFromMapList = false;

    this.timer = null;
    this.settings = {
      autoEnlistAll: false,
      mapEnabled: false,
      filtersEnabled: false,
      tagFilter: [],
      actionItem: null,
      badgePushNotifications: false,
      ranking: 'ALPHA_ASC',
      isIndexed: false,
    };
    this.filterScreen = new Filter({
      widget: this,
      settings: this.settings,
    });
    this.searchBar = new SearchBar('searchBar', {
      filterScreen: this.filterScreen,
    });
    this.init();
    // this.initMapSearchBar();
    this.initSearchBar();

    // buildfire.auth.onLogin(() => this.init());
    // buildfire.auth.onLogout(() => this.init());

    buildfire.auth.onLogin(() => location.reload());
    buildfire.auth.onLogout(() => location.reload());
    buildfire.datastore.onUpdate((event) => {
      console.log('event event event event event', event);
      if (event.data.mapEnabled || event.data.filtersEnabled) {
        this.directoryUI.directory.settings = event.data;
        this.directoryUI.directory.checkUser((err, userObj) => {
          console.log('from if checkuser, ERROR:', err, 'userObj:', userObj);
          if (err) return console.error(err);

          this.directoryUI.directory.updateUser(userObj, () => {
            console.log('this.directoryUI.directory.user>>userObj from datastore on update: 6:50', this.directoryUI.directory.user);
            location.reload();
          });
        });
      } else {
        console.log('from else 6:52');
        location.reload();
      }
    });

    // list users icon on map
    document.querySelector('.onMap-users-list-icon').onclick = () => {
      // 	this.currentScreen = Keys.screenNameKeys.LIST.key;
      // 	        mapView.style.display = 'none';
      // 			defaultView.style.display = 'block';
      // this.initSearchBar();
      this.isFilterFromMapList = true;
      gridViewContainer.classList.toggle('show');
      this.mapController.mapContainer.classList.add('hide');
      this.currentScreen = Keys.screenNameKeys.MAPLIST.key;

      console.log('this.mapController.allUsersOnMap', this.mapController.allUsersOnMap);
      this.initCityListView('all Users On Map', this.mapController.allUsersOnMap);
    };
    //filter icon on map
    document.querySelector('.onMap-filter-icon').onclick = () => this.searchBar.goToFilterScreen();
    // list users icon on map
    // document.querySelector('.onMap-filter-icon').onclick=()=>{
    // 	this.searchBar.goToFilterScreen();
    // }

    // show map view from list users
    showMapView.onclick = () => {
      // 	this.currentScreen = Keys.screenNameKeys.LIST.key;
      // 	        mapView.style.display = 'none';
      // 			defaultView.style.display = 'block';
      // this.initSearchBar();
      this.isFilterFromMapList = false;
      console.log('this.filterScreen.state', this.filterScreen.state);
      gridViewContainer.classList.toggle('show');
      this.mapController.mapContainer.classList.remove('hide');
      this.currentScreen = Keys.screenNameKeys.MAP.key;
      //show on map icons
      document.querySelector('.my-location-icon').style.display = 'block';
      document.querySelector('.onMap-users-list-icon').style.display = 'block';
      // filter icon on map
      if (this.settings.filtersEnabled) {
        document.querySelector('.onMap-filter-icon').style.display = 'block';
      } else {
        document.querySelector('.onMap-filter-icon').style.display = 'none';
      }

      // hide show active indicator if no selected categories
      if (Object.keys(this.filterScreen.state.pickedCategories) && Object.keys(this.filterScreen.state.pickedCategories).length > 0) {
        activeFilterIndicatorOnMap.style.display = 'block';
      } else {
        activeFilterIndicatorOnMap.style.display = 'none';
      }
    };

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
        case 'startSearchEngineUpdate':
          this.updateSearchEngine();
        default: {
          break;
        }
      }
    };

    buildfire.navigation.onBackButtonClick = () => {
      console.log('this.currentScreen', this.currentScreen);
      switch (this.currentScreen) {
        case Keys.screenNameKeys.LIST.key: {
          buildfire.navigation.restoreBackButtonClick();
          buildfire.navigation.goBack();
          break;
        }
        case Keys.screenNameKeys.MAP.key: {
          // hide on map icons
          // hide on map icons
          document.querySelector('.my-location-icon').style.display = 'none';
          document.querySelector('.onMap-users-list-icon').style.display = 'none';
          document.querySelector('.onMap-filter-icon').style.display = 'none';
          activeFilterIndicatorOnMap.style.display = 'none';
          buildfire.navigation.restoreBackButtonClick();
          buildfire.navigation.goBack();
          break;
        }
        case Keys.screenNameKeys.MAPLIST.key: {
          showMapView.onclick();
          // 					this.currentScreen = Keys.screenNameKeys.MAP.key;
          // 					gridViewContainer.classList.toggle("show");
          // 					googleMap.classList.remove("hide");
          // 								// hide on map icons
          // 		document.querySelector('.my-location-icon').style.display='block';
          //         document.querySelector('.onMap-users-list-icon').style.display='block';
          // 		if (this.settings && this.settings.filtersEnabled) {
          // 			document.querySelector('.onMap-filter-icon').style.display='block';
          // 		}
          // 		// hide show active indicator if no selected categories
          // if (Object.keys(this.filterScreen.state.pickedCategories) && Object.keys(this.filterScreen.state.pickedCategories).length > 0) {
          // 	activeFilterIndicatorOnMap.style.display='block';
          // }else{
          // 	activeFilterIndicatorOnMap.style.display='none';

          // }
          break;
        }
        case Keys.screenNameKeys.FILTER.key: {
          if (this.settings && this.settings.mapEnabled) {
            if (!this.isFilterFromMapList) {
              this.currentScreen = Keys.screenNameKeys.MAP.key;
              filterView.classList.toggle('show');
              console.log('googleMap', googleMap);
              mapView.style.display = 'block';
              googleMap.style.display = 'block';
              // 			console.log('document.querySelector(.my-location-icon)2222222',document.querySelector('.my-location-icon'));
              console.log('from ifffff');
              document.querySelector('.my-location-icon').style.display = 'block';
              document.querySelector('.onMap-users-list-icon').style.display = 'block';
              document.querySelector('.onMap-filter-icon').style.display = 'block';
            } else {
              // so it's from MapList go back to Map list
              filterView.classList.toggle('show');
              mapView.style.display = 'block';
              googleMap.style.display = 'block';
              gridViewContainer.classList.toggle('show');
              document.querySelector('.onMap-users-list-icon').onclick();
            }
          } else {
            console.log('from elseeeeeee');

            this.currentScreen = Keys.screenNameKeys.LIST.key;
            filterView.classList.toggle('show');
            defaultView.style.display = 'block';
          }
          break;
        }
        default: {
          buildfire.navigation.restoreBackButtonClick();
          buildfire.navigation.goBack();
          break;
        }
      }
    };
  }

  init() {
    buildfire.appearance.titlebar.show();
    Promise.all([this.getUser(), this.getSettings(), this.getStrings()]).then(() => {
      this.strings.inject();
      if (this.settings && this.settings.layout) {
        let cont = document.getElementById('listViewContainer');
        if (this.settings.layout === 'grid') {
          this.usersView = new buildfire.components.gridView('listViewContainer', { enableAddButton: false, Title: '' });
          if (cont.classList.contains('listViewContainer')) {
            cont.classList.remove('listViewContainer');
          }
        } else {
          this.usersView = new buildfire.components.listView('listViewContainer', { enableAddButton: false, Title: '' });
          if (cont.classList.contains('gridViewContainer')) {
            cont.classList.remove('gridViewContainer');
          }
        }
      }
      this.initListView();
      this.isInitialized = true;
      // this.showFilterScreen();
      this.directoryUI = new DirectoryUI(this.user, this.strings, this.settings);

      // for apply filter button
      document.getElementById('applyFilterBtn').innerText = this.strings.get('filter.filterButton') ? this.strings.get('filter.filterButton') : 'Apply';

      if (this.settings.mapEnabled) {
        console.log('this.user from widget', this.user);
        this.initMapView();
      } else {
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
              //TODO Check if filter is enabled in settings
              // if (this.settings.filterEnabled) {
              // this.searchBar.shouldShowFilterButton(true);
              if (this.settings.filtersEnabled) {
                // document.querySelector('.favorites').style.display='none';
                // document.querySelector('.filter-funnel').style.display='flex';
                this.searchBar.shouldShowFavouriteButton(false);
                this.searchBar.shouldShowFilterButton(true);
              } else {
                // document.querySelector('.favorites').style.display='flex';
                // document.querySelector('.filter-funnel').style.display='none';
                this.searchBar.shouldShowFilterButton(false);
                this.searchBar.shouldShowFavouriteButton(true);

                // filter icon on map
                // document.querySelector('.onMap-filter-icon').style.display='none';
                // this.searchBar.shouldShowOnMapFilterIcon(false);
              }
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
        // on click search bar options handler - searchbar
        this.searchBar.btn.onclick = () => {
          let listItems = [
            {
              text: 'Show Favorites',
              id: 'favourite',
            },
            {
              text: this.strings.get('other.openProfile'),
              id: 'openProfile',
            },
            {
              text: this.strings.get('other.leaveDirectory'),
              id: 'leaveDirectory',
            },
          ];

          if (this.settings && !this.settings.filtersEnabled) {
            listItems.shift();
          }
          buildfire.components.drawer.open(
            {
              listItems,
            },
            (err, result) => {
              if (err) return console.error(err);

              if (result.id == 'favourite') {
                this.searchBar.filterFavorites();
                buildfire.components.drawer.closeDrawer();
              }
              if (result.id == 'openProfile') {
                buildfire.auth.openProfile();
                buildfire.components.drawer.closeDrawer();
              }
              if (result.id == 'leaveDirectory') {
                this.directoryUI.leaveDirectory(() => {
                  this.searchBar.shouldShowAddButton(true);
                  this.searchBar.shouldShowOptionsButton(false);
                  this.search();
                });
                buildfire.components.drawer.closeDrawer();
              }
            }
          );
        };

        this.search();
      }
    });
  }
  //  init list view from map
  updateSearchEngine() {
    let page = 0,
      pageSize = 50,
      updatedArr = [];
    const get = () => {
      buildfire.appData.search({ recordCount: true, page, pageSize }, '$$userDirectory', (err, response) => {
        if (response && response.result && response.result.length) {
          response.result.map((el) => updatedArr.push(el));
        }
        if (response.totalRecord === updatedArr.length) {
          let updatedRecords = 0;
          updatedArr.map((el) => {
            Lookup.update(new DirectoryUser(el.data).objToJson_(), (err, result) => {
              updatedRecords++;
              if (updatedRecords === updatedArr.length) {
                buildfire.messaging.sendMessageToControl({ cmd: 'finishSearchEngineUpdate' });
              }
            });
          });
        } else {
          page++;
          get();
        }
      });
    };

    get();
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
  initMapSearchBar() {
    this.mapSearchBar.shouldShowOptionsButton(true);
    if (this.settings && this.settings.filtersEnabled) {
      this.mapSearchBar.shouldShowFavouriteButton(false);
      this.mapSearchBar.shouldShowFilterButton(true);
    } else {
      this.mapSearchBar.shouldShowFilterButton(false);
      this.mapSearchBar.shouldShowFavouriteButton(true);
    }
    this.mapSearchBar.onChange = () => this.debounce(this.searchOnMapList.bind(this));

    this.mapSearchBar.onAddButtonClicked = () => {
      if (!this.user) return buildfire.auth.login();

      this.directoryUI.promptUser(true, () => {
        this.mapSearchBar.shouldShowAddButton(false);
        this.mapSearchBar.shouldShowOptionsButton(true);
        this.search();
      });
    };

    this.mapSearchBar.onFavoritesButtonClicked = (value) => {
      // this.favoritesFilter = value;
      this.directoryUI.directory.filterFavorites = value;
      this.search();
    };

    // on click search bar options handler - searchbar
    this.mapSearchBar.btn.onclick = () => {
      let listItems = [
        {
          text: 'Show Favorites',
          id: 'favourite',
        },
        {
          text: this.strings.get('other.openProfile'),
          id: 'openProfile',
        },
        {
          text: this.strings.get('other.leaveDirectory'),
          id: 'leaveDirectory',
        },
      ];

      if (this.settings && !this.settings.filtersEnabled) {
        listItems.shift();
      }
      buildfire.components.drawer.open(
        {
          listItems,
        },
        (err, result) => {
          if (err) return console.error(err);

          if (result.id == 'favourite') {
            this.mapSearchBar.filterFavorites();
            buildfire.components.drawer.closeDrawer();
          }
          if (result.id == 'openProfile') {
            buildfire.auth.openProfile();
            buildfire.components.drawer.closeDrawer();
          }
          if (result.id == 'leaveDirectory') {
            this.directoryUI.leaveDirectory(() => {
              this.mapSearchBar.shouldShowAddButton(true);
              this.mapSearchBar.shouldShowOptionsButton(false);
              this.searchOnMapList();
            });
            buildfire.components.drawer.closeDrawer();
          }
        }
      );
    };

    this.mapSearchBar.applyListeners();
  }

  initListView() {
    this.usersView.onItemClicked = (item, e) => {
      if (!item.data.userId) return;

      var img = new Image();
      var self = this;
      img.onload = function () {
        self.renderUserModal(item, item.imageUrl);
      };
      img.onerror = function () {
        self.renderUserModal(item, 'https://app.buildfire.com/app/media/avatar.png');
      };
      img.src = item.imageUrl;
    };

    this.usersView.onItemActionClicked = (item, e) => {
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

  initMapView() {
    defaultView.style.display = 'none';
    this.currentScreen = Keys.screenNameKeys.MAP.key;
    this.mapController = new MapView(this.user, this.strings, this.settings, this.directoryUI, this);
  }

  // showFilterScreen() {
  // 	this.filterScreen = new Filter({
  // 		widget: this,
  // 		settings: this.settings,
  // 	});
  // 	this.filterScreen.init();
  // }

  initCityListView(cityName, users) {
    // hide on map icons
    document.querySelector('.my-location-icon').style.display = 'none';
    document.querySelector('.onMap-users-list-icon').style.display = 'none';
    document.querySelector('.onMap-filter-icon').style.display = 'none';
    activeFilterIndicatorOnMap.style.display = 'none';

    mapSearchBar.innerHTML = '';
    this.mapSearchBar = new SearchBar('mapSearchBar', {
      filterScreen: this.filterScreen,
    });
    // this.initCitySearchBar();
    this.initMapSearchBar();
    this.strings.inject();
    gridView.innerHTML = '';
    if (this.cityListView) this.cityListView.clear();
    if (this.settings && this.settings.layout) {
      let cont = document.getElementById('mapListContent');
      if (this.settings.layout === 'grid') {
        this.cityListView = new buildfire.components.gridView('mapListContent', { enableAddButton: false, Title: '' });
        if (cont.classList.contains('listViewContainer')) {
          cont.classList.remove('listViewContainer');
        }
      } else {
        this.cityListView = new buildfire.components.listView('mapListContent', { enableAddButton: false, Title: '' });
        if (cont.classList.contains('gridViewContainer')) {
          cont.classList.remove('gridViewContainer');
        }
      }
    }
    let name;
    if (cityName !== 'all Users On Map') {
      // then this is a city view > render users from that city
      gridView.style.display = 'block';
      this.cityName = cityName;
      name = this.directoryUI.ui('p', gridView, cityName);
      let userCount = users && users.length ? users.length : 0;
      let count = this.directoryUI.ui('span', name, userCount, ['user-count']);
    } else {
      gridView.style.display = 'none';
    }
    this.cityUsers = users;
    this.noMore = false;
    this.userSkip = 0;
    let limit = this.userSkip + 10;
    if (users && users.length && this.userSkip + 10 > users.length) {
      limit = users.length;
      this.noMore = true;
    }
    this.cityUsers = this.directoryUI.handleResults(this.cityUsers);
    let userSubset = this.cityUsers.slice(this.userSkip, limit);
    this.cityListView.loadListViewItems(userSubset);
    this.userSkip += 10;
    let appendCityUsers = () => {
      let users = this.cityUsers;
      if (!users || !users.length || this.noMore) return;
      let limit = this.userSkip + 10;
      if (this.userSkip + 10 > users.length) {
        limit = users.length;
        this.noMore = true;
      }
      if (cityName !== 'all Users On Map') {
        let userCount = users && users.length ? users.length : 0;
        let count = this.directoryUI.ui('span', name, userCount, ['user-count']);
      }
      let userSubset = users.slice(this.userSkip, limit);

      this.cityListView.loadListViewItems(userSubset);
      this.userSkip += 10;
    };
    this.cityListView.container.onscroll = (e) => {
      const { scrollTop, clientHeight, scrollHeight } = this.cityListView.container;

      if (scrollTop + clientHeight > scrollHeight * 0.8) {
        this.debounce(appendCityUsers);
      }
    };

    this.cityListView.onItemClicked = (item, e) => {
      if (!item.data.userId) return;

      var img = new Image();
      var self = this;
      img.onload = function () {
        self.renderUserModal(item, item.imageUrl);
      };
      img.onerror = function () {
        self.renderUserModal(item, 'https://app.buildfire.com/app/media/avatar.png');
      };
      img.src = item.imageUrl;
    };

    this.cityListView.onItemActionClicked = (item, e) => {
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
    if (this.cityListView.container.childElementCount < 1) {
      console.log('from ifffffff empty state');
      this.debounce(this.searchOnMapList.bind(this));
      // mapList.style.height = '1rem';
      // emptyStateTwo.classList.add('active');
    } else {
      // emptyStateTwo.classList.remove('active');
    }
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

  renderUserModal(item, image) {
    if (!buildfire.components || !buildfire.components.drawer) return;
    const { data } = item;
    const { displayName, email, badges, phoneNumber } = data;
    const { actionItem, userSubtitleShowMode, allowShowProfileComponent } = this.settings;

    let subtitle = '';

    if (
      (!userSubtitleShowMode || userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key) &&
      email &&
      email.length > 0 &&
      email.indexOf('facebook') === -1 &&
      email.indexOf('twitter') === -1
    ) {
      subtitle = email;
    }

    if (userSubtitleShowMode === Keys.userSubtitleShowModeKeys.SHOW_PHONE_NUMBER.key && phoneNumber) {
      subtitle = phoneNumber;
    }

    const options = {
      header: `
			<div style="display: flex; align-items: center;">
				<div class="avatar">
					<img src="${image}" />
				</div>

				<div class="user-info-holder ellipsis">
					<h4 class="user-title whiteTheme ellipsis">${displayName ? displayName : 'Someone'}</h4>
					<p class="user-subtitle ellipsis">${subtitle}</p>
				</div>
			</div>
			`,
      enableFilter: false,
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
      const tabs = {
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
      };

      if (allowShowProfileComponent) {
        tabs.listItems.splice(1, 0, {
          id: 'viewProfile',
          icon: '',
          text: this.strings.get('other.viewProfile') ? this.strings.get('other.viewProfile') : 'View Profile',
        });
      }
      options.tabs.push(tabs);
    }

    options.tabs.push({
      text: `<span class="glyphicon glyphicon-tags"></span>`,
      content: `
			<div style="word-break: normal !important; grid-template-columns: repeat(4, 1fr); display: grid; grid-column-gap: .75rem; grid-row-gap: 1.5rem; padding: 1rem .5rem; padding-bottom: calc(1rem + env(safe-area-inset-bottom));">

				${
          badges.length
            ? badges
                .map((badge) => {
                  return `
											<div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
												<div style="border-radius: .25rem; width: 4rem; height: 4rem; position: relative;">
													<img style="border-radius: .25rem; width: 4rem; height: 4rem; object-fit: cover; overflow: hidden;" src="${badge.imageUrl}" alt="">
													${
                            badge.appliedCount
                              ? `<span style="display: block; background-color: rgba(120, 120, 120, 0.5); color: #fff; border-radius: 1rem; position: absolute; top: -.75rem; right: calc(0% - .75rem); padding: .25rem .5rem; text-align: left;" class="successBackgroundTheme">${badge.appliedCount}</span>`
                              : ''
                          }
												</div>
												<h5 style="margin: .75rem 0 .125rem 0; font-weight: bold; word-break: break;">${badge.name}</h5>
												<p style="font-size: .75rem; opacity: .75; margin: 0;">${new Date(badge.earned).toLocaleDateString()}</p>
											</div>
									`;
                })
                .join(' ')
            : `<div style="text-transform: capitalize; text-align: center; font-size: 14px; padding: 24px; opacity: .7; min-height: 80px; display: flex; align-items:center;"><span>no badges yet!</span></div>`
        }
				</div>
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
        case 'viewProfile': {
          buildfire.components.drawer.closeDrawer();
          setTimeout(() => {
            buildfire.auth.openProfile(data.userId);
          }, 100);
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
        console.log('USERRRRR FROM DB', user);
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
    this.usersView.items.forEach((item) => {
      if (typeof item.isFavorite !== 'undefined') return;

      item.isFavorite = (favorites || []).indexOf(item.data.userId) > -1;
      item.update();
    });
  }

  search(index = 0) {
    buildfire.appearance.titlebar.show();
    if (index == 0) {
      this.usersView.container.onscroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = this.usersView.container;

        if (!this.inProgress && scrollTop + clientHeight > scrollHeight * 0.8) {
          this.currentPageIndex++;
          this.search(this.currentPageIndex);
        }
      };
    }

    this.inProgress = true;
    this.currentPageIndex = index;
    buildfire.spinner.show();
    console.log('this.searchBar.value', this.searchBar.value);
    this.directoryUI.search(this.searchBar.value, this.searchFilters, this.currentPageIndex, 15, (error, results) => {
      console.log('search results from FILTERRR', results);
      buildfire.spinner.hide();
      if (index == 0) this.usersView.clear();
      if (error) return console.error(error);

      this.usersView.loadListViewItems(results);

      this.inProgress = false;

      if (results.length == 0) {
        this.usersView.container.onscroll = null;
      }

      if (widget.usersView.container.childElementCount < 1) {
        this.emptyState.classList.add('active');
      } else {
        this.emptyState.classList.remove('active');
      }
    });
  }
  // handle search functionality from MAP list view
  searchOnMapList(index = 0) {
    mapList.style.height = 'auto';
    gridView.style.display = 'none';
    buildfire.appearance.titlebar.show();
    if (index == 0) {
      console.log('this', this);
      this.cityListView.container.onscroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = this.cityListView.container;

        if (!this.inProgress && scrollTop + clientHeight > scrollHeight * 0.8) {
          this.currentPageIndex++;
          this.searchOnMapList(this.currentPageIndex);
        }
      };
    }

    this.inProgress = true;
    this.currentPageIndex = index;
    buildfire.spinner.show();
    console.log('this.mapSearchBar.value', this.mapSearchBar.value);
    this.directoryUI.search(this.mapSearchBar.value, this.searchFilters, this.currentPageIndex, 15, (error, results) => {
      console.log('search results from searchOnMapList', results);
      buildfire.spinner.hide();
      if (index == 0) this.cityListView.clear();
      if (error) return console.error(error);

      this.cityListView.loadListViewItems(results);

      this.inProgress = false;

      if (results.length == 0) {
        this.usersView.container.onscroll = null;
      }
      if (this.cityListView.container.childElementCount < 1) {
        console.log('from ifffffff empty state');
        // this.cityListView.clear();
        mapList.style.height = '1rem';
        emptyStateTwo.classList.add('active');
      } else {
        emptyStateTwo.classList.remove('active');
      }
      // if (widget.usersView.container.childElementCount < 1) {
      // 	this.emptyState.classList.add('active');
      // } else {
      // 	this.emptyState.classList.remove('active');
      // }
    });
  }

  debounce(fnc) {
    // clear search filter to get correct results
    this.searchFilters = {};
    if (this.tmr) clearTimeout(this.tmr);
    this.tmr = setTimeout(() => (fnc ? fnc() : this.search()), 500);
  }

  filter(fromMap) {
    if (fromMap) return;
    //construct filter object from active filters
    let filters = this.activeFilters;
    let orS = [];
    let finalFilter = {};
    if (Object.keys(filters) && Object.keys(filters).length > 0) {
      let categories = Object.keys(filters);
      for (let i = 0; i < categories.length; i++) {
        let and = [];
        if (categories[i] == Keys.categoryTypes.BIRTHDATE.key) {
          console.log('KEY');
          let birthdate = filters[categories[i]];
          let bd = { '_buildfire.index.date1': { $gte: new Date(birthdate.max), $lte: new Date(birthdate.min) } };
          and.push(bd);
        } else {
          if (filters[categories[i]].length > 0) {
            filters[categories[i]].forEach(function (item) {
              and.push({ '_buildfire.index.array1.string1': item });
            });
          }
        }
        orS.push({
          $or: and,
        });
      }
    } else {
      orS = null;
    }

    console.log('orSorSorSorS from FILTERRRR', orS);
    if (orS) {
      finalFilter = {
        $and: orS,
      };
    }

    this.searchFilters = finalFilter;
    if (this.isFilterFromMapList) {
      this.cityListView.clear();
      this.searchOnMapList();
    } else {
      this.usersView.clear();
      this.search();
    }
  }

  // filter() {
  // 	//construct filter object from active filters
  // 	let filters = this.activeFilters;
  // 	let andS = [];
  // 	let finalFilter = {};
  // 	// console.log("CATEGORIES selected",filters);

  // 	if (Object.keys(filters) && Object.keys(filters).length > 0) {
  // 		let categories = Object.keys(filters);
  // 		for (let i = 0; i < categories.length; i++) {
  // 			let selectedTagsPerOneCategory = [];
  // 			if (categories[i] == Keys.categoryTypes.BIRTHDATE.key) {
  // 				console.log("KEY")
  // 				let birthdate = filters[categories[i]];
  // 				let bd = { "_buildfire.index.date1": { $gte: new Date(birthdate.min), $lte: new Date(birthdate.max) } };
  // 				selectedTagsPerOneCategory.push(bd);
  // 			}
  // 			else {
  // 				if (filters[categories[i]].length > 0) {
  // 					filters[categories[i]].forEach(function (item) {
  // 						selectedTagsPerOneCategory.push(item);
  // 					});
  // 				}
  // 			}
  // 			andS.push({"tags.tagName": { $in: selectedTagsPerOneCategory }});
  // 		}
  // 		// finalFilter = {"$and": [{"tags.tagName": { $in: [selectedTags[0]] }},{ "tags.tagName": { $in: [selectedTags[1]]}} ] }
  // 		// finalFilter = {wallet: { $elemMatch:{"tags" : "Tshirt", "store":"Nike"}}}
  // 	}
  // 	else {
  // 		andS = null;
  // 	}

  // 	if (andS) {
  // 		finalFilter = {
  // 			"$and": andS
  // 		}
  // 	}
  // 	this.usersView.clear();
  // 	this.searchFilters = finalFilter;
  // 	this.search();
  // }

  createMockUser() {
    let tags = [
      {
        '2ee7035a-5381-11e9-8fc5-06e43182e96c': [
          {
            tagName: '$$profile_cancer_type',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type1',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type2',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_birth_year:1980',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_birth_month:2',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_country:lb',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_state:beirut_governorate',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_city:beirut',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_town:beirut',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
        ],
      },
      {
        '2ee7035a-5381-11e9-8fc5-06e43182e96c': [
          {
            tagName: '$$profile_cancer_type',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type3',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_birth_year:1999',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_birth_month:7',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_country:tr',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.427Z',
            lastAssgined: '2022-03-04T17:29:39.427Z',
          },
          {
            tagName: '$$profile_state:mersin',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.427Z',
            lastAssgined: '2022-03-04T17:29:39.427Z',
          },
          {
            tagName: '$$profile_city:akdeniz',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.428Z',
            lastAssgined: '2022-03-04T17:29:39.428Z',
          },
          {
            tagName: '$$profile_town:mersin',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.428Z',
            lastAssgined: '2022-03-04T17:29:39.428Z',
          },
        ],
      },

      {
        '2ee7035a-5381-11e9-8fc5-06e43182e96c': [
          {
            tagName: '$$profile_cancer_type',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type1',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type2',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_cancer_type:type3',
            appliedCount: 1,
            firstAssgined: '2022-02-25T13:36:22.655Z',
            lastAssgined: '2022-02-25T13:36:22.655Z',
          },
          {
            tagName: '$$profile_birth_year:2002',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_birth_month:2',
            appliedCount: 1,
            firstAssgined: '2022-03-02T15:21:24.283Z',
            lastAssgined: '2022-03-02T15:21:24.283Z',
          },
          {
            tagName: '$$profile_country:us',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.427Z',
            lastAssgined: '2022-03-04T17:29:39.427Z',
          },
          {
            tagName: '$$profile_state:dc',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.427Z',
            lastAssgined: '2022-03-04T17:29:39.427Z',
          },
          {
            tagName: '$$profile_city:district_of_columbia',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.428Z',
            lastAssgined: '2022-03-04T17:29:39.428Z',
          },
          {
            tagName: '$$profile_town:washington',
            appliedCount: 1,
            firstAssgined: '2022-03-04T17:29:39.428Z',
            lastAssgined: '2022-03-04T17:29:39.428Z',
          },
        ],
      },
    ];
    let locations = [
      {
        lat: 33.8937913,
        lng: 35.5017767,
      },
      {
        lat: 36.81273,
        lng: 34.64213,
      },
      {
        lat: 47.751076,
        lng: -120.740135,
      },
    ];
    let locationkeys = ['beirut,lb', 'akdeniz,tr', 'district_of_columbia,us'];
    let url = 'http://filltext.com/?rows=100&firstName={firstName}&lastName={lastName}&isActive=true&displayName={firstName}~{lastName}&phoneNumber={phone}&email={email}&userId={index}';
    let userList = [];
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          userList = data.map((item, index) => {
            item['tags'] = tags[index % tags.length]['2ee7035a-5381-11e9-8fc5-06e43182e96c'];
            item['location'] = locations[index % locations.length];
            item['locationKey'] = locationkeys[index % locationkeys.length];
            item['joinDate'] = 1646421086535;
            item['badgeCount'] = 0;
            item['badges'] = [];
            item['tagsCount'] = tags[index % tags.length]['2ee7035a-5381-11e9-8fc5-06e43182e96c'].length;
            item['_buildfire'] = {};
            item['_buildfire']['index'] = {
              text: item['displayName'],
              string1: item['userId'],
              array1: [{ string1: item['locationKey'] }],
            };
            return item;
          });
          console.log(userList);
          buildfire.appData.bulkInsert(userList, '$$userDirectory', (err, result) => {
            if (err) return console.error('Error while inserting your data', err);

            console.log('Insert successfull', result);
          });
          // userList.forEach(item => {
          // 	Users.add(item, (err, res) => {
          // 	});
          // });
          // new DirectoryUser(user).toJson(this.settings, (error, json) => {
          // 	if (error) return console.error(error);
          // 	console.log("new User", json);
          // 	Users.add(json, (err, res) => {
          // 		console.log("new user added to dir");
          // 	});
          // });
        }
      });
  }

  goBack() {
    console.log('this.currentScreen', this.currentScreen);
    switch (this.currentScreen) {
      case Keys.screenNameKeys.LIST.key: {
        buildfire.navigation.restoreBackButtonClick();
        buildfire.navigation.goBack();
        break;
      }
      case Keys.screenNameKeys.MAP.key: {
        buildfire.navigation.restoreBackButtonClick();
        buildfire.navigation.goBack();
        break;
      }
      case Keys.screenNameKeys.MAPLIST.key: {
        this.currentScreen = Keys.screenNameKeys.MAP.key;
        gridViewContainer.classList.toggle('show');
        googleMap.classList.remove('hide');
        console.log('from maplist go back');
        // hide on map icons
        document.querySelector('.my-location-icon').style.display = 'block';
        document.querySelector('.onMap-users-list-icon').style.display = 'block';
        if (this.settings && this.settings.filtersEnabled) {
          document.querySelector('.onMap-filter-icon').style.display = 'block';
        }
        break;
      }
      case Keys.screenNameKeys.FILTER.key: {
        if (this.settings && this.settings.mapEnabled) {
          if (!this.isFilterFromMapList) {
            this.currentScreen = Keys.screenNameKeys.MAP.key;
            filterView.classList.toggle('show');
            mapView.style.display = 'block';
            googleMap.style.display = 'block';
            console.log('this.mapController', this.mapController);
            // this.mapController.updateMarkers();
            // restart the map to get the new results
            this.mapController.locations = {};
            this.mapController.fetchedUserIds = [];
            this.mapController.fetchedCities = [];
            this.mapController.markerClusterer = null;
            this.mapController.state = {
              isBusy: false,
              citySkip: 0,
              userSkip: 0,
              pageSize: 50,
              markers: [],
              cities: [],
              renderedMarkerIds: [],
            };

            this.mapController.initMap();
          } else {
            // so it's from MapList go back to Map list
            filterView.classList.toggle('show');
            mapView.style.display = 'block';
            googleMap.style.display = 'block';
            gridViewContainer.classList.toggle('show');
            document.querySelector('.onMap-users-list-icon').onclick();
          }
        } else {
          this.currentScreen = Keys.screenNameKeys.LIST.key;
          filterView.classList.toggle('show');
          defaultView.style.display = 'block';
        }
        break;
      }
      default: {
        buildfire.navigation.restoreBackButtonClick();
        buildfire.navigation.goBack();
        break;
      }
    }
  }
}
