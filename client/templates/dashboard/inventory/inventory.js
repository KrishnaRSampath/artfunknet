Template.inventory.helpers({
	'owned': function() {
		return items.find({'owner': Meteor.userId(), 'status': {$in : ['claimed', 'displayed']}});
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
		return items.findOne(item_id).status == 'displayed';
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
})

Template.inventory.events ({
	'click .quick-sell.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Meteor.call('sellArtwork', Meteor.userId(), item_id, function(error) {
			if (error)
				console.log(error.message);
		});
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

Template.createAuctionModal.rendered = function() {
	Session.set('createAuctionErrors', []);
	Session.set('auctionMin', false);
	Meteor.call('getItemValue', Session.get('selectedItem'), 'auction_min', function(error, result) {
		if (error)
			console.log(error.message);

		else Session.set('auctionMin', result);
	});
}

Template.createAuctionModal.events ({
	'click #ok-modal': function(element, template) {
		if (Session.get('auctionMin')) {
			var errors = [];
			var item_id = Session.get('selectedItem');
			var starting = template.find('#starting-amount').value;
			var buy_now = template.find('#buy-now-amount').value;
			var duration = template.find('#duration').value;

			if (isNaN(starting))
				errors.push("invalid starting value");

			if (isNaN(buy_now) && buy_now != "")
				errors.push("invalid buy now value");

			if (duration == "default")
				errors.push("invalid duration");

			if (items.findOne(item_id) == undefined)
				errors.push("invalid item");

			else {
				var item_object = items.findOne(item_id);
				var minimum = Session.get('auctionMin');
				if (Number(starting) < minimum)
					errors.push("starting value must be greater than $" + getCommaSeparatedValue(minimum));

				if (buy_now != "" && Number(buy_now) < minimum )
					errors.push("buy now value must be greater than $" + getCommaSeparatedValue(minimum));
			}

			if (errors.length > 0) {
	    		Session.set('createAuctionErrors', errors);
	    		$('.errors').show();
	    	}

			else {
				if (buy_now == "")
					buy_now = -1;

		    	Meteor.call('auctionArtwork', Meteor.userId(), item_id, Number(starting), Number(buy_now), duration, function(error) {
					if (error)
						console.log(error.message);

					else Modal.hide("createAuctionModal");
				});
				Session.set('createAuctionErrors', []);
	    		$('.errors').hide();
		    }
		}
    },

    'click #cancel-modal' : function(event, template) {
    	Modal.hide("createAuctionModal");
    },
})

Template.createAuctionModal.helpers({
	'itemData' : function() {
		var item_object = items.findOne(Session.get('selectedItem'));
		if (!!item_object) {
			var artwork_object = artworks.findOne(item_object.artwork_id);
			return {
				'title' : artwork_object.title,
				'artist' : artwork_object.artist,
				'minimum' : getCommaSeparatedValue(Session.get('auctionMin')),
			}
		}

		else return {
			'title' : "",
			'artist' : "",
			'minimum' : "",
			'buy_now' : "",
			'balance' : ""
		}
	},

	'error' : function() {
		return Session.get('createAuctionErrors');
	}
})

Template.onDisplayModal.events ({
	'click #ok-modal': function(event, template) {
		var errors = [];

		if (Session.get('display_duration') == 'default') {
			errors.push('invalid duration');
		}

		if (errors.length > 0) {
    		Session.set('onDisplayErrors', errors);
    		$('.errors').show();
    	}

		else {
			Meteor.call('displayArtwork', Meteor.userId(), Session.get('selectedItem'), Session.get('display_duration'), function(error) {
				if (error)
					console.log(error.message);

				else Modal.hide("onDisplayModal");
			});
			Session.set('onDisplayErrors', []);
    		$('.errors').hide();
	    }

    },

    'click #cancel-modal' : function(event, template) {
    	Modal.hide("onDisplayModal");
    },

    'change #duration' : function(event) {
    	Session.set('display_duration', event.target.value);
    	Meteor.call('getDisplayDetails', Session.get('selectedItem'), event.target.value, function(error, result) {
    		if (error)
    			console.log(error.message);

    		else Session.set('display_details', result);
    	})
    }
})

Template.onDisplayModal.helpers({
	'itemData' : function() {
		var item_object = items.findOne(Session.get('selectedItem'));
		if (!!item_object) {
			var artwork_object = artworks.findOne(item_object.artwork_id);
			return {
				'title' : artwork_object.title,
				'artist' : artwork_object.artist
			}
		}

		else return {
			'title' : "",
			'artist' : "",
		}
	},

	'error' : function() {
		return Session.get('onDisplayErrors');
	},

	'displayDetails' : function() {
		if (Session.get('display_duration') && Session.get('display_duration') != 'default' && Session.get('display_details')) {
			var details = {
				'money' : "$" + getCommaSeparatedValue(Session.get('display_details').money),
				'xp' : Session.get('display_details').xp,
				'end' : getTimeString(moment(Session.get('display_details').end)),
			}

			return details;
		}

		else return {
			'money' : '-',
			'xp' : '-',
			'end' : "-"
		}
	}
})

Template.onDisplayModal.rendered = function() {
	Session.set('display_duration', 'default');
	Session.set('onDisplayErrors', []);
};