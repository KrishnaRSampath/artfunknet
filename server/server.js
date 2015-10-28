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
    var user_objects = Meteor.users.find().fetch();
    for (var i=0; i < user_objects.length; i++) {
        if (user_objects[i].profile.gallery_details === undefined)
            Meteor.users.update(user_objects[i]._id, {$set: {'profile.gallery_details' : {} }});
    }
}

Meteor.startup(function() {
    setupMail();
    fs = Npm.require('fs');

	if (artists.find({}).count() == 0 && artworks.find({}).count() == 0)
		generateContent();

    updateContent();

    npcs.remove({});

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
        var last_drop = moment().add(-1, 'days');

        var admin_object = {
            "username": "jpollack320@gmail.com",
            "email": "jpollack320@gmail.com",
            "password": "password",
            "profile": {
                'screen_name': "EindacorDS",
                'user_type': "player",
                'bank_balance' : 100000,
                'last_drop' : last_drop._d.toISOString(),
                'level' : 0,
                'xp' : 0,
                'entry_fee' : 0,
                'gallery_tickets' : [],
                'gallery_details' : {}
            }
        };

        var admin_object_2 = {
            "username": "peter.mooney90@gmail.com",
            "email": "peter.mooney90@gmail.com",
            "password": "Password123!",
            "profile": {
                'screen_name': "PMoons",
                'user_type': "player",
                'bank_balance' : 100000,
                'last_drop' : last_drop._d.toISOString(),
                'level' : 0,
                'xp' : 0,
                'entry_fee' : 0,
                'gallery_tickets' : []
            }
        }
        
        var player_object = {
            "username": "player@email.com",
            "email": "player@email.com",
            "password": "password",
            "profile": {
                'screen_name': "Buyer",
                'user_type': "player",
                'bank_balance' : 10000000,
                'last_drop' : last_drop._d.toISOString(),
                'level' : 0,
                'xp' : 0,
                'entry_fee' : 0,
                'gallery_tickets' : [],
                'gallery_details' : {}
            }
        };

        createUser(admin_object);
        createUser(admin_object_2);
        createUser(player_object);
    }
})

function waitForUserAdded(userId, attempts){
    if (attempts === undefined) {
        attempts = 1;
    }

    if (Meteor.users.findOne(userId) && Meteor.users.findOne(userId).emails[0] && !Meteor.users.findOne(userId).emails[0].verified){
        // console.log("Sending verification for user " + userId);
        // Accounts.sendVerificationEmail(userId);
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
