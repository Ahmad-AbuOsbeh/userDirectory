class DirectoryUser {
	constructor(user) {
		this.displayName = user.displayName;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.email = user.email;
		this.userId = user._id || user.userId;
		this.badges = user.badges || [];
	}

	toJson() {
		const badgeIds = this.badges.map(badge => badge.id);
		return {
			displayName: this.displayName,
			firstName: this.firstName,
			lastName: this.lastName,
			email: this.email,
			userId: this.userId,
			badges: this.badges,
			_buildfire: {
				index: {
					text: `${this.firstName} ${this.lastName} ${this.displayName}`,
					string1: `${this.userId}`,
					array1: badgeIds
				}
			}
		};
	}
}
