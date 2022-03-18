class Category {
    constructor(data = {}) {
        this.name = data.name || "";
        this.nameIndex = data.name.toLowerCase();
        this.key = data.key || ""; //for future use
        this.iconType = data.iconType || Keys.iconTypes.IMG.key;
        this.icon = data.icon || "";
        this.categoryType = data.categoryType || Keys.categoryTypes.MULTI.key;
        this.subcategories = data.subcategories || [];
        this.sortBy = data.sortBy || Keys.sortByKeys.NEWEST.key;
        this.rank = data.rank || 10;
        this.rankOfLastSubcategory = data.rankOfLastSubcategory || 0;
        this.createdOn = data.createdOn || new Date();
        this.createdBy = data.createdBy || '';
        this.lastUpdatedOn = data.lastUpdatedOn || new Date();
        this.lastUpdatedBy = data.lastUpdatedBy || '';
        this.deletedOn = data.deletedOn || '';
        this.deletedBy = data.deletedBy || '';
    }

    toJson() {
        let subKeys = [];
        if (this.subcategories && this.subcategories.length > 0) {
            subKeys = this.subcategories.map(sub => {
                return { string1: sub.key };
            });
        }
        return {
            name: this.name,
            key: this.key,
            iconType: this.iconType,
            icon: this.icon,
            categoryType: this.categoryType,
            subcategories: this.subcategories,
            sortBy: this.sortBy,
            rank: this.rank,
            rankOfLastSubcategory: this.rankOfLastSubcategory,
            createdOn: this.createdOn,
            createdBy: this.createdBy,
            lastUpdatedOn: this.lastUpdatedOn,
            lastUpdatedBy: this.lastUpdatedBy,
            deletedOn: this.deletedOn,
            deletedBy: this.deletedBy,
            nameIndex: this.nameIndex,
            _buildfire: {
                index: {
                    string1: this.key,
                    array1: subKeys
                }
            }
        }
    }
}