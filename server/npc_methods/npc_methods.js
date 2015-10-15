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
			case "donor_bonus": //give rare painting
			case "entry_fee_reduction": //DISABLE - reduce entry fee
			case "set_xp_visitors": //DISABLE - give portion of set xp to visitors
			case "xp_visitors": //DISABLE - give portion of collection xp to visitors
			case "auctioneer_bonus": //DISABLE - provide access to private bot auction
			case "dealer_bonus": //DISABLE - offer rare paintings to buy
			case "collector_bonus": //DISABLE - offer money for painting
			case "designer_bonus": //DISABLE - give discount to store
			case "forger_bonus": //DISABLE - give access to black market
			case "art_expert_bonus": //DISABLE - reduce roll count of one of your paintings
			case "historian_bonus": //DISABLE - quiz players for xp
			case "preservationist_bonus": //DISABLE - improve condition of one of your paintings for a fee
			case "market_expert_bonus": //DISABLE - analyze auction house and return deals
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
	return {
		'message': message
	}
}

var benefactorInteraction = function(npc_object) {
	var max_donation = 1000000;
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
	return {
		'message': message
	}
}