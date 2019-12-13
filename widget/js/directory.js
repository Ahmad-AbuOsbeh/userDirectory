let directory = {

    addUser(user, callback) {
        let obj = new directoryUser(user);
        buildfire.appData.insert(obj.toJson(), 'userDirectory', true, callback);
    },

    search(criteria, index, size, callback) {


        var searchOptions = {
            "filter": { $text: { $search: criteria } },
            "sort": { "firstName": 1, "lastName": 1 },
            "page": index,
            "pageSize": size
        };

        buildfire.appData.search(searchOptions, 'contactInfo', callback);




    }









};