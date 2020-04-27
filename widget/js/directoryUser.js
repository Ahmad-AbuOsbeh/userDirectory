class DirectoryUser {
	constructor(user) {
		this.isActive = typeof user.isActive !== 'undefined' ? user.isActive : true;
		this.displayName = user.displayName;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.email = user.email;
		this.userId = user._id || user.userId;
		this.badges = user.badges || [];
		this.joinDate = user.joinDate || null;
		
		const { appId } = buildfire.getContext();
		this.tags = user.tags && user.tags[appId] ? user.tags[appId] : [];
	}

	toJson() {
		const badgeIds = this.badges.map(badge => badge.id);
		let badgeCount = 0;
		this.badges.forEach(badge => {
			if (typeof badge.appliedCount !== 'number') {
				badge.appliedCount = 1;
			}
			badgeCount += badge.appliedCount;
		});
		let tagCount = 0;
		this.tags.forEach(tag => {
			if (typeof tag.appliedCount !== 'number') {
				tag.appliedCount = 1;
			}
			tagCount += tag.appliedCount;
		});
		return {
			isActive: this.isActive,
			displayName: this.displayName,
			dName: this.displayName ? this.displayName.toLowerCase() : '',
			firstName: this.firstName,
			fName: this.firstName ? this.firstName.toLowerCase() : '',
			lastName: this.lastName,
			lName: this.lastName ? this.lastName.toLowerCase() : '',
			email: this.email,
			userId: this.userId,
			badges: this.badges,
			badgeCount,
			tags: this.tags,
			tagCount,
			joinDate: this.joinDate,
			_buildfire: {
				index: {
					text: `${this.firstName || ''} ${this.lastName || ''} ${this.displayName || ''} ${this.email || ''}`,
					string1: `${this.userId}`,
					array1: badgeIds
				}
			}
		};
	}
}
