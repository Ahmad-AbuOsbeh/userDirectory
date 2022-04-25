/**
 * @class Directory
 * Manages directory data
 */

class Directory {
	constructor(user, strings, settings) {
		this.user = user ? new DirectoryUser(user) : null;
		this.strings = strings;
		this.settings = settings;
		this.badges = null;
		this.Favorites = null;
        this.userToBeIndexed = null;
		this.favoritesList = null;
		this.filterFavorites = false;
		// this.stop=false;

		if (!this.user) return;

		if (!this.isService && typeof Favorites !== 'undefined') {
			this.Favorites = new Favorites(this.user);
			this.Favorites.get((error, favorites) => {
				if (error) return console.log(error);

				this.favoritesList = favorites;
			});
		}

       this.buildIndexforAllUsersDirectory();
	}

	addFavorite(userData, callback) {
		if (!this.user) return buildfire.auth.login({});
		if (typeof userData === 'string') {
			const userId = userData;
			userData = { userId };
		}

		this.Favorites.add(userData, (error, result) => {
			if (error) return callback(error);

			if (result.nModified && result.status === 'updated') {
				buildfire.components.toast.showToastMessage({ text: this.strings.get('infoMessages.added') });
				this.favoritesList.push(userData.userId);
			}

			callback(null, this.favoritesList);
		});
	}

	removeFavorite(userData, callback) {
		if (!this.user) return buildfire.auth.login({});

		this.Favorites.delete(userData, (error, result) => {
			if (error) return callback(error);

			if (result.nModified && result.status === 'updated') {
				buildfire.components.toast.showToastMessage({ text: this.strings.get('infoMessages.removed') });
				this.favoritesList = this.favoritesList.filter((userId) => userId !== userData.userId);
			}

			callback(null, this.favoritesList);
		});
	}

	getFavorites(callback) {
		if (!this.user) {
			return callback(null, []);
		}
		if (this.favoritesList && this.favoritesList.length) {
			return callback(null, this.favoritesList);
		}
		if (this.user && !this.isService && typeof Favorites !== 'undefined') {
			this.Favorites = new Favorites(this.user);
			this.Favorites.get((error, favorites) => {
				if (error) return callback(error, null);

				this.favoritesList = favorites;
				callback(null, this.favoritesList);
			});
		}
	}

	getBadges(callback) {
		// if (this.badges && this.badges.length) {
		// 	return callback(null, this.badges);
		// }
		Badges.get((error, badges) => {
			if (error) return callback(error, null);

			this.badges = badges;
			callback(null, this.badges);
		});
	}

	search(searchText, filters, pageIndex, pageSize, callback) {
		let userIds = null;
		const _search = () => {
			this.getFavorites(() => {
				this.getBadges((err, badges) => {
					if (err) console.error(err);
					console.log("users", userIds);
					const { ranking } = this.settings;
					Users.search({ userIds, filters, pageIndex, pageSize, ranking }, (error, results) => {
						if (error) return callback(error, null);

						results = results.map((result) => {
							if (this.user) {
								result.data.isFavorite = this.favoritesList.indexOf(result.data.userId) > -1;
							}
							if (result.data.badges.length) {
								if (!this.badges.length) {
									debugger;
								}
								result.data.badges = result.data.badges.filter((badge) => {
									return this.badges.find((b) => b.id === badge.id);
								});
								result.data.badges = result.data.badges.map((badge) => {
									// return({ ...badge, ...this.badges.find(b => b.id === badge.id) });
									const b = JSON.parse(JSON.stringify(this.badges.find((b) => b.id === badge.id)));
									b.earned = badge.earned;
									b.appliedCount = badge.appliedCount;
									return b;
								});
							}
							if (this.user && result.data.userId === this.user.userId) {
								return result;
							}
							result.data.action = {
								icon: result.data.isFavorite ? 'icon glyphicon glyphicon-star btn-primary' : 'icon glyphicon glyphicon-star-empty',
							};
							return result;
						});

						callback(null, results);
					});
				});
			});
		};

		if (searchText) {
			return Lookup.search({ searchText, pageIndex, pageSize }, (error, ids) => {
				userIds = ids;

				if (this.filterFavorites) {
					userIds = userIds.filter((id) => this.favoritesList.indexOf(id) > -1);
				}

				_search();
			});
		}

		if (this.filterFavorites) {
			userIds = this.favoritesList;

			return _search();
		}

		_search();
	}

