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
    for (var i=0; i < painting_data.length; i++) {
        var file_data = painting_data[i];
        var img_link = file_data.img_link;

        artworks.update({'filename': file_data.filename}, {$set: {'img_link' : img_link}});
    }
}

Meteor.startup(function() {
    //setupMail();
    fs = Npm.require('fs');
    
	if (artists.find({}).count() == 0 && artworks.find({}).count() == 0)
		generateContent();

    else updateContent();

    if (Meteor.users.find().count() == 0) {
        var last_drop = moment().add(-1, 'days');

        var admin_object = {
            "username": "jpollack320@gmail.com",
            "email": "jpollack320@gmail.com",
            "password": "password",
            "profile": {
                "screen_name": "EindacorDS",
                "user_type": "player",
                "bank_balance" : 1000000,
                "last_drop" : last_drop._d.toISOString()
            }
        };

        createUser(admin_object);

        var player_object = {
            "username": "player@email.com",
            "email": "player@email.com",
            "password": "password",
            "profile": {
                "screen_name": "Buyer",
                "user_type": "player",
                "bank_balance" : 10000000,
                "last_drop" : last_drop._d.toISOString()
            }
        };

        createUser(player_object);
    }
})


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

function clearExpiredAuctions() {
    var now = moment();
    var expired = auctions.find({'expiration_date': {$lt : now}}).fetch();

    for (var i=0; i < expired.length; i++) {
        var item_object = items.findOne({'_id': expired[i].item_id});

        if (expired[i].bid_history.length == 0) {
            items.update(expired[i].item_id, {$set: {'status' : 'claimed'}});
            auctions.remove({'_id': expired[i]._id});

            var message = "Your auction has ended for " + expired[i].title + " by " + expired[i].artist + " without a sale";
            var alert_object = {
                'user_id' : item_object.owner,
                'message' : message,
                'link' : '/',
                'icon' : 'fa-gavel',
                'sentiment' : "neutral",
                'time' : moment()
            };
            alerts.insert(alert_object);
        }

        else {
            var bid_history = expired[i].bid_history;
            var highest_bid = { 'amount' : 0 }

            for (var n=0; n < bid_history.length; n++) {
                if (bid_history[n].amount > highest_bid.amount)
                    highest_bid = bid_history[n];
            }

            var sale_message = "You have successfully auctioned " + expired[i].title + " by " + expired[i].artist + " for $" + getCommaSeparatedValue(expired[i].current_price)
            var alert_sale_object = {
                'user_id' : item_object.owner,
                'message' : sale_message,
                'link' : '/',
                'icon' : 'fa-gavel',
                'sentiment' : "good",
                'time' : moment()
            };
            alerts.insert(alert_sale_object);


            var win_message = "You have won " + expired[i].title + " by " + expired[i].artist + " in the auction house for $" + getCommaSeparatedValue(expired[i].current_price);
            var alert_win_object = {
                'user_id' : highest_bid.user_id,
                'message' : win_message,
                'link' : '/',
                'icon' : 'fa-gavel',
                'sentiment' : "good",
                'time' : moment()
            };
            alerts.insert(alert_win_object);

            addFunds(item_object.owner, highest_bid.amount);
            items.update(expired[i].item_id, {$set: {'status' : 'claimed', 'owner': highest_bid.user_id}});
            auctions.remove({'_id': expired[i]._id});
            Meteor.call('alertUserOfWin', highest_bid.user_id, item_object._id);
        }
    }
}

function clearDisplayedItems() {
    var finished_displays = items.find({'status' : 'displayed', 'display_details.end': {$lte : moment()._d.toISOString()}}).fetch();

    for (var i=0; i < finished_displays.length; i++) {
        var artwork_object = artworks.findOne(finished_displays[i].artwork_id);
        var money_earned = finished_displays[i].display_details.money;
        var user_id = finished_displays[i].owner;
        var xp_earned = finished_displays[i].display_details.xp;

        var display_message = "Your exhibition of " + artwork_object.title + " by " + artwork_object.artist + " has concluded. You have earned $" + getCommaSeparatedValue(money_earned);
        var alert_win_object = {
            'user_id' : user_id,
            'message' : display_message,
            'link' : '/',
            'icon' : 'fa-usd',
            'sentiment' : "good",
            'time' : moment()
        };
        alerts.insert(alert_win_object);

        var null_display_details = {
            'money' : 0,
            'xp' : 0,
            'end' : ""
        };

        addFunds(user_id, money_earned);
        items.update(finished_displays[i]._id, {$set: {'status' : 'claimed', 'display_details' : null_display_details}});
    }
}

Meteor.setInterval((function() {
    clearExpiredAuctions();
    clearDisplayedItems();
}), 1000);