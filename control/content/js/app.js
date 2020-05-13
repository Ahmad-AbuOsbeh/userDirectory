((angular, buildfire) => {
	'use strict';

	Analytics.init();
	
	const app = angular.module('directoryContent', []);

	const directoryContentCtrl = $scope => {
		$scope.data = {
			autoEnlistAll: false,
			tagFilter: [],
			actionItem: null,
			badgePushNotifications: false,
			ranking: 'ALPHA_ASC'
		};

		$scope.badgeListUI = badgeListUI;
		$scope.badgeListUI.init('badges');

		$scope.tagName = '';

		$scope.tooltip = "The following properties are available from the user: userId, email, displayName, firstName, lastName. Example: {{userId}} will resolve to the user's id.";

		$scope.badge = {
			imageUrl: '',
			name: '',
			tag: '',
			tagCount: 1,
			rank: 0
		};

		$scope.pickImage = (e) => {
			e.preventDefault();

			buildfire.imageLib.showDialog({showIcons: false, multiSelection: false}, (error, result) => {
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
				rank: 0
			};
		};

		$scope.rankingOptions = Users.rankings;

		$scope.applyTag = () => {
			$scope.data.tagFilter.push($scope.tagName);
			$scope.tagName = '';

			if (!$scope.$$phase) $scope.$apply();
		};

		$scope.removeTag = tag => {
			$scope.data.tagFilter = $scope.data.tagFilter.filter(tagName => tagName !== tag);

			if (!$scope.$$phase) $scope.$apply();
		};

		$scope.editAction = reset => {
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

		Settings.get()
			.then(data => {
				const { autoEnlistAll, tagFilter, actionItem, badgePushNotifications, ranking } = data;

				$scope.data.autoEnlistAll = autoEnlistAll || false;
				$scope.data.tagFilter = tagFilter || [];
				$scope.data.actionItem = actionItem || null;
				$scope.data.badgePushNotifications = badgePushNotifications || null;
				$scope.data.ranking = ranking || 'ALPHA_ASC';

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
			$scope.$watch('data', (newObj, oldObj) => {
				if (angular.equals(newObj, oldObj)) return;
				$scope.save();
			}, true);
		}
	};

	app.controller('directoryContentCtrl', ['$scope', directoryContentCtrl]).filter('cropImg', function() {
		return function(url) {
			if (!url) return;
			return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
		};
	});
})(window.angular, window.buildfire);