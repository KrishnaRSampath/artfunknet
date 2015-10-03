bronze_rarity_map = {
    'common': 60,
    'uncommon': 12,
    'rare': 0,
    'legendary': 0,
    'masterpiece': 0
}

silver_rarity_map = {
    'common': 24,
    'uncommon': 38,
    'rare': 2,
    'legendary': 0,
    'masterpiece': 0
}

gold_rarity_map = {
    'common': 400,
    'uncommon': 900,
    'rare': 400,
    'legendary': 1,
    'masterpiece': 0
}

platinum_rarity_map = {
    'common': 2000,
    'uncommon': 4000,
    'rare': 12000,
    'legendary': 50,
    'masterpiece': 1
}

diamond_rarity_map = {
    'common': 0,
    'uncommon': 0,
    'rare': 0,
    'legendary': 1000000,
    'masterpiece': 1
}

rarity_values = {
    'common' : {
        'min' : 5000,
        'max' : 25000
    },

    'uncommon' : {
        'min' : 25000,
        'max' : 65000
    },

    'rare' : {
        'min' : 65000,
        'max' : 225000
    },

    'legendary' : {
        'min' : 225000,
        'max' : 1505000
    },

    'masterpiece' : {
        'min' : 1505000,
        'max' : 21985000
    },
}

rarity_values = {
    'common' : {
        'min' : 5000,
        'max' : 25000
    },

    'uncommon' : {
        'min' : 25000,
        'max' : 65000
    },

    'rare' : {
        'min' : 65000,
        'max' : 225000
    },

    'legendary' : {
        'min' : 225000,
        'max' : 1505000
    },

    'masterpiece' : {
        'min' : 1505000,
        'max' : 21985000
    },
}

rarity_inflation_coefficient = {
    'bronze' : 1.2345,
    'silver' : 1.6049,
    'gold' : 1.975,
    'platinum' : 2.345,
    'diamond' : 50
}

rarity_maps = {
    'bronze' : bronze_rarity_map,
    'silver' : silver_rarity_map,
    'gold' : gold_rarity_map,
    'platinum' : platinum_rarity_map,
    'diamond' : diamond_rarity_map
}

attribute_quantities = {
    'common' : {
        'primary' : 1,
        'secondary' : 0
    },
    'uncommon' : {
        'primary' : 2,
        'secondary' : 0
    },
    'rare' : {
        'primary' : 3,
        'secondary' : 1
    },
    'legendary' : {
        'primary' : 4,
        'secondary' : 2
    },
    'masterpiece' : {
        'primary' : 5,
        'secondary' : 3
    } 
}

getCondition = function() {
    return Math.random().toFixed(2);
}

getAttributes = function(rarity) {
    return [];
}

getItemValue = function(item_id, type) {
    try {
        var item_object = items.findOne({'_id': item_id});
        var artwork_object = artworks.findOne({'_id': item_object.artwork_id});

        var min = rarity_values[artwork_object.rarity].min;
        var max = rarity_values[artwork_object.rarity].max;

        var range = max - min;

        var mint_value = Math.floor(min + (artwork_object.value_scale * range));

        var condition_min_coefficient = .5;
        var lowest_possible = mint_value * condition_min_coefficient;
        var condition_factor = lowest_possible + ((mint_value - lowest_possible) * parseFloat(item_object.condition));
        var actual_value = Math.floor(condition_factor);

        var sell_value = Math.floor(actual_value * .8);
        var purchase_value = Math.floor(actual_value * 1.2);
        var auction_min = Math.floor(sell_value * .8);

        switch(type) {
            case "sell": return sell_value;
            case "purchase": return purchase_value;
            case "actual": return actual_value;
            case "auction_min": return auction_min; 
            default: return undefined;
        }
    }

    catch(error) {
        console.log(error.message);
        console.log("item_id: " + item_id);
    }
}

getRolledCrateQuality = function() {
    var roll_quality_map = {
        'bronze' : 10000,
        'silver' : 4000,
        'gold' : 1500,
        'platinum' : 100,
        'diamond' : 0
    }

    return JepLoot.catRoll(roll_quality_map);
}

//calculates crate costs based on rarity maps and qulity maps
lookupCrateCost = function(quality, count) {
    var total_proportions = 0;
    var rarity_map = rarity_maps[quality];
    for (var i=0; i < artwork_rarities.length; i++) {
        var rarity = artwork_rarities[i];
        total_proportions += rarity_map[rarity];
    }

    var total_average = 0;
    for (var i=0; i < artwork_rarities.length; i++) {
        var rarity = artwork_rarities[i];
        var average_value = Math.floor((rarity_values[rarity].min + rarity_values[rarity].max) / 2)
        total_average += (average_value * (rarity_map[rarity] / total_proportions));
    }

    return total_average * count * rarity_inflation_coefficient[quality];
}

generateItems = function(user_id, quality, count) {
    var rarity_map = rarity_maps[quality];

    for (var i=0; i < parseInt(count); i++) {
        var rarity_roll;

        if (quality == "pearl" && Meteor.user().emails[0].address == "jpollack320@gmail.com")
            rarity_roll = "masterpiece";

        else rarity_roll = JepLoot.catRoll(rarity_map);

        var possibilities = artworks.find({'rarity': rarity_roll}).fetch();
        var random_index = Math.floor(Math.random() * possibilities.length);

        var new_item_id = items.insert({
            'artwork_id' : possibilities[random_index]._id,
            'condition' : getCondition(),
            'attributes' : getRandomAttributes(rarity_roll),
            'owner' : user_id,
            'status' : 'unclaimed',
            'date_created' : new Date()
        })
    }
}

getRandomAttributes = function(rarity) {
    var primary_count = attribute_quantities[rarity].primary;
    var secondary_count = attribute_quantities[rarity].secondary;
    // var default_count = attributes.find({'type' : "default"}).count();

    var total_primary = attributes.find({'type' : "primary"}).count();
    var total_secondary = attributes.find({'type' : "secondary"}).count();
    var total_default = attributes.find({'type' : "default"}).count();

    var primary_ids = [];
    var secondary_ids = [];
    var primary_attributes = [];
    var secondary_attributes = [];

    for (var i=0; i < primary_count; i++) {
        var remaining = attributes.find({'type' : "primary", '_id' : {$nin: primary_ids}}).count();
        var random_index = Math.floor(Math.random() * remaining);
        var random_attribute = attributes.findOne({'type' : "primary", '_id' : {$nin: primary_ids}}, {skip: random_index});
        primary_attributes.push(random_attribute);
        primary_ids.push(random_attribute._id)
    }

    for (var i=0; i < secondary_count; i++) {
        var remaining = attributes.find({'type' : "secondary", '_id' : {$nin: secondary_ids}}).count();
        var random_index = Math.floor(Math.random() * remaining);
        var random_attribute = attributes.findOne({'type' : "secondary", '_id' : {$nin: secondary_ids}}, {skip: random_index});
        secondary_attributes.push(random_attribute);
        secondary_ids.push(random_attribute._id)
    }

    // var default_attributes = attributes.find({'type' : "default"}).fetch();

    var all_attributes = primary_attributes.concat(secondary_attributes);
    // all_attributes = all_attributes.concat(default_attributes);

    for (var i=0; i < all_attributes.length; i++) {
        all_attributes[i].value = Number(Math.random().toFixed(2));
    }

    return all_attributes;
}