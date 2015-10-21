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
			var starting = getAmountFromInput(template.find('#starting-amount').value);
			var buy_now = getAmountFromInput(template.find('#buy-now-amount').value);
			var duration = template.find('#duration').value;
			var item_object = items.findOne(item_id);

			if (isNaN(starting))
				errors.push("invalid starting value");

			if (isNaN(buy_now) && buy_now != "")
				errors.push("invalid buy now value");

			if (duration == "default")
				errors.push("invalid duration");

			if (items.findOne(item_id) == undefined)
				errors.push("invalid item");

			else {
				if (items.find({'owner' : Meteor.userId(), 'status' : 'auctioned'}).count() >= Meteor.user().profile.auction_cap ||
					item_object.status == 'permanent')
					errors.push("invalid command");
			
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

		    	Meteor.call('auctionArtwork', item_id, Number(starting), Number(buy_now), duration, function(error) {
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