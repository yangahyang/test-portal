app.controller("loginController", function($scope, usersFactory, $state, $ionicLoading, $ionicHistory) {
    // retrieve firebase authentication object
    var authObj = usersFactory.getAuthObj();

    // login listener
    var listener;

    // on page enter, initiate login listener
    $scope.$on('$ionicView.enter', function() {
        $ionicHistory.clearHistory();
        $scope.data = {};
        $scope.data.redirect = false;

        // initiate login listener
        listener = authObj.$onAuth(function(authData) {
            // check for logged in account
            if (authData != null) {
                // check for existing facebook email in firebase
                try {
                    usersFactory.checkEmail(authData.facebook.email.replace(/\./g, ''), function (emailAvailable) {
                        // logged in with facebook
                        if (emailAvailable) {
                            // firebase account not created, display error message
                            authObj.$unauth();
                            $scope.data.error = "Invalid user!";
                            $ionicLoading.hide();
                        } else {
                            // firebase account already created, go to main page
                            if ($scope.data.redirect) {
                                usersFactory.update();
                                $state.go("songs");
                                //update usersFactory profile
                                //usersFactory.pullProfile(authData.facebook.email);
                            }
                            $ionicLoading.hide();
                        }
                    })
                } catch (error) {
                    // logged in with email
                    //usersFactory.pullProfile(authData.password.email);
                    $ionicLoading.hide();
                }
            }
        })
    })

    // on page leave, unsubscribe listener + clear variables
    $scope.$on('$ionicView.leave', function() {
        // unsubscribe listener
        listener();

        // clear variables
        $scope.data = {};
    })

    // facebook login method
    $scope.loginFB = function() {
        $scope.data.redirect = true;

        // initialize plugin for browser
        if (!window.cordova) {
            facebookConnectPlugin.browserInit(120329051634496);
        }

        // firebase login with facebook access token
        facebookConnectPlugin.login(['email'], function(status) {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><br>Logging in...'
            });
            facebookConnectPlugin.getAccessToken(function(token) {
                authObj.$authWithOAuthToken("facebook", token, function(error, authData) {
                    if (error) {
                        console.log('Firebase login failed!', error);
                    } else {
                        console.log('Authenticated successfully with payload:', authData);
                    }
                });
            }, function(error) {
                console.log('Could not get access token', error);
            });
        }, function(error) {
            console.log('An error occurred logging the user in', error);
        })
    }

    // email login method
    $scope.loginEmail = function() {
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner><br>Logging in...'
        });

        // firebase login with password
        authObj.$authWithPassword({
            email: $scope.data.email,
            password: $scope.data.password
        }).then(function() {
            usersFactory.update();
            $state.go('songs');
        }).catch(function(error) {
            $ionicLoading.hide();
            $scope.data.error = "Invalid email or password!";
        });
    }
});