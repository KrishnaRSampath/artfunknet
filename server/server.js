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

var exeption_list = [];

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
                'inventory_cap' : 9,
                'display_cap' : 5,
                'auction_cap' :5,
                'ticket_cap' : 8,
                'pc_cap' : 5,
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
                'inventory_cap' : 9,
                'display_cap' : 5,
                'auction_cap' :5,
                'ticket_cap' : 8,
                'pc_cap' : 5,
                'level' : 0,
                'xp' : 0,
                'entry_fee' : 0,
                'gallery_tickets' : []
            }
        }

        createUser(admin_object);
        createUser(admin_object_2);
        
        var player_object = {
            "username": "player@email.com",
            "email": "player@email.com",
            "password": "password",
            "profile": {
                'screen_name': "Buyer",
                'user_type': "player",
                'bank_balance' : 10000000,
                'last_drop' : last_drop._d.toISOString(),
                'inventory_cap' : 9,
                'display_cap' : 5,
                'auction_cap' : 5,
                'ticket_cap' : 8,
                'pc_cap' : 5,
                'level' : 0,
                'xp' : 0,
                'entry_fee' : 0,
                'gallery_tickets' : [],
                'gallery_details' : {}
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

        if (highest_bid.user_id != "auction_bot") {
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
        }

        var XPChunkValue;

        switch(auction_object.rarity) {
            case 'common' : XPChunkValue = .5; break;
            case 'uncommon' : XPChunkValue = .6; break;
            case 'rare' : XPChunkValue = .7; break;
            case 'legendary' : XPChunkValue = .8; break;
            case 'masterpiece' : XPChunkValue = 1; break;
            default: break;
        }

        addXPChunkPercentage(item_object.owner, XPChunkValue);

        if (highest_bid.user_id != "auction_bot")
            addXPChunkPercentage(highest_bid.user_id, XPChunkValue);

        addFunds(item_object.owner, highest_bid.amount);

        if (highest_bid.user_id != "auction_bot")
            items.update(item_object._id, {$set: {'status' : 'claimed', 'owner': highest_bid.user_id}});

        else items.remove(item_object._id);

        auctions.remove({'_id': auction_id}, function(error) {
            if (error)
                console.log(error.message);
        });
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
    addXP(user_id, xp_earned);

    var null_display_details = {
        'money' : 0,
        'xp' : 0,
        'end' : ""
    };

    items.update(item_id, {$set: {'status' : 'claimed', 'display_details' : null_display_details}}, function(error) {
        if (error)
            console.log(error.message);

        else updateGalleryDetails(items.findOne(item_id).owner);
    });
}

var check_frequency = 30000;
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

var auction_bot_frequency = 3600000; //once per hour
// var auction_bot_frequency = 10000;
var max_bot_auctions = 2;
Meteor.setInterval((function() {
    if (auctions.find({'bid_history.user_id' : "auction_bot"}).count() < max_bot_auctions) {
        var potential_auctions = auctions.find({'bid_history' : [], 'rarity' : {$nin : ['legendary', 'masterpiece']}}).fetch();
        var qualifying_auctions = [];

        for (var i=0; i < potential_auctions.length; i++) {
            var item_object = items.findOne(potential_auctions[i].item_id);
            var actual_value = getItemValue(item_object._id, 'actual');
            var asking_value = potential_auctions[i].current_price;
            var difference = Math.abs(actual_value - asking_value);
            if (difference / actual_value < .5)
                qualifying_auctions.push(potential_auctions[i]);
        }

        if (qualifying_auctions.length > 0) {
            var random_auction = qualifying_auctions[Math.floor(Math.random() * (qualifying_auctions.length))];

            var bid_object = {
                'user_id': "auction_bot",
                'amount' : random_auction.bid_minimum,
                'date' : moment(),
            }

            auctions.update(
                random_auction._id, {
                    $push: {'bid_history' : bid_object},
                    $set: {'current_price' : random_auction.bid_minimum, 'bid_minimum' : Math.floor(random_auction.bid_minimum * 1.05)}
                }
            );
        }
    }
}), auction_bot_frequency)

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

var permanent_collection_xp_frequency = 3600000; //once per hour
Meteor.setInterval((function() {
    var permanent_items = items.find({'status' : 'permanent'}).fetch();
    for (var i=0; i < permanent_items.length; i++) {
        var time_displayed = moment() - moment(permanent_items[i].permanent_post);

        var periods_displayed = Math.floor(time_displayed / permanent_collection_xp_frequency);

        var xp_max_percentage = .01;
        var xp_increment = .002;
        var percentage = periods_displayed * xp_increment <= xp_max_percentage ? periods_displayed * xp_increment : xp_max_percentage;

        var time_til_next_xp = (permanent_collection_xp_frequency * (periods_displayed + 1)) - time_displayed;

        giveXPOnTimeout(permanent_items[i].owner, percentage * permanent_items[i].xp_rating, time_til_next_xp);
    }
}), permanent_collection_xp_frequency);

function giveXPOnTimeout(user_id, percentage, time_offset) {
    Meteor.setTimeout(function() {
        addXPChunkPercentage(user_id, percentage);
    }, time_offset);
}

var expire_ticket_frequency = 3600000; //once per hour
expire_ticket_frequency = 600000;
Meteor.setInterval((function() {
    var next_check = moment().add(expire_ticket_frequency, 'milliseconds');
    var next_string = next_check._d.toISOString();
    var now = moment();
    var ticket_holders = Meteor.users.find({'profile.tickets' : {$ne : undefined}}).fetch();
    for (var i=0; i < ticket_holders.length; i++) {
        var ticket_ids = Object.keys(ticket_holders[i].profile.tickets);
        for (var n=0; n < ticket_ids.length; n++) {
            var owner_id = ticket_ids[n];
            if (moment(ticket_holders[i].profile.tickets[owner_id]) < now) {
                var ticket_unsetter = {};
                ticket_unsetter[owner_id] = "";
                Meteor.users.update(ticket_holders[i]._id, {$unset : {'profile.tickets' : ticket_unsetter}});
            }
        }
    }
}), expire_ticket_frequency);

var npc_spawn_frequency = 600000;
// npc_spawn_frequency = 30000;
Meteor.setInterval((function() {
    var default_spawn_chance = .5;

    var gallery_objects = galleries.find();
    gallery_objects.forEach(function(db_object) {
        var attribute_values = db_object.attribute_values;
        var attribute_ids = Object.keys(attribute_values);
        for (var i=0; i < attribute_ids.length; i++) {
            if (attributes.findOne(attribute_ids[i]).type == "secondary")
                continue;
            
            var proc_chance = default_spawn_chance * attribute_values[attribute_ids[i]];
            var description = attributes.findOne(attribute_ids[i]).description;           
            var proc = JepLoot.booRoll(proc_chance);
            if (proc)
                createNPC(db_object, attribute_ids[i], npc_spawn_frequency);
        }
    });

}), npc_spawn_frequency);
