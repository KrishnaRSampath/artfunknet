var generateContent = function() {
    var fs = Npm.require('fs');

    console.log("artist count: " + artist_data.length);
    console.log("artwork count: " + painting_data.length);

	for (var i=0; i < artist_data.length; i++) {
		artists.insert(artist_data[i]);
	}

    try {

    	for (var i=0; i < painting_data.length; i++) {
    		var artist_id = artists.findOne({"artist_name": painting_data[i].artist})._id;
    		var artwork_object = painting_data[i];
    		artwork_object.genre = artwork_object.genre.toLowerCase();
    		artwork_object.artist_id = artist_id;
    		artworks.insert(artwork_object, function(artwork_insert_error, inserted_id) {
                if (artwork_insert_error)
                    console.log(artwork_insert_error.message);

                else {
                    // var added_artwork = artworks.findOne(inserted_id);
                    // var image = fs.readFileSync('./assets/app/' + added_artwork.filename);
                    // var newFile = new FS.File();
                    // newFile.attachData(image, {type: 'image/bmp'}, function(attach_error) {
                    //     if (attach_error)
                    //         console.log(attach_error.message);

                    //     else {
                    //         newFile.name(added_artwork.filename);
                    //         artworkImages.insert(newFile, function(image_insert_error, inserted_image_id) {
                    //             if(image_insert_error)
                    //                 console.log(image_insert_error.message);

                    //             else {
                    //                 console.log("image added: " + inserted_image_id);
                    //                 artworkImages.update(inserted_image_id, {$set: {'artwork_id' : added_artwork._id}});
                    //             }
                    //         });
                    //     }
                    // });
                }
            });
    	}
    }

    catch(error) {
        console.log("error adding artwork to DBs:");
        console.log(error.message);
    }
}

var updateContent = function() {
    npcs.remove({});
}

Meteor.startup(function() {
    setupMail();
    fs = Npm.require('fs');

	if (artists.find({}).count() == 0 && artworks.find({}).count() == 0)
		generateContent();

    updateContent();

    // for (var i=0; i<51; i++) {
    //     console.log("level " + i);
    //     console.log(testMap(getSmartRarityMap(i, 0)));
    //     console.log(testMap(getSmartRarityMap(i, 1)));
    // }

    //clear out expired tickets
    //conclude expired auctions
    //conclude expired displays
    //clear out expired npcs

    if (attributes.find().count() == 0) {
        for (var i=0; i < attribute_data.length; i++) {
            attributes.insert(attribute_data[i]);
        }
    }

    if (Meteor.users.find().count() == 0) {
        var player_1 = {
            "username": "jpollack320@gmail.com",
            "email": "jpollack320@gmail.com",
            "password": "password",
            "profile": {
                'screen_name': "EindacorDS",
                'user_type': "player"
            }
        };

        var player_2 = {
            "username": "peter.mooney90@gmail.com",
            "email": "peter.mooney90@gmail.com",
            "password": "Password123!",
            "profile": {
                'screen_name': "PMoons",
                'user_type': "player"
            }
        }
        
        var player_3 = {
            "username": "player@email.com",
            "email": "player@email.com",
            "password": "password",
            "profile": {
                'screen_name': "Buyer",
                'user_type': "player"
            }
        };

        var admin = {
            "username": "admin@email.com",
            "email": "admin@email.com",
            "password": "admin_password",
            "profile": {
                'screen_name': "admin",
                'user_type': "admin"
            }
        };

        createUser(player_1);
        createUser(player_2);
        createUser(player_3);
        createUser(admin);
    }
})

function waitForUserAdded(userId, attempts){
    if (attempts === undefined) {
        attempts = 1;
    }

    if (Meteor.users.findOne(userId) && Meteor.users.findOne(userId).emails[0] && !Meteor.users.findOne(userId).emails[0].verified){
        Accounts.sendVerificationEmail(userId);
    }

    else if (Meteor.users.findOne(userId) && !Meteor.users.findOne(userId).emails[0]) {
        console.log("No email for user " + userId);
    }

    else if (!Meteor.users.findOne(userId) && (attempts > 0)){
        Meteor.setTimeout(function() {
            console.log(attempts + " more attempts to find user " + userId + " after insert...");
            waitForUserAdded(userId, attempts - 1);
        }, 2000);
    }

    else if (!Meteor.users.findOne(userId)){
        console.log("Could not find user " + userId);
    }
}

Accounts.onCreateUser(function(options, user) {
    if (options.profile){
        user.profile = options.profile;
    }

    // Allow time for Meteor to create user before sending verification email.
    // Try this 5 times before failing.
    Meteor.setTimeout(function(){
        waitForUserAdded(user._id, 5);
    }, 2000);

    return user;
});
