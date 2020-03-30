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
