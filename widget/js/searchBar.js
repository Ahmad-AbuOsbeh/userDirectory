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

		this.options = ui.create('span', this.container, null, ['join', 'search-bar__icon', 'icon', 'icon-ellipsis', 'hidden']);

		this.favoritesFilter = false;
	}

	get value() {
		return this.input.value;
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

// class SearchBar extends HTMLElement {
// 	constructor() {
// 		super();

// 		this.wrapper = ui.create('header', null, null, ['search-bar']);

// 		let style = `
// 			.search-bar {
// 				padding: 1em;
// 				display: flex;
// 			}

// 			.search-bar__input {
// 				border: 0;
// 				outline: 0;
// 				display: block;
// 				width: 100%;
// 				height: 34px;
// 				padding: 6px 12px;
// 				font-size: 13px;
// 				line-height: 20px;
// 				color: #555555;
// 				background-color: #ffffff;
// 				background-image: none;
// 				border: 1px solid #dddddd;
// 				border-radius: 4px;
// 				box-shadow:none;
// 				-webkit-appearance:none;
// 			}

// 			.search-bar__icon {

// 			}
// 		`;
// 		ui.create('style', this.wrapper, style, []);

// 		this.input = ui.create('input', this.wrapper, null, ['search-bar__input', 'form-control']);
// 		this.input.setAttribute('type', 'search');
// 		this.input.setAttribute('bfString', 'other.searchUser');

// 		this.favorites = ui.create('span', this.wrapper, null, ['favorites', 'search-bar__icon', 'icon', 'icon-star']);

// 		let shadowRoot = this.attachShadow({ mode: 'open' });
// 		shadowRoot.appendChild(this.wrapper);
// 	}

// 	get value() {
// 		return this.input.value;
// 	}
// }

// window.customElements.define('search-bar', SearchBar);
