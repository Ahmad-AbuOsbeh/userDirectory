// if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
// if (typeof buildfire.components == 'undefined') buildfire.components = {};

// buildfire.components.drawer = class Drawer {
// 	constructor(elementId, options = {}) {

// 		const { design } = options;

// 		///////////////////////// container ////////////////////////
// 		this.container = document.getElementById(elementId);
// 		if (!this.container) {
// 			throw new Error(`Cannot find element with id ${elementId}`);
// 		}
// 		this.container.classList = 'bottom-drawer-container hidden';

// 		///////////////////////// backdrop /////////////////////////
// 		this.backdrop = document.createElement('div');
// 		this.backdrop.classList = 'bottom-drawer-backdrop';
// 		this.backdrop.onclick = () => this._hide();
// 		this.container.appendChild(this.backdrop);

// 		////////////////////////// drawer //////////////////////////
// 		this.drawer = document.createElement('div');
// 		this.drawer.classList = 'bottom-drawer backgroundColorTheme';

// 		const { height } = (design || {});
// 		this.drawer.setAttribute('style', `height: ${ height || 50 }vh !important;`);

// 		this.container.appendChild(this.drawer);

// 		////////////////////////// header //////////////////////////
// 		this.header = document.createElement('div');
// 		this.header.classList = 'drawer-header primaryBackgroundTheme';
// 		this.drawer.appendChild(this.header);

// 		/////////////////////// tab container //////////////////////
// 		this.tabContainer = document.createElement('div');
// 		this.tabContainer.classList = 'drawer-tab-container';
// 		this.drawer.appendChild(this.tabContainer);

// 		/////////////////////////// tabs ///////////////////////////
// 		this.tabs = document.createElement('div');
// 		this.tabs.classList = 'drawer-tabs';
// 		this.tabContainer.appendChild(this.tabs);

// 		/////////////////////// tabs content ///////////////////////
// 		this.tabsContent = document.createElement('div');
// 		this.tabsContent.classList = 'drawer-tabs-content';
// 		this.tabContainer.appendChild(this.tabsContent);

// 		/////////////////////////// data ///////////////////////////
// 		this.tabList = [];
// 	}

// 	switchTab(index) {
// 		const activeTab = this.tabList.find(tab => tab.active === true);
// 		const targetTab = this.tabList.find(tab => tab.index === index);

// 		activeTab.header.classList.remove('active');
// 		activeTab.content.classList.remove('active');
// 		activeTab.active = false;

// 		targetTab.header.classList.add('active');
// 		targetTab.content.classList.add('active');
// 		targetTab.active = true;
// 	}

// 	render(options) {
// 		this.tabList = [];
// 		this.header.innerHTML = options.header || '';

// 		if (options.tabs && options.tabs.length) {
// 			options.tabs.forEach((tab, index) => {
// 				const header = document.createElement('div');
// 				header.classList = 'tab';
// 				header.innerHTML = tab.header;
// 				header.onclick = () => this.switchTab(index);
// 				this.tabs.appendChild(header);

// 				const content = document.createElement('div');
// 				content.classList = 'tab-content';

// 				if (typeof tab.content === 'string') {
// 					content.innerHTML = tab.content;
// 				} else if (tab.content && tab.content.length) {
// 					tab.content.forEach(item => {
// 						const listItem = document.createElement('div');
// 						listItem.classList.add('list-item');

// 						if (item.icon) {
// 							const listItemIcon = document.createElement('span');
// 							listItemIcon.classList = item.icon;
// 							listItem.appendChild(listItemIcon);
// 						}

// 						if (item.text) {
// 							const listItemText = document.createElement('p');
// 							listItemText.classList.add('list-item-text');
// 							listItemText.innerHTML = item.text;
// 							listItem.appendChild(listItemText);
// 						}

// 						if (item.callback) {
// 							listItem.onclick = item.callback;
// 						}

// 						content.appendChild(listItem);
// 					});
// 				}

// 				this.tabsContent.appendChild(content);

// 				let active = false;

// 				if (index === 0) {
// 					header.classList.add('active');
// 					content.classList.add('active');
// 					active = true;
// 				}

// 				this.tabList.push({ index, header, content, active });
// 			});
// 		}

// 		this._show();
// 	}

// 	_show() {
// 		this.container.classList.remove('hidden');
// 	}

// 	_hide() {
// 		this.container.classList.add('hidden');

// 		// do this on animation end
// 		this.header.innerHTML = '';
// 		this.tabs.innerHTML = '';
// 		this.tabsContent.innerHTML = '';

// 		this.tabList = [];
// 	}

// 	open(options, callback) {
// 		this.render(options);
// 	}
// };
