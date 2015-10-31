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

var getMVPData = function() {
    var mvp_owner = Meteor.users.findOne({}, {sort: {'profile.mvp.value': -1}});
    if (mvp_owner == undefined) {
        console.log("mvp_owner not found");
        return undefined;
    }

    var mvp = mvp_owner.profile.mvp;

    if (mvp == undefined) {
        console.log("mvp not found");
        return undefined;
    }

    var item_object = items.findOne(mvp.item_id);

    if (item_object == undefined) {
        console.log("item_object not found");
        return undefined;
    }

    var artwork_object = artworks.findOne(item_object.artwork_id);

    return {
        'artist': artwork_object.artist,
        'title': artwork_object.title,
        'owner': mvp_owner.profile.screen_name,
        'value': getItemValue(item_object._id, 'actual'),
        'rarity': artwork_object.rarity,
        'condition': item_object.condition,
    }
}

Meteor.methods({
    'getLeaderboardData' : function() {
        return {
            'mvp_data': getMVPData(),
            'gallery_score_data': Meteor.users.find({}, {limit: 20, sort: {'profile.gallery_score': -1}}).fetch(),
            'gallery_value_data': Meteor.users.find({}, {limit: 20, sort: {'profile.gallery_value': -1}}).fetch()
        }
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

    'getUserScreenName' : function(user_id) {
        var user_object = Meteor.users.findOne(user_id);
        return user_object ? user_object.profile.screen_name : undefined;
    },

    'placeBid' : function(auction_id, amount) {
        try {
            var auction_object = auctions.findOne({'_id': auction_id});
            var item_object = items.findOne({'_id': auction_object.item_id});
            var user_object = Meteor.user();

            if (item_object == undefined)
                throw "cannot find item";

            if (inventoryIsFull())
                throw "inventory is full";

            if (amount < auction_object.bid_minimum && (amount < auction_object.buy_now && auction_object.buy_now != -1))
                throw "invalid amount";

            if (user_object === undefined)
                throw "invalid user";

            if (amount > user_object.profile.bank_balance)
                throw "invalid amount";

            if (amount >= auction_object.buy_now && auction_object.buy_now != -1) {
                refundHighestBid(auction_id);

                var highest_bidder = getHighestBidder(auction_id);
                if (highest_bidder && highest_bidder != user_object._id) {
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

                chargeAccount(user_object._id, auction_object.buy_now);
                var owner_id = item_object.owner;
                addFunds(owner_id, auction_object.buy_now);
                items.update({'_id': item_object._id}, {$set: {'status' : 'claimed', 'owner': user_object._id}});
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
                'user_id': user_object._id,
                'amount' : amount,
                'date' : moment(),
            }

            auctions.update(
                auction_id, {
                    $push: {'bid_history' : bid_object},
                    $set: {'current_price' : amount, 'bid_minimum' : Math.floor(amount * 1.05)}
                }
            );

            chargeAccount(user_object._id, amount);
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

    'lookupCrateCost' : function(quality) {
        return lookupCrateCost(quality, admin_settings.crate_drop_count);
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

        if (highest_bid.user_id != "auction_bot")
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
