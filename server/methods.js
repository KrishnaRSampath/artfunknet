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
	'registerUser': function(user) {
		var emailExists = !! Meteor.users.findOne({ emails: { $elemMatch: { address: user.email } } });
        var screenNameExists;

        // TODO: Compare screennames and emails by case
        if (user.profile.screen_name.length == 0) {
            screenNameExists = false;
        }

        else {
            screenNameExists = !! Meteor.users.findOne({'profile.screen_name': user.profile.screen_name });
        }

        if (emailExists){
            throw new Meteor.Error("Email already exists");
        }

        else if (screenNameExists) {
            throw new Meteor.Error("Screen Name already exists");
        }

        else {
            createUser(user);
        }
	},

    'validateCreateLogin' : function(user_object, confirmed_password) {
        try {
            var errors = [];

            if (user_object.password != confirmed_password)
                errors.push("Password fields do not match");

            if (user_object.profile.screen_name == "" || Meteor.users.find({'profile.screen_name': user_object.profile.screen_name}).count() > 0)
                errors.push("Invalid user handle");

            if (user_object.email == "")
                errors.push("Invalid email address");

            if (user_object.password == "")
                errors.push("Invalid password");

            if (Meteor.users.find({'emails.0.address': user_object.email}).count() > 0)
                errors.push("A user with that email address already exists");

            if (errors.length == 0) {
                createUser(user_object);
            }

            return errors;
        }

        catch(error) {
            return [error.message];
        }
    },

    'emailIsTaken' : function(email_address) {
        return Meteor.users.find({'emails.0.address': email_address}).count() > 0;
    },

    'generateItemsFromRarity' : function(user_id, rarity, count) {
        generateItemsFromRarity(user_id, rarity, count);
    },

    'claimArtwork' : function(user_id, item_id) {
        if (Meteor.userId() && Meteor.userId() == user_id && !inventoryIsFull()) {
            items.update({'_id': item_id}, {$set: {'status' : 'claimed'}});
        }

        else throw "access denied";
    },

    'displayArtwork' : function(user_id, item_id, duration) {
        if (Meteor.userId() && Meteor.userId() == user_id && canDisplay()) {
            var end = moment().add(duration, 'minutes');
            var display_details = getDisplayDetails(item_id, duration);
            items.update({'_id': item_id}, {$set: {'status' : 'displayed', 'display_details' : display_details}}, function(error) {
                if (error)
                    console.log(error.message);

                else updateGalleryDetails(user_id);
            });
        }

        else throw "current userId does not match item's owner";
    },

    'sellArtwork' : function(user_id, item_id) {
        try {
            var item_object = items.findOne(item_id);
            if (Meteor.userId() && Meteor.userId() == user_id && 
                    item_object.owner == Meteor.userId() && 
                    (item_object.status != 'claimed' && item_object.status != 'unclaimed') 
                ) {
                var value = getItemValue(item_id, 'sell');
                if (isNaN(value))
                    throw "invalid amount";

                addFunds(user_id, value);
                items.remove({'_id': item_id});
            }

            else throw "current userId does not match item's owner'";
        }

        catch(error) {
            console.log('in sellArtwork');
            console.log('user_id: ' + user_id);
            console.log('item_id: ' + item_id);
            console.log(error.message);
        }
    },

    'deleteArtwork' : function(user_id, item_id) {
        console.log(item_id);
        if (Meteor.userId() && Meteor.userId() == user_id) {
            items.remove({'_id': item_id});
        }

        else throw "current userId does not match item's owner'";
    },

    'getInventory' : function() {
        var owned = items.find({'owner': Meteor.userId(), 'status': 'claimed'});
        var owned_array = [];

        owned.forEach(function(item_object) {
            owned_array.push(item_object._id);
        });

        return owned_array;
    },

    'auctionArtwork' : function(user_id, item_id, starting, buy_now, duration) {
        if (Meteor.userId() && Meteor.userId() == user_id && items.findOne(item_id).owner == Meteor.userId() && canAuction()) {

            items.update({'_id': item_id}, {$set: {'status' : 'auctioned'}}, function() {
                createAuction(item_id, starting, buy_now, duration);
            });
        }

        else throw "current userId does not match item's owner'";
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

        if (user_object)
            return items.find({'owner': user_object._id, 'status': {$in : ['displayed', 'permanent']}}).fetch();

        else return [];
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

            else if (! !!Meteor.userId() || Meteor.userId() != user_id)
                throw "invalid user";

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

    'chargeAccount' : function(user_id, amount) {
        chargeAccount(user_id, amount);
    },

    'clearUnclaimed' : function(user_id) {
        items.remove({'owner': user_id, 'status': 'unclaimed'});
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

    'getItemValue' : function(item_id, type) {
        return getItemValue(item_id, type);
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

    'getItemImageURL' : function(item_id) {
        return "http://go-grafix.com/data/wallpapers/35/painting-626297-1920x1080-hq-dsk-wallpapers.jpg";
    },

    'alertAllUsers' : function(message) {
        var admin = Meteor.user().emails[0].address == "jpollack320@gmail.com";
        if (admin) {
            var all_users = Meteor.users.find();

            all_users.forEach(function(db_object) {
                var alert_object = {
                    'user_id' : db_object._id,
                    'message' : message,
                    'link' : '/',
                    'icon' : 'fa-exclamation',
                    'sentiment' : "neutral",
                    'time' : moment()
                };

                alerts.insert(alert_object);
            })
        }
    },

    'clearAlerts' : function() {
        alerts.remove({'user_id' : Meteor.userId()}, {multi : true});
    },

    'getRerollCost' : function(item_id) {
        return getRerollCost(item_id);
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

    'rerollAttributeValue' : function(item_id, attribute_id) {
        if (canRerollItem(item_id)) {
            var item_object = items.findOne(item_id);
            if (item_object != undefined) {
                var roll_count = item_object.roll_count;
                var attribute_array = item_object.attributes;

                for (var i=0; i < attribute_array.length; i++) {
                    if (attribute_array[i]._id == attribute_id) {
                        attribute_array[i].value = getAttributeValue();
                        break;
                    }
                }

                items.update(item_id, {$set: {'attributes' : attribute_array}});
                items.update(item_id, {$set : {'roll_count' : roll_count + 1}});
                chargeAccount(Meteor.userId(), getRerollCost(item_id));
            }
        }
    },

    'rerollAttribute' : function(item_id, attribute_id) {
        if (canRerollItem(item_id)) {
            var attribute_type = attributes.findOne(attribute_id).type;
            var item_object = items.findOne(item_id);
            if (item_object != undefined) {
                var roll_count = item_object.roll_count;
                var attribute_array = item_object.attributes;

                var attribute_ids = []
                for (var i=0; i < attribute_array.length; i++)
                    attribute_ids.push(attribute_array[i]._id);

                var target_attribute_index;
                for (var i=0; i < attribute_array.length; i++) {
                    if (attribute_array[i]._id == attribute_id) {
                        target_attribute_index = i;
                        break;
                    }
                }

                var remaining = attributes.find({'type' : attribute_type, '_id' : {$nin: attribute_ids}}).count();
                var random_index = Math.floor(Math.random() * remaining);
                var random_attribute = attributes.findOne({'type' : attribute_type, '_id' : {$nin: attribute_ids}}, {skip: random_index});

                attribute_array[target_attribute_index] = random_attribute;
                attribute_array[target_attribute_index].value = getAttributeValue();

                items.update(item_id, {$set: {'attributes' : attribute_array}});
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
    },

    'levelUp' : function() {
        levelUp(Meteor.userId());
    },

    'addXP' : function(amount) {
        addXP(Meteor.userId(), amount);
    },

    'sendResetPasswordEmail': function(email_address) {
        var user = Meteor.users.findOne({"emails.0.address": email_address});

        if (user) {
            Accounts.sendResetPasswordEmail(user._id);
            return true;
        }

        else return null;
    },

    'purchaseTicket' : function(buyer_id, owner_id) {
        // var ticket_duration = 10000;
        var ticket_duration = 1800000;
        var ticket_expiration = moment().add(ticket_duration, 'milliseconds')._d.toISOString();
        var entry_fee = Meteor.users.findOne(owner_id).profile.entry_fee;

        if (entry_fee > Meteor.user().profile.bank_balance)
            return;

        var current_tickets = Meteor.users.findOne(buyer_id).profile.tickets;

        if (current_tickets == undefined) {
            var ticket_object = {};
            ticket_object[owner_id] = ticket_expiration;
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : ticket_object}});
        }

        else {
            if (Object.keys(current_tickets).length >= Meteor.users.findOne(buyer_id).profile.ticket_cap)
                return;

            current_tickets[owner_id] = ticket_expiration;
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : current_tickets}});
        }

        Meteor.setTimeout(function() {
            var buyer_object = Meteor.users.findOne(buyer_id);
            var current_tickets = buyer_object.profile.tickets;
            delete current_tickets[owner_id];
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : current_tickets}});
        }, ticket_duration);

        addFunds(owner_id, entry_fee);
        addXPChunkPercentage(owner_id, .02);
        chargeAccount(buyer_id, entry_fee);
    },

    'updateEntryFee' : function(value) {
        if (value < 0)
            return;
        
        Meteor.users.update(Meteor.userId(), {$set: {'profile.entry_fee' : value}});
        galleries.update({'owner_id' : Meteor.userId()}, {$set: {'entry_fee' : value}});
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

addFunds = function(user_id, amount) {
    if (isNaN(amount))
        throw "invalid amount";

    var actual_amount = Number(amount).toFixed(2);

    var current_balance = Number(Meteor.users.findOne({'_id': user_id}).profile.bank_balance).toFixed(2);
    var new_balance = Math.ceil((Number(current_balance) + Number(actual_amount)) * 100) / 100;
    Meteor.users.update(user_id, {$set: {"profile.bank_balance" : new_balance}});
}

chargeAccount = function(user_id, amount) {
    if (isNaN(amount))
        throw "invalid amount";

    var actual_amount = Number(amount).toFixed(2);

    var current_balance = Number(Meteor.users.findOne({'_id': user_id}).profile.bank_balance).toFixed(2);
    var new_balance = Math.ceil((Number(current_balance) - Number(actual_amount)) * 100) / 100;
    Meteor.users.update(user_id, {$set: {"profile.bank_balance" : new_balance}});
}

var getDisplayDetails = function(item_id, duration) {
    // 1 hour
    // 6 hours
    // 12 hours
    // 1 day
    var actual_amount = getItemValue(item_id, 'actual');
    var xp_chunk = getXPChunk(Meteor.user().profile.level);
    var xp_rating = items.findOne(item_id).xp_rating;
    var xp_value = (xp_chunk * .5) + (xp_chunk * .5 * xp_rating);

    //add bonuses from attributes

    var money, xp;
    switch(Number(duration)) {
        case 1:
            money = actual_amount * .0001 * duration;
            xp = xp_value * .001 * duration;
            break;
        case 60:
            money = actual_amount * .00025 * duration;
            xp = xp_value * .0012 * duration;
            break;
        case 360:
            money = actual_amount * .0004 * duration;
            xp = xp_value * .0013 * duration;
            break;
        case 720:
            money = actual_amount * .00055 * duration;
            xp = xp_value * .0014 * duration;
            break;
        case 1440:
            money = actual_amount * .0007 * duration;
            xp = xp_value * .0015 * duration;
            break;
        default:
            money = 0;
            break;
    }

    var end = moment().add(duration, 'minutes')._d.toISOString();
    var display_details = {
        'money' : money.toFixed(2),
        'xp' : Math.floor(xp),
        'end' :end
        // 'end' : moment().add(1, 'minutes')._d.toISOString()
    }

    return display_details;
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
