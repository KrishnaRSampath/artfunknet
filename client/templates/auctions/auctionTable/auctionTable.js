//	HEADERS
Template.headerTemplate.events({
	'click th': function(element) {
		var sort = $(element.target).closest('.table-header').data('sort');
		var table_id = $(element.target).closest('.auction-table').data('table_id');

		if (sort && Session.get(table_id + '_sort')) {
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
			{ 'text' : 'date', 'sort_id' : 'date', 'table_id' : table_data.table_id  },
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
			list_object.owned = items.find({'owner': Meteor.userId(), '_id': item_object._id}).count() > 0;

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
				'filename' : artwork_object.filename,
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
	}
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