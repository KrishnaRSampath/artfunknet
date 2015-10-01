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