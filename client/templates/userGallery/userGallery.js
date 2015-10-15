Template.userGallery.helpers({
	'displayed': function(screen_name) {
		Meteor.call('getUserGallery', screen_name, function(error, result) {
			if (error)
				console.log(error.message);

			else Session.set('user_gallery', result);
		});

		if (Session.get('user_gallery'))
			return Session.get('user_gallery');

		else return [];
	},

	'time_remaining': function(item_id) {
		var item_object = items.findOne(item_id);

		if (item_object.status == 'displayed') {
			var expiration = moment(item_object.display_details.end);
			var now = moment(Session.get('gallery_now'));
			var remaining = expiration - now;

			var remaining_text = remaining > 0 ? getCountdownString(remaining) : "expired";
			return remaining_text;
		}

		else return "";
	},

	'entryInfo' : function(screen_name) {
		//move to server-side
		if (Meteor.user()) {
			var user_object = Meteor.users.findOne({'profile.screen_name' : screen_name});
			var viewer_object = Meteor.user();
			var tickets_maxed = viewer_object.profile.tickets != undefined && Object.keys(viewer_object.profile.tickets).length >= viewer_object.profile.ticket_cap;
			var insufficient_funds = user_object.profile.entry_fee > viewer_object.profile.bank_balance;

			return {
				'paid' : viewer_object.profile.screen_name == screen_name || (viewer_object.profile.tickets != undefined && viewer_object.profile.tickets[user_object._id] != undefined),
				'pay_fee_enabled' : !insufficient_funds && !tickets_maxed,
				'entry_fee_text' : "$" + getCommaSeparatedValue(user_object.profile.entry_fee),
				'screen_name' : screen_name,
				'owner_id' : user_object._id
			}
		}

		else return {};
	},

	'npc' : function(owner_id) {
		var primary_attributes = attributes.find({'type' : "primary"}).fetch();
		var primary_ids = [];
		primary_attributes.forEach(function(db_object) {
			primary_ids.push(db_object._id);
		});

		return npcs.find({'owner_id' : owner_id, 'attribute_id' : {$in : primary_ids}});
	},

	'unmet' : function(npc_id) {
		return npcs.findOne(npc_id).players_met.indexOf(Meteor.userId()) == -1;
	}
})

Template.userGallery.events ({
	// 'click .quick-sell.enabled' : function(element) {
	// 	var item_id = $(element.target).data('item_id');
	// 	Session.set('selectedItem', item_id);
	// 	Modal.show('quickSellModal');
	// },

	// 'click .auction.enabled' : function(element) {
	// 	var item_id = $(element.target).data('item_id');
	// 	Session.set('selectedItem', item_id);
	// 	Modal.show('createAuctionModal');
	// },

	// 'click .display.enabled' : function(element, template) {
	// 	var item_id = $(element.target).data('item_id');
	// 	Session.set('selectedItem', item_id);
	// 	Modal.show('onDisplayModal');
	// }

	'click #enter-button' : function(element) {
		var owner_id = element.target.dataset.owner_id;
		Meteor.call('purchaseTicket', Meteor.userId(), owner_id, function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click .npc.enabled' : function(element) {
		var npc_id = element.target.dataset.npc_id;
		Meteor.call('interactWithNPC', npc_id, function(error, interaction_object) {
			if (error)
				console.log(error.message);

			else {
				Session.set('npc_interaction', interaction_object);
				Modal.show("standardNPCMessageModal");
			}
		})
	}
})

Template.userGallery.created = function() {
	this.handle = Meteor.setInterval((function() {
		var now = moment();
		Session.set('gallery_now', now.toISOString());
	}), 1000);
}

Template.userGallery.destroyed = function() {
	Meteor.clearInterval(this.handle);
}