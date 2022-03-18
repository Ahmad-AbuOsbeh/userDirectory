class DirectoryUser {
	constructor(user) {
		this.isActive = typeof user.isActive !== 'undefined' ? user.isActive : true;
		this.displayName = user.displayName;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.phoneNumber = user && user.userProfile && user.userProfile.tel ? user.userProfile.tel : null;
		this.email = user.email;
		this.userId = user._id || user.userId;
		this.badges = user.badges || [];
		this.joinDate = user.joinDate || null;
		this.location = user.location || null;
		this.locationKey = user.locationKey || null;

		// const { appId } = buildfire.getContext();
		const appId = "2ee7035a-5381-11e9-8fc5-06e43182e96c";
		this.tags = user.tags && user.tags[appId] ? user.tags[appId] : [];
	};

	handleLocationTags(locationTags, callback) {
		const countryTag = locationTags.find(tag => tag.tagName.includes("$$profile_country"));
		const cityTag = locationTags.find(tag => tag.tagName.includes("$$profile_city") || tag.tagName.includes("$$profile_town"));
		if (countryTag && cityTag) {
			const countryKey = countryTag.tagName.split(":")[1];
			const cityKey = cityTag.tagName.split(":")[1];
			this.locationKey = `${cityKey},${countryKey}`;
			// Check if we have the key in the list of locations
			Locations.getLocationByKey(this.locationKey, (error, location) => {
				if (error) {
					return callback(error);
				} else if (location && location.data) {
					this.location = location.data.coordinates;
					return callback(null, true);
				}
				else {
					// convert location into lat/long and save it
					fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${this.locationKey}&key=AIzaSyBOp1GltsWARlkHhF1H_cb6xtdR1pvNDAk`)
						.then(response => response.json())
						.then(data => {
							if (data && data.results && data.results.length) {
								let address = data.results[0].geometry.location;
								let locationName = data.results[0].formatted_address;
								Locations.addLocation(new Location({ key: this.locationKey, coordinates: address, locationName: locationName }), (err, res) => {
									if (err) {
										return callback(err);
									} else {
										console.log("Location added to database");
										this.location = address;
										callback(null, true);
									}
								});
							}
						});
				}
			});
		}
		else {
			callback(null, false);
		}
	}

	handleFilterTags(type, filterTags, callback) {
		if (type == "birthdate") {
			const year = filterTags.find(tag => tag.tagName.includes("$$profile_birth_year"));
			const month = filterTags.find(tag => tag.tagName.includes("$$profile_birth_month"));
			//note: custom reg does not return the birth "day"
			let birthday = new Date(`${year.tagName.split(":")[1]}-${parseInt(month.tagName.split(":")[1])}-01`);
			this._buildfire.index.date1 = birthday;
		}
	}

	objToJson_() {
		const badgeIds = this.badges.map(badge => badge.id);
		let badgeCount = 0;
		this.badges.forEach(badge => {
			if (typeof badge.appliedCount !== 'number') {
				badge.appliedCount = 1;
			}
			badgeCount += badge.appliedCount;
		});
		let tagCount = 0;
		let tagIndex = [];
		this.tags.forEach(tag => {
			if (typeof tag.appliedCount !== 'number') {
				tag.appliedCount = 1;
			}
			tagCount += tag.appliedCount;
			tagIndex.push({string1: tag.tagName});
		});
		return {
			isActive: this.isActive,
			displayName: this.displayName,
			dName: this.displayName ? this.displayName.toLowerCase() : '',
			firstName: this.firstName,
			fName: this.firstName ? this.firstName.toLowerCase() : '',
			lastName: this.lastName,
			phoneNumber: this.phoneNumber,
			lName: this.lastName ? this.lastName.toLowerCase() : '',
			email: this.email,
			userId: this.userId,
			badges: this.badges,
			location: this.location,
			locationKey: this.locationKey,
			badgeCount,
			tags: this.tags,
			tagCount,
			joinDate: this.joinDate,
			_buildfire: {
				index: {
					text: `${this.firstName || ''} ${this.lastName || ''} ${this.displayName || ''} ${this.email || ''}`,
					string1: `${this.userId}`,
					array1: [...badgeIds, ...tagIndex, { string1: `${this.locationKey}` }],
				}
			}
		};
	}

	toJson(settings, callback) {
		// if (settings && settings.filtersEnabled) {
		// 	if (this.tags && this.tags.length) {
		// 		// Check if we have birthdate tag
		// 		const birthdateTags = this.tags.filter(tag => {
		// 			if (tag.tagName.includes("$$profile_birth_year") && tag.tagName.includes("$$profile_birth_month")) {
		// 				return true;
		// 			}
		// 		});

		// 		if (birthdateTags.length == 2) {

		// 		}

		// 		var locationTags = this.tags.filter(tag => tag.tagName.includes("$$profile_country") || (tag.tagName.includes("$$profile_city") || tag.tagName.includes("$$profile_town")));
		// 		if (locationTags && locationTags.length) {
		// 			this.handleLocationTags(locationTags, (err, res) => {
		// 				if (err) {
		// 					return callback(err);
		// 				}
		// 				else {
		// 					return callback(null, this.objToJson_());
		// 				}
		// 			});
		// 		}
		// 		else {
		// 			return callback(null, this.objToJson_());
		// 		}
		// 	}
		// }
		if (settings && settings.mapEnabled) {
			if (this.tags && this.tags.length) {
				var locationTags = this.tags.filter(tag => tag.tagName.includes("$$profile_country") || (tag.tagName.includes("$$profile_city") || tag.tagName.includes("$$profile_town")));
				if (locationTags && locationTags.length) {
					this.handleLocationTags(locationTags, (err, res) => {
						if (err) {
							return callback(err);
						}
						else {
							return callback(null, this.objToJson_());
						}
					});
				}
				else {
					return callback(null, this.objToJson_());
				}
			}
			else {
				return callback(null, this.objToJson_());
			}
		}
		else {
			return callback(null, this.objToJson_());
		}
	}
}
