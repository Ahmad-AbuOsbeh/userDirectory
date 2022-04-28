(function (angular) {
  'use strict';
  angular
    .module('directoryContent')
    .controller('ContentCategoryHomeCtrl', [
      '$scope',
      'EDITED_CATEGORY',
      function ($scope, EDITED_CATEGORY) {
        /**
         * Breadcrumbs  related implementation
         */
        //Buildfire.history.pop();

        //scroll current view to top when loaded.
        buildfire.navigation.scrollTop();

        $scope.sortingCatrgoriesOptions = [
          { id: 1, name: 'Manually', value: 'Manually', key: 'rank', order: 1 },
          { id: 1, name: 'Category Title A-Z', value: 'Category Title A-Z', key: 'title', order: 1 },
          { id: 1, name: 'Category Title Z-A', value: 'Category Title Z-A', key: 'title', order: -1 },
          { id: 1, name: 'Newest', value: 'Newest', key: 'createdOn', order: -1 },
          { id: 1, name: 'Oldest', value: 'Oldest', key: 'createdOn', order: 1 },
        ];

        buildfire.auth.getCurrentUser((err, user) => {
          // if (err) {
          //     $scope.saving = false;
          //     return;
          // }
          // $scope.sortOptions = SubcategoryOrders.options;
          if (user) $scope.user = user;
          // item.data.isActive = $scope.user;
        });
        // var ContentCategoryHome = this;

        // var _infoData = {
        //     data: {
        //         content: {
        //             images: [],
        //             descriptionHTML: '',
        //             description: '',
        //             sortBy: Orders.ordersMap.Newest,
        //             sortCategoriesBy: CategoryOrders.ordersMap.Newest,
        //             rankOfLastItem: 0,
        //             rankOfLastCategory: 0,
        //             allowShare: true,
        //             allowSource: true,
        //             allowOfflineDownload: false,
        //             enableFiltering: false,
        //             transferAudioContentToPlayList: false,
        //             forceAutoPlay: false,
        //             dateIndexed: true,
        //             dateCreatedIndexed: true
        //         },
        //         design: {
        //             listLayout: "list-1",
        //             itemLayout: "item-1",
        //             backgroundImage: "",
        //             skipMediaPage: false
        //         }
        //     }
        // };

        // var CategoryContent = new DB(COLLECTIONS.CategoryContent);
        // var MediaCenter = new DB(COLLECTIONS.MediaCenter);

        // if (CategoryHomeInfo) {
        //     updateMasterInfo(CategoryHomeInfo);
        //     $scope.info = CategoryHomeInfo;
        // }
        // else {
        //     CategoryHomeInfo = _infoData;
        //     updateMasterInfo(_infoData);
        //     $scope.info = _infoData;
        // }
        // if (typeof ($scope.info.data.content.sortCategoriesBy) !== 'undefined'
        //     && $scope.info.data.content.sortCategoriesBy === 'Most') {
        //     $scope.info.data.content.sortCategoriesBy = 'Category Title A-Z';
        //     $scope.info.data.content.sortCategoriesByValue = 'Category Title A-Z';
        // }
        // if (typeof ($scope.info.data.content.sortCategoriesBy) !== 'undefined'
        //     && $scope.info.data.content.sortCategoriesBy === 'Least') {
        //     $scope.info.data.content.sortCategoriesBy = 'Category Title Z-A';
        //     $scope.info.data.content.sortCategoriesByValue = 'Category Title Z-A';
        // }

        // var header = {
        //     icon: 'Icon image',
        //     name: 'Name',
        //     subcategories: 'Subcategories',
        // };
        // var headerRow = ["icon", "name", "subcategories"];
        // var tmrDelayForMedia = null;

        /**
         * Create instance of CategoryContent, MediaCenter db collection
         * @type {DB}
         */

        var _skip = 0,
          _limit = 30,
          _maxLimit = 50,
          searchOptions = {
            filter: {},
            sort: { createdOn: -1 },
            skip: _skip,
            limit: _limit + 1, // the plus one is to check if there are any more
          };

        $scope.isBusy = false;
        /* tells if data is being fetched*/
        $scope.items = [];
        $scope.sortOption = 'Newest';
        // $scope.sortOptions = 'Category Title A-Z';
        // $scope.sortOptions = {title:1};

        // var updateSearchOptions = function () {
        //     var order;
        //     if ($scope.info && $scope.info.data && $scope.info.data.content)
        //         order = CategoryOrders.getOrder($scope.info.data.content.sortCategoriesBy || CategoryOrders.ordersMap.Default);
        //     if (order) {
        //         //Handles Indexing Changes categoryDate/mediaDateIndex
        //         if ($scope.info.data.content.dateIndexed && order.key == "categoryDate") {
        //             order.key = "mediaDateIndex";
        //         } else if (!$scope.info.data.content.dateIndexed && order.key == "categoryDateIndex") {//so it don't couse issues before data is updated
        //             order.key = "categoryDate";
        //         }
        //         //END Handles Indexing Changes categoryDate/mediaDateIndex
        //         var sort = {};
        //         sort[order.key] = order.order;
        //         if ((order.name == "Category Title A-Z" || order.name === "Category Title Z-A")) {
        //             if (order.name == "Category Title A-Z") {
        //                 searchOptions.sort = { titleIndex: 1 }
        //             }
        //             if (order.name == "Category Title Z-A") {
        //                 searchOptions.sort = { titleIndex: -1 }
        //             }
        //         } else {
        //             searchOptions.sort = sort;
        //         }

        //         return true;
        //     }
        //     else {
        //         return false;
        //     }
        // };
        /**
         * $scope.noMore tells if all data has been loaded
         */
        $scope.noMore = false;

        // $scope.goToMediaHome = function () {
        //     Location.goToHome();
        // };

        // $scope.navigateToSettings = function () {
        //     Buildfire.navigation.navigateToTab(
        //         {
        //             tabTitle: "Settings",
        //         },
        //         (err) => {
        //             if (err) return console.error(err); // `Content` tab was not found

        //             console.log("NAVIGATION FINISHED");
        //         }
        //     );
        // }

        /**
         * $scope.getMore is used to load the items
         */
        $scope.toggleSortOrder = function (option) {
          let key;
          let order;
          for (let i = 0; i < $scope.sortingCatrgoriesOptions.length; i++) {
            if ($scope.sortingCatrgoriesOptions[i].value == option) {
              key = $scope.sortingCatrgoriesOptions[i].key;
              order = $scope.sortingCatrgoriesOptions[i].order;
            }
          }
          //   setTimeout(() => {
          //  update categories > sortby
          let updatedItems = [];
          $scope.items.forEach((item) => {
            console.log('catttt', item);

            item.data.id = item.id;
            item.data.lastUpdatedOn = new Date();
            item.data.lastUpdatedBy = $scope.user;
            //   item.data.rankOfLastSubcategory = item.data.subcategories.length ? item.data.subcategories[item.data.subcategories.length - 1].rank : 0;
            item.data.sortBy = option;
            Categories.update(item.data, function (err, result) {
              if (err) {
                $scope.saving = false;
                console.error('Error saving data: ', err);
                return;
              } else {
                console.log('edited activve', result);
                // item = result;
                updatedItems.push(result);
                // updateMasterItem($scope.item);
                // buildfire.messaging.sendMessageToWidget({
                //   name: EVENTS.CATEGORIES_CHANGE,
                //   message: {}
                // });
                // $scope.done();
              }
            });
          });
          $scope.saving = false;
          //   }, 5000);
          console.log('updatedItems', updatedItems);
          //   $scope.items = updatedItems;
          // $scope.sortOption=option.value;
          console.log('receieved option', option, 'KEY:', key, 'ORDER:', order);
          searchOptions.sort = { key: order };
          console.log('searchOptions from dropdownnn', searchOptions);
          $scope.items = [];
          $scope.getMore();
        };

        $scope.getMore = function () {
          if ($scope.isBusy && !$scope.noMore) {
            return;
          }
          // updateSearchOptions();
          $scope.isBusy = true;
          Categories.get(searchOptions, function (err, result) {
            if (err) {
              console.error('Error getting data..', err);
              $scope.isBusy = false;
              return;
            }
            console.log('resultttt', result);
            if (result.length <= _limit) {
              // to indicate there are more
              $scope.noMore = true;
            } else {
              result.pop();
              searchOptions.skip = searchOptions.skip + _limit;
              $scope.noMore = false;
            }

            $scope.items = $scope.items ? $scope.items.concat(result) : result;
            $scope.sortOption = $scope.items[0].data.sortBy;
            $scope.isBusy = false;
            console.log('$scope.isBusy', $scope.isBusy);
            console.log('$scope.items', $scope.items);
            $scope.$apply();
          });
        };

        // check if "Age" category added or not, add it if it not exists
        var searchAgeOptions = {
          filter: { '_buildfire.index.string1': 'Age' },
          limit: 50,
          skip: 0,
          sort: { createdOn: -1 },
          // sort: { },
        };
        Categories.get(searchAgeOptions, function (err, result) {
          if (err) {
            console.error('Error getting Age category..', err);
            return;
          }
          console.log('resulttttttttttttt', result);
          if (!result.length) {
            $scope.createMockCategory();
          } else {
            $scope.getMore();
          }
        });
        $scope.createMockCategory = () => {
          console.log('from mock');
          // let sub1 = new Subcategory({
          // 	name: 'Male',
          // 	key: '$$profile_data_male',
          // 	rank: 10,
          // });
          // let sub2 = new Subcategory({
          // 	name: 'Female',
          // 	key: '$$profile_data_female',
          // 	rank:20
          // });
          // let data = {
          // 	name: 'Gender',
          // 	iconType: Keys.iconTypes.IMG.key,
          // 	icon: 'https://alnnibitpo.cloudimg.io/v7/https://alnnibitpo.cloudimg.io/v7/https://images.unsplash.com/photo-1485579149621-3123dd979885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=Mnw0NDA1fDB8MXxzZWFyY2h8OXx8c291bmR8ZW58MHx8fHwxNjQ2OTIxMzU5&ixlib=rb-1.2.1&q=80&w=1080&func=bound&width=240&height=135&func=crop&width=215&height=121',
          // 	subcategories: [sub1, sub2],
          // 	rank: 10,
          // }
          let data = {
            name: 'Age',
            // iconType: Keys.iconTypes.ICON.key,
            // icon: 'glyphicon glyphicon-user',
            categoryType: Keys.categoryTypes.BIRTHDATE.key,
            rank: 20,
          };

          Categories.add(data, (err, res) => {
            if (err) {
              console.error('Error while Creating Age category', err);
              return;
            }
            if (res) {
              console.log('Success', res);
              $scope.getMore();
            }
          });
        };

        /**
         * $scope.toggleSortOrder() to change the sort by
         */
        // $scope.toggleSortOrder = function (name) {
        //     if (!name) {
        //         console.info('There was a problem sorting your data');
        //     } else {
        //         var sortOrder = CategoryOrders.getOrder(name || CategoryOrders.ordersMap.Default);
        //             $scope.items = [];
        //             /* reset Search options */
        //             $scope.noMore = false;
        //             searchOptions.skip = 0;
        //             /* Reset skip to ensure search begins from scratch*/

        //             $scope.isBusy = false;

        //             $scope.info.data.content.sortCategoriesBy = name;
        //             $scope.info.data.content.sortCategoriesByValue = sortOrder.value;
        //             $scope.getMore();
        //             $scope.itemSortableOptions.disabled = !($scope.info.data.content.sortCategoriesBy === CategoryOrders.ordersMap.Manually);
        //     }
        // };
        $scope.itemSortableOptions = {
          handle: '> .cursor-grab',
          //   disabled: $scope.isBusy || !($scope.item.data.sortBy === SubcategoryOrders.ordersMap.Manually),
          disabled: false,
          stop: function (e, ui) {
            console.log('all good');
            var endIndex = ui.item.sortable.dropindex,
              maxRank = 0,
              draggedItem = $scope.items[endIndex];
            if (draggedItem) {
              var prev = $scope.items[endIndex - 1],
                next = $scope.items[endIndex + 1];
              var isRankChanged = false;
              if (next) {
                if (prev) {
                  draggedItem.rank = ((prev.rank || 0) + (next.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.rank = (next.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.rank = ((prev.rank || 0) * 2 + 10) / 2;
                  maxRank = draggedItem.rank;
                  isRankChanged = true;
                }
              }
              if (isRankChanged) {
                if ($scope.item.data.rankOfLastSubcategory < maxRank) {
                  $scope.item.data.rankOfLastSubcategory = maxRank;
                }
                $scope.item.data.subcategories.sort(function (a, b) {
                  return a.rank - b.rank;
                });
                // $scope.searchSubcategories();
              }
            }
          },
        };
        // $scope.itemSortableOptions = {
        //   handle: '> .cursor-grab',
        //   //   disabled: !($scope.sortOption === 'Manually'),
        //   disabled: false,
        //   stop: function (e, ui) {
        //     console.log('from stop');
        //     var endIndex = ui.item.sortable.dropindex,
        //       maxRank = 0,
        //       draggedItem = $scope.items[endIndex];
        //     if (draggedItem) {
        //       var prev = $scope.items[endIndex - 1],
        //         next = $scope.items[endIndex + 1];
        //       var isRankChanged = false;
        //       if (next) {
        //         if (prev) {
        //           draggedItem.data.rank = ((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
        //           isRankChanged = true;
        //         } else {
        //           draggedItem.data.rank = (next.data.rank || 0) / 2;
        //           isRankChanged = true;
        //         }
        //       } else {
        //         if (prev) {
        //           draggedItem.data.rank = ((prev.data.rank || 0) * 2 + 10) / 2;
        //           maxRank = draggedItem.data.rank;
        //           isRankChanged = true;
        //         }
        //       }
        //       if (isRankChanged) {
        //         console.log('rankedd changed: draggedItem:', draggedItem);
        //         // CategoryContent.update(draggedItem.id, draggedItem.data, function (err) {
        //         //     if (err) {
        //         //         console.error('Error during updating rank');
        //         //     } else {
        //         //         if ($scope.data.content.rankOfLastCategory < maxRank) {
        //         //             $scope.data.content.rankOfLastCategory = maxRank;
        //         //         }
        //         //     }
        //         // });
        //       }
        //     }
        //   },
        // };

        /**
         * $scope.getTemplate() used to download csv template
         */
        // $scope.getTemplate = function () {
        //     var templateData = [{
        //         icon: '',
        //         name: '',
        //         subcategories: [],
        //     }];
        //     var csv = $csv.jsonToCsv(angular.toJson(templateData), {
        //         header: header
        //     });
        //     $csv.download(csv, "Template.csv");
        // };

        /**
         * records holds the data to export the data.
         * @type {Array}
         */
        var records = [];

        /**
         * getRecords function get the  all items from DB
         * @param searchOption
         * @param records
         * @param callback
         */
        // function getRecords(searchOption, records, callback) {
        //     CategoryContent.find(searchOption).then(function (result) {
        //         if (result.length <= _maxLimit) {// to indicate there are more
        //             records = records.concat(result);
        //             return callback(records);
        //         }
        //         else {
        //             result.pop();
        //             searchOption.skip = searchOption.skip + _maxLimit;
        //             records = records.concat(result);
        //             return getRecords(searchOption, records, callback);
        //         }
        //     }, function (error) {
        //         throw (error);
        //     });
        // }

        /**
         * $scope.exportCSV() used to export people list data to CSV
         */
        // $scope.exportCSV = function () {
        //     var search = angular.copy(searchOptions);
        //     search.skip = 0;
        //     search.limit = _maxLimit + 1;
        //     getRecords(search,
        //         []
        //         , function (data) {
        //             if (data && data.length) {
        //                 var persons = [];
        //                 angular.forEach(angular.copy(data), function (value) {
        //                     delete value.data.createdBy;
        //                     delete value.data.createdOn;
        //                     delete value.data.deletedBy;
        //                     delete value.data.deletedOn;
        //                     delete value.data.id;
        //                     delete value.data.lastSubcategoryId;
        //                     delete value.data.lastUpdatedBy;
        //                     delete value.data.lastUpdatedOn;
        //                     delete value.data.rankOfLastSubcategory;
        //                     delete value.data.rankOfLastCategory;
        //                     delete value.data.sortBy;
        //                     delete value.data.rank;
        //                     delete value.data.sortByValue;
        //                     delete value.data.titleIndex;
        //                     if (value.data.subcategories && value.data.subcategories.length) {
        //                         value.data.subcategories = value.data.subcategories.map(function (subcategory) {
        //                             return subcategory.name;
        //                         });
        //                         value.data.subcategories = value.data.subcategories.join(",");
        //                     }
        //                     persons.push(value.data);
        //                 });
        //                 var csv = $csv.jsonToCsv(angular.toJson(persons), {
        //                     header: header
        //                 });
        //                 $csv.download(csv, "Export.csv");
        //             }
        //             else {
        //                 $scope.getTemplate();
        //             }
        //             records = [];
        //         });
        // };
        // function isValidItem(item, index, array) {
        //     return item.name;
        // }

        // function validateCsv(items) {
        //     if (!Array.isArray(items) || !items.length) {
        //         return false;
        //     }
        //     return items.every(isValidItem);
        // }

        /**
         * method to open the importCSV Dialog
         */
        // $scope.openImportCSVDialog = function () {
        //     $csv.import(headerRow).then(function (rows) {
        //         $scope.loading = true;
        //         if (rows && rows.length > 1) {

        //             var columns = rows.shift();

        //             for (var _index = 0; _index < headerRow.length; _index++) {
        //                 if (header[headerRow[_index]] != columns[headerRow[_index]]) {
        //                     $scope.loading = false;
        //                     $scope.csvDataInvalid = true;
        //                     /* $timeout(function hideCsvDataError() {
        //                      $scope.csvDataInvalid = false;
        //                      }, 2000);*/
        //                     break;
        //                 }
        //             }

        //             if (!$scope.loading)
        //                 return;

        //             var rank = $scope.info.data.content.rankOfLastCategory || 0;
        //             for (var index = 0; index < rows.length; index++) {
        //                 rank += 10;
        //                 rows[index].createdOn = new Date().getTime();
        //                 let subcategories = [];
        //                 if (rows[index].subcategories && rows[index].subcategories.length) {
        //                     rows[index].subcategories.split(",");
        //                     let subRank = 0;
        //                     subcategories = subcategories.map(function (subcategory, subcategoryIndex) {
        //                         subRank += 10;
        //                         return {
        //                             name: subcategory,
        //                             rank: subRank,
        //                             createdOn: new Date().getTime(),
        //                             lastUpdatedOn: "",
        //                             lastUpdatedBy: "",
        //                             deletedOn: "",
        //                             deletedBy: "",
        //                         }
        //                     });
        //                 }
        //                 rows[index].lastSubcategoryId = subcategories.length ? subcategories.length : 0;
        //                 rows[index].rankOfLastSubcategory = subcategories.length ? subcategories[subcategories.length - 1].rank : 0;
        //                 rows[index].rank = rank;
        //                 rows[index].subcategories = subcategories;
        //                 rows[index].titleIndex = rows[index].name.toLowerCase();
        //                 rows[index].createdBy = "";
        //                 rows[index].lastUpdatedBy = "";
        //                 rows[index].deletedBy = "";
        //                 rows[index].deletedOn = "";
        //                 rows[index].lastUpdatedOn = "";
        //                 rows[index].sortBy = SubcategoryOrders.ordersMap.Newest;

        //             }
        //             if (validateCsv(rows)) {
        //                 CategoryContent.insert(rows).then(function (data) {
        //                     $scope.loading = false;
        //                     $scope.isBusy = false;
        //                     $scope.items = [];
        //                     $scope.info.data.content.rankOfLastCategory = rank;
        //                     $scope.items = [];
        //                     searchOptions.skip = 0
        //                     $scope.getMore();
        //                     $scope.updateSubcategories();
        //                 }, function errorHandler(error) {
        //                     console.error(error);
        //                     $scope.loading = false;
        //                     $scope.$apply();
        //                 });
        //             } else {
        //                 $scope.loading = false;
        //                 $scope.csvDataInvalid = true;
        //                 $timeout(function hideCsvDataError() {
        //                     $scope.csvDataInvalid = false;
        //                 }, 2000);
        //             }
        //         }
        //         else {
        //             $scope.loading = false;
        //             $scope.csvDataInvalid = true;
        //             /*
        //              $timeout(function hideCsvDataError() {
        //              $scope.csvDataInvalid = false;
        //              }, 2000);*/
        //             $scope.$apply();
        //         }
        //     }, function (error) {
        //         $scope.loading = false;
        //         $scope.$apply();
        //         //do something on cancel
        //     });
        // };

        /**
         * $scope.updateSubcategories() used to give bulk inserted categories' subcategories ids
         */
        // $scope.updateSubcategories = function () {
        //     var records = [];
        //     var page = 0;

        //     var get = function () {
        //         CategoryContent.find({ filter: {}, pageSize: 50, page: page, recordCount: true })
        //             .then(function (data) {
        //                 records = records.concat(data.result);
        //                 if (records.length < data.totalRecord) {
        //                     page++;
        //                     get();
        //                 } else {
        //                     records.forEach(function (record) {
        //                         if (!record.data.id) {
        //                             record.data.id = record.id;
        //                             if (record.data.subcategories && record.data.subcategories.length) {
        //                                 record.data.subcategories.map((subcategory, index) => {
        //                                     subcategory.categoryId = record.id;
        //                                     subcategory.id = record.id + "_" + index;
        //                                 });
        //                             }
        //                             CategoryContent.update(record.id, record.data);
        //                         }
        //                     });
        //                 }

        //             });
        //     }
        //     get();
        // };

        /**
         * $scope.searchListItem() used to search items list
         * @param value to be search.
         */
        // $scope.searchListItem = function (value) {
        //     searchOptions.skip = 0;
        //     /*reset the skip value*/

        //     $scope.isBusy = false;
        //     $scope.items = [];
        //     value = value.trim();
        //     if (!value) {
        //         value = '/*';
        //     }
        //     searchOptions.filter = { "$json.name": { "$regex": value, $options: "-i", } };
        //     $scope.getMore();
        // };

        // $scope.onEnterKey = (keyEvent) => {
        //     if (keyEvent.which === 13) $scope.searchListItem($scope.search);
        // }
        $scope.changeActive = function (item) {
          $scope.saving = true;

          console.log('catttttttt', item);
          console.log('cat name:', item.data.name, 'isActive:', item.data.isActive);
          if (item.id) {
            //then we are editing the item

            item.data.id = item.id;
            item.data.lastUpdatedOn = new Date();
            // buildfire.auth.getCurrentUser((err, user) => {
            //   if (err) {
            //     $scope.saving = false;
            //     return;
            //   }

            // $scope.sortOptions = SubcategoryOrders.options;
            //   if (user) $scope.user = user;
            // item.data.isActive = $scope.user;
            item.data.lastUpdatedBy = $scope.user;
            item.data.rankOfLastSubcategory = item.data.subcategories.length ? item.data.subcategories[item.data.subcategories.length - 1].rank : 0;
            Categories.update(item.data, function (err, result) {
              if (err) {
                $scope.saving = false;
                console.error('Error saving data: ', err);
                return;
              } else {
                console.log('edited activve', result);
                item = result;
                // updateMasterItem($scope.item);
                // buildfire.messaging.sendMessageToWidget({
                //   name: EVENTS.CATEGORIES_CHANGE,
                //   message: {}
                // });
                $scope.saving = false;
                // $scope.done();
              }
            });
            // });
          }
        };
        /**
         * $scope.removeListItem() used to delete an item from item list
         * @param _index tells the index of item to be deleted.
         */
        $scope.removeListItem = function (index, id) {
          if ('undefined' == typeof index) {
            return;
          }
          var item = $scope.items[index];
          if ('undefined' !== typeof item) {
            buildfire.dialog.confirm(
              {
                title: 'Delete Item',
                message: 'Are you sure you want to delete this item?',
                confirmButton: {
                  type: 'danger',
                  text: 'Delete',
                },
              },
              (err, isConfirmed) => {
                if (isConfirmed) {
                  $scope.isBusy = true;
                  Categories.delete(id, function (err, result) {
                    if (err) {
                      console.error('Error while deleting an item-----', err);
                      $scope.isBusy = false;
                      return;
                    }
                    $scope.items.splice(index, 1);
                    $scope.isBusy = false;
                    $scope.$apply();
                  });
                }
              }
            );
          }
        };

        // $scope.goTo = function (id) {
        //     Location.go('#category/' + id);
        // };

        // updateSearchOptions();

        // function updateMasterInfo(info) {
        //     $scope.masterInfo = angular.copy(info);
        // }

        // function resetInfo() {
        //     //$scope.info = angular.copy($scope.masterInfo);
        // }

        // function isUnchanged(info) {
        //     return angular.equals(info, $scope.masterInfo);
        // }

        // function updateData(_info) {
        //     if (!_info.id) {
        //         MediaCenter.save(_info.data).then(function (data) {
        //             MediaCenter.get().then(function (getData) {
        //                 /* $scope.masterInfo = angular.copy(_info);
        //                  _info.id = getData.id;
        //                  AppConfig.setSettings(_info.data);*/
        //                 updateMasterInfo(data);
        //             }, function (err) {
        //                 console.error(err);
        //             });
        //         }, function (err) {
        //             console.error('Error-------', err);
        //         });
        //     } else {
        //         MediaCenter.update(_info.id, _info.data).then(function (data) {
        //             updateMasterInfo(data);
        //         }, function (err) {
        //             console.error('Error-------', err);
        //         });
        //     }

        // }

        $scope.isIcon = function (icon) {
          if (icon) {
            return icon.indexOf('http') != 0;
          }
        };

        $scope.editCategory = function (category) {
          $scope.editedCategory = EDITED_CATEGORY.CategoryData(category);
          // console.log('$scope.Product',$scope.Product);
          window.location.href = '#/category';
          setTimeout(() => {}, 0);
        };
        // function saveDataWithDelay(_info) {
        //     if (tmrDelayForMedia) {
        //         clearTimeout(tmrDelayForMedia);
        //     }
        //     if (!isUnchanged(_info)) {
        //         tmrDelayForMedia = setTimeout(function () {
        //             updateData(_info);
        //         }, 1000);
        //     }
        // }

        // $scope.goToCategories = function () {
        //     Location.go('#category/');
        // };

        // $scope.goToCategory = function (id) {
        //     Location.go('#category/' + id);
        // };

        // //var initInfo = true;
        // $scope.$watch(function () {
        //     return $scope.info;
        // }, saveDataWithDelay, true);

        // Messaging.sendMessageToWidget({
        //     name: EVENTS.ROUTE_CHANGE,
        //     message: {
        //         path: PATHS.HOME
        //     }
        // });
      },
    ])
    .filter('cropImg', function () {
      return function (url) {
        if (!url) return;
        return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
      };
    });
})(window.angular);
