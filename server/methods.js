createAuction = function(item_id, starting, buy_now, duration) {
    try {
        if (auctions.find({'item_id': item_id}).count() == 0) {
            var post_date = moment();
            var expiration_date = moment(post_date).add(duration, 'minutes');
            var item_object = items.findOne(item_id);
            var artwork_object = artworks.findOne(item_object.artwork_id);
            var user_object = Meteor.users.findOne(item_object.owner);

            var rarity_rank;

            switch(artwork_object.rarity) {
                case 'common' : rarity_rank = 0; break;
                case 'uncommon' : rarity_rank = 1; break;
                case 'rare' : rarity_rank = 2; break;
                case 'legendary' : rarity_rank = 3; break;
                case 'masterpiece' : rarity_rank = 4; break;
                default: rarity_rank = 0; break;
            }

            var auction_object = {
                'item_id': item_id,
                'bid_history': [],
                'current_price': starting,
                'buy_now': buy_now,
                'bid_minimum' : Math.floor(starting * 1.05),
                'date_posted': post_date,
                'expiration_date': expiration_date,
                'title': artwork_object.title,
                'artist': artwork_object.artist,
                'rarity': artwork_object.rarity,
                'medium': artwork_object.medium,
                'condition': item_object.condition,
                'seller': user_object.profile.screen_name,
                'date': artwork_object.date,
                'xp_rating': item_object.xp_rating,
                'feature_count': item_object.attributes.length,
                'rarity_rank' : rarity_rank,
                'roll_count' : item_object.roll_count
            };

            auctions.insert(auction_object);
        }
    }

    catch(error) {
        console.log(error.message);
    }
}

Meteor.methods({
    'generateItemsFromRarity' : function(user_id, rarity, count) {
        generateItemsFromRarity(user_id, rarity, count);
    },

    'getInventory' : function() {
        var owned = items.find({'owner': Meteor.userId(), 'status': 'claimed'});
        var owned_array = [];

        owned.forEach(function(item_object) {
            owned_array.push(item_object._id);
        });

        return owned_array;
    },

    'getAuctions' : function(sorter, ascending) {
        var asc = (ascending ? 1 : -1);

        var sort_query = {};
        sort_query[sorter] = asc;

        var auction_objects = auctions.find({}, {fields : {'_id': 1}}, {sort: sort_query}).fetch();
        var auction_array = [];

        for (var i=0; i < auction_objects.length; i++) {
            auction_array.push(auction_objects[i]._id);
        };

        return auction_array;
    },

    'getUserGallery' : function(screen_name) {
        var user_object = Meteor.users.findOne({'profile.screen_name' : screen_name});

        if (user_object) {
            return {
                'displayed': items.find({'owner': user_object._id, 'status': 'displayed'}).fetch(),
                'permanent': items.find({'owner': user_object._id, 'status': 'permanent'}).fetch(),
            }
        }

        else return {
            'displayed' : [],
            'permanent' : []
        }
    },

    'placeBid' : function(user_id, auction_id, amount) {
        try {
            var auction_object = auctions.findOne({'_id': auction_id});
            var item_object = items.findOne({'_id': auction_object.item_id});

            if (item_object == undefined)
                throw "cannot find item";

            if (inventoryIsFull())
                throw "inventory is full";

            if (amount < auction_object.bid_minimum && (amount < auction_object.buy_now && auction_object.buy_now != -1))
                throw "invalid amount";

            if (! !!Meteor.userId() || Meteor.userId() != user_id)
                throw "invalid user";

            if (amount > Meteor.user().profile.bank_balance)
                throw "invalid amount";

            if (amount >= auction_object.buy_now && auction_object.buy_now != -1) {
                refundHighestBid(auction_id);

                var highest_bidder = getHighestBidder(auction_id);
                if (highest_bidder && highest_bidder != Meteor.userId()) {
                    var message = "Someone has purchased one of your watched items: " + auction_object.title + " by " + auction_object.artist;
                    var alert_object = {
                        'user_id' : highest_bidder,
                        'message' : message,
                        'link' : '/',
                        'icon' : 'fa-gavel',
                        'sentiment' : "bad",
                        'time' : moment()
                    };

                    alerts.insert(alert_object);
                }

                var message = "Someone has purchased your artwork: " + auction_object.title + " by " + auction_object.artist + " for $" + getCommaSeparatedValue(auction_object.buy_now);
                var alert_object = {
                    'user_id' : item_object.owner,
                    'message' : message,
                    'link' : '/',
                    'icon' : 'fa-gavel',
                    'sentiment' : "good",
                    'time' : moment()
                };

                alerts.insert(alert_object);

                chargeAccount(user_id, auction_object.buy_now);
                var owner_id = item_object.owner;
                addFunds(owner_id, auction_object.buy_now);
                items.update({'_id': item_object._id}, {$set: {'status' : 'claimed', 'owner': user_id}});
                auctions.remove({'_id': auction_id});

                return;
            }

            if (auction_object.bid_history.length != 0) {
                refundHighestBid(auction_id);

                var highest_bidder = getHighestBidder(auction_id);
                if (highest_bidder && highest_bidder != "auction_bot") {
                    var message = "Someone has outbid you on one of your watched items: " + auction_object.title + " by " + auction_object.artist;
                    var alert_object = {
                        'user_id' : highest_bidder,
                        'message' : message,
                        'link' : '/',
                        'icon' : 'fa-gavel',
                        'sentiment' : "bad",
                        'time' : moment()
                    };

                    alerts.insert(alert_object);
                }
            }

            var bid_object = {
                'user_id': user_id,
                'amount' : amount,
                'date' : moment(),
            }

            auctions.update(
                auction_id, {
                    $push: {'bid_history' : bid_object},
                    $set: {'current_price' : amount, 'bid_minimum' : Math.floor(amount * 1.05)}
                }
            );

            chargeAccount(user_id, amount);
        }

        catch(error) {
            console.log(error);
            console.log("auction id: " + auction_id);
            throw "an error has occurred, see server console"
        }
    },

    'testCrateRolls' : function() {
        var roll_map = {
            'bronze' : 0,
            'silver' : 0,
            'gold' : 0,
            'platinum' : 0,
            'diamond' : 0
        }

        for (var i=0; i < 1000; i++) {
            var rolled = getRolledCrateQuality();
            roll_map[rolled] += 1;
        }

        console.log("bronze: " + roll_map.bronze);
        console.log("silver: " + roll_map.silver);
        console.log("gold: " + roll_map.gold);
        console.log("platinum: " + roll_map.platinum);
        console.log("diamond: " + roll_map.diamond);
    },

    'getCollectionValue' : function(user_id) {
        var collection_total = 0;
        var item_objects = items.find({'owner' : user_id, 'status' : {$ne: 'unclaimed'}});
        item_objects.forEach(function(db_object) {
            collection_total += getItemValue(db_object._id, 'actual');
        });

        return collection_total;
    },

    'getExhibitionValue' : function(user_id) {
        var display_total = 0;
        var item_objects = items.find({'owner' : user_id, 'status' : 'displayed'});
        item_objects.forEach(function(db_object) {
            display_total += getItemValue(db_object._id, 'actual');
        });

        return display_total;
    },


    'getDisplayDetails' : function(item_id, duration) {
        return getDisplayDetails(item_id, duration);
    },

    'lookupCrateCost' : function(quality, count) {
        return lookupCrateCost(quality, count);
    },

    'rerollXPRating' : function(item_id) {
        if (canRerollItem(item_id)) {
            var item_object = items.findOne(item_id);
            if (item_object != undefined) {
                var roll_count = item_object.roll_count;
                items.update(item_id, {$set : {'xp_rating' : getXPRating()}});
                items.update(item_id, {$set : {'roll_count' : roll_count + 1}});
                chargeAccount(Meteor.userId(), getRerollCost(item_id));
            }
        }
    },

    'resetXPRatings' : function() {
        var item_objects = items.find();
        item_objects.forEach(function(db_object) {
            var xp_rating = getXPRating();
            items.update(db_object._id, {$set: {'xp_rating' : xp_rating}});
            auctions.update({'item_id' : db_object._id}, {$set: {'xp_rating' : xp_rating}}, {multi : true});
        })
    },

    'resetRollCounts' : function() {
        items.update({}, {$set : {'roll_count' : 0}}, {multi : true});
        auctions.update({}, {$set : {'roll_count' : 0}}, {multi : true});
    },

    'getXPData' : function(current_level) {
        return {
            'chunk' : getXPChunk(current_level),
            'goal' : getXPGoal(current_level)
        }
    }
})

