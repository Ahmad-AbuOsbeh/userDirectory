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
					// This way, we will keep old instances to use PSW navigate by default (so we don't break backward compatibility) and new instances to navigate to CW by default.
					if (!Object.keys(obj.data).length) {
						s.navigateToCwByDefault = true;
						s.updatedSearchEngine = true;
					}
					
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
		this.userSubtitleShowMode = dbObj.data.userSubtitleShowMode || null;
		this.navigateToCwByDefault = dbObj.data.navigateToCwByDefault || false;
		this.allowShowProfileComponent = dbObj.data.allowShowProfileComponent || false;
		this.updatedSearchEngine = dbObj.data.updatedSearchEngine || null;
	}

	toRawData() {
		return {
			autoEnlistAll: this.autoEnlistAll,
			tagFilter: this.tagFilter,
			actionItem: this.actionItem,
			badgePushNotifications: this.badgePushNotifications,
			ranking: this.ranking,
			userSubtitleShowMode: this.userSubtitleShowMode,
			navigateToCwByDefault: this.navigateToCwByDefault,
			allowShowProfileComponent: this.allowShowProfileComponent,
			updatedSearchEngine: this.updatedSearchEngine
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