	registerDeepLink(callback){
		let id = this.user.userId;
		let name = "";
		if(this.user.displayName) name = this.user.displayName;
		else if(this.user.firstName) name = this.user.firstName;
		else name = this.user.email;
		buildfire.deeplink.registerDeeplink(
			{
			  id: id,
			  name: name,
			  deeplinkData: { userId: id, name: name },
			},
			(err, result) => {
			  if (err) return callback(err);
			  return callback(null, result);
			}
		  );
	}

	unregisterDeepLink(id, callback){
		buildfire.deeplink.unregisterDeeplink(id, (err, result) => {
			if (err) return callback(err);
			return callback(null, result);
		  });
	}

	addUser(callback) {
		if (!this.user) return;

		buildfire.notifications.pushNotification.subscribe({ groupName: '$$userDirectory' }, console.log);

		buildfire.components.toast.showToastMessage({ text: 'Joined Directory' });
		this.registerDeepLink((err, succ) =>{
			if(err) console.error(err);
			else console.log("deeplink registered successfully", succ);
			this.user.toJson(this.settings, (err, userJSON) => {
				if (err) return callback(err);
				Users.add(userJSON, callback);
			});
		});
	}

	checkUser(callback) {
		if (!this.user) return;

		Users.getByUserId(this.user.userId, (error, result) => {
			if (error) return callback(error, false);

			callback(null, result);
		});
	}

