((angular, buildfire) => {
	'use strict';

	Analytics.init();

	const app = angular.module('directoryContent', ['ngRoute']);

	app.config(['$routeProvider',function ($routeProvider) {
		$routeProvider.when('/home',{
			templateUrl: 'templates/home.html',
			controller: 'ContentHomeCtrl',

		})
		.when('/category',{
			templateUrl: 'templates/category.html',
			controllerAs: 'ContentCategory',
            controller: 'ContentCategoryCtrl',
	
			
			
		})
		// .when('/category/:itemId',{
		// 	templateUrl: 'templates/category.html',
		// 	controllerAs: 'ContentCategory',
        //     controller: 'ContentCategoryCtrl',
	
			
			
		// })
		.otherwise('/home',{
			templateUrl: 'templates/home.html',
			controller: 'ContentHomeCtrl'
		});
	}]);
	app.service('EDITED_CATEGORY', function () {  
		this.EditedCategory;    
		this.CategoryData = function(category) {
			this.EditedCategory=category;
		 return category;
		};    
		return this;
	  });
})(window.angular, window.buildfire);
