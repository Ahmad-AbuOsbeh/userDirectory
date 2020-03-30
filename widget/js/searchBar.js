class SearchBar {
	constructor(containerId, options) {
		this.container = document.getElementById(containerId);
		if (!this.container) throw 'Cant find container';

		this.container.classList.add('search-bar');

		this.input = ui.create('input', this.container, null, ['search-bar__input', 'form-control']);
		this.input.setAttribute('type', 'search');
		this.input.setAttribute('bfString', 'other.searchUser');

		this.favorites = ui.create('span', this.container, null, ['favorites', 'search-bar__icon', 'icon', 'icon-star-empty']);
		this.favorites.onclick = () => this.filterFavorites();

		this.add = ui.create('span', this.container, null, ['join', 'search-bar__icon', 'icon', 'icon-plus']);

		this.options = ui.create('div', this.container, null, ['btn-group']);

		const btn = ui.create('div', this.options, '<span class="icon icon-ellipsis"></span>', ['dropdown-toggle']);

		btn.setAttribute('data-toggle', 'dropdown');
		btn.setAttribute('aria-haspopup', 'true');
		btn.setAttribute('aria-expanded', 'false');

		this.dropdown = ui.create('ul', this.options, null, ['dropdown-menu']);

		btn.onclick = () => {
			if (this.dropdown.classList.contains('show')) {
				this.dropdown.classList.remove('show');
			} else {
				this.dropdown.classList.add('show');
			}
		};

		this.favoritesFilter = false;
	}

	get value() {
		return this.input.value;
	}

	setDropdownItems(items) {
		this.dropdown.innerHTML = '';
		items.forEach(item => {
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
			this.options.classList.add('hidden');
		} else {
			this.add.classList.add('hidden');
			this.options.classList.remove('hidden');
		}
	}

	filterFavorites() {
		if (this.favoritesFilter) {
			this.favoritesFilter = false;
			this.favorites.classList.replace('icon-star', 'icon-star-empty');
		} else {
			this.favoritesFilter = true;
			this.favorites.classList.replace('icon-star-empty', 'icon-star');
		}

		this.onFavoritesButtonClicked(this.favoritesFilter);
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
