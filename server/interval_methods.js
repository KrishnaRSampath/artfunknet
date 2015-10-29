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

    var new_condition = item_object.condition < .1 ? item_object.condition : item_object.condition - .01;
    items.update(item_id, {$set: {'status' : 'claimed', 'display_details' : null_display_details, 'condition' : new_condition}}, function(error) {
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
    items.remove({'status' : {$in: ['unclaimed', 'for_sale']}, 'date_created' : {$lt : creation_cutoff}});

}), check_frequency);

var auction_bot_frequency = 3600000; //once per hour
// auction_bot_frequency = 10000;
var max_bot_auctions = 2;
Meteor.setInterval((function() {
    if (auctions.find({'bid_history.user_id' : "auction_bot"}).count() < max_bot_auctions) {
        var potential_auctions = auctions.find({'bid_history' : [], 'rarity' : {$nin : ['legendary', 'masterpiece']}}).fetch();
        var qualifying_auctions = [];

        for (var i=0; i < potential_auctions.length; i++) {
            var item_object = items.findOne(potential_auctions[i].item_id);
            var actual_value = getItemValue(item_object._id, 'actual');
            var asking_value = potential_auctions[i].current_price;
            var difference = asking_value - actual_value;
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
//permanent_collection_xp_frequency = 10000; //uncomment when debugging permanent collection xp
Meteor.setInterval((function() {
    var permanent_items = items.find({'status' : 'permanent'}).fetch();
    for (var i=0; i < permanent_items.length; i++) {
        var time_displayed = moment() - moment(permanent_items[i].permanent_post);

        var periods_displayed = Math.floor(time_displayed / permanent_collection_xp_frequency);

        var xp_max_percentage = .1;
        var xp_increment = .01;
        var percentage = periods_displayed * xp_increment <= xp_max_percentage ? periods_displayed * xp_increment : xp_max_percentage;

        var time_til_next_xp = (permanent_collection_xp_frequency * (periods_displayed + 1)) - time_displayed;

        //TODO see if this gives xp after paintings have been removed from permanent collection
        giveXPOnTimeout(permanent_items[i].owner, percentage * permanent_items[i].xp_rating, time_til_next_xp);
    }
}), permanent_collection_xp_frequency);

function giveXPOnTimeout(user_id, percentage, time_offset) {
    Meteor.setTimeout(function() {
        addXPChunkPercentage(user_id, percentage);
    }, time_offset);
}

var check_ticket_frequency = 600000; //once every 10 minutes
// check_ticket_frequency = 30000; //once every 30 seconds
Meteor.setInterval((function() {
    var next_check = moment().add(check_ticket_frequency, 'milliseconds');
    var next_string = next_check._d.toISOString();
    var now = moment();

    var expiring_ticket_holders = Meteor.users.find({'profile.gallery_tickets.expiration' : {$lt : next_string}});
    expiring_ticket_holders.forEach(function(db_object) {
        for (var i=0; i < db_object.profile.gallery_tickets.length; i++) {
            if (db_object.profile.gallery_tickets[i].expiration < next_string) {
                var time_from_now = check_ticket_frequency - (next_check - moment(db_object.profile.gallery_tickets[i].expiration));
                removeTicketOnTimeout(db_object._id, db_object.profile.gallery_tickets[i].owner_id, time_from_now);
            }
        }
    });

}), check_ticket_frequency);

function removeTicketOnTimeout(buyer_id, owner_id, time_offset) {
    Meteor.setTimeout(function() {
        Meteor.users.update(buyer_id, {$pull : {'profile.gallery_tickets' : {'owner_id': owner_id}}});
    }, time_offset);
}

var npc_spawn_frequency = 600000; // 10 minutes
// npc_spawn_frequency = 30000;
Meteor.setInterval((function() {
    var default_spawn_chance = .5;

    var gallery_objects = galleries.find();
    gallery_objects.forEach(function(db_object) {
        npcs.remove({'owner_id': db_object.owner_id});
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

        //code below automatically spawns npc's of a specific type, used for debugging/testing
        //createNPC(db_object, attributes.findOne({'title': "collector_bonus"})._id, npc_spawn_frequency);
    });

}), npc_spawn_frequency);