((angular, buildfire) => {
	'use strict';

	const app = angular.module('directoryContent', []);

	const directoryContentCtrl = $scope => {
		$scope.data = {
			autoEnlistAll: false,
			autoEnlistTags: [],
			actionItem: null
		};

		$scope.badgeListUI = badgeListUI;
		$scope.badgeListUI.init('badges');

		$scope.tagName = '';

		$scope.badge = {
			imageUrl: '',
			name: '',
			tag: '',
			tagCount: 0
		};

		$scope.pickImage = () => {
			buildfire.imageLib.showDialog({}, (error, result) => {
				if (result && result.selectedFiles && result.selectedFiles.length) {
					$scope.badge.imageUrl = result.selectedFiles[0];

					if (!$scope.$$phase) $scope.$apply();
				}
			});
		};

		$scope.addBadge = () => {
			$scope.badgeListUI.addItem($scope.badge, console.error);
			$scope.badge = {
				imageUrl: '',
				name: '',
				tag: '',
				tagCount: 0
			};
		};

		$scope.applyTag = () => {
			$scope.data.autoEnlistTags.push({
				name: $scope.tagName,
				id: Date.now() + Math.floor(Math.random() * 10)
			});
			$scope.tagName = '';

			if (!$scope.$$phase) $scope.$apply();
		};

		$scope.removeTag = tag => {
			$scope.data.autoEnlistTags.filter(({ id }) => id !== tag.id);

			if (!$scope.$$phase) $scope.$apply();
		};

		$scope.editAction = () => {
			buildfire.actionItems.showDialog($scope.data.actionItem, { showIcon: false }, (error, actionItem) => {
				if (error) return console.error(error);

				$scope.data.actionItem = actionItem;
				if (!$scope.$$phase) $scope.$apply();
			});
		};

		Settings.get()
			.then(data => {
				const { autoEnlistAll, autoEnlistTags, actionItem } = data;

				$scope.data.autoEnlistAll = autoEnlistAll || false;
				$scope.data.autoEnlistTags = autoEnlistTags || [];
				$scope.data.actionItem = actionItem || null;

				if (!$scope.$$phase) $scope.$apply();

				startWatch();
			})
			.catch(console.error);

		// Badges.get((error, badges) => {

		// 	if (error) return console.error(error);

		// 	$scope.badges = badges;
		// 	badgeList.
		// 	if (!$scope.$$phase) $scope.$apply();
		// });

		$scope.save = obj => {
			const { data } = $scope;

			new Settings({ data })
				.save()
				.then(console.warn)
				.catch(console.error);
		};

		function startWatch() {
			$scope.$watch('data', $scope.save, true);
		}
	};

	app.controller('directoryContentCtrl', ['$scope', directoryContentCtrl]).filter('cropImg', function() {
		return function(url) {
			if (!url) return;
			return buildfire.imageLib.cropImage(url, { size: 'xxs', aspect: '1:1' });
		};
	});
})(window.angular, window.buildfire);
