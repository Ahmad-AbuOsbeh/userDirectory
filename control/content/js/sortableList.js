class BadgeList {
	constructor(element, badges = []) {
		// sortableList requires Sortable.js
		if (typeof Sortable == 'undefined') throw 'please add Sortable first to use sortableList components';
		this.badges = [];
		this.init(element);
		this.loadItems(badges);
	}

	// will be called to initialize the setting in the constructor
	init(element) {
		if (typeof element == 'string') this.element = document.getElementById(element);
		else this.element = element;
		//this._renderTemplate();
		this.element.classList.add('draggable-list-view');

		this._initEvents();
	}

	// this method allows you to replace the slider image or append to then if appendItems = true
	loadItems(badges, appendItems) {
		if (badges && badges instanceof Array) {
			if (!appendItems && this.badges.length !== 0) {
				// here we want to remove any existing badges since the user of the component don't want to append badges
				this._removeAll();
			}

			for (var i = 0; i < badges.length; i++) {
				this.badges.push(badges[i]);
				let row = document.createElement('div');
				this.injectItemElements(badges[i], this.badges.length - 1, row);
				this.element.appendChild(row);
			}

			this.onUpdate();
		}
	}

	// allows you to append a single item or an array of badges
	append(badges) {
		if (!badges) return;
		else if (!(badges instanceof Array) && typeof badges == 'object') badges = [badges];

		this.loadItems(badges, true);
	}

	// remove all badges in list
	clear() {
		this._removeAll();
	}

	// remove all the DOM element and empty the badges array
	_removeAll() {
		this.badges = [];
		this.element.innerHTML = '';
	}

	// append new sortable item to the DOM
	injectItemElements(item, index, divRow) {
		if (!item) throw 'Missing Item';
		divRow.innerHTML = '';
		divRow.setAttribute('arrayIndex', index);
		// Create the required DOM elements
		var moveHandle = document.createElement('span'),
			img = document.createElement('img'),
			editImg = document.createElement('img'),
			title = document.createElement('a'),
			editTitle = document.createElement('input'),
			tag = document.createElement('span'),
			editTag = document.createElement('input'),
			tagCount = document.createElement('span'),
			editTagCount = document.createElement('input'),
			edit = document.createElement('span'),
			cancel = document.createElement('button'),
			deleteButton = document.createElement('span'),
			save = document.createElement('button');

		// Add the required classes to the elements
		divRow.className = 'd-item clearfix';
		moveHandle.className = 'icon icon-menu cursor-grab';

		title.className = 'badge-name ellipsis';
		title.innerHTML = item.name;

		editTitle.setAttribute('type', 'text');
		editTitle.value = item.name;
		editTitle.classList = 'badge-name edit';

		tag.classList.add('tag-name');
		tag.innerHTML = item.tag;
		editTag.setAttribute('type', 'text');
		editTag.value = item.tag;
		editTag.classList = 'tag-name edit';

		tagCount.innerHTML = item.tagCount;
		tagCount.classList.add('tag-count');
		editTagCount.setAttribute('type', 'number');
		editTagCount.setAttribute('min', '1');
		editTagCount.setAttribute('max', '999');
		editTagCount.addEventListener('keydown', e => {
			if (['.', '-'].indexOf(e.key) > -1) {
				return e.preventDefault();
			}
		});
		editTagCount.value = item.tagCount;
		editTagCount.classList = 'tag-count edit';

		edit.className = 'icon icon-pencil btn-icon';
		deleteButton.className = 'btn btn--icon icon icon-cross2';
		cancel.innerHTML = 'Cancel';
		cancel.classList = 'btn btn-cancel edit';
		cancel.onclick = () => {
			editTag.value = item.tag;
			editTag.classList.remove('has-error');
			editTitle.value = item.name;
			editTitle.classList.remove('has-error');
			editTagCount.value = item.tagCount;
			editTagCount.classList.remove('has-error');
			divRow.classList.remove('edit');
		};
		save.innerHTML = 'Save';
		save.classList = 'btn btn-success edit';
		save.onclick = () => {
			let hasError = false;

			if (!editImg.src) {
				editImg.classList.add('has-error');
				hasError = true;
			} else {
				editImg.classList.remove('has-error');
			}
			if (!editTitle.value) {
				editTitle.classList.add('has-error');
				hasError = true;
			} else {
				editTitle.classList.remove('has-error');
			}
			if (!editTag.value) {
				editTag.classList.add('has-error');
				hasError = true;
			} else {
				editTag.classList.remove('has-error');
			}
			if (!editTagCount.value || editTagCount.value < 1) {
				editTagCount.classList.add('has-error');
				hasError = true;
			} else {
				editTagCount.classList.remove('has-error');
			}
			if (hasError) {
				return;
			}

			img.src = editImg.src;
			title.innerHTML = editTitle.value;
			tag.innerHTML = editTag.value;
			tagCount.innerHTML = editTagCount.value;
			divRow.classList.remove('edit');

			const badgeData = {
				imageUrl: editImg.getAttribute('data-src'),
				name: editTitle.value,
				tag: editTag.value,
				tagCount: editTagCount.value,
				rank: index,
				id: item.id
			};

			Badges.update(badgeData, console.log);
		};

		if (item.imageUrl) {
			img.src = buildfire.imageLib.cropImage(item.imageUrl, { width: 16, height: 16 });
		}

		editImg.src = buildfire.imageLib.cropImage(item.imageUrl, { width: 16, height: 16 });
		editImg.classList = 'item-img edit';
		editImg.setAttribute('data-src', item.imageUrl);
		editImg.onclick = () => {
			buildfire.imageLib.showDialog({ showIcons: false, multiSelection: false }, (error, result) => {
				if (result && result.selectedFiles && result.selectedFiles.length) {
					editImg.src = buildfire.imageLib.cropImage(result.selectedFiles[0], { width: 16, height: 16 });
					editImg.setAttribute('data-src', result.selectedFiles[0]);
				}
			});
		};

		divRow.appendChild(moveHandle);
		divRow.appendChild(img);
		divRow.appendChild(editImg);
		divRow.appendChild(title);
		divRow.appendChild(editTitle);
		divRow.appendChild(tag);
		divRow.appendChild(editTag);
		divRow.appendChild(tagCount);
		divRow.appendChild(editTagCount);
		divRow.appendChild(edit);
		divRow.appendChild(cancel);
		divRow.appendChild(deleteButton);
		divRow.appendChild(save);

		title.onclick = () => {
			let index = divRow.getAttribute('arrayIndex'); /// it may have bee reordered so get value of current property
			index = parseInt(index);
			this.onItemClick(item, index, divRow);
			return false;
		};

		edit.onclick = () => {
			divRow.classList.add('edit');
		};

		deleteButton.onclick = () => {
			let index = divRow.getAttribute('arrayIndex'); /// it may have bee reordered so get value of current property
			index = parseInt(index);
			let t = this;
			this.onDeleteItem(item, index, confirmed => {
				if (confirmed) {
					divRow.parentNode.removeChild(divRow);
					t.reIndexRows();
				}
			});
			return false;
		};
	}

	// initialize the generic events
	_initEvents() {
		var me = this;
		var oldIndex = 0;

		// initialize the sort on the container of the badges
		me.sortableList = Sortable.create(me.element, {
			animation: 150,
			onUpdate: function(evt) {
				var newIndex = me._getSortableItemIndex(evt.item);
				var tmp = me.badges.splice(oldIndex, 1)[0];
				me.badges.splice(newIndex, 0, tmp);
				me.reIndexRows();
				me.onOrderChange(tmp, oldIndex, newIndex);
			},
			onStart: function(evt) {
				oldIndex = me._getSortableItemIndex(evt.item);
			}
		});
	}

	reIndexRows() {
		let i = 0;
		this.element.childNodes.forEach(e => {
			if (e.setAttribute) {
				e.setAttribute('arrayIndex', i);
				i++;
			}
		});
		this.onUpdate();
	}

	// get item index from the DOM sortable elements
	_getSortableItemIndex(item) {
		var index = 0;
		while ((item = item.previousSibling) != null) {
			index++;
		}
		return index;
	}

	_cropImage(url, options) {
		if (!url) {
			return '';
		} else {
			return buildfire.imageLib.cropImage(url, options);
		}
	}

	/* This will be triggered when the order of badges changes
	  Example: if you move the first item location to be the second this will return item object, 0, 1 */
	onOrderChange(item, oldIndex, newIndex) {
		console.warn('please handle onOrderChange', item, oldIndex, newIndex);
	}

	// This will be triggered when you delete an item
	onDeleteItem(item, index) {
		console.error('please handle onDeleteItem', item);
	}

	// This will be triggered when you delete an item
	onItemClick(item, index, divRow) {
		console.error('please handle onItemClick', item);
	}

	onUpdate() {

	}
}
