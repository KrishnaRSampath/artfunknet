Template.dashboard.helpers({
	'userData' : function() {
		//return Meteor.user();

		if (Meteor.user()) {
			var user_object = Meteor.user();



			var data_object = {
				'screen_name' : user_object.profile.screen_name,
				'bank_balance' : getCommaSeparatedValue(user_object.profile.bank_balance),
				'display_count' : items.find({'owner' : Meteor.userId(), 'status' : 'displayed'}).count(),
				'inventory_count' : items.find({'owner' : Meteor.userId(), 'status' : {$ne : 'unclaimed'}}).count(),
				'auction_count' : items.find({'owner' : Meteor.userId(), 'status' : 'auctioned'}).count(),
				'alert_count' : alerts.find({'user_id' : Meteor.userId()}).count(),
			}

			return data_object;
		}

		else return {};
	},

	'xpData' : function() {
		Meteor.call('getXPData', Meteor.user().profile.level, function(error, result) {
			if (error)
				console.log(error.message);

			else {
				var xp_data = result;
				var completion = (Meteor.user().profile.xp / xp_data.goal) * 100;
				console.log(completion);
				var xp_object = {
					'xp_completion' : Math.floor(completion) > 100 ? 100 : Math.floor(completion),
					'xp_goal' : getCommaSeparatedValue(xp_data.goal),
					'current_level' : Meteor.user().profile.level
				};

				Session.set('xp_data', xp_object);
			}
		});

		if (Session.get('xp_data'))
			return Session.get('xp_data');

		else return {
			'xp_completion' : 0,
			'xp_goal' : 0,
			'current_level' : 0
		}
	},

	'collection_value' : function() {
		Meteor.call('getCollectionValue', Meteor.userId(), function(error, result) {
			if (error)
				console.log(error.message);

			else Session.set('collection_value', result);
		});

		if (Session.get('collection_value') !== undefined)
			return getCommaSeparatedValue(Session.get('collection_value'));

		else return "";
	},

	'display_value' : function() {
		Meteor.call('getExhibitionValue', Meteor.userId(), function(error, result) {
			if (error)
				console.log(error.message);

			else Session.set('display_value', result);
		});

		if (Session.get('display_value') !== undefined)
			return getCommaSeparatedValue(Session.get('display_value'));

		else return "";
	}
})