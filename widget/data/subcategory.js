class Subcategory {
    constructor(data = {}) {
        this.key = data.key || ''; //the key is usually the tag
        this.name = data.name || '';
        this.rank = data.rank || 10;
        this.nameIndex = data.name.toLowerCase();
        this.createdOn = data.createdOn || new Date();
        this.createdBy = data.createdBy || '';
        this.lastUpdatedOn = data.lastUpdatedOn || new Date();
        this.lastUpdatedBy = data.lastUpdatedBy || '';
        this.deletedOn = data.deletedOn || '';
        this.deletedBy = data.deletedBy || '';
    };

    toJson() {
        return {
            key: this.key,
            name: this.name,
            rank: this.rank,
            nameIndex: this.nameIndex,
            createdOn: this.createdOn,
            createdBy: this.createdBy,
            lastUpdatedOn: this.lastUpdatedOn,
            lastUpdatedBy: this.lastUpdatedBy,
            deletedOn: this.deletedOn,
            deletedBy: this.deletedBy,
        }
    };
}

