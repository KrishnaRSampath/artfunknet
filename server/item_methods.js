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

Meteor.methods({
	'claimArtwork' : function(item_id) {
		var item_object = canClaimItem(item_id);
        if (item_object) {
            items.update({'_id': item_id}, {$set: {'status' : 'claimed'}});
        }

        else throw "invalid operation";
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
            items.remove({'_id': item_id});
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