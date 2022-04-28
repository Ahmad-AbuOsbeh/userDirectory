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
    //from content tab
    this.tagFilter = dbObj.data.tagFilter || [];
    this.actionItem = dbObj.data.actionItem || null;
    //not sure from which tab
    this.navigateToCwByDefault = dbObj.data.navigateToCwByDefault || false;
    this.updatedSearchEngine = dbObj.data.updatedSearchEngine || null;
    //from settings tab
    this.autoEnlistAll = dbObj.data.autoEnlistAll || false;
    this.allowShowProfileComponent = dbObj.data.allowShowProfileComponent || false;
    this.badgePushNotifications = dbObj.data.badgePushNotifications || null;
    this.userSubtitleShowMode = dbObj.data.userSubtitleShowMode || null;
    this.ranking = dbObj.data.ranking || 'ALPHA_ASC';
    this.mapEnabled = dbObj.data.mapEnabled || false;
    this.filtersEnabled = dbObj.data.filtersEnabled || false;
    //from design tab
    this.layout = dbObj.data.layout || 'list';

    //to indexing all users inside the directory one time
    this.isIndexed = dbObj.data.isIndexed || false;
  }

  toRawData() {
    return {
      tagFilter: this.tagFilter,
      actionItem: this.actionItem,
      navigateToCwByDefault: this.navigateToCwByDefault,
      updatedSearchEngine: this.updatedSearchEngine,

      autoEnlistAll: this.autoEnlistAll,
      allowShowProfileComponent: this.allowShowProfileComponent,
      badgePushNotifications: this.badgePushNotifications,
      userSubtitleShowMode: this.userSubtitleShowMode,
      ranking: this.ranking,
      mapEnabled: this.mapEnabled,
      filtersEnabled: this.filtersEnabled,

      layout: this.layout,

      isIndexed: this.isIndexed,
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
