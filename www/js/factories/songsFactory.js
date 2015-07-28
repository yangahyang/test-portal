app.factory("songsFactory", function($firebaseObject) {
    // initiate firebase reference + authentication object
    var ref;
    var firebaseObj;

    // factory methods
    return {
        getRef: function(userID) {
            ref = new Firebase("https//incandescent-heat-862.firebaseIO.com/songs/" + userID);
            return ref;
        },

        getFirebaseObj: function() {
            firebaseObj = $firebaseObject(ref);
            return firebaseObj;
        },

        pushSong: function(title, artist, genre, lyrics) {
            song = {title: title, artist: artist, genre: genre, lyrics: lyrics}
            ref.child(artist.toLowerCase() + " - " + title.toLowerCase()).set(song);
        },

        deleteSong: function(userID, songKey, fireBaseOnly) {
            ref.child(songKey).remove();
            var tracksRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/tracks/" + userID + "/" + songKey);
            var tracksFirebaseObj = $firebaseObject(tracksRef);
            tracksFirebaseObj.$remove();
            var rootBucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks'}});
            var tracksBucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks/' + userID + "/" + songKey}});
            var cutOff = (userID + "/" + songKey).length + 1;
            rootBucket.listObjects({Prefix: userID + '/' + songKey + '/'}, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 1; i < data.Contents.length; i++) {
                        tracksBucket.deleteObject({Key: data.Contents[i].Key.substring(cutOff)}, function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                    if (data.Contents.length != 0) {
                        tracksBucket.deleteObject({Key: data.Contents[0].Key.substring(cutOff)}, function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                }
            })
        },

        editSong: function(userID, oldKey, newKey) {
            var oldSongRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/songs/" + userID + "/" + oldKey);
            oldSongRef.once("value", function(snapshot) {
                var data = snapshot.exportVal();
                ref.child(newKey).set(data);
                ref.child(oldKey).remove();
            });
            var oldTracksRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/tracks/" + userID + "/" + oldKey);
            oldTracksRef.once("value", function(snapshot) {
                var data = snapshot.exportVal();
                var tracksRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/tracks/" + userID);
                tracksRef.child(newKey).set(data);
                tracksRef.child(oldKey).remove();
            });



            var rootBucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks'}});
            var oldBucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks/' + userID + "/" + oldKey}});
            var newBucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks/' + userID + "/" + newKey}});
            var cutOff = (userID + "/" + oldKey).length + 1;
            rootBucket.listObjects({Prefix: userID + '/' + oldKey + '/'}, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    var counter = 0;
                    var noOfItems = data.Contents.length;
                    for (var i = 0; i < data.Contents.length; i++) {
                        var params = {
                            CopySource: 'waypastcurfewtracks/' + data.Contents[i].Key,
                            Key: data.Contents[i].Key.substring(cutOff)
                        }
                        newBucket.copyObject(params, function(err, data2) {
                            if (err) {
                                console.log(err);
                            } else {
                                counter++;
                                if (counter == noOfItems) {
                                    for (var i = 0; i < data.Contents.length; i++) {
                                        oldBucket.deleteObject({Key: data.Contents[i].Key.substring(cutOff)}, function (err, data) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        })
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    };
});