    // build index for once first time when you open old plugins for their users.
    buildIndexforAllUsersDirectory(){
		var old_time = new Date();
    
		if (this.settings.isIndexed) return;
	if (this.settings && !this.settings.isIndexed) {
		const { appId } = buildfire.getContext();
		let  allUsers=[],
		     pageIndex =0,
			 pageSize=50;

     let updateIndexedObj = (indexedObj)=>{
		Users.update(indexedObj, (e, res) => {
			if (e) {
				return buildfire.components.toast.showToastMessage({ text: 'user not updated' });
			}
			if (res) {
				console.log("user to be indexed updateeedddddd |*|*|* *i*n************* APP data",res);
			}
		
			// if (onUpdate) onUpdate(this.user);
		});
		Lookup.update(indexedObj, console.log);
	 };

	 let handleLocationTagsIndexing = (locationKey,callback)=>{
	// Check if we have the key in the list of locations
	Locations.getLocationByKey(locationKey, (error, location) => {
		if (error) {
			return callback(error);
		} else if (location && location.data) {
			return callback(null, location.data.coordinates);
		}
		else {
			// convert location into lat/long and save it
			fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${locationKey}&key=AIzaSyBOp1GltsWARlkHhF1H_cb6xtdR1pvNDAk`)
				.then(response => response.json())
				.then(data => {
					if (data && data.results && data.results.length) {
						let address = data.results[0].geometry.location;
						let locationName = data.results[0].formatted_address;
						Locations.addLocation(new Location({ key: locationKey, coordinates: address, locationName: locationName }), (err, res) => {
							if (err) {
								return callback(err);
							} else {
								console.log("Location added to database");
								callback(null, address);
							}
						});
					}
				});
		}
	});
	}
	let getAllUsers = ()=>{

			// get all users in the directory
	Users.search({pageIndex,pageSize},(err,users)=>{
		if (err) return console.error('ERROR while getting all users',err);
		if (users) {
			if (users.length < 50 ) {
				allUsers.push(...users);
				console.log(' alllll users DOnee  10:14 ',allUsers);

				// loop over each user
				allUsers.forEach(userObj=>{
					let indexedObj = userObj.data;
					// since i didn't find a way to get user tags from buildfire.auth to update userDirectory users with the new tags >> will add the indexing for existing tags

					// const userId = userObj.userId;
					// Users.getByUserId(userId,(err,user)=>{
					// 	if (err) return console.error(`Error while getting user by userID:${userId}`,err);
                    //     if (user) {
					// 		console.log('test user',user);

		// 					this.userToBeIndexed = new DirectoryUser(userObj);

		// const userTags = user.tags && user.tags[appId] ? user.tags[appId] : [];


		// if (userTags.length !== (userObj.data.tags || []).length) {
		// 	this.userToBeIndexed.tags = userTags;
		// } else if (userTags.length) {
		// 	userTags.forEach((tag) => {
		// 		if (!userObj.data.tags.some((t) => t.tagName === tag.tagName)) {
		// 			this.userToBeIndexed.tags = userTags;
		// 		}
		// 	});
		// }
        // add these two keys
		indexedObj._buildfire.index.array1 = indexedObj._buildfire.index.array1 ? indexedObj._buildfire.index.array1 : [];
		

		let tagsToBeIndexed =[];
		let birthdayIndex, year, month;
		let countryTag, cityTag ,locationKey;
		if (indexedObj.tags && indexedObj.tags.length) {
			 
			indexedObj.tags.forEach(tag=>{

				// indexing all tags
				tagsToBeIndexed.push({string1: tag.tagName});

				// handle Birthdate for Age filter
				if (tag.tagName.includes("$$profile_birth_year")) {
					 year = tag;
					}
				if (tag.tagName.includes("$$profile_birth_month")) {
					month = tag;
					}

				// handle location tags
				if (tag.tagName.includes("$$profile_country")) {
					countryTag = tag;
				}
				if (tag.tagName.includes("$$profile_city")) {
					cityTag = tag;
				}

			})

				if (year && month) {
					birthdayIndex = new Date(`${year.tagName.split(":")[1]}-${parseInt(month.tagName.split(":")[1])}-01`);
				}

				if (countryTag && cityTag) {
					const countryKey = countryTag.tagName.split(":")[1];
					const cityKey = cityTag.tagName.split(":")[1];
					locationKey = `${cityKey},${countryKey}`;
					if (locationKey) {
						
						handleLocationTagsIndexing(locationKey,(err,loc)=>{
							indexedObj.location=loc;
							indexedObj.locationKey=locationKey;
							indexedObj._buildfire.index.date1=birthdayIndex;
			                indexedObj._buildfire.index.array1 = [...indexedObj._buildfire.index.array1, ...tagsToBeIndexed,{ string1: `${locationKey}`}]
							// remove duplicates if it exists
		let duplicatesRemoved =  indexedObj._buildfire.index.array1.filter((a, i) => indexedObj._buildfire.index.array1.findIndex((s) => a.string1 === s.string1) === i);
		indexedObj._buildfire.index.array1 =duplicatesRemoved;

							// now we have the updated object 
							updateIndexedObj(indexedObj);
						});
					}
				}else{
					// update the user, since he has not a location tags
					indexedObj._buildfire.index.date1=birthdayIndex;
					indexedObj._buildfire.index.array1 = [...indexedObj._buildfire.index.array1, ...tagsToBeIndexed];
					// remove duplicates if it exists
		let duplicatesRemoved =  indexedObj._buildfire.index.array1.filter((a, i) => indexedObj._buildfire.index.array1.findIndex((s) => a.string1 === s.string1) === i);
		indexedObj._buildfire.index.array1 =duplicatesRemoved;
					updateIndexedObj(indexedObj);

				}
			

			}

		
		// this.location = user.location || null;
		// this.locationKey = user.locationKey || null;
		// this.userToBeIndexed.toJson(this.settings, (err, userJSON) => {
		// 	if (userJSON) {
			
			// }
		// });
						// }
					// });
				// this.stop=true;

				});
				// get the user from buildfire.auth
				// update his data
				// stop here
				var new_time = new Date();
				var seconds_passed = new_time - old_time;
				console.log('new_time - old_time FINALLLLLLLLLLLLLLLLLLLLLLL TIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIMETIMT TIMT ITM TIME TIME',seconds_passed,(seconds_passed/1000));
				// make is indexed to TRUE
				// this.settings.isIndexed = true;
				// let data = this.settings;
// console.log('settings to bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbe updated',this.settings);
buildfire.messaging.sendMessageToControl({ cmd: 'indexingDone' });
				// return new Settings({ data })
                //         .save()
                //         .then(console.warn)
                //         .catch(console.error);
			}else{
				allUsers.push(...users);
				pageSize = pageSize +50;
				pageIndex = pageIndex +1;
				getAllUsers();
			}
		}
	})
		};

		getAllUsers();
		//loop over each user and update the index
		
	}else{
		return console.warn('all users indexed alreadyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy!')
	}
}

	updateUser(userObj, onUpdate) {
		console.log('this.user from first update on RELOAD:  6:32',userObj);
		if (userObj.data.isActive === false) return console.error('avoid update');

		if (!this.user) return;

		buildfire.auth.getCurrentUser((error, user) => {
			if (error) return console.error(error);

			Badges.computeUserBadges(user, (err, userBadges) => {
				if (err) return console.error(err);

				this.getBadges(() => {
					let hasUpdate = false;

					this.user.badges = userObj.data.badges.filter((b) => userBadges.find((badge) => badge.id === b.id));

					if (this.user.badges.length !== userObj.data.badges.length) {
						hasUpdate = true;
					} else {
						this.user.badges = this.user.badges.filter((b) => {
							const match = this.badges.find((badge) => badge.id === b.id);

							if (!match) hasUpdate = true;

							return this.badges.find((badge) => badge.id === b.id);
						});
					}

					let newBadges = [];

					userBadges.forEach((userBadge) => {
						const index = userObj.data.badges.findIndex((badge) => badge.id === userBadge.id);
						const match = userObj.data.badges[index];

						if (match && match.appliedCount === userBadge.appliedCount) {
							return;
						}

						if (match && match.appliedCount > userBadge.appliedCount) {
							match.appliedCount = userBadge.appliedCount;
							hasUpdate = true;
							return;
						}

						if (match && match.appliedCount < userBadge.appliedCount) {
							match.appliedCount = userBadge.appliedCount;
							userObj.data.badges[index] = match;
							hasUpdate = true;
							newBadges.push({
								id: userBadge.id,
								earned: Date.now(),
								appliedCount: userBadge.appliedCount,
							});
						}

						if (!match) {
							const newBadge = {
								id: userBadge.id,
								earned: Date.now(),
								appliedCount: userBadge.appliedCount,
							};

							this.user.badges.push(newBadge);
							newBadges.push(newBadge);
							hasUpdate = true;
						}
					});

					const updateQueue = ['displayName', 'email', 'firstName', 'lastName'];

					if (this.user.userId !== user._id) {
						return;
					}

					updateQueue.forEach((key) => {
						if (userObj.data[key] !== user[key]) {
							this.user[key] = user[key];
							hasUpdate = true;
						}
					});

					const { appId } = buildfire.getContext();
					const userTags = user.tags && user.tags[appId] ? user.tags[appId] : [];
					console.log(" Current user user from AUTH BUILDFIRE", user);
					console.log("userObj from APP DATA USER DIRECTORY", userObj);

					if (userTags.length !== (userObj.data.tags || []).length) {
						this.user.tags = userTags;
						hasUpdate = true;
					} else if (userTags.length) {
						userTags.forEach((tag) => {
							if (!userObj.data.tags.some((t) => t.tagName === tag.tagName)) {
								this.user.tags = userTags;
								hasUpdate = true;
							}
						});
					}
                    
					if (this.settings && this.settings.mapEnabled) {
						//  do some logic here to check if he has the location key as indexed if not
						hasUpdate =true;
					}
                    
					if (this.settings && this.settings.filtersEnabled) {
							//  do some logic here to check if he has the birthdate as indexed if not
							hasUpdate =true;
					}
					console.log('this.settings > has update',this.settings);
					console.log('hasUpdate',hasUpdate);
					if (!hasUpdate) return;

					this.user.toJson(this.settings, (err, userJSON) => {
						console.log('userJSON from update user |||| directory',userJSON);
						if (userJSON) {
							Users.update(userJSON, (e, res) => {
								if (e) {
									return buildfire.components.toast.showToastMessage({ text: 'user not updated' });
								}
								if (res) {
									console.log("CUrent user updateeedddddd |||| in APP data",res);
								}
								if (newBadges.length) {
									const badges = newBadges.map((badge) => {
										const b = this.badges.find((b) => b.id === badge.id);
										b.earned = badge.earned;
										return b;
									});
									if (this.settings.badgePushNotifications) {
										this.sendNewBadgePN(userObj, badges);
									}
		
									const richContent = `
										<div class="center-content active-user">
										<h4 class="title text-center">New Badge${badges.length > 1 ? 's' : ''} Received!</h4>
										${badges.length > 1 ? this.renderMultipleBadges(badges) : renderSingleBadge(badges[0])}
										</div>
										${this.getModalStyles()}
										`;
		
									buildfire.components.popup.display({ richContent }, console.error);
								}
								if (onUpdate) onUpdate(this.user);
							});
							Lookup.update(userJSON, console.log);
						}
					});
				});

				function renderSingleBadge(badge) {
					const { name, imageUrl } = badge;
					return `
						<div class="badge-user">
							<img src="${imageUrl}" alt="">
						</div>
						<p>${name}</p>

					`;
				}
			});
		});
	}

	sendNewBadgePN(user, badges) {
		const { email, displayName, userId } = user.data;

		const { instanceId } = buildfire.getContext();
		const imgUrl = buildfire.auth.getUserPictureUrl({ email });
		const inAppMessage = `
			<div class="center-content">
				<div class="avatar">
					<img src="${imgUrl}" alt="">
				</div>
				<p>${displayName}</p>

				<h4 class="title text-center">
					${badges.length > 1 ? 'Received New Badges!' : 'Received a New Badge!'}
				</h4>
	
				${
					badges.length > 1
						? this.renderMultipleBadges(badges)
						: `<div class="badge-user">
						<img src="${badges[0].imageUrl}" alt="">
					</div>
					<p class="caption">${badges[0].name}</p>`
				}
			</div>
			${this.getModalStyles()}
		`;

		const options = {
			title: `${displayName || email} has earned ${badges.length > 1 ? 'new badges!' : 'a new badge!'}`,
			text: `${displayName || email} has earned ${badges.length > 1 ? 'new badges!' : 'a new badge!'}`,
			inAppMessage,
			groupName: '$$userDirectory',
			queryString: userId,
			actionItem: {
				action: 'linkToApp',
				instanceId,
			},
		};

		// date format!!!
		// PN exclude user

		buildfire.notifications.pushNotification.schedule(options, (e, d) => {
			if (e) console.error(e, options, d);
		});
	}

	renderMultipleBadges(badges) {
		return `
			<div class="badges-grid">
			${badges
				.map((badge) => {
					return `
					<div class="grid-item">
						<div class="user-badge">
							<img src="${badge.imageUrl}" alt="">
							<!-- <span class="badge-count successBackgroundTheme">999</span> -->
						</div>
						<h5>${badge.name}</h5>
						<!-- <p class="caption">${new Date(badge.earned).toLocaleDateString()}</p> -->
					</div>
				`;
				})
				.join(' ')}
			</div>
		`;
	}

	getModalStyles() {
		return `
			<style> 
				.center-content{
						font-size: 16px;
						display: flex;
						flex-direction: column;
						align-items: center;
						padding: 1em 0;
					}
					.center-content.active-user .badge-user,
					.center-content.active-user .badge-user img{
						width: 5em;
						height: 5em;
					}
					.center-content.active-user .badge-user{
						margin: 1em;
					}
					.badge-user{
						width: 3em;
						height: 3em;
						border-radius: .5em;
						overflow: hidden;
					}
					.center-content .badge-user{
						margin: .5em;
					}
					.badge-user img{
						width: 3em;
						height: 3em;
						border-radius: .5em;
						overflow: hidden;
						object-fit: cover;
					}
					.center-content .avatar{
						margin: .5em;
					}
					.center-content .avatar,
					.center-content .avatar img{
						width: 4.5em;
						height: 4.5em;
						overflow: hidden;
						border-radius: 50%;
						margin-bottom: .75em;
					}
					.center-content .avatar img{
						object-fit: cover;
					}
					/* Grid Styling Start */
					.badges-grid{
						font-size: 16px;
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						grid-column-gap: .75em;
						grid-row-gap: 1.5em;
						padding: 1em .5em;
						padding-bottom: calc(1em + env(safe-area-inset-bottom));
					}
					.badges-grid .grid-item{
						display: flex;
						flex-direction: column;
						align-items: center;
						text-align: center;
					}
					.badges-grid .user-badge{
						border-radius: .25em;
						width: 4em;
						height: 4em;
						position: relative;
					}
					.badges-grid .grid-item h5{
						margin: .75em 0 .125em 0;
						font-weight: bold;
						word-break: break;
					}
					.badges-grid .user-badge img{
						border-radius: .25em;
						width: 4em;
						height: 4em;
						object-fit: cover;
						overflow: hidden;
					}
					.user-badge .badge-count{
						display: block;
						background-color: rgba(120, 120, 120, 0.5);
						color: #fff;
						border-radius: 1em;
						position: absolute;
						top: -.75em;
						right: calc(0% - .75em);
						padding: .25em .5em;
						text-align: left;
					}
					.caption{
						font-size: .75em;
						opacity: .75;
						margin: 0;
					}
					@media(min-width: 700px){
						.badges-grid{
							grid-template-columns: repeat(4, 1fr);
						}
					}
				</style>
			`;
	}

	removeUser(callback) {
		if (!this.user) return;

		buildfire.notifications.pushNotification.unsubscribe({ groupName: '$$userDirectory' }, console.log);

		buildfire.components.toast.showToastMessage({ text: 'Left Directory' });
		buildfire.deeplink.getAllDeeplinks(null, (err, r) =>{
			let index = r.findIndex(c => c.data.deeplinkData.userId == this.user.userId);
			if(index >= 0){
				let id = r[index].data.deeplinkId;
				this.unregisterDeepLink(id, (err, r) =>{
					if(err) console.error(err);
					else console.log("deeplink removed successfully");
					Users.delete(this.user.userId, callback);
				});
			}
			else{
				Users.delete(this.user.userId, callback);
			}
		});
	}

	_clear() {
		Lookup._clear();
		Users._clear();
	}

	_insertDummyData() {
		const users = dummyData.getRandomNames((users) => {
			users.forEach((user) => {
				Users.add(new DirectoryUser(user).toJson(), console.error);
			});
		});
	}
}
