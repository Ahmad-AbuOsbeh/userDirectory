const dummyData = {
	fields: ['_id', 'displayName', 'firstName', 'lastName', 'email'],

	getData: n => {
		const results = [];

		for (let i = 0; i < n; i++) {
			results.push(dummyData.getRow());
		}

		return results;
	},

	getRow() {
		const email = dummyData.getRandomString();
		const firstName = dummyData.getRandomString();
		const lastName = dummyData.getRandomString();
		const displayName = `${firstName} ${lastName}`;
		const obj = {
			_id: dummyData.getRandomString(),
			displayName,
			firstName,
			lastName,
			email
		};

		// this.fields.forEach(field => {
		// 	obj[field] = dummyData.getRandomString();
		// });

		return obj;
	},

	getRandomString: () => {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		// var result = '';
		// var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		// var charactersLength = characters.length;
		// for (var i = 0; i < 5; i++) {
		// 	result += characters.charAt(Math.floor(Math.random() * charactersLength));
		// }
		// return result;
	},

	getRandomNames: callback => {
		let oReq = new XMLHttpRequest();
		oReq.onload = () => {
			const data = JSON.parse(oReq.response);
			callback(
				data.map(obj => {
					const { name, surname } = obj;
					return {
						_id: dummyData.getRandomString(),
						firstName: name,
						lastName: surname,
						displayName: `${name} ${surname}`,
						email: `${name}_${surname}@gmail.com`
					};
				})
			);
		};
		oReq.open('GET', 'https://uinames.com/api/?amount=500&region=united+states');
		oReq.send();
	}
};

// https://uinames.com/api/?amount=25

// {
//   "_id": "5b311a44b4050410eccb16f2",

//   "displayName": "Chris Berger",
//   "lastName": "Berger",
//   "username": "chrisb000@gmail.com",
//   "firstName": "Chris",
//   "email": "chrisb000@gmail.com",
// }
