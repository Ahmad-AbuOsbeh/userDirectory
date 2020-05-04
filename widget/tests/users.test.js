const getUser = () => {
	return new Promise((resolve, reject) => {
		buildfire.auth.getCurrentUser((e, user) => {
			if (e) return reject(e);

			resolve(user);
		});
	});
};

const addUser = () => {
	return new Promise((resolve, reject) => {
		getUser().then(user => {
			Users.add(user, (e, result) => {
				if (e) return reject(e);

				resolve(result);
			});
		});
	});
};

