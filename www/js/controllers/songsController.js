app.controller("songsController", function($scope, usersFactory, songsFactory, tracksFactory, $state, $ionicLoading, $ionicPopup, $ionicViewSwitcher) {
    var authObj;
    $scope.data = {};
    var songsRef;

    // on page enter,
    $scope.$on('$ionicView.beforeEnter', function() {
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner><br>Loading...'
        });

        // retrieve firebase reference + authentication object
        var usersRref = usersFactory.getRef();
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
                usersRef.once("value", function(snapshot) {
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
                songsRef = songsFactory.getRef($scope.data.user.email.replace(/\./g, ''));
                $scope.data.songs = songsFactory.getFirebaseObj();
                $scope.data.songs.$loaded()
                    .then(function() {
                        $ionicLoading.hide();
                    })
            })
    })

    // on page leave, unsubscribe listener + clear variables
    $scope.$on('$ionicView.leave', function() {
        if ($scope.data.popupAddSong != null) {
            $scope.data.popupAddSong.close();
        }
        if ($scope.data.popupDeleteSong != null) {
            $scope.data.popupDeleteSong.close();
        }
        if ($scope.data.popupEditSong != null) {
            $scope.data.popupEditSong.close();
        }
    })

    // logout method
    $scope.logout = function() {
        $ionicViewSwitcher.nextDirection('forward');
        authObj.$unauth();
        $state.go("login");
    };

    $scope.addSong = function() {
        $scope.data.newSong = {};
        $scope.data.popupAddSong = $ionicPopup.show({
            templateUrl: 'templates/popupAddSong.html',
            cssClass: 'popup50',
            title: 'Add New Song',
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: 'Add',
                    type: 'button-positive',
                    onTap: function(e) {
                        if ($scope.data.newSong == null || $scope.data.newSong.title == null || $scope.data.newSong.title == "" || $scope.data.newSong.artist == null || $scope.data.newSong.artist == "") {
                            $scope.data.newSong.error = "Please fill in all required fields!";
                            e.preventDefault();
                        } else {
                            if ($scope.data.newSong.genre == null) {
                                $scope.data.newSong.genre = "";
                            }
                            if ($scope.data.newSong.lyrics == null) {
                                $scope.data.newSong.lyrics = "";
                            }
                            if ($scope.data.songs[$scope.data.newSong.artist.toLowerCase() + " - " + $scope.data.newSong.title.toLowerCase()] != null) {
                                $scope.data.newSong.error = "A song with the same title & artist already exists!";
                                e.preventDefault();
                            } else {
                                songsFactory.pushSong($scope.data.newSong.title, $scope.data.newSong.artist, $scope.data.newSong.genre, $scope.data.newSong.lyrics);
                                $scope.viewTracks($scope.data.newSong.artist.toLowerCase() + " - " + $scope.data.newSong.title.toLowerCase(), {title: $scope.data.newSong.title, artist: $scope.data.newSong.artist});
                            }
                        }
                    }
                }
            ]
        });
    }

    $scope.deleteSong = function(songKey) {
        $scope.data.popupDeleteSong = $ionicPopup.confirm({
            title: 'Confirm delete?',
            template: 'Deleting this song will also delete all of its tracks.',
            cssClass: 'centerHorizontal'
        });
        $scope.data.popupDeleteSong.then(function(res) {
            if(res) {
                songsFactory.deleteSong($scope.data.user.email.replace(/\./g, ''), songKey);
            } else {
                // nothing
            }
        });
    }

    $scope.editSong = function(songKey, song) {
        $scope.data.editSong = {};
        $scope.data.editSong.artist = song.artist;
        $scope.data.editSong.title = song.title;
        $scope.data.editSong.genre = song.genre;
        $scope.data.editSong.lyrics = song.lyrics;
        $scope.data.popupEditSong = $ionicPopup.show({
            templateUrl: 'templates/popupEditSong.html',
            cssClass: 'popup50',
            title: 'Edit Song',
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: 'Save',
                    type: 'button-positive',
                    onTap: function(e) {
                        if ($scope.data.editSong == null || $scope.data.editSong.title == null || $scope.data.editSong.title == "" || $scope.data.editSong.artist == null || $scope.data.editSong.artist == "") {
                            $scope.data.editSong.error = "Please fill in all required fields!";
                            e.preventDefault();
                        } else {
                            if ($scope.data.editSong.genre == null) {
                                $scope.data.editSong.genre = "";
                            }
                            if ($scope.data.editSong.lyrics == null) {
                                $scope.data.editSong.lyrics = "";
                            }
                            if (($scope.data.editSong.title != song.title || $scope.data.editSong.artist != song.artist) && $scope.data.songs[$scope.data.editSong.artist.toLowerCase() + " - " + $scope.data.editSong.title.toLowerCase()] != null) {
                                $scope.data.editSong.error = "A song with the same title & artist already exists!";
                                e.preventDefault();
                            } else if ($scope.data.editSong.title == song.title && $scope.data.editSong.artist == song.artist) {
                                songsFactory.pushSong($scope.data.editSong.title, $scope.data.editSong.artist, $scope.data.editSong.genre, $scope.data.editSong.lyrics);
                            } else {
                                songsFactory.editSong($scope.data.user.email.replace(/\./g, ''), songKey, $scope.data.editSong.artist.toLowerCase() + " - " + $scope.data.editSong.title.toLowerCase());
                                songsFactory.pushSong($scope.data.editSong.title, $scope.data.editSong.artist, $scope.data.editSong.genre, $scope.data.editSong.lyrics);
                            }
                        }
                    }
                }
            ]
        });
    }

    $scope.viewTracks = function(songKey, song) {
        tracksFactory.assignRef($scope.data.user.email.replace(/\./g, ''), songKey, song);
        tracksFactory.assignBucket();
        $ionicViewSwitcher.nextDirection('forward');
        $state.go("tracks");
    }
});