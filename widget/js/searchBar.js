class SearchBar {
  constructor(containerId, options) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw 'Cant find container';
    this.filterScreen;
    if (options && options.filterScreen) this.filterScreen = options.filterScreen;
    this.container.classList.add('search-bar');
    this.container.classList.add('backgroundColorTheme');

    // search icon
    this.searchIcon = ui.create('i', this.container, null, ['material-icons', 'mdc-text-field__icon', 'mdc-theme--text-icon-on-background']);
    this.searchIcon.setAttribute('tabindex', '0');
    this.searchIcon.setAttribute('role', 'button');
    this.searchIcon.setAttribute('id', 'searchLocationsBtn');
    this.searchIcon.innerHTML = 'search';

    this.input = ui.create('input', this.container, null, ['search-bar__input', 'form-control']);
    this.input.setAttribute('type', 'search');
    this.input.setAttribute('bfString', 'other.searchUser');
    this.iconFilterContainer = ui.create('div', this.container, null, ['icon-filter-container']);
    if (!document.getElementById('activeFilterIndicatorTwo')) {
      this.activeFilterIndicator = ui.create('span', this.iconFilterContainer, null, null);
      this.activeFilterIndicator.setAttribute('id', 'activeFilterIndicatorTwo');
    }

    this.filterButton = ui.create('i', this.iconFilterContainer, null, ['material-icons-outlined', 'mdc-text-field__icon', 'mdc-theme--text-icon-on-background', 'hidden']);
    this.filterButton.onclick = () => this.goToFilterScreen();

    this.filterButton.setAttribute('tabindex', '0');
    this.filterButton.setAttribute('role', 'button');
    this.filterButton.setAttribute('id', 'filterIconBtn');
    this.filterButton.innerHTML = 'filter_alt';

    this.favorites = ui.create('span', this.container, null, ['favorites', 'search-bar__icon', 'icon', 'glyphicon', 'glyphicon-star-empty']);
    this.favorites.onclick = () => this.filterFavorites();

    this.add = ui.create('span', this.container, null, ['join', 'search-bar__icon', 'icon', 'glyphicon', 'glyphicon-plus', 'hidden']);

    this.options = ui.create('div', this.container, null, ['btn-group', 'hidden']);

    this.btn = ui.create('div', this.options, '<span class="icon glyphicon glyphicon-option-horizontal horizontal-options"></span>', ['dropdown-toggle']);

    this.btn.setAttribute('data-toggle', 'dropdown');
    this.btn.setAttribute('aria-haspopup', 'true');
    this.btn.setAttribute('aria-expanded', 'false');

    this.dropdown = ui.create('ul', this.options, null, ['dropdown-menu', 'backgroundColorTheme']);

    // btn.onclick = () => {
    //   if (this.dropdown.classList.contains('show')) {
    //     this.dropdown.classList.remove('show');
    //   } else {
    //     this.dropdown.classList.add('show');
    //     setTimeout(() => {
    //       document.addEventListener(
    //         'click',
    //         (e) => {
    //           if (e.target !== this.dropdown) {
    //             this.dropdown.classList.remove('show');
    //           }
    //         },
    //         { once: true }
    //       );
    //     }, 100);
    //   }
    //   buildfire.components.drawer.openBottomListDrawer(
    //     {
    //       listItems: [
    //         {
    //           text: 'Show Favorites',
    //           id: 'favourite',
    //           action: () => this.mapSearchBar.filterFavorites(),
    //         },
    //         {
    //           text: this.strings.get('other.openProfile'),
    //           id: 'openProfile',
    //           action: () => buildfire.auth.openProfile(),
    //         },
    //         {
    //           text: this.strings.get('other.leaveDirectory'),
    //           id: 'leaveDirectory',
    //           action: () => {
    //             this.directoryUI.leaveDirectory(() => {
    //               this.mapSearchBar.shouldShowAddButton(true);
    //               this.mapSearchBar.shouldShowOptionsButton(false);
    //               this.searchOnMapList();
    //             });
    //           },
    //         },
    //       ],
    //     },
    //     (err, result) => {
    //       if (err) return console.error(err);

    //       console.log('Action selected:', result.id);
    //       if (result.id == 'favourite') {
    //         this.mapSearchBar.filterFavorites();
    //       }
    //       if (result.id == 'openProfile') {
    //         buildfire.auth.openProfile();
    //       }
    //       if (result.id == 'leaveDirectory') {
    //         this.directoryUI.leaveDirectory(() => {
    //           this.mapSearchBar.shouldShowAddButton(true);
    //           this.mapSearchBar.shouldShowOptionsButton(false);
    //           this.searchOnMapList();
    //         });
    //       }
    //     }
    //   );
    // };

    this.favoritesFilter = false;
    this.shouldShowFavouriteButton(false);
    this.shouldShowFilterButton(false);
  }

  get value() {
    return this.input.value;
  }

  setDropdownItems(items) {
    this.dropdown.innerHTML = '';
    items.forEach((item) => {
      const i = ui.create('li', this.dropdown, item.text, []);
      i.onclick = () => {
        item.action();
        this.dropdown.classList.remove('show');
      };
    });
  }

  shouldShowAddButton(value) {
    if (value) {
      this.add.classList.remove('hidden');
      // this.options.classList.add('hidden');
    } else {
      this.add.classList.add('hidden');
      // this.options.classList.remove('hidden');
    }
  }

  shouldShowOptionsButton(value) {
    if (value) {
      // this.add.classList.remove('hidden');
      this.options.classList.remove('hidden');
    } else {
      // this.add.classList.add('hidden');
      this.options.classList.add('hidden');
    }
  }

  shouldShowFilterButton(value) {
    console.log('Show filter BTON ??', value);
    if (value) {
      // this.add.classList.remove('hidden');
      this.filterButton.classList.remove('hidden');
    } else {
      // this.add.classList.add('hidden');
      this.filterButton.classList.add('hidden');
    }
  }
  shouldShowFavouriteButton(value) {
    if (value) {
      // this.add.classList.remove('hidden');
      this.favorites.classList.remove('hidden');
    } else {
      // this.add.classList.add('hidden');
      this.favorites.classList.add('hidden');
    }
  }

  filterFavorites() {
    if (this.favoritesFilter) {
      this.favoritesFilter = false;
      this.favorites.classList.replace('glyphicon-star', 'glyphicon-star-empty');
    } else {
      this.favoritesFilter = true;
      this.favorites.classList.replace('glyphicon-star-empty', 'glyphicon-star');
    }

    this.onFavoritesButtonClicked(this.favoritesFilter);
  }

  goToFilterScreen() {
    if (this.filterScreen) {
      console.log('from filterrrrrrrrrrrr');
      if (this.filterScreen.state.initialized) {
        this.filterScreen.show();
      } else {
        this.filterScreen.init();
      }
    }
  }

  onChange() {
    console.log('handle onChange');
  }

  onAddButtonClicked() {
    console.log('handle onAddButtonClicked');
  }
  onOptionsButtonClicked() {
    console.log('handle onAddButtonClicked');
  }
  onFavoritesButtonClicked() {
    console.log('handle onAddButtonClicked');
  }

  applyListeners() {
    this.options.onclick = this.onOptionsButtonClicked;
    this.add.onclick = this.onAddButtonClicked;
    this.input.onkeyup = this.onChange;
  }
}
