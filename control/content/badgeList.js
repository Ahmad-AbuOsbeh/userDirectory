// class BadgeList {
// 	constructor(containerId) {
// 		this.container = document.getElementById(containerId);
// 		if (!this.container) throw 'Cant find container';
// 		this.badges = [];
// 	}

// 	loadBadges(badges) {
// 		this.badges = [];

// 		badges.forEach(badge => this.addBadge(badge));
// 	}

// 	addBadge(badge) {
// 		if (!(badge instanceof BadgeListItem)) badge = new BadgeListItem(badge);
// 		let i = badge.render(this.container);

// 		this.badges.push(badge);
// 	}
// }

// class BadgeListItem {
// 	constructor(obj = {}) {
// 		this.id = obj.id;
// 		this.name = obj.name;
// 		this.tag = obj.tag;
// 		this.tagCount = obj.tagCount;
// 		this.iconUrl = obj.iconUrl;
// 	}

// 	init() {
// 		new window.Sortable(element, {
// 			group: 'badges',
// 			animation: 150,
// 			fallbackOnBody: true,
// 			swapThreshold: 0.65,
// 			onEnd: this.onReorder
// 		});
// 	}

// 	onReorder(event) {
		
// 	}

// 	toJson() {
// 		const { id, name, tag, tagCount, iconUrl } = this;
// 		return {
// 			id,
// 			name,
// 			tag,
// 			tagCount,
// 			iconUrl
// 		};
// 	}

// 	render(container, card) {
// 		this.container = container;

// 		if (card) card.innerHTML = '';
// 		else card = ui.create('div', container, '', ['badgeListItem']);

// 		this.card = card;

// 		const handle = ui.create('div', card, null, ['badge__item--handle']);
// 		ui.create('span', handle, null, ['icon', 'icon-menu']);

// 		return card;
// 	}
// }

// // import React, { PureComponent } from 'react';

// // export class SortableList extends PureComponent {
// //   constructor(props) {
// //     super(props);
// //     this.sortableRef = React.createRef();
// //     this.id = Date.now() + Math.floor(Math.random() * 10000);
// //   }

// //   componentDidMount = () => {
// //     const element = this.sortableRef.current;
// //     // const element = document.getElementById(this.id.toString());
// //     const { group, handleReorder } = this.props;
// //     this.sortable = new window.Sortable(element, {
// //       group,
// //       animation: 150,
// //       fallbackOnBody: true,
// //       swapThreshold: 0.65,
// //       onEnd: handleReorder
// //     });
// //   };

// //   render() {
// //     const { children, group } = this.props;
    
// //     return (
// //       <div ref={this.sortableRef} className={`carousel-items hide-empty draggable-list-view ${group}`}>
// //         {children}
// //       </div>
// //     );
// //   }
// // }

// // export default SortableList;

