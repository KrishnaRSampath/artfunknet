concludeAuction = function(auction_id) {
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
        addFunds(item_object.owner, highest_bid.amount);

        if (highest_bid.user_id != "auction_bot") {
            addXPChunkPercentage(highest_bid.user_id, XPChunkValue);
            transferAuctionItem(item_object._id, item_object.owner, highest_bid.user_id);
        }

        else {
            items.remove(item_object._id);
            calcMVP(item_object.owner);
        }

        auctions.remove({'_id': auction_id}, function(error) {
            if (error)
                console.log(error.message);
        });
    }
}

transferAuctionItem = function(item_id, owner_id, winner_id) {
    items.update(item_id, {$set: {'status' : 'claimed', 'owner': winner_id}}, function(error) {
        if (error)
            console.log(error.message);

        else {
            calcMVP(winner_id);
            calcMVP(owner_id);
        }
    });
}

concludeDisplay = function(item_id) {
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

        else {
            updateGalleryDetails(items.findOne(item_id).owner);
            calcMVP(Meteor.userId());
        }
    });
}

getDisplayDetails = function(item_id, duration) {
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
            money = actual_amount * .00018 * duration;
            xp = xp_value * .0008 * duration;
            break;
        case 60:
            money = actual_amount * .00012 * duration;
            xp = xp_value * .0001 * duration;
            break;
        case 360:
            money = actual_amount * .00014 * duration;
            xp = xp_value * .0002 * duration;
            break;
        case 720:
            money = actual_amount * .00016 * duration;
            xp = xp_value * .0003 * duration;
            break;
        case 1440:
            money = actual_amount * .00018 * duration;
            xp = xp_value * .0004 * duration;
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

Meteor.methods({
	'claimArtwork' : function(item_id) {
		var item_object = canClaimItem(item_id);
        if (item_object) {
            items.update({'_id': item_id}, {$set: {'status' : 'claimed'}}, function(error) {
                if (error)
                    console.log(error.message);

                else calcMVP(Meteor.userId());
            });
        }

        else throw "invalid operation";
    },

    'declineItem' : function(item_id) {
        var item_object = canDeclineItem(item_id);
        if (item_object) {
            items.remove(item_object._id);
        }

        else throw "invalid operation";
    },

    'purchaseItemFromDealer' : function(item_id) {
        var item_object = canPurchaseItemFromDealer(item_id);
        if (item_object) {
            chargeAccount(Meteor.userId(), getItemValue(item_id, "dealer"));
            items.update(item_id, {$set: {'status': "claimed"}}, function(error) {
                if (error)
                    console.log(error.message);

                else calcMVP(Meteor.userId());
            });
        }
    },

    'displayArtwork' : function(item_id, duration) {
        var errors = [];

        if (isNaN(duration))
            errors.push("invalid duration");

    	var item_object = canDisplayItem(item_id);
        if (item_object) {
            var end = moment().add(duration, 'minutes');
            var display_details = getDisplayDetails(item_id, duration);
            items.update({'_id': item_id}, {$set: {'status' : 'displayed', 'display_details' : display_details}}, function(error) {
                if (error)
                    console.log(error.message);

                else updateGalleryDetails(item_object.owner);
            });
            return [];
        }

        else errors.push("invalid operation");

        return errors;
    },

    'acceptCollectorOffer' : function(interaction_object) {
        var item_object = canSellToCollector(interaction_object.item._id);
        if (item_object) {
            addFunds(Meteor.userId(), interaction_object.offer);
            items.remove(item_object._id, function(error) {
                if (error)
                    console.log(error.message);

                else calcMVP(Meteor.userId());
            });
        }
    },

    'setItemPermanentCollectionStatus' : function(item_id, set_to_permanent) {
        var item_object = set_to_permanent ? canSetPermanent(item_id) : canUnsetPermanent(item_id);
        if (item_object) {
            if (set_to_permanent) {
                items.update(item_id, {$set: {'status' : 'permanent'}});
                items.update(item_id, {$set: {'permanent_post' : moment()._d.toISOString()}});
            }

            else {
                items.update(item_id, {$set: {'status' : 'claimed'}});
                items.update(item_id, {$unset: {'permanent_post' : ""}});
            }
        }

        else throw "invalid operation";
    },

    'sellArtwork' : function(item_id) {
        var item_object = canSellItem(item_id);
        if (item_object) {
            var value = getItemValue(item_id, 'sell');
            if (isNaN(value))
                throw "invalid amount";

            addFunds(Meteor.userId(), value);
            items.remove(item_id, function(error) {
                if (error)
                    console.log(error.message);

                else calcMVP(Meteor.userId());
            });
        }

        else throw "invalid operation";
    },

    'auctionArtwork' : function(item_id, starting, buy_now, duration) {
    	var item_object = canAuctionItem(item_id);

        var errors = [];

        if (item_object == undefined)
            errors.push("invalid action");

        if (isNaN(starting))
            errors.push("invalid starting value");

        if (isNaN(buy_now))
            errors.push("invalid buy now value");

        if (duration == "default")
            errors.push("invalid duration");

        if (item_object) {        
            var minimum = getItemValue(item_id, "auction_min");
            if (Number(starting) < minimum)
                errors.push("starting value must be greater than $" + getCommaSeparatedValue(minimum));

            if (buy_now != -1 && Number(buy_now) < minimum )
                errors.push("buy now value must be greater than $" + getCommaSeparatedValue(minimum));
        }

        if (errors.length == 0) {
            items.update({'_id': item_id}, {$set: {'status' : 'auctioned'}}, function() {
                createAuction(item_id, starting, buy_now, duration);
            });
        }

        return errors;
    },

    'getItemValue' : function(item_id, type) {
        return getItemValue(item_id, type);
    },

    'getRerollCost' : function(item_id) {
        return getRerollCost(item_id);
    },

    'rerollAttributeValue' : function(item_id, attribute_id) {
    	var item_object = canRerollItem(item_id);
        if (item_object) {
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

        else throw "invalid operation";
    },

    'rerollAttribute' : function(item_id, attribute_id) {
    	var item_object = canRerollItem(item_id);
        if (item_object) {
            var attribute_type = attributes.findOne(attribute_id).type;
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

        else throw "invalid operation";
    },

})