//	HEADERS
Template.headerTemplate.events({
	'click th': function(element, template) {
		var sort = $(element.target).closest('.table-header').data('sort');
		var table_id = $(element.target).closest('.auction-table').data('table_id');

		if (sort != undefined) {
			var ascending = (Session.get(table_id + '_sort') != sort ? true : !Session.get(table_id + '_ascending'));
			Session.set(table_id + '_ascending', ascending);
			Session.set(table_id + '_sort', sort);
		}
	}
})

Template.headerTemplate.helpers({
	'sorted' : function() {
		var table_id = this.table_id;
		return {
			'sort' : Session.get(table_id + '_sort') == this.sort_id,
			'ascending' : Session.get(table_id + '_ascending')
		}
	}
})

//	AUCTION TABLE
Template.auctionTable.helpers({
	'header' : function(table_data) {
		var header_array = [
			{ 'text' : 'view', 'sort_id' : undefined, 'table_id' : table_data.table_id  },
			{ 'text' : 'remaining', 'sort_id' : 'expiration_date', 'table_id' : table_data.table_id  },
			{ 'text' : 'title', 'sort_id' : 'title', 'table_id' : table_data.table_id  },
			{ 'text' : 'date', 'sort_id' : undefined, 'table_id' : table_data.table_id  },
			{ 'text' : 'artist', 'sort_id' : 'artist', 'table_id' : table_data.table_id  },
			{ 'text' : 'rarity', 'sort_id' : 'rarity', 'table_id' : table_data.table_id  },
			{ 'text' : 'dimensions', 'sort_id' : undefined, 'table_id' : table_data.table_id  },
			{ 'text' : 'condition', 'sort_id' : 'condition', 'table_id' : table_data.table_id  },
			{ 'text' : 'attributes', 'sort_id' : undefined, 'table_id' : table_data.table_id  },
			{ 'text' : 'current bid', 'sort_id' : 'current_price', 'table_id' : table_data.table_id  },
			{ 'text' : 'buy now', 'sort_id' : 'buy_now', 'table_id' : table_data.table_id  },
			{ 'text' : 'actions', 'sort_id' : undefined, 'table_id' : table_data.table_id  },
			{ 'text' : 'seller', 'sort_id' : 'seller', 'table_id' : table_data.table_id }
		];

		return header_array;
	},

	'time_remaining': function(expiration_date) {
		var expiration = moment(expiration_date);
		var now = moment(Session.get('now'));
		var remaining = expiration - now;

		var remaining_text = remaining > 0 ? getCountdownString(remaining) : "expired";

		return {
			'remaining': remaining_text,
			'soon' : remaining < 10000
		}
	},

	'current_bid' : function(auction_id) {
		var auction_object = auctions.findOne(auction_id);
		if (auction_object)
			return "$" + getCommaSeparatedValue(auction_object.current_price);

		else return "";
	},

	'auction_info' : function(auction_object) {
		try {
			var item_object = items.findOne({'_id': auction_object.item_id});
			//retrieve artwork data to use as a foundation for the list object
			var list_object = artworks.findOne({'_id': item_object.artwork_id});
			var bids = auction_object.bid_history.length;
			var winning_id = (bids > 0 ? auction_object.bid_history[bids - 1].user_id : undefined);
			var has_bid = false;

			for (var n=0; n < auction_object.bid_history.length; n++) {
				if (auction_object.bid_history[n].user_id == Meteor.userId()) {
					has_bid = true;
					break;
				}
			}

			list_object.condition = Math.floor((item_object.condition * 100)) + '%';
			list_object.attributes = item_object.attributes;
			list_object.auction_id = auction_object._id;
			list_object.biddable = Meteor.userId() && (item_object.owner != Meteor.userId()) && (auction_object.bid_minimum <= Meteor.user().profile.bank_balance);
			list_object.expiration = auction_object.expiration_date;
			list_object.buy_now = auction_object.buy_now == -1 ? "-" : "$" + getCommaSeparatedValue(auction_object.buy_now),
			list_object.history = auction_object.bid_history.length > 0;
			list_object.winning = (winning_id == Meteor.userId()) && Meteor.userId();
			list_object.losing = (winning_id != Meteor.userId() && winning_id && has_bid);
			list_object.seller = auction_object.seller;
			list_object.item_id = item_object._id;

			return list_object;
		}

		catch(error) {
			console.log(error.message);
			return {};
		}
	},

	'thumbnailInfo' : function(item_id) {
		try {
			var item_object = items.findOne(item_id);
			var artwork_object = artworks.findOne(item_object.artwork_id);
			var auction_object = auctions.findOne({'item_id' : item_id}); 
			var biddable = (item_object.owner != Meteor.userId()) && (auction_object.bid_minimum <= Meteor.user().profile.bank_balance);

			var max_dimension = 40;

			var width = artwork_object.width;
			var height = artwork_object.height;
			var ratio = width / height;

			var info_object = {
				'image_width' : 0,
				'image_height' : 0,
				'biddable' : biddable,
				'imageURL' : artwork_object.img_link == "" ? "http://go-grafix.com/data/wallpapers/35/painting-626297-1920x1080-hq-dsk-wallpapers.jpg" : artwork_object.img_link
			};

			if (width > height) {
				info_object.image_width = max_dimension;
				info_object.image_height = Math.floor(max_dimension / ratio);
			}

			else {
				info_object.image_height = max_dimension;
				info_object.image_width = Math.floor(max_dimension * ratio);
			}

			return info_object;
		}

		catch(error) {
			console.log(error.message);
			return {
				'image_width' : 0,
				'image_height' : 0,
				'biddable' : false,
				'filename' : ""
			};
		}
	},
});

