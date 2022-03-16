class Category{
    constructor (data = {}) {
        this.name = data.name || "";
        this.iconType = data.iconType || Keys.iconTypes.IMG;
        this.icon = data.icon || "";
        this.categoryType = data.categoryType || Keys.categoryTypes.MULTI;
        this.subcategories = data.subcategories || [];
        this.sortBy = data.sortBy || "";
        this.rank = data.rank || 0;
        this.rankOfLastSubcategory = data.rankOfLastSubcategory || 0;
        this.createdOn = data.createdOn || new Date();
        this.createdBy = data.createdBy || '';
        this.lastUpdatedOn = data.lastUpdatedOn || new Date();
        this.lastUpdatedBy = data.lastUpdatedBy || '';
        this.deletedOn = data.deletedOn || '';
        this.deletedBy = data.deletedBy || '';
        this.titleIndex = data.titleIndex || data.name.toLowerCase();
    }
}