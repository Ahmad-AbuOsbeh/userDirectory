const badgeListUI = {
	sortableList: null,
	container: null,
	data: null,
	id: null,
	badges: [],
	/*
		This method will call the appData to pull a single object
		it needs to have an array property called `items` each item need {title, imgUrl}
	 */
	init(elementId) {
		this.container = document.getElementById(elementId);
		this.container.innerHTML = 'loading...';
		let t = this;

		Badges.get((err, badges) => {
			
			this.badges = badges;
			if (this.badges.length == 0) this.container.innerHTML = 'No badges have been added yet.';
			else this.container.innerHTML = '';

			badgeListUI.render(this.badges);
		});
	},

	render(badges) {
		let t = this;
		this.badgeList = new BadgeList(this.container, badges || []);

		this.badgeList.onItemClick = this.onItemClick;
		this.badgeList.onDeleteItem = (item, index, callback) => {
			buildfire.notifications.confirm(
				{
					message: 'Are you sure you want to delete ' + item.name + '?',
					confirmButton: { text: 'Delete', key: 'y', type: 'danger' },
					cancelButton: { text: 'Cancel', key: 'n', type: 'default' }
				},
				function(e, data) {
					if (e) console.error(e);
					if (data.selectedButton.key == 'y') {
						badgeListUI.badgeList.badges.splice(index, 1);
						Badges.delete(item.id, callback);
						badgeListUI.badgeList.loadItems(badgeListUI.badgeList.badges, false);
					}
				}
			);
		};

		this.badgeList.onOrderChange = (item, oldIndex, newIndex) => {
			badgeListUI.badgeList.badges.forEach((badge, index) => {
				badgeListUI.badgeList.badges[index].rank = index;
				Badges.update(badgeListUI.badgeList.badges[index], console.error);
			});
		};
	},
	/**
	 * Updates item in appData and updates sortable list UI
	 * @param {Object} item Item to be updated
	 * @param {Number} index Array index of the item you are updating
	 * @param {HTMLElement} divRow Html element (div) of the entire row that is being updated
	 * @param {Function} callback Optional callback function
	 */
	updateItem(item, index, divRow, callback) {
		console.log(divRow);
		badgeListUI.badgeList.injectItemElements(item, index, divRow);

		Badges.update(item);
	},
	/**
	 * This function adds item to appData and updates sortable list UI
	 * @param {Object} item Item to be added to appData
	 * @param {Function} callback Optional callback function
	 */
	addItem(item, callback) {
		Badges.add(item, (error, result) => {
			if (error) return callback(error, null);
			
			badgeListUI.badgeList.append(result.data);
			callback(null, result.data);
		});

	},
	onItemClick(item, divRow) {
		buildfire.notifications.alert({ message: item.title + ' clicked' });
	}
};

// class badgeListUI {
// 	constructor(selector) {
// 		this.container = document.getElementById(selector);
// 		this.badgeList = null;
// 		this.badges = null;
// 		this.id = null;
// 		this.init();
// 	}
// 	get items() {
// 		return badgeListUI.sortableList.items;
// 	}
// 	/*
// 		This method will call the datastore to pull a single object
// 		it needs to have an array property called `items` each item need {title, imgUrl}
// 	 */
// 	init() {
// 		this.container.innerHTML = 'loading...';
// 		let t = this;

// 		// Badges.get((error, badges) => {
// 		// 	if (error) return console.error(error);

// 		// 	this.badges = badges;

// 		// 	if (!badges.length) this.container.innerHTML = 'No items have been added yet.';
// 		// 	else this.container.innerHTML = '';

// 		// 	this.render();
// 		// });
// 	}

// 	render(badges) {
// 		let t = this;
// 		// this.newBadgeRow = new NewBadgeRow(this.container);
// 		this.badgeList = new BadgeList(this.container, badges || []);

// 		this.badgeList.onItemClick = this.onItemClick;
// 		this.badgeList.onDeleteItem = (item, index, callback) => {
// 			buildfire.notifications.confirm(
// 				{
// 					message: 'Are you sure you want to delete ' + item.title + '?',
// 					confirmButton: { text: 'Delete', key: 'y', type: 'danger' },
// 					cancelButton: { text: 'Cancel', key: 'n', type: 'default' }
// 				},
// 				function(e, data) {
// 					if (e) console.error(e);
// 					if (data.selectedButton.key == 'y') {
// 						badgeListUI.sortableList.items.splice(index, 1);
// 						Badges.delete(item, console.error);
// 					}
// 				}
// 			);
// 		};

// 		this.badgeList.onOrderChange = (item, oldIndex, newIndex) => {
// 			buildfire.datastore.save({ $set: { items: badgeListUI.sortableList.items } }, this.tag, () => {});
// 		};
// 	}
// 	/**
// 	 * Updates item in datastore and updates sortable list UI
// 	 * @param {Object} item Item to be updated
// 	 * @param {Number} index Array index of the item you are updating
// 	 * @param {HTMLElement} divRow Html element (div) of the entire row that is being updated
// 	 * @param {Function} callback Optional callback function
// 	 */
// 	updateItem(item, index, divRow, callback) {
// 		console.log(divRow);
// 		badgeListUI.sortableList.injectItemElements(item, index, divRow);
// 		let cmd = { $set: {} };
// 		cmd.$set['items.' + index] = item;
// 		buildfire.datastore.save(cmd, this.tag, (err, data) => {
// 			if (err) {
// 				console.error(err);
// 				if (callback) return callback(err);
// 			}
// 			if (callback) return callback(null, data);
// 		});
// 	}
// 	/**
// 	 * This function adds item to datastore and updates sortable list UI
// 	 * @param {Object} item Item to be added to datastore
// 	 * @param {Function} callback Optional callback function
// 	 */
// 	addItem(item, callback) {
// 		let cmd = {
// 			$push: { items: item }
// 		};
// 		buildfire.datastore.save(cmd, this.tag, (err, data) => {
// 			if (err) {
// 				console.error(err);
// 				if (callback) return callback(err);
// 			}
// 			if (callback) return callback(null, data);
// 		});

// 		badgeListUI.sortableList.append(item);
// 	}
// 	onItemClick(item, divRow) {
// 		buildfire.notifications.alert({ message: item.title + ' clicked' });
// 	}
// }
