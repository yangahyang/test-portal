app.controller("tracksController", function($scope, usersFactory, tracksFactory, $state, $ionicLoading, $ionicPopup, $ionicViewSwitcher, $timeout) {
    var authObj;
    $scope.data = {};

    // on page enter,
    $scope.$on('$ionicView.beforeEnter', function() {
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner><br>Loading...'
        });

        // retrieve firebase reference + authentication object
        var ref = usersFactory.getRef();
        authObj = usersFactory.getAuthObj();

        // redirect to login page if not logged in
        if(authObj.$getAuth() == null) {
            // not logged in, go to login page
            $state.go("login");
        } else {
            // this check is solely for the event that a new user logs in with facebook and then
            // manually types and goes to this page's URL
            var email;
            try {
                // facebook account logged in
                email = authObj.$getAuth().facebook.email.replace(/\./g, '');
                ref.once("value", function(snapshot) {
                    if(snapshot.child(email).val() == null) {
                        // facebook account not created, aunauth and go back to login page
                        authObj.$unauth();
                        $state.go("login");
                    }
                });
            } catch (error) {
                // not a new facebook account, do nothing
            }
        }

        $scope.data.user = usersFactory.getUserObj();

        $scope.data.user.$loaded()
            .then(function() {
                $scope.data.tracks = tracksFactory.getFirebaseArr()
                if ($scope.data.tracks == null) {
                    $scope.viewSongs();
                } else {
                    $scope.data.song = tracksFactory.getSong();
                    $scope.data.tracks.$loaded()
                        .then(function () {
                            $ionicLoading.hide();
                        })
                }
            })
    })

    // on page leave, unsubscribe listener + clear variables
    $scope.$on('$ionicView.leave', function() {
        if ($scope.data.popupAddTrack != null) {
            $scope.data.popupAddTrack.close();
        }
        if ($scope.data.popupDeleteTrack != null) {
            $scope.data.popupDeleteTrack.close();
        }
        if ($scope.data.popupEditTrack != null) {
            $scope.data.popupEditTrack.close();
        }
    })

    // logout method
    $scope.logout = function() {
        authObj.$unauth();
        $state.go("login");
    };

    $scope.addTrack = function() {
        $scope.data.newTrack = {};
        $scope.data.newTrack.uploading = false;
        $scope.data.popupAddTrack = $ionicPopup.show({
            templateUrl: 'templates/popupAddTrack.html',
            cssClass: 'popup50',
            title: 'Add New Track',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    onTap: function(e) {
                        if ($scope.data.newTrack.uploading) {
                            e.preventDefault();
                        }
                    }
                },
                {
                    text: 'Add',
                    type: 'button-positive',
                    onTap: function(e) {
                        e.preventDefault();
                        if (!$scope.data.newTrack.uploading) {
                            var file = document.getElementById('file').files[0];

                            if ($scope.data.newTrack == null || $scope.data.newTrack.name == null || $scope.data.newTrack.name == "" || $scope.data.newTrack.label == null || $scope.data.newTrack.label == "" || file == null) {
                                $scope.data.newTrack.error = "Please complete all fields!";
                            } else {
                                var add = true;
                                for (var i = 0; i < $scope.data.tracks.length; i++) {
                                    if ($scope.data.tracks[i].name.toLowerCase() == $scope.data.newTrack.name.toLowerCase()) {
                                        $scope.data.newTrack.error = "A track with the same name already exists!";
                                        add = false;
                                    } else if ($scope.data.tracks[i].label.toLowerCase() == $scope.data.newTrack.label.toLowerCase()) {
                                        $scope.data.newTrack.error = "A track with the same label already exists!";
                                        add = false;
                                    } else if ($scope.data.tracks[i].track.toLowerCase() == file.name.toLowerCase()) {
                                        $scope.data.newTrack.error = "A track with the same file name already exists!";
                                        add = false;
                                    }
                                }

                                if (add) {
                                    $scope.data.newTrack.uploading = true;
                                    tracksFactory.uploadTrack($scope.data.newTrack.name, $scope.data.newTrack.label, file).then(function (status) {
                                        // successfully uploaded
                                        $timeout(function () {
                                            $scope.data.popupAddTrack.close();
                                        }, 500)
                                    }, function (error) {
                                        // upload failure
                                        console.log(error);
                                    }, function (status) {
                                        // notify
                                        $scope.data.newTrack.error = status;
                                    })
                                }
                            }
                        }
                    }
                }
            ]
        });
    }

    $scope.deleteTrack = function(trackKey, track) {
        $scope.data.popupDeleteTrack = $ionicPopup.confirm({
            title: 'Confirm delete?',
            template: 'This action cannot be undone.',
            cssClass: 'centerHorizontal'
        });
        $scope.data.popupDeleteTrack.then(function(res) {
            if(res) {
                tracksFactory.deleteTrack(trackKey, track.track);
            } else {
                // nothing
            }
        });
    }

    $scope.editTrack = function(trackKey, track) {
        $scope.data.editTrack = {};
        $scope.data.editTrack.uploading = false;
        $scope.data.editTrack.name = track.name;
        $scope.data.editTrack.label = track.label;
        $scope.data.editTrack.track = track.track;
        $scope.data.popupEditTrack = $ionicPopup.show({
            templateUrl: 'templates/popupEditTrack.html',
            cssClass: 'popup50',
            title: 'Edit Track',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    onTap: function(e) {
                        if ($scope.data.editTrack.uploading) {
                            e.preventDefault();
                        }
                    }
                },
                {
                    text: 'Save',
                    type: 'button-positive',
                    onTap: function(e) {
                        e.preventDefault();
                        if (!$scope.data.editTrack.uploading) {
                            var file = document.getElementById('file').files[0];

                            if ($scope.data.editTrack == null || $scope.data.editTrack.name == null || $scope.data.editTrack.name == "" || $scope.data.editTrack.label == null || $scope.data.editTrack.label == "") {
                                $scope.data.editTrack.error = "Please fill in all required fields!";
                            } else {
                                var save = true;
                                if ($scope.data.editTrack.label != track.label) {
                                    for (var i = 0; i < $scope.data.tracks.length; i++) {
                                        if ($scope.data.tracks[i].label.toLowerCase() == $scope.data.editTrack.label.toLowerCase()) {
                                            $scope.data.editTrack.error = "A track with the same label already exists!"
                                            save = false;
                                        }
                                    }
                                }

                                if ($scope.data.editTrack.name != track.name) {
                                    for (var i = 0; i < $scope.data.tracks.length; i++) {
                                        if ($scope.data.tracks[i].name.toLowerCase() == $scope.data.editTrack.name.toLowerCase()) {
                                            $scope.data.editTrack.error = "A track with the same name already exists!";
                                            save = false;
                                        }
                                    }
                                }

                                if ($scope.data.editTrack.track != track.track) {
                                    for (var i = 0; i < $scope.data.tracks.length; i++) {
                                        if ($scope.data.tracks[i].track.toLowerCase() == $scope.data.editTrack.track.toLowerCase()) {
                                            $scope.data.editTrack.error = "A track with the same file name already exists!";
                                            save = false;
                                        }
                                    }
                                }

                                if (save) {
                                    if ($scope.data.editTrack.trackChanged) {
                                        $scope.data.editTrack.uploading = true;
                                        tracksFactory.deleteTrack(null, track.track).then(function(){
                                            tracksFactory.uploadTrack(null, null, file).then(function (status) {
                                                // successfully uploaded
                                                $scope.data.editTrack.error = status;
                                                tracksFactory.editTrack(trackKey, $scope.data.editTrack.name, $scope.data.editTrack.label, $scope.data.editTrack.track);
                                                $timeout(function () {
                                                    $scope.data.popupEditTrack.close();
                                                }, 500)
                                            }, function (error) {
                                                // upload failure
                                                console.log(error);
                                            }, function (status) {
                                                // notify status
                                                $scope.data.editTrack.error = status;
                                            })
                                        }, function(error) {
                                            console.log(error);
                                        });
                                    } else {
                                        tracksFactory.editTrack(trackKey, $scope.data.editTrack.name, $scope.data.editTrack.label, $scope.data.editTrack.track);
                                        $scope.data.popupEditTrack.close();
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        });
    }

    $scope.viewSongs = function() {
        $ionicViewSwitcher.nextDirection('back');
        $state.go("songs");
    }

    $scope.moveUp = function(trackKey) {
        if (trackKey != 0) {
            tracksFactory.swapTrack(trackKey, trackKey - 1);
        }
    }

    $scope.moveDown = function(trackKey) {
        if (trackKey != $scope.data.tracks.length - 1) {
            tracksFactory.swapTrack(trackKey, trackKey + 1);
        }
    }

    $scope.fileChanged = function() {
        var file = document.getElementById('file').files[0];
        $scope.$apply(function() {
            $scope.data.editTrack.track = file.name;
        });
        $scope.data.editTrack.trackChanged = true;
    }
});