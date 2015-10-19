var max_level = 50;

getNPCQuality = function(player_level) {
	var max_roll_value = 100;
	var min_roll_value = 0;

	var low_roll_from_level = Math.floor((player_level / max_level) * 100);

	var npc_quality_map = {
		'bronze' : max_roll_value,
		'silver' : Math.floor(low_roll_from_level + ((max_roll_value - low_roll_from_level) * .67)),
		'gold' : Math.floor(low_roll_from_level + ((max_roll_value - low_roll_from_level) * .33)),
		'platinum' : low_roll_from_level
	}

	return JepLoot.catRoll(npc_quality_map);
}

createNPC = function(gallery_object, attribute_id, duration) {
    var npc_object = {
        'quality' : getNPCQuality(Meteor.users.findOne(gallery_object.owner_id).profile.level),
        'attribute_id' : attribute_id,
        'owner_id' : gallery_object.owner_id,
        'expiration' : moment().add(duration, 'milliseconds')._d.toISOString(),
        'players_met' : [],
        'icon' : attributes.findOne(attribute_id).icon
    }

    npcs.insert(npc_object, function(error, inserted_id) {
        if (error)
            console.log(error.message)

        else {
            Meteor.setTimeout(function() {
                npcs.remove(inserted_id);
            }, duration);
        }
    })
}

Meteor.methods({
	'interactWithNPC' : function(npc_id) {
		var npc_object = npcs.findOne(npc_id);

		if (npc_object == undefined || npc_object.players_met.indexOf(Meteor.userId()) != -1)
			return undefined;

		var attribute_object = attributes.findOne(npc_object.attribute_id);		
		var npc_interaction = {};

		switch(attribute_object.title) {
			case "benefactor_bonus": 
				npc_interaction = benefactorInteraction(npc_object);
				break;
			case "donor_bonus": 
				npc_interaction = donorInteraction(npc_object);
				break;
			case "preservationist_bonus": 
				npc_interaction = preservationistInteraction(npc_object);
				break;
			case "entry_fee_reduction": //DISABLE - reduce entry fee
				npc_interaction = {'message': "A portion of your entry fee has been refunded."};
				break;
			case "set_xp_visitors": //DISABLE - give portion of set xp to visitors
				npc_interaction = {'message': "You have been given 0xp for sets in this permanent collection."};
				break;
			case "xp_visitors": //DISABLE - give portion of collection xp to visitors
				npc_interaction = {'message': "You have been given 0xp for works in this permanent collection."};
				break;
			case "auctioneer_bonus": //DISABLE - provide access to private bot auction
				npc_interaction = {'message': "You have met an auctioneer."};
				break;
			case "dealer_bonus": //DISABLE - offer rare paintings to buy
				npc_interaction = {'message': "You have met an art dealer."};
				break;
			case "collector_bonus": //DISABLE - offer money for painting
				npc_interaction = {'message': "You have met an art collector."};
				break;
			case "designer_bonus": //DISABLE - give discount to store
				npc_interaction = {'message': "You have met a designer."};
				break;
			case "forger_bonus": //DISABLE - give access to black market
				npc_interaction = {'message': "You have met an art forger."};
				break;
			case "art_expert_bonus": //DISABLE - reduce roll count of one of your paintings
				npc_interaction = artExpertInteraction(npc_object);
				break;
			case "historian_bonus": //DISABLE - quiz players for xp
				npc_interaction = {'message': "You have met an historian."};
				break;
			case "market_expert_bonus": //DISABLE - analyze auction house and return deals
				npc_interaction = {'message': "You have met a market expert."};
				break;
			case "entry_fee_reduction_members": //DISABLE = reduce entry fee for members
			case "set_xp_members": //DISABLE - give portion of set xp to members
			case "xp_members": //DISABLE - give portion of xp to members
			case "xp_per_visitor": //DISABLE - increase xp gain per visitor
			case "money_per_visitor": //DISABLE - increase money earned for entry fee
			case "bonus_money": //DISABLE - bonus money from feature paintings
			case "enthusiast_bonus": //give xp
				npc_interaction = enthusiastInteraction(npc_object);
				break;
			default: return undefined;
		}

		npcs.update(npc_id, {$push: {'players_met' : Meteor.userId()}});
		return npc_interaction;
	}
})

