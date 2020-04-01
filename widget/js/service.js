class Service {
	constructor() {
		this.strings = new buildfire.services.Strings('en-us', stringsConfig);
		this.settings = {
			autoEnlistAll: false,
			autoEnlistTags: [],
			actionItem: null
		};
		this.user = null;
		this.DirectoryUI = null;

		buildfire.auth.onLogin(() => this.init());
		buildfire.auth.onLogout(() => this.init());
		this.init();
	}

	init() {
		Promise.all([this.getUser(), this.getSettings(), this.getStrings()]).then(() => {
			if (this.user) {
				this.directoryUI = new DirectoryUI(this.user, this.strings, this.settings);
				this.directoryUI.promptUser(false, () => {
					buildfire.messaging.sendMessageToWidget({ cmd: 'userAdded' });
				});

				this.directoryUI.autoUpdateUser();
			}
		});
	}

	getUser() {
		return new Promise(resolve => {
			buildfire.auth.getCurrentUser((error, user) => {
				if (error) console.error(error);
				this.user = user || null;

				resolve();
			});
		});
	}

	getSettings() {
		return new Promise(resolve => {
			Settings.get()
				.then(settings => {
					this.settings = settings;
					resolve();
				})
				.catch(() => resolve(null));
		});
	}

	getStrings() {
		return new Promise(resolve => {
			this.strings
				.init()
				.then(resolve)
				.catch(() => resolve(null));
		});
	}
}
