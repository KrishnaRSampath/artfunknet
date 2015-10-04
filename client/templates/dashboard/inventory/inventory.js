Template.inventory.helpers({
	'owned': function() {	
		return items.find({'owner': Meteor.userId(), 'status': {$in : ['claimed', 'displayed']}}, {sort: {'aftwork_id' : 1}}).fetch();
	},

	'sellValue' : function(item_id) {
		if (Session.get(item_id + 'sellValue'))
			return '$' + getCommaSeparatedValue(Session.get(item_id + 'sellValue'));

		else {
			Meteor.call('getItemValue', item_id, 'sell', function(error, result) {
				Session.set(item_id + 'sellValue', result);
			})
		}
	},

	'onDisplay' : function(item_id) {
		if (items.findOne(item_id))
			return items.findOne(item_id).status == 'displayed';

		else return false;
	},

	'time_remaining': function(item_id) {
		var item_object = items.findOne(item_id);

		if (item_object.status == 'displayed') {
			var expiration = moment(item_object.display_details.end);
			var now = moment(Session.get('inventory_now'));
			var remaining = expiration - now;

			var remaining_text = remaining > 0 ? getCountdownString(remaining) : "expired";
			return remaining_text;
		}

		else return "";
	},

	'can_display' : function() {
		if (Meteor.userId())
			return items.find({'owner' : Meteor.userId(), 'status' : 'displayed'}).count() < Meteor.user().profile.display_cap;

		else return false;
	},

	'can_auction' : function() {
		if (Meteor.userId())
			return items.find({'owner' : Meteor.userId(), 'status' : 'auctioned'}).count() < Meteor.user().profile.auction_cap;

		else return false;
	}
})

Template.inventory.events ({
	'click .quick-sell.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('quickSellModal');
	},

	'click .auction.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('createAuctionModal');
	},

	'click .display.enabled' : function(element, template) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('onDisplayModal');
	}
})

Template.inventory.created = function() {
	this.handle = Meteor.setInterval((function() {
		var now = moment();
		Session.set('inventory_now', now.toISOString());
	}), 1000);
}

Template.inventory.destroyed = function() {
	Meteor.clearInterval(this.handle);
}