Template.auctionTable.events({
	'click .place-bid.enabled' : function(element) {
		var auction_id = $(element.target).closest('tr').data('auction_id');
		Session.set('selectedAuction', auction_id);
		Modal.show('placeBidModal');
	},

	'click .view-history.enabled' : function(element) {
		var auction_id = $(element.target).closest('tr').data('auction_id');
		Session.set('selectedAuction', auction_id);
		Modal.show('auctionHistoryModal');
	},

	'click .preview.enabled' : function(element) {
		var auction_id = $(element.target).closest('tr').data('auction_id');
		Session.set('selectedAuction', auction_id);
		Modal.show('previewModal');
	},
})

Template.auctionTable.created = function() {
	this.handle = Meteor.setInterval((function() {
		var now = moment();
		Session.set('now', now.toISOString());
	}), 1000);
}

Template.auctionTable.destroyed = function() {
	Meteor.clearInterval(this.handle);
}


//	PLACE BID MODAL
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
		return !!auction_object && auction_object.buy_now != -1;
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
    	var bid_amount = template.find('#bid-amount').value;
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

Template.auctionHistoryModal.helpers({
	'history' : function() {
		var auction_object = auctions.findOne(Session.get('selectedAuction'));
		var history_array = [];
		if (!!auction_object) {
			for (var i=0; i < auction_object.bid_history.length; i++) {
				var history_object = {
					'amount': "$" + getCommaSeparatedValue(auction_object.bid_history[i].amount),
					'date' : getTimeString(moment(auction_object.bid_history[i].date)),
					'even' : i % 2 == 0
				}

				history_array.push(history_object);
			}
		}

		return history_array;
	},

	'auctionData' : function() {
		var auction_object = auctions.findOne(Session.get('selectedAuction'));
		if (!!auction_object) {
			return {
				'title' : auction_object.title,
				'artist' : auction_object.artist,
			}
		}

		else return {
			'title' : "",
			'artist' : "",
		}
	},
})

//	PREVIEW MODAL
Template.previewModal.helpers({
	'itemId' : function() {
		if (Session.get('selectedAuction')) {
			var auction_object = auctions.findOne(Session.get('selectedAuction'));
			return auction_object.item_id;
		}

		else return "";
	},

	'auctionData' : function() {
		var auction_object = auctions.findOne(Session.get('selectedAuction'));
		if (!!auction_object) {
			return {
				'title' : auction_object.title,
				'artist' : auction_object.artist,
			}
		}

		else return {
			'title' : "",
			'artist' : "",
		}
	},

	'imageInfo' : function(item_id) {
		try {
			var item_object = items.findOne(item_id);
			var artwork_object = artworks.findOne(item_object.artwork_id);
			var auction_object = auctions.findOne(Session.get('selectedAuction')); 
			var biddable = (item_object.owner != Meteor.userId()) && (auction_object.bid_minimum <= Meteor.user().profile.bank_balance);

			var max_dimension = 400;

			var width = artwork_object.width;
			var height = artwork_object.height;
			var ratio = width / height;

			var info_object = {
				'image_width' : 0,
				'image_height' : 0,
				'biddable' : biddable,
				'imageURL' : artwork_object.img_link == "" ? "http://go-grafix.com/data/wallpapers/35/painting-626297-1920x1080-hq-dsk-wallpapers.jpg" : artwork_object.img_link
			};

			if (width > height) {
				info_object.image_width = max_dimension;
				info_object.image_height = Math.floor(max_dimension / ratio);
			}

			else {
				info_object.image_height = max_dimension;
				info_object.image_width = Math.floor(max_dimension * ratio);
			}

			return info_object;
		}

		catch(error) {
			console.log(error.message);
			return {
				'image_width' : 0,
				'image_height' : 0,
				'biddable' : false,
				'filename' : ""
			};
		}
	},
})

Template.previewModal.events({
	'click #close-button' : function() {
		Modal.hide('previewModal');
	},

	'click #place-bid' : function() {
		Modal.hide('previewModal');

		setTimeout(function() {
			Modal.show('placeBidModal');
		}, 500);
	}
})