var enthusiastInteraction = function(npc_object) {
	var xp_chunk_percentage;

	switch(npc_object.quality) {
		case 'bronze' : xp_chunk_percentage = .2; break;
		case 'silver' : xp_chunk_percentage = .4; break;
		case 'gold' : xp_chunk_percentage = .6; break;
		case 'platinum' : xp_chunk_percentage = .8; break;
	};

	var xp_chunk = getXPChunk(Meteor.user().profile.level);
	var xp_won = Math.floor(xp_chunk * xp_chunk_percentage);

	var message = "You have met an art enthusiast who recently attended one of your gallery's events. They rave about your collection, and thank you for the experience. You have earned " + xp_won + "xp!";

	addXP(Meteor.userId(), xp_won);
	return {'message': message}
}

var benefactorInteraction = function(npc_object) {
	var max_donation = 500000;
	var donation_amount;

	switch(npc_object.quality) {
		case 'bronze' : donation_amount = max_donation * .3; break;
		case 'silver' : donation_amount = max_donation * .5; break;
		case 'gold' : donation_amount = max_donation * .7; break;
		case 'platinum' : donation_amount = max_donation * .9; break;
	};

	var money_won = Math.floor(donation_amount + ((Math.random() * .1) * max_donation));

	var message = "You have met a benefactor who would like to make a donation. You have recieved $" + getCommaSeparatedValue(money_won) + "!";

	addFunds(Meteor.userId(), money_won);
	return {'message': message}
}

var donorInteraction = function(npc_object) {
	generateItems(Meteor.userId(), npc_object.quality, 1);

	var message = "You have met a donor who would like to contribute to your collection. You may claim your gift in the loot area.";

	return {'message': message}
}

var preservationistInteraction = function(npc_object) {
	var repair_amount;

	var lowest_item = items.findOne({'owner' : Meteor.userId(), 'status' : {$in : ['claimed', 'displayed', 'permanent']}}, {sort: {'condition': 1}});

	if (lowest_item == undefined || lowest_item.condition > .9)
		return {'message' : "You have met a preservationist, but you don't currently own any works that can be refurbished"};

	switch(npc_object.quality) {
		case 'bronze': repair_amount = .1; break;
		case 'silver': repair_amount = .15; break;
		case 'gold': repair_amount = .2; break;
		case 'platinum': repair_amount = .25; break;
		default: repair_amount = 0; break;
	}

	var artwork_object = artworks.findOne(lowest_item.artwork_id);

	var new_condition;
	if (repair_amount + lowest_item.condition > 1)
		new_condition = 1;

	else new_condition = repair_amount + lowest_item.condition;

	items.update(lowest_item._id, {$set: {'condition' : Number(new_condition)}});

	var message = "You have met a preservationist who has offered to refurbish one of your pieces. " + artwork_object.title + " by " + artwork_object.artist + " has increased in value.";

	return {'message': message}
}

var artExpertInteraction = function(npc_object) {
	var roll_reduction;

	var highest_item = items.findOne({'owner' : Meteor.userId(), 'status' : {$in : ['claimed', 'displayed', 'permanent']}, 'roll_count' : {$gt : 0}}, {sort: {'roll_count': -1}});

	if (highest_item == undefined)
		return {'message' : "You have met an art expert, but you don't currently own any works that can be improved. Try re-rolling painting attributes to improve a piece's ratings."};

	switch(npc_object.quality) {
		case 'bronze': roll_reduction = 1; break;
		case 'silver': roll_reduction = 2; break;
		case 'gold': roll_reduction = 3; break;
		case 'platinum': roll_reduction = 4; break;
		default: roll_reduction = 0; break;
	}

	var artwork_object = artworks.findOne(highest_item.artwork_id);

	var new_count;
	if (highest_item.roll_count - roll_reduction < 0)
		new_count = 0;

	else new_count = highest_item.roll_count - roll_reduction;

	items.update(highest_item._id, {$set: {'roll_count' : Number(new_count)}});

	var message = "You have met an art expert who recently attended one of your events and was impressed by your collection. As a result, they have been spreading the word about your gallery. " + artwork_object.title + " by " + artwork_object.artist + " has had its roll count reduced to " + new_count + ".";

	return {'message': message}
}