class Drawer {
	constructor(elementId) {
		this.container = document.getElementById(elementId);
		this.container.classList.add('bottom-drawer-container');
		this.container.classList.add('hidden');

		this.backdrop = ui.create('div', this.container, null, ['bottom-drawer-backdrop']);

		this.drawer = ui.create('div', this.container, null, ['bottom-drawer', 'backgroundColorTheme']);

		this.header = ui.create('div', this.drawer, null, ['drawer-header']);

		this.tabContainer = ui.create('div', this.drawer, null, ['drawer-tab-container']);


		this.tabs = [];
	}

	// create(elementType,appendTo,innerHTML,classNameArray){
	render(options) {

		if (options.tabs.length) {
			options.tabs.forEach(tab => this.renderTab(tab));
		}

		// this.userImage = ui.create('img', this.userContainer, null, ['user-image']);

		// this.userInfo = ui.create('div', this.userContainer, null, ['user-info']);
		// this.title = ui.create('div', this.userInfo, null, ['user-info__name']);
		// this.subtitle = ui.create('div', this.userInfo, null, ['user-info__subtitle']);
	}

	renderTab(tab) {
		const newTab = ui.create('div', this.tabContainer, null, ['tab']);

		ui.create('div', newTab, tab.tab, ['tab-header']);

		ui.create('div', newTab, tab.content, ['tab-content']);
	}

	_show() {
		this.container.classList.remove('hidden');
	}

	_hide() {
		this.container.classList.remove('hidden');

		// do this on animation end
		this.drawer.innerHTML = '';
	}

	open(options, callback) {

		this.render(options);
		
		this._show();

		// const { userId, displayName, imageUrl, email, badges } = user;

		// this.title.innerHtml = displayName;
		// this.subtitle.innerHtml = email;
		// this.userImage.src = buildfire.auth.getUserPictureUrl({ userId });

		// this.container.classList.remove('hidden');
	}
}

{/* 
<div class="bottom-drawer-container">
	<div class="bottom-drawer-backdrop"></div>
	<div class="bottom-drawer backgroundColorTheme">
		<h4>Bottom Drawer</h4>
		<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero ea quidem neque porro suscipit, aliquam ipsam accusantium nihil iure distinctio. Mollitia, totam ad vero autem quam explicabo sit corrupti recusandae!</p>
	</div>
</div>
*/}