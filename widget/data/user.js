class User {
	constructor(user = {}) {
		// DON'T DELETE THESE DATA OBJECTS
		this.isActive = user.isActive || true;
		this.createdOn = user.createdOn || new Date();
		this.createdBy = user.createdBy || null;
		this.lastUpdatedOn = user.lastUpdatedOn || null;
		this.lastUpdatedBy = user.lastUpdatedBy || null;
		this.deletedOn = user.deletedOn || null;
		this.deletedBy = user.deletedBy || null;

		//ADD NEW ONES BELOW
		this.displayName = user.displayName;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.email = user.email;
		this.userId = user._id || user.userId;
		this.badges = user.badges || [];
	}

	toJson() {
		return {
			displayName: this.displayName,
			firstName: this.firstName,
			lastName: this.lastName,
			email: this.email,
			userId: this.userId,
			badges: this.badges,
			_buildfire: {
				index: {
					text: `${this.firstName} ${this.lastName}`,
					string1: `${this.userId}`,
					array1: this.badges
				}
			}
		};
	}
}
