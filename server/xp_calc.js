var starting_max_chunk = 1;
var chunk_exponent = .9;
var starting_xp  = 100;
var xp_exponent = 1.3;
var max_level = 50;

getXPChunk = function(current_level) {
	var chunk_percentage = starting_max_chunk * (Math.pow(chunk_exponent, current_level));
	return Math.floor(chunk_percentage * getXPGoal(current_level));
}

getXPGoal = function(current_level) {
	return Math.floor(starting_xp * (Math.pow(xp_exponent, current_level)));
}

levelUp = function(user_id) {
	try {
		var current_level = Meteor.users.findOne(user_id).profile.level;
		var level_hit = current_level + 1;
		Meteor.users.update(user_id, {$set : {'profile.level' : level_hit}});

		var level_message = "You have reached level " + level_hit + "! ";

		switch(level_hit % 10) {
			case 0: 
				Meteor.users.update(user_id, {$set : {'profile.inventory_cap' : Meteor.users.findOne(user_id).profile.inventory_cap + 2}}); 
				level_message += "Your inventory has been increased by 2.";
				break;
			case 1: 
			case 4:
			case 7: 
				Meteor.users.update(user_id, {$set : {'profile.pc_cap' : Meteor.users.findOne(user_id).profile.pc_cap + 1}}); 
				level_message += "Your private collection limit has been increased by 1.";
				break;
			case 3: 
			case 9: 
				Meteor.users.update(user_id, {$set : {'profile.auction_cap' : Meteor.users.findOne(user_id).profile.auction_cap + 1}}); 
				level_message += "Your active auction limit has been increased by 1.";
				break;
			case 2:
			case 5:
			case 8: 
				Meteor.users.update(user_id, {$set : {'profile.inventory_cap' : Meteor.users.findOne(user_id).profile.inventory_cap + 1}});
				level_message += "Your inventory has been increased by 1.";
				break;
			case 6: 
				Meteor.users.update(user_id, {$set : {'profile.display_cap' : Meteor.users.findOne(user_id).profile.display_cap + 1}}); 
				level_message += "Your display capacity has been increased by 1.";
				break;
			default: break;
		}

		var alert_object = {
	        'user_id' : user_id,
	        'message' : level_message,
	        'link' : '/',
	        'icon' : 'fa-star',
	        'sentiment' : "good",
	        'time' : moment()
	    };

	    alerts.insert(alert_object, function(error) {
	    	if(error)
	    		console.log(error.message);
	    });
	}

	catch(error) {
		console.log(error.message);
	}
}

addXP = function(user_id, xp) {
	var xp_to_add = xp;
	var player_object = Meteor.users.findOne(user_id);
	var player_level = player_object.profile.level;
	var player_xp = player_object.profile.xp;
	var level_up_count = 0;

	while (xp_to_add > 0) {
		var remaining_xp = getXPGoal(player_level) - player_xp;

		if (remaining_xp > xp_to_add) {
			player_xp += xp_to_add;
			xp_to_add = 0;
		}

		else {
			level_up_count++;
			player_level++;
			player_xp = 0;
			xp_to_add -= remaining_xp;
		}
	}

	for (var i=0; i < level_up_count; i++) {
		Meteor.setTimeout(function(){
			levelUp(user_id);
		}, 2000);
	}

	Meteor.users.update(user_id, {$set: {'profile.xp' : player_xp}});
}

addXPChunkPercentage = function(user_id, chunk_percentage) {
	var chunk = getXPChunk(Meteor.users.findOne(user_id).profile.level);
	addXP(user_id, Math.floor(chunk * chunk_percentage));
}