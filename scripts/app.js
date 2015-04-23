var app = angular.module('offlineApp', ['kendo.directives']);

var el = null;

app.run(['everliveService', '$rootScope', function (everliveService, $rootScope) {



    function onDeviceOnline() {
        $rootScope.$broadcast('network:changed', "online");
        everliveService.goOnline();
    }

    function onDeviceOffline() {
        $rootScope.$broadcast('network:changed', "offline");
        everliveService.goOffline();
    }

    document.addEventListener("online", onDeviceOnline);
    document.addEventListener("offline", onDeviceOffline);

}]);

//This is required, so that the AppBuilder simulator works correctly
app.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|local):/);
    }
]);

//customerService that exposes a Kendo UI data source for Customers
app.service('customerService', ['everliveService', function (everliveService) {

    this.dataSource = everliveService.getDataSource("Customers", { autoSync: true });

    this.create = function (customer) {
        this.dataSource.add(customer);
    };

}]);

//everliveService 
app.service('everliveService', ['$rootScope', function ($rootScope) {

    this.el = new Everlive({
        apiKey: 'ChGozz6pHwKNAxVi',
        scheme: 'https',
        offlineStorage: {
            provider: {
                type: Everlive.Constants.StorageProviders.LocalStorage
            }
        }
    });
    
    //making sure the 
    this.el.offline(navigator.connection.type == 'none');

    this.getDataSource = function (contentType, options) {
        return this.el.getKendoDataSource(contentType, options);
    }

    this.goOnline = function () {
        this.el.offline(false);
        this.el.sync();
    }

    this.goOffline = function () {
        this.el.offline(true);
    }

    this.isSyncing = function () {
        return this.el.offlineStorage.isSynchronizing();
    }

}]);


app.controller('homeController', ['$scope', 'customerService', 'everliveService', function ($scope, customerService, everliveService) {

    $scope.customerService = customerService;
    $scope.isOnline = true;
    $scope.isSyncing = false;
    $scope.showSync = false;

    $scope.$on('network:changed', function (event, data) {
        if (data == "online") {
            $scope.isOnline = true;
        } else {
            $scope.isOnline = false;
        }
        $scope.$apply();
    });

    everliveService.el.on("syncStart", function () {
        $scope.isSyncing = everliveService.isSyncing();
        $scope.showSync = true;
        $scope.$apply();
    });

    everliveService.el.on("syncEnd", function () {
        $scope.isSyncing = everliveService.isSyncing();
        setTimeout(function () {
            $scope.showSync = false;
            $scope.$apply();
        }, 3000);
        $scope.$apply();
    });


}]);

app.controller('addController', ['$scope', 'customerService', function ($scope, customerService) {
    $scope.newCustomer = {
        ContactName: "Hristo",
        ContactTitle: "PM",
        CompanyName: "Telerik",
        City: "Sofia"
    }

    $scope.createNew = function (customer) {
        customerService.create(customer);
        kendo.mobile.application.navigate("#!home");
    }

}]);

function onDeviceReady() {
    StatusBar.overlaysWebView(false);
    angular.bootstrap(document, ['offlineApp']);
}

document.addEventListener("deviceready", onDeviceReady, false);