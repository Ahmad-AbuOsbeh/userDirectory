class DirectoryUser {
	constructor(user) {
		this.isActive = typeof user.isActive !== 'undefined' ? user.isActive : true;
		this.displayName = user.displayName;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.email = user.email;
		this.userId = user._id || user.userId;
		this.badges = user.badges || [];
		
		const { appId } = buildfire.getContext();
		this.tags = user.tags ? user.tags[appId] : [];
	}

	toJson() {
		const badgeIds = this.badges.map(badge => badge.id);
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
			badgeCount: this.badges.length,
			tags: this.tags,
			tagCount: this.tags.length,
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
