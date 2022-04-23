(function (angular,buildfire) {
    'use strict';
    angular
        .module('directorySettings')
        .controller('SettingsCtrl', ['$scope', function ($scope) {
     console.log('from settings controllerrrrrrr');
            //    shared region
            
                $scope.data = {
                    tagFilter: [],
                    actionItem: null,

                    navigateToCwByDefault: false,
                   // in this controller only we are handling thess settings
                    autoEnlistAll: false,
                    allowShowProfileComponent: false,
                    badgePushNotifications: false,
                    userSubtitleShowMode: Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key,
                    ranking: 'ALPHA_ASC',
                    mapEnabled:false,
                    filtersEnabled:false,
                };
                $scope.userSubtitleShowModeOptions = [...Object.values(Keys.userSubtitleShowModeKeys)];
                // $scope.sortUsersOptions=[...Object.values(Keys.userSubtitleShowModeKeys)]
                $scope.rankingOptions = Users.rankings;

        // bages section -- content tab -- 

                // $scope.badgeListUI = badgeListUI;
                // $scope.badgeListUI.init('badges');
        
                // $scope.tagName = '';
        
                // $scope.tooltip = "The following properties are available from the user: userId, email, displayName, firstName, lastName. Example: {{userId}} will resolve to the user's id. If there is no action set (if default \"messageUser\" action is set) you will need the Community Wall plugin installed on your App in order to navigate user to 1 on 1 chat.";
        
                // $scope.badge = {
                //     imageUrl: '',
                //     name: '',
                //     tag: '',
                //     tagCount: 1,
                //     rank: 0
                // };
        
                // $scope.pickImage = (e) => {
                //     e.preventDefault();
        
                //     buildfire.imageLib.showDialog({ showIcons: false, multiSelection: false }, (error, result) => {
                //         if (result && result.selectedFiles && result.selectedFiles.length) {
                //             $scope.badge.imageUrl = result.selectedFiles[0];
        
                //             if (!$scope.$$phase) $scope.$apply();
                //         }
                //     });
                // };
        
                // $scope.addBadge = (isValid) => {
                //     if (!isValid) return;
        
                //     $scope.badge.rank = $scope.badgeListUI.badgeList.badges.length;
                //     $scope.badgeListUI.addItem($scope.badge, console.error);
                //     $scope.badge = {
                //         imageUrl: '',
                //         name: '',
                //         tag: '',
                //         tagCount: 1,
                //         rank: 0
                //     };
                // };
        
                // $scope.rankingOptions = Users.rankings;
        
        
                // $scope.applyTag = () => {
                //     $scope.data.tagFilter.push($scope.tagName);
                //     $scope.tagName = '';
        
                //     if (!$scope.$$phase) $scope.$apply();
                // };
        
                // $scope.removeTag = tag => {
                //     $scope.data.tagFilter = $scope.data.tagFilter.filter(tagName => tagName !== tag);
        
                //     if (!$scope.$$phase) $scope.$apply();
                // };
        
                // $scope.editAction = reset => {
                //     if (reset) {
                //         $scope.data.actionItem = null;
                //         if (!$scope.$$phase) $scope.$apply();
        
                //         return;
                //     }
                //     buildfire.actionItems.showDialog($scope.data.actionItem, { showIcon: false }, (error, actionItem) => {
                //         if (error) return console.error(error);
        
                //         $scope.data.actionItem = actionItem;
                //         if (!$scope.$$phase) $scope.$apply();
                //     });
                // };
        
                buildfire.messaging.onReceivedMessage = (msg) => {
                    if (msg.cmd === 'finishSearchEngineUpdate') {
                        $scope.data.updatedSearchEngine = true;
                        $scope.save();
                        buildfire.dialog.alert({
                            title: 'Search Engine Update',
                            message: 'Congratulations! Search Engine succesfully updated.',
                        });
                    }
                };
    
                Settings.get()
                    .then(data => {
                        const { autoEnlistAll, tagFilter, actionItem, badgePushNotifications, ranking, userSubtitleShowMode, navigateToCwByDefault, allowShowProfileComponent, updatedSearchEngine, mapEnabled,filtersEnabled ,isIndexed} = data;
        console.log('DATAAAA from settings',data);
                        $scope.data.tagFilter = tagFilter || [];
                        $scope.data.actionItem = actionItem || null;

                        $scope.data.navigateToCwByDefault = navigateToCwByDefault || false;
                        $scope.data.updatedSearchEngine = updatedSearchEngine || null;

                        $scope.data.autoEnlistAll = autoEnlistAll || false;
                        $scope.data.allowShowProfileComponent = allowShowProfileComponent || false;
                        $scope.data.badgePushNotifications = badgePushNotifications || null;
                        $scope.data.userSubtitleShowMode = userSubtitleShowMode || Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key;
                        $scope.data.ranking = ranking || 'ALPHA_ASC';
                        $scope.data.mapEnabled = mapEnabled || false;
                        $scope.data.filtersEnabled = filtersEnabled || false;

                        $scope.data.isIndexed = isIndexed || false;
        
                        if (!$scope.data.updatedSearchEngine) {
                            buildfire.dialog.alert({
                                title: 'Search Engine Update',
                                message: 'We are improving your search engine, please do not close your browser or leave the plugin until you see success dialog.',
                            });
                            buildfire.messaging.sendMessageToWidget({ cmd: 'startSearchEngineUpdate' });
                        }
        
        
                        if (!$scope.$$phase) $scope.$apply();
        
                        startWatch();
                    })
                    .catch(console.error);
        
                $scope.save = () => {
                    const { data } = $scope;
        
                    new Settings({ data })
                        .save()
                        .then(console.warn)
                        .catch(console.error);
                };
        
                function startWatch() {
                    $scope.$watch('data', () => {
                        $scope.save();
                    }, true);
                }
        
                // $scope.createMockCategory = () => {
                //     // let sub1 = new Subcategory({
                //     // 	name: 'Male',
                //     // 	key: '$$profile_data_male',
                //     // 	rank: 10,
                //     // });
                //     // let sub2 = new Subcategory({
                //     // 	name: 'Female',
                //     // 	key: '$$profile_data_female',
                //     // 	rank:20
                //     // });
                //     // let data = {
                //     // 	name: 'Gender',
                //     // 	iconType: Keys.iconTypes.IMG.key,
                //     // 	icon: 'https://alnnibitpo.cloudimg.io/v7/https://alnnibitpo.cloudimg.io/v7/https://images.unsplash.com/photo-1485579149621-3123dd979885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=Mnw0NDA1fDB8MXxzZWFyY2h8OXx8c291bmR8ZW58MHx8fHwxNjQ2OTIxMzU5&ixlib=rb-1.2.1&q=80&w=1080&func=bound&width=240&height=135&func=crop&width=215&height=121',
                //     // 	subcategories: [sub1, sub2],
                //     // 	rank: 10,
                //     // }
                //     let data = {
                //         name: 'Age',
                //         iconType: Keys.iconTypes.ICON.key,
                //         icon: 'glyphicon glyphicon-user',
                //         categoryType: Keys.categoryTypes.BIRTHDATE.key,
                //         rank: 20
                //     }
                //     Categories.add(data, (err, res) => {
                //         if (res) {
                //             console.log("Success", res);
                //         }
                //     });
                // }
            
        }]).filter('cropImg', function () {
            return function (url) {
                if (!url) return;
                return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
            };
        });
})(window.angular, window.buildfire);
