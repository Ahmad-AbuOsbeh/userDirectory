let directory = {

    addUser(user, callback) {

        let obj = new directoryUser(user);
        buildfire.appData.insert(obj.toJson(), 'userDirectory', false, callback);
    },

    addUserNew(user,callback){
        let obj = new directoryUser(user);
        let insertData = {
            tag: 'userDirectory',
            title: obj.displayName,
            description: obj.firstName + ' ' + obj.lastName,
            keywords: obj._buildfire.index.text
        };

        buildfire.services.searchEngine.insert(insertData,callback);
    },

    search(criteria, index, size, callback) {


        var searchOptions = {
            "sort": { "firstName": 1, "lastName": 1 },
            "page": index,
            "pageSize": size
        };

        if(criteria)
            searchOptions.filter={$text: { $search: criteria  }} ;

        buildfire.appData.search(searchOptions, 'userDirectory', callback);


    },



    searchNew(criteria, index, size, callback) {


        var searchData = {
            tag: 'userDirectory',
            searchText: criteria,
            pageSize: size,
            pageIndex: index,
            preHighlightTag : "<b>",
            postHighlightTag : "</b>",
        };
debugger;
        buildfire.services.searchEngine.search(searchData,(e,r)=>{
            debugger;
        });


    }




};