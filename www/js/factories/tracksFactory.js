app.factory("tracksFactory", function($firebaseArray, $firebaseObject, $q) {
    // initiate firebase reference + authentication object
    var ref;
    var firebaseArr;
    var email;
    var songArtist;
    var songTitle;
    var bucket;

    // factory methods
    return {
        assignRef: function(userID, songKey, song) {
            ref = new Firebase("https//incandescent-heat-862.firebaseIO.com/tracks/" + userID + "/" + songKey);
            email = userID;
            songTitle = song.title;
            songArtist = song.artist;
        },

        getFirebaseArr: function() {
            if (ref != null) {
                firebaseArr = $firebaseArray(ref);
            }
            return firebaseArr;
        },

        getSong: function() {
            return {title: songTitle, artist: songArtist};
        },

        editTrack: function(trackKey, name, label, track) {
            firebaseArr[trackKey].name = name;
            firebaseArr[trackKey].label = label;
            firebaseArr[trackKey].track = track;
            firebaseArr[trackKey].url = encodeURI("https://s3-ap-southeast-1.amazonaws.com/waypastcurfewtracks/" + email + "/" + songArtist.toLowerCase() + " - " + songTitle.toLowerCase() + "/" + track);
            firebaseArr.$save(trackKey);
        },

        swapTrack: function(trackKey1, trackKey2) {
            nameTemp = firebaseArr[trackKey1].name;
            labelTemp = firebaseArr[trackKey1].label;
            trackTemp = firebaseArr[trackKey1].track;
            firebaseArr[trackKey1].name = firebaseArr[trackKey2].name;
            firebaseArr[trackKey1].label = firebaseArr[trackKey2].label;
            firebaseArr[trackKey1].track = firebaseArr[trackKey2].track;
            firebaseArr[trackKey2].name = nameTemp;
            firebaseArr[trackKey2].label = labelTemp;
            firebaseArr[trackKey2].track = trackTemp;
            firebaseArr.$save(trackKey1);
            firebaseArr.$save(trackKey2);
        },

        deleteTrack: function(key, fileName) {
            var deferred = $q.defer();
            if (key != null) {
                firebaseArr.$remove(key);
            }
            var params = { Key: fileName};
            bucket.deleteObject(params, function(err, data) {
                if(err) {
                    // error with S3 config
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            })
            return deferred.promise;
        },

        assignBucket: function() {
            bucket = new AWS.S3({params: {Bucket: 'waypastcurfewtracks/' + email + "/" + songArtist.toLowerCase() + " - " + songTitle.toLowerCase()}});
        },

        uploadTrack: function(name, label, file){
            var params = { Key: file.name, ContentType: file.type, Body: file, ServerSideEncryption: 'AES256', ACL: "public-read-write"};

            var deferred = $q.defer();

            bucket.putObject(params, function(err, data) {
                if(err) {
                    // error with S3 config
                    deferred.reject(err);
                }
                else {
                    // success
                    var status = "Uploading... Done!";
                    if (name != null && label != null) {
                        track = {name: name, label: label, track: file.name, url: encodeURI("https://s3-ap-southeast-1.amazonaws.com/waypastcurfewtracks/" + email + "/" + songArtist.toLowerCase() + " - " + songTitle.toLowerCase() + "/" + file.name)};
                        firebaseArr.$add(track);
                    }
                    deferred.resolve(status);
                }
            })
                .on('httpUploadProgress',function(progress) {
                    // display progress information
                    var percentage = Math.round(progress.loaded / progress.total * 100);
                    var status = "Uploading... " + percentage + "%";
                    deferred.notify(status);
                });

            return deferred.promise;
        }
    };
});