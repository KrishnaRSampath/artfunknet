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
				'alert_count' : alerts.find({'user_id' : Meteor.userId()}).count()
			}

			return data_object;
		}

		else return {};
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