var refundHighestBid = function(auction_id) {
    var auction_object = auctions.findOne({'_id': auction_id});
    var bid_history = auction_object.bid_history;

    if (bid_history.length > 0) {
        var highest_bid = {'amount' : 0}

        for (var n=0; n < bid_history.length; n++) {
            if (bid_history[n].amount > highest_bid.amount)
                highest_bid = bid_history[n];
        }

        addFunds(highest_bid.user_id, highest_bid.amount);
    }
}

var getHighestBidder = function(auction_id) {
    var auction_object = auctions.findOne({'_id': auction_id});
    var bid_history = auction_object.bid_history;

    if (bid_history.length > 0) {
        var highest_bid = {'amount' : 0}

        for (var n=0; n < bid_history.length; n++) {
            if (bid_history[n].amount > highest_bid.amount)
                highest_bid = bid_history[n];
        }

        return highest_bid.user_id;
    }

    else return undefined;
}

updateGalleryDetails = function(user_id) {
    var items_on_display = items.find({'owner' : user_id, 'status' : 'displayed'}).fetch();
    var attribute_totals = {};
    for (var i=0; i < items_on_display.length; i++) {
        var item_attributes = items_on_display[i].attributes;
        for (var n=0; n < item_attributes.length; n++) {
            var attribute_id = item_attributes[n]._id;
            var attribute_value = item_attributes[n].value;
            if (attribute_totals[attribute_id] === undefined)
                attribute_totals[attribute_id] = attribute_value;

            else attribute_totals[attribute_id] += attribute_value;
        }
    }

    var display_cap = Meteor.users.findOne(user_id).profile.display_cap;
    var attribute_ids = Object.keys(attribute_totals);
    var attribute_values = {};

    if (attribute_ids.length == 0) {
        var gallery_object = galleries.findOne({'owner_id' : user_id});
        if (gallery_object != undefined)
            galleries.remove(gallery_object._id);

        return;
    }

    for (var i=0; i < attribute_ids.length; i++) {
        var attribute_id = attribute_ids[i];
        attribute_values[attribute_id] = attribute_totals[attribute_id] / display_cap;
    }

    Meteor.users.update(user_id, {$set: {'profile.gallery_details' : attribute_values}});

    if (galleries.findOne({"owner_id" : user_id}) == undefined) {
        var user_object = Meteor.users.findOne(user_id);
        if (user_object != undefined) {
            galleries.insert({
                'owner_id' : user_id,
                'owner' : user_object.profile.screen_name,
                'attribute_values' : attribute_values,
                'entry_fee' : user_object.profile.entry_fee,
            });
        }
    }

    else galleries.update({'owner_id' : user_id}, {$set: {'attribute_values' : attribute_values}});
}
