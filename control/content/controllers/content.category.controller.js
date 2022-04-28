/**
 * Create self executing function to avoid global scope creation
 */
(function (angular) {
  'use strict';
  angular
    .module('directoryContent')
    /**
     * Inject dependency
     */
    .controller('ContentCategoryCtrl', [
      '$scope',
      '$location',
      'EDITED_CATEGORY',
      function ($scope, $location, EDITED_CATEGORY) {
        /**
         * Using Control as syntax this
         */
        // var ContentCategory = this;
        $scope.subcategoryTitle = '';
        // $scope.hideSubcategorySection=false;

        //  console.log('this==$scope',this==$scope);
        // function chackAllSubCatNames () {
        //   if ($scope.item.data.subcategories.length) {

        //     $scope.item.data.subcategories.map((sub)=>{
        //       if (sub.name) {
        //     $scope.isSubCatNameExist=true;

        //       }else{
        //       $scope.isSubCatNameExist=false;
        //       return;
        //       }
        //     });
        //   }

        // }
        function init() {
          $scope.isBusy = true;
          $scope.isSubCatNameExist = true;

          buildfire.auth.getCurrentUser((err, user) => {
            if (err) {
              $scope.saving = false;
              return;
            }
            var data = {
              name: '',
              icon: '',
              subcategories: [],
              sortBy: 'Newest', // to sort subcategories
              rank: 0,
              rankOfLastSubcategory: 0,
              lastSubcategoryId: 0,
              isActive: true,
              createdOn: '',
              createdBy: '',
              lastUpdatedOn: '',
              lastUpdatedBy: '',
              deletedOn: '',
              deletedBy: '',
              // titleIndex:"",
            };

            // $scope.sortOptions = SubcategoryOrders.options;
            if (user) $scope.user = user;

            /**
             * if controller is for opened in edit mode, Load media data
             * else init it with bootstrap data
             */
            // if (category) {
            if (EDITED_CATEGORY.EditedCategory) {
              console.log('EDITED_CATEGORY.EditedCategory', EDITED_CATEGORY.EditedCategory);
              $scope.item = EDITED_CATEGORY.EditedCategory;
              $scope.mode = 'edit';
              $scope.title = 'Edit Category';
              $scope.displayedSubactegories = $scope.item.data.subcategories; // used to display searched subcategories
              // updateMasterItem($scope.item);
              if ($scope.item.data.name == 'Age') {
                //then hide subcategories part
                $scope.hideSubcategorySection = true;
              } else {
                $scope.hideSubcategorySection = false;
              }
              // chackAllSubCatNames();
            } else {
              $scope.hideSubcategorySection = false;
              $scope.item = { data: data };
              $scope.mode = 'add';
              $scope.title = 'Add Category';
              $scope.displayedSubactegories = $scope.item.data.subcategories;
              // updateMasterItem($scope.item);
            }
            // $scope.checkSubCategoryName();
            // $scope.itemSortableOptions.disabled = !($scope.item.data.sortBy === SubcategoryOrders.ordersMap.Manually);
            $scope.isBusy = false;
            $scope.$apply();
          });
        }

        init();

        function updateMasterItem(item) {
          $scope.masterItem = angular.copy(item);
        }

        $scope.addIcon = function () {
          var options = { showIcons: true, multiSelection: false },
            listImgCB = function (error, result) {
              if (error) {
                console.error('Error:', error);
              } else {
                if (result && result.selectedFiles && result.selectedFiles[0]) {
                  $scope.item.data.icon = result.selectedFiles[0];
                  $scope.item.data.iconType = Keys.iconTypes.IMG.key;
                } else if (result && result.selectedIcons && result.selectedIcons[0]) {
                  $scope.item.data.icon = result.selectedIcons[0];
                  $scope.item.data.iconType = Keys.iconTypes.ICON.key;
                } else {
                  $scope.item.data.icon = '';
                }
                // $scope.item.data.icon = result && result.selectedFiles && result.selectedFiles[0] || result && result.selectedIcons && result.selectedIcons[0] || "";
                if (!$scope.$$phase) $scope.$digest();
              }
            };
          buildfire.imageLib.showDialog(options, listImgCB);
        };

        $scope.removeIcon = function () {
          $scope.item.data.icon = '';
        };

        // //To render icon whether it is an image or icon
        $scope.isIcon = function (icon) {
          if (icon) {
            return icon.indexOf('http') != 0;
          }
          return $scope.item.data.icon && $scope.item.data.icon.indexOf('http') != 0;
        };

        $scope.updateItem = function () {
          if ($scope.item.data.name) {
            $scope.saving = true;
            $scope.item.data.name = $scope.item.data.name.trim();
            $scope.item.data.titleIndex = $scope.item.data.name.toLowerCase();
            if ($scope.item.id) {
              //then we are editing the item

              $scope.item.data.id = $scope.item.id;
              $scope.item.data.lastUpdatedOn = new Date();
              $scope.item.data.lastUpdatedBy = $scope.user;
              $scope.item.data.rankOfLastSubcategory = $scope.item.data.subcategories.length ? $scope.item.data.subcategories[$scope.item.data.subcategories.length - 1].rank : 0;
              Categories.update($scope.item.data, function (err, result) {
                if (err) {
                  $scope.saving = false;
                  console.error('Error saving data: ', err);
                  return;
                } else {
                  $scope.item = result;
                  // updateMasterItem($scope.item);
                  // buildfire.messaging.sendMessageToWidget({
                  //   name: EVENTS.CATEGORIES_CHANGE,
                  //   message: {}
                  // });
                  $scope.saving = false;
                  $scope.done();
                }
              });
            } else {
              //then we are adding the item
              $scope.hideSubcategorySection = false;
              $scope.item.data.createdOn = new Date();
              $scope.item.data.createdBy = $scope.user;

              $scope.item.data.lastSubcategoryId = $scope.item.data.subcategories.length ? $scope.item.data.subcategories.length : 0;
              $scope.item.data.rankOfLastSubcategory = $scope.item.data.subcategories.length ? $scope.item.data.subcategories[$scope.item.data.subcategories.length - 1].rank : 0;
              $scope.addItem((err, result) => {
                if (err) {
                  $scope.saving = false;
                  return console.log('Error saving data: ', err);
                }
                if (result) {
                  console.log('first added results', result);
                  $scope.item = result;
                  // updateMasterItem($scope.item);
                  if ($scope.item.data.subcategories && $scope.item.data.subcategories.length) {
                    $scope.item.data.subcategories.map((subcategory, index) => {
                      subcategory.categoryId = result.id;
                      subcategory.id = result.id + '_' + index;
                    });
                  }
                  $scope.item.data.id = result.id;
                  Categories.update($scope.item.data, function (err, result) {
                    if (err) {
                      $scope.saving = false;
                      console.error('Error saving data: ', err);
                      return;
                    } else {
                      $scope.item = result;
                      // updateMasterItem($scope.item);
                      // buildfire.messaging.sendMessageToWidget({
                      //   name: EVENTS.CATEGORIES_CHANGE,
                      //   message: {}
                      // });
                      $scope.saving = false;
                      // MediaCenterSettings.content.rankOfLastCategory = $scope.item.data.rank;
                      // MediaCenter.save(MediaCenterSettings).then(() => {
                      // });
                      console.log('resultssssss final from appdata', result);
                      $scope.done();
                    }
                  });
                }
              });
              return;
            }
          } else {
            $scope.titleRequired = true;
          }
        };

        $scope.addItem = function (cb) {
          Categories.add($scope.item.data, function (err, result) {
            if (err) {
              console.error('Error saving data: ', err);
              return cb('Error saving data');
            } else {
              $scope.item = result;
              // updateMasterItem($scope.item);
              cb(null, result);
            }
          });
        };

        $scope.done = function () {
          setTimeout(() => {
            window.location.href = '#/home';
          }, 0);
        };

        $scope.showSubcategoryModal = function () {
          buildfire.auth.showTagsSearchDialog(null, (err, result) => {
            if (err) return console.error(err);
            if (result) {
              console.log('resultttttt subcatt', result);
              let addedSubcategories = [];
              for (let i = 0; i < result.length; i++) {
                addedSubcategories.push(new Subcategory({ ...result[i], createdBy: $scope.user, lastUpdatedBy: $scope.user }).toJson());
              }
              if ($scope.item.data.subcategories.length) {
                $scope.item.data.subcategories = [...$scope.item.data.subcategories, ...addedSubcategories];
              } else {
                $scope.item.data.subcategories = addedSubcategories;
              }
              $scope.displayedSubactegories = $scope.item.data.subcategories;
              $scope.isSubCatNameExist = false;
              // chackAllSubCatNames();
              $scope.$apply();
            }
          });
          // if (mode == "Add") {
          //   $scope.subcategoryModalMode = "Add";
          //   $scope.addSubcategoryTitle = "Add Subcategory";
          //   $scope.showSubModal = true;
          // }
          // else if (mode == "Edit" && editedSubcategory && editedSubcategory.name) {
          //   // we are editing
          //   $scope.subcategoryModalMode = "Edit";
          //   $scope.addSubcategoryTitle = "Edit Subcategory";
          //   $scope.subcategoryTitle = editedSubcategory.name;
          //   $scope.showSubModal = true;
          //   $scope.editedSubcategory = editedSubcategory;
          // }
        };

        $scope.checkSubCategoryName = function (subCatName) {
          if (subCatName) {
            $scope.isSubCatNameExist = true;
          } else {
            $scope.isSubCatNameExist = false;
          }
          // if (!$scope.item.data.subcategories.length) {
          //   $scope.isSubCatNameExist=true;
          // }
        };
        // $scope.closeSubcategoryModal = function () {
        //   $scope.showSubModal = false;
        //   $scope.subcategoryTitle = "";
        // };

        // $scope.addSucbategoryIcon = function (subcategory, event) {
        //   let subIndex = $scope.item.data.subcategories.indexOf(subcategory);
        //   var options = { showIcons: true, multiSelection: false },
        //     listImgCB = function (error, result) {
        //       if (error) {
        //         console.error('Error:', error);
        //       } else {
        //         $scope.item.data.subcategories[subIndex].icon = result && result.selectedFiles && result.selectedFiles[0] || result && result.selectedIcons && result.selectedIcons[0] || "";
        //         if (!$scope.$$phase) $scope.$digest();
        //       }
        //     };
        //   buildfire.imageLib.showDialog(options, listImgCB);
        // };

        // $scope.removeSubcategoryIcon = function (subcategory) {
        //   let subIndex = $scope.item.data.subcategories.indexOf(subcategory);
        //   $scope.item.data.subcategories[subIndex].icon = "";
        // };

        // $scope.updateSubcategory = function () {
        //   if ($scope.subcategoryTitle) {
        //     if ($scope.subcategoryModalMode == "Add") {
        //       $scope.item.data.subcategories.push(new Subcategory({
        //         name: $scope.subcategoryTitle,
        //         id: $scope.item.id + "_" + $scope.item.data.lastSubcategoryId,
        //         rank: ($scope.item.data.rankOfLastSubcategory || 0) + 10,
        //         icon: "",
        //         createdOn: new Date(),
        //         createdBy: $scope.user || "",
        //         lastUpdatedOn: "",
        //         lastUpdatedBy: "",
        //         deletedOn: "",
        //         deletedBy: "",
        //       }));
        //       $scope.closeSubcategoryModal();
        //       $scope.subcategoryTitle = "";
        //       $scope.item.data.rankOfLastSubcategory = ($scope.item.data.rankOfLastSubcategory || 0) + 10;
        //       $scope.item.data.lastSubcategoryId = parseInt($scope.item.data.lastSubcategoryId + 1);
        //     }
        //     else {
        //       let itemIndex = $scope.item.data.subcategories.indexOf($scope.editedSubcategory);
        //       $scope.item.data.subcategories[itemIndex] = new Subcategory({
        //         id: $scope.editedSubcategory.id,
        //         name: $scope.subcategoryTitle,
        //         categoryId: $scope.item.id,
        //         rank: $scope.editedSubcategory.rank || ($scope.item.data.rankOfLastCategory || 0) + 10,
        //         icon: $scope.editedSubcategory.icon || "",
        //         createdOn: $scope.editedSubcategory.createdOn || new Date(),
        //         createdBy: $scope.editedSubcategory.createdBy || "",
        //         lastUpdatedOn: new Date(),
        //         lastUpdatedBy: $scope.user || "",
        //         deletedOn: "",
        //         deletedBy: "",
        //       })
        //       $scope.closeSubcategoryModal();
        //       $scope.subcategoryTitle = "";
        //     }
        //   }
        //   $scope.searchSubcategories();
        // };

        $scope.removeSubcategory = function (subcategory) {
          buildfire.dialog.confirm(
            {
              title: 'Delete Sucbategory',
              confirmButton: {
                type: 'danger',
                text: 'Delete',
              },
              message: 'Are you sure you want to delete this subcategory? This action is not reversible.',
            },
            (err, isConfirmed) => {
              if (err) console.error(err);

              if (isConfirmed) {
                let itemIndex = $scope.item.data.subcategories.indexOf(subcategory);
                $scope.item.data.subcategories.splice(itemIndex, 1);
                // $scope.searchSubcategories();
                $scope.$apply();
              } else {
                //Prevent action
              }
            }
          );
        };

        // $scope.toggleSortOrder = function (name) {
        //   if (!name) {
        //     console.info('There was a problem sorting your data');
        //   } else {
        //     var sortOrder = SubcategoryOrders.getOrder(name || SubcategoryOrders.ordersMap.Default);
        //     $scope.item.data.sortBy = name;
        //     $scope.item.data.sortByValue = sortOrder.value;
        //     $scope.sort();
        //     // $scope.getMore();
        //     $scope.itemSortableOptions.disabled = !($scope.item.data.sortBy === SubcategoryOrders.ordersMap.Manually);
        //   }
        // };

        // $scope.itemSortableOptions = {
        //   handle: '> .cursor-grab',
        //   disabled: $scope.isBusy || !($scope.item.data.sortBy === SubcategoryOrders.ordersMap.Manually),
        //   stop: function (e, ui) {
        //     console.log('all good');
        //     var endIndex = ui.item.sortable.dropindex,
        //       maxRank = 0,
        //       draggedItem = $scope.displayedSubactegories[endIndex];
        //     if (draggedItem) {
        //       var prev = $scope.displayedSubactegories[endIndex - 1],
        //         next = $scope.displayedSubactegories[endIndex + 1];
        //       var isRankChanged = false;
        //       if (next) {
        //         if (prev) {
        //           draggedItem.rank = ((prev.rank || 0) + (next.rank || 0)) / 2;
        //           isRankChanged = true;
        //         } else {
        //           draggedItem.rank = (next.rank || 0) / 2;
        //           isRankChanged = true;
        //         }
        //       } else {
        //         if (prev) {
        //           draggedItem.rank = ((prev.rank || 0) * 2 + 10) / 2;
        //           maxRank = draggedItem.rank;
        //           isRankChanged = true;
        //         }
        //       }
        //       if (isRankChanged) {
        //         if ($scope.item.data.rankOfLastSubcategory < maxRank) {
        //           $scope.item.data.rankOfLastSubcategory = maxRank;
        //         }
        //         $scope.item.data.subcategories.sort(function (a, b) {
        //           return a.rank - b.rank;
        //         });
        //         $scope.searchSubcategories();
        //       }
        //     }
        //   },
        // };

        // $scope.sort = function () {
        //   if ($scope.item.data.sortBy === "Subcategory Title A-Z") {
        //     $scope.item.data.subcategories.sort(function (a, b) {
        //       return a.name.localeCompare(b.name);
        //     });
        //   }

        //   if ($scope.item.data.sortBy === "Subcategory Title Z-A") {
        //     $scope.item.data.subcategories.sort(function (a, b) {
        //       return b.name.localeCompare(a.name);
        //     });
        //   }

        //   if ($scope.item.data.sortBy === "Manually") {
        //     $scope.item.data.subcategories.sort(function (a, b) {
        //       return a.rank - b.rank;
        //     });
        //   }

        //   if ($scope.item.data.sortBy === "Newest") {
        //     $scope.item.data.subcategories.sort(function (a, b) {
        //       return (new Date(b.createdOn) - new Date(a.createdOn));
        //     });
        //   }

        //   if ($scope.item.data.sortBy === "Oldest") {
        //     $scope.item.data.subcategories.sort(function (a, b) {
        //       return (new Date(a.createdOn) - new Date(b.createdOn));
        //     });
        //   }
        // };

        $scope.cancelAdd = function () {
          // $scope.done();
          window.location.href = '#/home';
        };

        // $scope.searchSubcategories = function () {
        //   if ($scope.searchText == "") {
        //     $scope.displayedSubactegories = $scope.item.data.subcategories;
        //   }
        //   else {
        //     $scope.displayedSubactegories = $scope.item.data.subcategories.filter(function (subcategory) {
        //       return subcategory.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1;
        //     });
        //   }
        // };

        // $scope.onEnterKey = function (keyEvent) {
        //   if (keyEvent.which === 13) $scope.searchSubcategories();
        // };

        // var header = {
        //   name: "Subcategory name",
        // };
        // var headerRow = ["name"];

        // $scope.getTemplate = function () {
        //   var templateData = [{
        //     name: '',
        //   }];
        //   var csv = $csv.jsonToCsv(angular.toJson(templateData), {
        //     header: header
        //   });
        //   $csv.download(csv, "Template.csv");
        // };

        // $scope.exportCSV = function () {
        //   if ($scope.item.data.subcategories && $scope.item.data.subcategories.length) {
        //     let persons = $scope.item.data.subcategories.map(function (subcategory) {
        //       return { name: subcategory.name };
        //     });
        //     var csv = $csv.jsonToCsv(angular.toJson(persons), {
        //       header: header
        //     });
        //     $csv.download(csv, "Export.csv");
        //   }
        //   else {
        //     $scope.getTemplate();
        //   }
        // };

        // function isValidItem(item, index, array) {
        //   return item.name;
        // }

        // function validateCsv(items) {
        //   if (!Array.isArray(items) || !items.length) {
        //     return false;
        //   }
        //   return items.every(isValidItem);
        // }

        // $scope.openImportCSVDialog = function () {
        //   $csv.import(headerRow).then(function (rows) {
        //     $scope.loading = true;
        //     if (rows && rows.length > 1) {

        //       var columns = rows.shift();

        //       for (var _index = 0; _index < headerRow.length; _index++) {
        //         if (header[headerRow[_index]] != columns[headerRow[_index]]) {
        //           $scope.loading = false;
        //           $scope.csvDataInvalid = true;
        //           /* $timeout(function hideCsvDataError() {
        //            $scope.csvDataInvalid = false;
        //            }, 2000);*/
        //           break;
        //         }
        //       }

        //       if (!$scope.loading)
        //         return;

        //       var rank = 0;
        //       for (var index = 0; index < rows.length; index++) {
        //         rank += 10;
        //         rows[index].createdOn = new Date().getTime();
        //         rows[index].createdBy = $scope.user || "";
        //         rows[index].lastUpdatedOn = "";
        //         rows[index].lastUpdatedBy = "";
        //         rows[index].deletedOn = "";
        //         rows[index].deletedBy = "";
        //         rows[index].rank = rank;
        //         rows[index].id = $scope.item.id ? $scope.item.id + "_" + parseInt($scope.item.data.lastSubcategoryId + index) : "";
        //         rows[index].name = rows[index].name;
        //       }
        //       if (validateCsv(rows)) {
        //         // MediaContent.insert(rows).then(function (data) {
        //         //     $scope.loading = false;
        //         //     $scope.isBusy = false;
        //         //     $scope.items = [];
        //         //     $scope.info.data.content.rankOfLastItem = rank;
        //         // }, function errorHandler(error) {
        //         //     console.error(error);
        //         //     $scope.loading = false;
        //         //     $scope.$apply();
        //         // });
        //         $scope.item.data.rankOfLastCategory = rank;
        //         $scope.item.data.lastSubcategoryId = parseInt($scope.item.data.lastSubcategoryId + rows.length);
        //         $scope.item.data.subcategories = rows;
        //         $scope.searchSubcategories();
        //       } else {
        //         $scope.loading = false;
        //         $scope.csvDataInvalid = true;
        //         $timeout(function hideCsvDataError() {
        //           $scope.csvDataInvalid = false;
        //         }, 2000);
        //       }
        //     }
        //     else {
        //       $scope.loading = false;
        //       $scope.csvDataInvalid = true;
        //       /*
        //        $timeout(function hideCsvDataError() {
        //        $scope.csvDataInvalid = false;
        //        }, 2000);*/
        //       $scope.$apply();
        //     }
        //   }, function (error) {
        //     $scope.loading = false;
        //     $scope.$apply();
        //     //do something on cancel
        //   });
        // };
      },
    ])
    .filter('cropImg', function () {
      return function (url) {
        if (!url) return;
        return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
      };
    });
})(window.angular);
