/**
 * Created by danielhindi on 8/31/17.
 */

class Settings {
	static get(callback) {
		/// supporting both callback and promises
		return new Promise((resolve, reject) => {
			buildfire.datastore.get('settings', (e, obj) => {
				if (e) {
					reject(e);
					if (callback) callback(e);
				} else {
					let s = new Settings(obj);
					resolve(s);
					if (callback) callback(null, s);
				}
			});
		});
	}

	constructor(dbObj = { data: {} }) {
		this.autoEnlistAll = dbObj.data.autoEnlistAll || false;
		this.tagFilter = dbObj.data.tagFilter || [];
		this.actionItem = dbObj.data.actionItem || null;
		this.badgePushNotifications = dbObj.data.badgePushNotifications || null;
		this.ranking = dbObj.data.ranking || 'ALPHA_ASC';
	}

	toRawData() {
		return {
			autoEnlistAll: this.autoEnlistAll,
			tagFilter: this.tagFilter,
			actionItem: this.actionItem,
			badgePushNotifications: this.badgePushNotifications,
			ranking: this.ranking
		};
	}

	save(callback) {
		return new Promise((resolve, reject) => {
			buildfire.datastore.save(this.toRawData(), 'settings', (e, r) => {
				if (e) {
					reject(e);
					if (callback) callback(e);
				} else {
					resolve(r);
					if (callback) callback(null, r);
				}
			});
		});
	}

	onUpdate(callback) {
		buildfire.datastore.onUpdate(callback);
	}
}
