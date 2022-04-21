class Categories {
    static TAG = `$$userDirectoryCategories-${buildfire.getContext().instanceId}`;

    static get(data, callback) {
        var searchOptions = {
            filter: data.filter ? data.filter : {},
            limit: data.limit ? data.limit : 50,
            skip: data.skip ? data.skip : 0,
            sort: data.sort ? data.sort : { createdOn: -1 },
        };
        buildfire.appData.search(searchOptions, this.TAG, (error, result) => {
            if (error) return callback(error, null);

            callback(
                null,
                result
            );
        });
    };

    static add(categoryData, callback) {
        const category = new Category(categoryData);

        buildfire.appData.insert(category.toJson(), this.TAG, (error, record) => {
            if (error) return callback(error);

            callback(null, record);
        });
    };

    static getByCategoryId(categoryId, callback) {
        buildfire.appData.getById(categoryId, this.TAG, (error, results) => {
            callback(error, (results || [])[0]);
        });
    };

    // returns all categories that have the "tag" as a subcategory key
    static getBySubcategoryId(tag, callback) {
        const searchOptions = {
            filter: {
                '_buildfire.index.array1.string1': tag,
            },
        };

        buildfire.appData.search(searchOptions, this.TAG, (error, results) => {
            callback(error, (results || [])[0]);
        });
    };

    static delete(categoryId, callback) {
        buildfire.appData.delete(categoryId, this.TAG, callback);
    };

    static update(categoryData, callback) {
        const category = new Category(categoryData);
        buildfire.appData.update(categoryData.id,category.toJson(), this.TAG, (error, record) => {
            if (error) return callback(error);

            callback(null, record);
        });
    };
}