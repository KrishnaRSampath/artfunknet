Template.dashboard.helpers({
	'userData' : function() {
		if (Meteor.user()) {
			var user_object = Meteor.user();
			var data_object = {
				'screen_name' : user_object.profile.screen_name,
				'bank_balance' : getCommaSeparatedValue(user_object.profile.bank_balance),
				'display_count' : items.find({'owner' : Meteor.userId(), 'status' : 'displayed'}).count(),
				'inventory_count' : items.find({'owner' : Meteor.userId(), 'status' : {$nin : ['unclaimed', 'for_sale']}}).count(),
				'auction_count' : items.find({'owner' : Meteor.userId(), 'status' : 'auctioned'}).count(),
				'alert_count' : alerts.find({'user_id' : Meteor.userId()}).count(),
				'private_count' : items.find({'owner' : Meteor.userId(), 'status' : 'permanent'}).count(),
				'display_max' : user_object.profile.display_cap,
				'inventory_max' : user_object.profile.inventory_cap,
				'auction_max' : user_object.profile.auction_cap,
				'private_max' : user_object.profile.pc_cap,
				'entry_fee' : "$" + getCommaSeparatedValue(user_object.profile.entry_fee)
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
				var xp_object = {
					'xp_completion' : Math.floor(completion) > 100 ? 100 : Math.floor(completion),
					'xp_remaining' : getCommaSeparatedValue(xp_data.goal - Meteor.user().profile.xp),
					'current_level' : Meteor.user().profile.level,
					'current_xp' : getCommaSeparatedValue(Meteor.user().profile.xp),
					'xp_goal' : getCommaSeparatedValue(xp_data.goal)
				};

				Session.set('xp_data', xp_object);
			}
		});

		if (Session.get('xp_data'))
			return Session.get('xp_data');

		else return {
			'xp_completion' : 0,
			'xp_remaining' : 0,
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
	},

	'ticket' : function() {
		var tickets = Meteor.user().profile.tickets;
		if (tickets != undefined) {
			var ticket_ids = Object.keys(tickets);
			var ticket_array = [];
			for (var i=0; i < ticket_ids.length; i++) {
				var gallery_object = galleries.findOne({'owner_id' : ticket_ids[i]});
				if (gallery_object) {
					var ticket_object = {
						'screen_name' : gallery_object.owner,
						'owner_id' : ticket_ids[i],
						'expiration_string' : getTimeString(moment(tickets[ticket_ids[i]]))
					}
					ticket_array.push(ticket_object);
				}
			}

			return ticket_array;
		}

		else return [];
	}
})

Template.dashboard.events({
	'mouseover .ticket-button i' : function(element) {
		var owner_name = element.target.dataset.owner_name;
		var expiration_string = element.target.dataset.expiration_string;
		setFootnote("Visit gallery of " + owner_name + ". Expires " + expiration_string + ".", Math.floor(Math.random() * 100000));
	},

	'click #edit-fee' : function() {
		Modal.show('entryFeeModal');
	},

	'change #entry-fee' : function() {
		console.log($('#entry-fee').data().uiSlider.options.value);
	}
});

Template.dashboard.rendered = function() {
	$('#entry-fee').slider({
		'value': Meteor.user().profile.entry_fee,
		'max': 100000,
		'min': 0,
		'change': function(event, ui) {
			Meteor.call('updateEntryFee', ui.value - (ui.value % 1000), function(error) {
				if (error)
					console.log(error.message)
			});
		}
	});
}
