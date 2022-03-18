class Filter {
    constructor(data = {}) {
        this.widget = data.widget || null;
        this.settings = data.settings || null;
        this.state = {
            initialized: false,
            searchOptions: {
                skip: 0,
                limit: 50,
            },
            categories: [],
            activeFilters: this.widget.activeFilters,
            pickedCategories: {},
            noMore: false,
        }
    };

    init() {
        this.updateSearchOptions();
        this.getCategories();
        this.show();
        applyFilterBtn.addEventListener("click", () => {
            this.applyFilters();
        });
    };

    show() {
        defaultView.style.display = "none";
        mapView.style.display = "none";
        filterView.classList.toggle("show");
        this.widget.currentScreen = Keys.screenNameKeys.FILTER.key;
    }

    // Gets categories, then calls the render functions
    getCategories() {
        if (this.state.isBusy || this.state.noMore) return;
        this.state.isBusy = true;
        Categories.get(this.state.searchOptions, (error, results) => {
            if (error) return console.error(error);
            this.state.categories = this.state.categories ? this.state.categories.concat(results) : results;
            console.log("categories", this.state.categories);
            this.state.isBusy = false;
            if (results && results.length) {
                if (results.length < this.state.searchOptions.limit) {
                    this.state.noMore = true;
                }
                else {
                    this.state.searchOptions.skip += this.state.searchOptions.limit;
                }
            }
            if (this.state.categories.length == 0) {
                this.state.noMore = true;
                this.renderEmptyState();
            }
            else {
                this.renderCategories();
            }
            this.state.initialized = true;
        });
    };

    // Updates the search options based on the settings
    updateSearchOptions() {
        if (this.settings && this.settings.sortCategoriesBy) {
            switch (this.settings.sortCategoriesBy) {
                case Keys.sortByKeys.NEWEST.key:
                    this.state.searchOptions.sort = {
                        createdOn: -1,
                    };
                    break;
                case Keys.sortByKeys.OLDEST.key:
                    this.state.searchOptions.sort = {
                        createdOn: 1,
                    };
                    break;
                case Keys.sortByKeys.MANUAL.key:
                    this.state.searchOptions.sort = {
                        rank: 1,
                    };
                    break;

                default:
                    this.state.searchOptions.sort = {
                        createdOn: -1,
                    };
                    break;
            };
        }
    };

    // customized ui function for image cropping
    ui(elementType, appendTo, innerHTML, classNameArray, imageSource, cropSize, cropAspect) {
        let e = document.createElement(elementType);
        if (innerHTML) e.innerHTML = innerHTML;
        if (elementType == 'img') {
            e.src = imageSource;
            e.onload = () => {
                if (e.src.indexOf('avatar.png') < 0) {
                    e.src = buildfire.imageLib.cropImage(imageSource, { size: cropSize, aspect: cropAspect });
                }
            };
            e.onerror = () => {
                e.src = "./images/avatar.png";
            };
        }
        if (Array.isArray(classNameArray)) {
            classNameArray.forEach(c => e.classList.add(c));
        }
        else {
            e.classList.add(classNameArray);
        }
        if (appendTo) appendTo.appendChild(e);
        return e;
    }
    renderCategories() {
        this.state.categories.forEach(category => {
            if (category.data.categoryType == Keys.categoryTypes.BIRTHDATE.key) {
                this.renderDateCategory(category);
            }
            else {
                this.renderCategory(category);
            }
        })
    };

    renderCategory(category) {
        let categoryContainer = this.ui('div', filtersContainer, null, 'category-container');
        let topRow = this.ui('div', categoryContainer, null, 'top-row');
        let imgContainer = this.ui('div', topRow, null, 'category-image-container');
        if (category.data.iconType == Keys.iconTypes.IMG.key) {
            this.ui('img', imgContainer, null, 'categoryScreenIcon', category.data.icon, 'xs', '1:1');
        }
        else {
            let iconClasses = category.data.icon.split(" ");
            this.ui('div', imgContainer, null, iconClasses);
        }
        let categoryName = this.ui('div', topRow, category.data.name, 'category-name');
        let inputContainer = this.ui('div', topRow, null, 'input-container');
        let checkBoxesContainer = this.ui('div', inputContainer, null, 'checkbox-container');
        let untouchedCheckWrapper = this.ui('div', checkBoxesContainer, null, ['checkbox', 'checkbox-primary', 'no-label']);
        let untouchedCheck = this.ui('input', untouchedCheckWrapper, null, ['ng-pristine', 'ng-untouched', 'ng-valid']);
        untouchedCheck.type = "checkbox";
        untouchedCheck.checked = this.isCategoryPicked(category.id);
        let mainCheckBoxWrapper = this.ui('div', checkBoxesContainer, null, ['checkbox', 'checkbox-primary', 'no-label']);
        let mainCheck = this.ui('input', mainCheckBoxWrapper, null, ['ng-pristine', 'ng-untouched', 'ng-valid']);
        mainCheck.type = "checkbox";
        mainCheck.checked = this.isCategoryPicked(category.id);
        mainCheck.id = category.id;
        let mainLabel = this.ui('label', mainCheckBoxWrapper, null, ['subcategory-label']);
        mainLabel.htmlFor  = category.id;
        let chevron = this.ui('span', topRow, null, ['expand-collapse', 'chevron', 'top', 'chev']);


        //subcategories render
        let subCategoriesContainer;
        let subcategories;
        if (category.data && category.data.subcategories && category.data.subcategories.length) {
            subCategoriesContainer = this.ui('div', categoryContainer, null, 'subcategories-container');
            subcategories = category.data.subcategories.map(subcat => this.renderSubcategory(subCategoriesContainer, subcat, category.id));
        }


        mainLabel.addEventListener('click', (e) => {
            e.preventDefault();
            if (mainCheck.checked) {
                mainCheck.checked = false;
                this.removeCategory(category);
                if (subCategoriesContainer) {
                    if (subcategories && subcategories.length) {
                        subcategories.forEach(sub => {
                            sub(true);
                        });
                    }
                }
            }
            else {
                mainCheck.checked = true;
                this.addCategory(category);
                if (subCategoriesContainer) {
                    if (subcategories && subcategories.length) {
                        subcategories.forEach(sub => {
                            sub();
                        });
                    }
                }
            }
        });

        chevron.addEventListener('click', () => {
            if (chevron.classList) {
                chevron.classList.toggle('bottom');
            }
            if (subCategoriesContainer) {
                if (subCategoriesContainer.classList && subCategoriesContainer.classList.contains("expand")) {
                    subCategoriesContainer.classList.remove("expand");
                }
                else {
                    subCategoriesContainer.classList.add("expand");
                }
            }
        });

    };

    renderDateCategory(category) {
        let categoryContainer = this.ui('div', filtersContainer, null, 'category-container');
        let topRow = this.ui('div', categoryContainer, null, 'top-row');
        let imgContainer = this.ui('div', topRow, null, 'category-image-container');
        if (category.data.iconType == Keys.iconTypes.IMG.key) {
            this.ui('img', imgContainer, null, 'categoryScreenIcon', category.data.icon, 'xs', '1:1');
        }
        else {
            let iconClasses = category.data.icon.split(" ");
            this.ui('div', imgContainer, null, iconClasses);
        }
        let categoryName = this.ui('div', topRow, category.data.name, 'category-name');
        let inputContainer = this.ui('div', topRow, null, 'input-container');
        let checkBoxesContainer = this.ui('div', inputContainer, null, 'checkbox-container');
        let untouchedCheckWrapper = this.ui('div', checkBoxesContainer, null, ['checkbox', 'checkbox-primary', 'no-label']);
        let untouchedCheck = this.ui('input', untouchedCheckWrapper, null, ['ng-pristine', 'ng-untouched', 'ng-valid']);
        untouchedCheck.type = "checkbox";
        untouchedCheck.checked = this.isCategoryPicked(category.id);
        let mainCheckBoxWrapper = this.ui('div', checkBoxesContainer, null, ['checkbox', 'checkbox-primary', 'no-label']);
        let mainCheck = this.ui('input', mainCheckBoxWrapper, null, ['ng-pristine', 'ng-untouched', 'ng-valid']);
        mainCheck.type = "checkbox";
        mainCheck.checked = this.isCategoryPicked(category.id);
        mainCheck.id = category.id;
        let mainLabel = this.ui('label', mainCheckBoxWrapper, null, ['subcategory-label']);
        mainLabel.htmlFor  = category.id;
        let chevron = this.ui('span', topRow, null, ['expand-collapse', 'chevron', 'top', 'chev']);

        let sliderWrapper = this.ui('div', categoryContainer, null, 'slider-wrapper');
        let sliderLeft = this.ui('div', sliderWrapper, null, ["slider-val", "left"]);
        let sliderMin = this.ui('p', sliderLeft, "1");
        sliderMin.id = "sliderMin";
        let slideContainer = this.ui('div', sliderWrapper, null, ["slider-container"]);
        let sliderTrack = this.ui('div', slideContainer, null, ["slider-track"]);
        let sliderOne = this.ui("input", slideContainer, null);
        sliderOne.type = "range";
        sliderOne.min = 1;
        sliderOne.max = 100;
        sliderOne.value = 1;
        sliderOne.id = "slider-1";

        let sliderTwo = this.ui("input", slideContainer, null);
        sliderTwo.type = "range";
        sliderTwo.min = 1;
        sliderTwo.max = 100;
        sliderTwo.value = 100;
        sliderTwo.id = "slider-2";

        let sliderRight = this.ui('div', sliderWrapper, null, ["slider-val", "right"]);
        let sliderMax = this.ui('p', sliderRight, "100");

        let minGap = 1;
        let sliderMaxValue = sliderTwo.max;

        const slideOne = () => {
            if(parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap){
                sliderOne.value = parseInt(sliderTwo.value) - minGap;
            }
            sliderMin.innerHTML = sliderOne.value;
            if (!this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key]) this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key] = {};
            let minYear = new Date();
            minYear.setFullYear(minYear.getFullYear() - parseInt(sliderOne.value));
            let maxYear = new Date();
            maxYear.setFullYear(maxYear.getFullYear() + parseInt(sliderTwo.value));
            if (sliderOne.value != 1 || sliderTwo.value != 100) {
                mainCheck.checked = true;
                this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].min = minYear;
                if (!this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].max) {
                    this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].max = maxYear;
                }
            }
            else {
                delete this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key];
                mainCheck.checked = false;
            }
            
            fillColor();
        }
        const slideTwo = () => {
            if(parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap){
                sliderTwo.value = parseInt(sliderOne.value) + minGap;
            }
            sliderMax.innerHTML = sliderTwo.value;
            let maxYear = new Date();
            maxYear.setFullYear(maxYear.getFullYear() + parseInt(sliderTwo.value));
            let minYear = new Date();
            minYear.setFullYear(minYear.getFullYear() - parseInt(sliderOne.value));
            if (!this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key]) this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key] = {};
            if (sliderOne.value != 1 || sliderTwo.value != 100) {
                mainCheck.checked = true;
                this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].max = maxYear;
                if (!this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].min) {
                    this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key].min = minYear;
                }
            }
            else {
                delete this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key];
                mainCheck.checked = false;
            }
        
            fillColor();
        }
        function fillColor(){
            let percent1 = (sliderOne.value / sliderMaxValue) * 100;
            let percent2 = (sliderTwo.value / sliderMaxValue) * 100;
            sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , var(--bf-theme-primary) ${percent1}% , var(--bf-theme-primary) ${percent2}%, #dadae5 ${percent2}%)`;
        }

        sliderOne.addEventListener('input', (e) => {
            slideOne(e);
        });

        sliderTwo.addEventListener('input', (e) => {
            slideTwo(e);
        });

        mainLabel.addEventListener('click', (e) => {
            e.preventDefault();
            if (mainCheck.checked) {
                mainCheck.checked = false;
                delete this.state.pickedCategories[Keys.categoryTypes.BIRTHDATE.key];
                sliderOne.value = 1;
                sliderTwo.value = 100;
                sliderMin.innerHTML = sliderOne.value;
                sliderMax.innerHTML = sliderTwo.value;
            }
        });

    };

    renderSubcategory(container, subcategory, categoryId) {
        let subCont = this.ui('div', container, null, "subcategory");
        let subcategoryBubble = this.ui('div', subCont, null, "subcategory-bubble");
        subcategoryBubble.id = subcategory.key;
        let subcatName = this.ui('p', subcategoryBubble, subcategory.name);
        let check;

        const toggleCheck = (onlyRemoveUI) => {
            if (onlyRemoveUI) {
                if (subcategoryBubble.classList.contains("picked")) subcategoryBubble.classList.remove("picked");
                if (check) {
                    check.parentElement.removeChild(check);
                    check = null;
                }
                return;
            }
            if (Object.keys(this.state.pickedCategories) && Object.keys(this.state.pickedCategories).length > 0 && this.state.pickedCategories[categoryId]) {
                if (this.state.pickedCategories[categoryId].indexOf(subcategory.key) == -1) {
                    this.state.pickedCategories[categoryId].push(subcategory.key);
                    if (!subcategoryBubble.classList.contains("picked")) subcategoryBubble.classList.add("picked");
                    if (!check) {
                        check = this.ui("span", null, "&#x2714;", ["bubble-check"]);
                        subcategoryBubble.insertBefore(check, subcatName);
                    }
                }
                else {
                    this.state.pickedCategories[categoryId].splice(this.state.pickedCategories[categoryId].indexOf(subcategory.key), 1);
                    if (this.state.pickedCategories[categoryId].length == 0) {
                        delete this.state.pickedCategories[categoryId];
                    }
                    if (subcategoryBubble.classList.contains("picked")) subcategoryBubble.classList.remove("picked");
                    if (check) {
                        check.parentElement.removeChild(check);
                        check = null;
                    }

                }
            }
            else {
                this.state.pickedCategories[categoryId] = [subcategory.key];
                if (!subcategoryBubble.classList.contains("picked")) subcategoryBubble.classList.add("picked");
                if (!check) {
                    check = this.ui("span", null, "&#x2714;", ["bubble-check"]);
                    subcategoryBubble.insertBefore(check, subcatName);
                }
            }
            this.updateCategoryCheck(categoryId);
            console.log("picked", this.state.pickedCategories);
        }

        subCont.addEventListener('click', (e) => {
            toggleCheck();
        });
        return toggleCheck
    }

    isCategoryPicked(categoryId) {
        return false;
    }

    updateCategoryCheck(categoryId) {
        let check = document.getElementById(categoryId);
        let category = this.state.categories.find(cat => cat.id == categoryId);
        if (check && check.labels && check.labels.length) {
            let label = check.labels[0];
            let newClass = this.getCategoryIconState(category);
            if (newClass == "minus" || newClass == "check") {
                check.checked = true;
            }
            else {
                check.checked = false;
            }
            label.className = `${this.getCategoryIconState(category)} subcategory-label`;
        }
    }

    getCategoryIconState(category) {
        if (Object.keys(this.state.pickedCategories) && Object.keys(this.state.pickedCategories).length > 0 && Object.keys(this.state.pickedCategories).includes(category.id)) {
            let subCats = this.state.pickedCategories[category.id] || [];
            if (subCats.length > 0 && subCats.length < category.data.subcategories.length) {
                return "minus";
            }
            else {
                return "check";
            }
        }
        else {
            return "";
        }
    };

    addCategory(category) {
        this.state.pickedCategories[category.id] = [];
        if (category.data && category.data.subcategories && category.data.subcategories.length) {
        }
    }

    removeCategory(category) {
        if (Object.keys(this.state.pickedCategories) && Object.keys(this.state.pickedCategories).length > 0 && this.state.pickedCategories[category.id]) {
            delete this.state.pickedCategories[category.id];
            return;
        }
    }

    applyFilters() {
        this.widget.activeFilters = this.state.pickedCategories;
        this.widget.filter();
        this.widget.goBack();
    }

    renderEmptyState() {

    };


}