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
    var artwork_objects = artworks.find();
    artwork_objects.forEach(function(db_object) {
        if (typeof(db_object.date) == "string") {
            var new_date = db_object.date.replace("????", "");
            artworks.update(db_object._id, {$set: {'date' : Number(new_date)}});
        }
    });
}

Meteor.startup(function() {
    //setupMail();
    fs = Npm.require('fs');
    
	if (artists.find({}).count() == 0 && artworks.find({}).count() == 0)
		generateContent();

    updateContent();

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
                "last_drop" : last_drop._d.toISOString(),
                'inventory_cap' : 40,
                'display_cap' : 8,
                'auction_cap' : 8,
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
                "last_drop" : last_drop._d.toISOString(),
                'inventory_cap' : 40,
                'display_cap' : 8,
                'auction_cap' : 8,
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


function concludeAuction(auction_id) {
    var auction_object = auctions.findOne(auction_id);
    var item_object = items.findOne({'_id': auction_object.item_id});

    if (auction_object.bid_history.length == 0) {
        items.update(item_object._id, {$set: {'status' : 'claimed'}});

        auctions.remove({'_id': auction_object._id});

        var message = "Your auction has ended for " + auction_object.title + " by " + auction_object.artist + " without a sale";
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
        var bid_history = auction_object.bid_history;
        var highest_bid = { 'amount' : 0 }

        for (var i=0; i < bid_history.length; i++) {
            if (bid_history[i].amount > highest_bid.amount)
                highest_bid = bid_history[i];
        }

        var sale_message = "You have successfully auctioned " + auction_object.title + " by " + auction_object.artist + " for $" + getCommaSeparatedValue(auction_object.current_price)
        var alert_sale_object = {
            'user_id' : item_object.owner,
            'message' : sale_message,
            'link' : '/',
            'icon' : 'fa-gavel',
            'sentiment' : "good",
            'time' : moment()
        };
        alerts.insert(alert_sale_object);

        var win_message = "You have won " + auction_object.title + " by " + auction_object.artist + " in the auction house for $" + getCommaSeparatedValue(auction_object.current_price);
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
        
        items.update(item_object._id, {$set: {'status' : 'claimed', 'owner': highest_bid.user_id}});
        auctions.remove({'_id': auction_id}, function(error) {
            if (error)
                console.log(error.message);
        });

        Meteor.call('alertUserOfWin', highest_bid.user_id, item_object._id);
    }
}

function concludeDisplay(item_id) {
    var item_object = items.findOne(item_id);
    var artwork_object = artworks.findOne(item_object.artwork_id);
    var money_earned = item_object.display_details.money;
    var user_id = item_object.owner;
    var xp_earned = item_object.display_details.xp;

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

    addFunds(user_id, money_earned);
    
    var null_display_details = {
        'money' : 0,
        'xp' : 0,
        'end' : ""
    };

    items.update(item_id, {$set: {'status' : 'claimed', 'display_details' : null_display_details}}, function(error) {
        if (error)
            console.log(error.message);
    });
}

var check_frequency = 30000
Meteor.setInterval((function() {
    var next_check = moment().add(check_frequency, 'milliseconds');
    var next_string = next_check._d.toISOString();
    var now = moment();
    var finishing_displays = items.find({'status' : 'displayed', 'display_details.end': {$lt : next_string}}).fetch();
    for (var i=0; i < finishing_displays.length; i++) {
        var time_from_now = moment(finishing_displays[i].display_details.end) - moment();
        concludeDisplayOnTimeout(finishing_displays[i]._id, time_from_now);
    }

    var expired_auctions = auctions.find({'expiration_date': {$lt : next_check}}).fetch();
    for (var i=0; i < expired_auctions.length; i++) {
        var time_from_now = moment(expired_auctions[i].expiration_date) - moment();
        concludeAuctionOnTimeout(expired_auctions[i]._id, time_from_now);
    }

    var creation_cutoff = moment().add(-5, 'minutes')._d;
    items.remove({'status' : 'unclaimed', 'date_created' : {$lt : creation_cutoff}});

}), check_frequency);

function concludeDisplayOnTimeout(item_id, time_offset) {
    Meteor.setTimeout(function() {
        concludeDisplay(item_id);
    }, time_offset);
}

function concludeAuctionOnTimeout(auction_id, time_offset) {
    Meteor.setTimeout(function() {
        concludeAuction(auction_id);
    }, time_offset);
}