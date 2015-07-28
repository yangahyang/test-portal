app.factory("usersFactory", function($firebaseAuth, $firebaseObject) {
    // initiate firebase reference + authentication object
    var ref = new Firebase("https//incandescent-heat-862.firebaseIO.com/users");
    var authObj = $firebaseAuth(ref);
    var userRef;

    // user profile data
    var data = {};

    // refresh user profile on restart
    if (authObj.$getAuth() != null) {
        try {
            // facebook account logged in
            data.email = authObj.$getAuth().facebook.email;
        } catch (error) {
            // email account logged in
            data.email = authObj.$getAuth().password.email;
        }

        userRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/users/" + data.email.replace(/\./g, ''));
        data = $firebaseObject(userRef);
    }

    // factory methods
    return {
        getRef: function() {
            return ref;
        },

        getAuthObj: function() {
            return authObj;
        },

        getUserObj: function() {
            return data;
        },

        // checks for existing email in firebase
        checkEmail: function(email, callback) {
            ref.child(email.replace(/\./g, '')).once("value", function(snapshot) {
                callback(snapshot.val() == null);
            })
        },

        update: function() {
            try {
                // facebook account logged in
                data.email = authObj.$getAuth().facebook.email;
            } catch (error) {
                // email account logged in
                data.email = authObj.$getAuth().password.email;
            }

            userRef = new Firebase("https//incandescent-heat-862.firebaseIO.com/users/" + data.email.replace(/\./g, ''));
            data = $firebaseObject(userRef);
        }
    };
});