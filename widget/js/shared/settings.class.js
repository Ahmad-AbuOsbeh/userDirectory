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
		this.autoEnlistTags = dbObj.data.autoEnlistTags || [];
		this.actionItem = dbObj.data.actionItem || null;
	}

	toRawData() {
		return {
			autoEnlistAll: this.autoEnlistAll,
			autoEnlistTags: this.autoEnlistTags,
			actionItem: this.actionItem
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
