Template.placeBidModal.rendered = function() {
	$('.errors').hide();
}

Template.placeBidModal.helpers({
	'auctionData' : function() {
		var auction_object = auctions.findOne(Session.get('selectedAuction'));
		if (!!auction_object) {
			return {
				'title' : auction_object.title,
				'artist' : auction_object.artist,
				'minimum' : getCommaSeparatedValue(auction_object.bid_minimum),
				'buy_now' : getCommaSeparatedValue(auction_object.buy_now),
				'balance' : getCommaSeparatedValue(Meteor.user().profile.bank_balance.toString())
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
		return Session.get('placeBidErrors');
	},

	'canBuy' : function() {
		var auction_object = auctions.findOne(Session.get('selectedAuction'));
		return !!auction_object && auction_object.buy_now != -1 && Meteor.user().profile.bank_balance >= auction_object.buy_now;
	}
})

Template.placeBidModal.events({
    "click #cancel-modal": function(event, template){
    	//event.preventDefault();
    	Session.set('selectedAuction', undefined);
        Modal.hide('placeBidModal');
        Session.set('placeBidErrors', []);
    },

    'click #ok-modal': function(event, template) {
    	//event.preventDefault();
    	var errors = [];
    	var auction_object = auctions.findOne(Session.get('selectedAuction'));
    	var bid_amount = getAmountFromInput(template.find('#bid-amount').value);
        
    	if (! !!auction_object) 
    		errors.push("auction not found");

    	if (bid_amount < auction_object.bid_minimum)
    		errors.push("bid must be at least $" + getCommaSeparatedValue(auction_object.bid_minimum));

    	if (bid_amount > Meteor.user().profile.bank_balance)
    		errors.push("bid amount exceeds available funds");

    	if (errors.length > 0) {
    		Session.set('placeBidErrors', errors);
    		$('.errors').show();
    	}

    	else {
    		Meteor.call('placeBid', Meteor.userId(), auction_object._id, bid_amount, function(error) {
    			if (error)
    				console.log(error.message);
    		});

    		Session.set('placeBidErrors', []);
    		$('.errors').hide();
	    	Modal.hide('placeBidModal');
	    }
    },

    'click #bid-minimum' : function(event, template) {
    	var auction_object = auctions.findOne(Session.get('selectedAuction'));
    	if (! !!auction_object) 
    		Session.set('placeBidError', "auction not found")

    	if (Session.get('placeBidError'))
    		$('.errors').show();

    	else {
    		Meteor.call('placeBid', Meteor.userId(), auction_object._id, auction_object.bid_minimum, function(error) {
    			if (error)
    				console.log(error.message);
    		});

    		$('.errors').hide();
	    	Modal.hide('placeBidModal');
	    }
    },

    'click #buy-now' : function(event, template) {
    	var auction_object = auctions.findOne(Session.get('selectedAuction'));
    	if (! !!auction_object) 
    		Session.set('placeBidError', "auction not found")

    	if (Session.get('placeBidError'))
    		$('.errors').show();

    	else {
    		Meteor.call('placeBid', Meteor.userId(), auction_object._id, auction_object.buy_now, function(error) {
    			if (error)
    				console.log(error.message);
    		});

    		$('.errors').hide();
	    	Modal.hide('placeBidModal');
	    }
    },
})