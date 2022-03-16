class Location {
    constructor(data = {}) {
        this.key = data.key;
        this.coordinates = data.coordinates;
        this.locationName = data.locationName;
    }

    toJSON() {
        const { key, coordinates, locationName } = this;
        return {
            key,
            coordinates,
            locationName,
            _buildfire: {
                index: {
                    string1: key,
                },
                geo: {
                    type: "Point",
                    coordinates: [coordinates.lng, coordinates.lat]
                }
            }
        };
    }
}

class Locations {
    static get tag() {
        return '$$locations';
    }

    static addLocation(location, callback) {
        buildfire.appData.insert(location.toJSON(), this.tag, callback);
    };

    static search(filter,page, pageSize, callback) {
        const searchOptions = {
            filter,
            page,
            pageSize,
        };

        buildfire.appData.search(searchOptions, this.tag, callback);
    }

    static getLocationByKey(key, callback) {
        const searchOptions = {
            filter: {
                '_buildfire.index.string1': key
            }
        };

        buildfire.appData.search(searchOptions, this.tag, (error, results) => {
            callback(error, (results || [])[0]);
        });
    }
}
