(function (angular, buildfire) {
  'use strict';
  angular
    .module('directoryContent')
    .controller('ContentHomeCtrl', [
      '$scope',
      function ($scope) {
        /**
         * Breadcrumbs  related implementation
         */
        //Buildfire.history.pop();

        //scroll current view to top when loaded.
        // Buildfire.navigation.scrollTop();

        $scope.data = {
          // in this controller only we are handling thess settings
          tagFilter: [],
          actionItem: null,

          navigateToCwByDefault: false,

          autoEnlistAll: false,
          allowShowProfileComponent: false,
          badgePushNotifications: false,
          userSubtitleShowMode: Keys.userSubtitleShowModeKeys.SHOW_EMAIL.key,
          ranking: 'ALPHA_ASC',
          mapEnabled: false,
          filtersEnabled: false,

          layout: 'list',
        };

        $scope.badgeListUI = badgeListUI;
        $scope.badgeListUI.init('badges');

        $scope.tagName = '';

        $scope.tooltip =
          'The following properties are available from the user: userId, email, displayName, firstName, lastName. Example: {{userId}} will resolve to the user\'s id. If there is no action set (if default "messageUser" action is set) you will need the Community Wall plugin installed on your App in order to navigate user to 1 on 1 chat.';

        $scope.badge = {
          imageUrl: '',
          name: '',
          tag: '',
          tagCount: 1,
          rank: 0,
        };

        $scope.pickImage = (e) => {
          e.preventDefault();

          buildfire.imageLib.showDialog({ showIcons: false, multiSelection: false }, (error, result) => {
            if (result && result.selectedFiles && result.selectedFiles.length) {
              $scope.badge.imageUrl = result.selectedFiles[0];

              if (!$scope.$$phase) $scope.$apply();
            }
          });
        };

        $scope.addBadge = (isValid) => {
          if (!isValid) return;

          $scope.badge.rank = $scope.badgeListUI.badgeList.badges.length;
          $scope.badgeListUI.addItem($scope.badge, console.error);
          $scope.badge = {
            imageUrl: '',
            name: '',
            tag: '',
            tagCount: 1,
            rank: 0,
          };
        };

        // $scope.rankingOptions = Users.rankings;

        $scope.userSubtitleShowModeOptions = [...Object.values(Keys.userSubtitleShowModeKeys)];

        $scope.applyTag = () => {
          $scope.data.tagFilter.push($scope.tagName);
          $scope.tagName = '';

          if (!$scope.$$phase) $scope.$apply();
        };

        $scope.removeTag = (tag) => {
          $scope.data.tagFilter = $scope.data.tagFilter.filter((tagName) => tagName !== tag);

          if (!$scope.$$phase) $scope.$apply();
        };

        $scope.editAction = (reset) => {
          if (reset) {
            $scope.data.actionItem = null;
            if (!$scope.$$phase) $scope.$apply();

            return;
          }
          buildfire.actionItems.showDialog($scope.data.actionItem, { showIcon: false }, (error, actionItem) => {
            if (error) return console.error(error);

            $scope.data.actionItem = actionItem;
            if (!$scope.$$phase) $scope.$apply();
          });
        };

        buildfire.messaging.onReceivedMessage = (msg) => {
          if (msg.cmd === 'finishSearchEngineUpdate') {
            $scope.data.updatedSearchEngine = true;
            $scope.save();
            buildfire.dialog.alert({
              title: 'Search Engine Update',
              message: 'Congratulations! Search Engine succesfully updated.',
            });
          }
          if (msg.cmd === 'indexingDone') {
            $scope.data.isIndexed = true;
            $scope.save();
            buildfire.dialog.alert({
              title: 'Indexing for all users done',
              message: 'Congratulations! indexing all user succesfully updated.',
            });
          }
        };

        Settings.get()
          .then((data) => {
            const {
              autoEnlistAll,
              tagFilter,
              actionItem,
              badgePushNotifications,
              ranking,
              userSubtitleShowMode,
              navigateToCwByDefault,
              allowShowProfileComponent,
              updatedSearchEngine,
              mapEnabled,
              filtersEnabled,
              layout,
              isIndexed,
            } = data;

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

            $scope.data.layout = layout || 'list';

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
            console.log('$scope.dataaaaaaa ytytytytyty', $scope.data);
          })
          .catch(console.error);

        $scope.save = () => {
          const { data } = $scope;

          new Settings({ data }).save().then(console.warn).catch(console.error);
        };

        function startWatch() {
          $scope.$watch(
            'data',
            () => {
              $scope.save();
            },
            true
          );
        }
      },
    ])
    .filter('cropImg', function () {
      return function (url) {
        if (!url) return;
        return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
      };
    });
})(window.angular, window.buildfire);
