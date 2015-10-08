var setEstimatedValue = function(item_id) {
	Meteor.call('getItemValue', item_id, 'actual', function(error, result) {
		if (error)
			console.log(error.message);

		else Session.set(item_id + "_estimated_value", result);
	})
}

Template.inventory.helpers({
	'owned': function() {	
		var owned_items = items.find({'owner': Meteor.userId(), 'status': {$in : ['claimed', 'displayed', 'permanent']}}, {sort: {'aftwork_id' : 1}}).fetch();

		//create list object and add rarity_rank, feature_count, artist, title, date
		var display_objects = [];

		owned_items.forEach(function(db_object) {
			var artwork_object = artworks.findOne(db_object.artwork_id);
			var display_object = db_object;

			var rarity_rank;
			switch(artwork_object.rarity) {
				case "common": rarity_rank = 0; break;
				case "uncommon": rarity_rank = 1; break;
				case "rare": rarity_rank = 2; break;
				case "legendary": rarity_rank = 3; break;
				case "masterpiece": rarity_rank = 4; break;
				default: rarity_rank = 0; break;
			}

			display_object.rarity_rank = rarity_rank;
			display_object.feature_count = db_object.attributes.length;
			display_object.artist = artwork_object.artist;
			display_object.title = artwork_object.title;
			display_object.date = artwork_object.date;
			display_object.rarity = artwork_object.rarity;
			display_object.width = artwork_object.width;
			display_object.height = artwork_object.height;
			display_object.condition_text = Math.floor((db_object.condition * 100)) + '%';
			display_object.xp_rating_text = Math.floor(db_object.xp_rating * 100);

			setEstimatedValue(db_object._id);

			display_object.estimated_value = Session.get(db_object._id + "_estimated_value") ? Session.get(db_object._id + "_estimated_value") : 0;
			display_object.estimated_value_text = Session.get(db_object._id + "_estimated_value") ? getCommaSeparatedValue(Session.get(db_object._id + "_estimated_value")) : "0";

			display_objects.push(display_object);
		})

		display_objects.sort(function (a, b) {
			return Session.get('inventory_ascending') ? 
				a[Session.get('inventory_sort')] > b[Session.get('inventory_sort')]  : 
				a[Session.get('inventory_sort')]  < b[Session.get('inventory_sort')] ;
		});

		return display_objects;
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

	'permanent' : function(item_id) {
		return items.findOne(item_id).status == 'permanent';
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

	'can_display' : function(display_object) {
		if (Meteor.userId()) {
			return items.find({'owner' : Meteor.userId(), 'status' : 'displayed'}).count() < Meteor.user().profile.display_cap && 
				items.find({'owner' : Meteor.userId(), 'status' : 'displayed', 'artwork_id' : display_object.artwork_id}).count() == 0 &&
				display_object.status != 'permanent';
		}

		else return false;
	},

	'can_auction' : function(display_object) {
		if (Meteor.userId()) {
			return items.find({'owner' : Meteor.userId(), 'status' : 'auctioned'}).count() < Meteor.user().profile.auction_cap &&
				display_object.status != 'permanent';
		}

		else return false;
	},

	'can_reroll' : function(display_object) {
		return display_object.status != 'permanent';
	},

	'can_sell' : function(display_object) {
		return display_object.status != 'permanent';
	},

	'can_permanent' : function(display_object) {
		return items.find({'owner' : Meteor.userId(), 'status' : 'permanent'}).count() < Meteor.user().profile.pc_cap ||
			display_object.status == 'permanent';
	},

	'list_view' : function() {
		return Session.get('list_view');
	},

	'listHeader' : function() {
		var header_array = [
			{ 'text' : 'view', 'sort_id' : undefined },
			{ 'text' : 'title', 'sort_id' : 'title' },
			{ 'text' : 'date', 'sort_id' : 'date' },
			{ 'text' : 'artist', 'sort_id' : 'artist' },
			{ 'text' : 'rarity', 'sort_id' : 'rarity_rank' },
			{ 'text' : 'estimated value', 'sort_id' : 'estimated_value' },
			{ 'text' : 'dimensions', 'sort_id' : undefined },
			{ 'text' : 'condition', 'sort_id' : 'condition' },
			{ 'text' : 'features', 'sort_id' : 'feature_count' },
			{ 'text' : 'xp rating', 'sort_id' : 'xp_rating' },
			{ 'text' : 'reroll count', 'sort_id' : 'roll_count' },
			{ 'text' : 'actions', 'sort_id' : undefined },
		];

		return header_array;
	},

	'sortHeader' : function() {
		var header_array = [
			{ 'text' : 'title', 'sort_id' : 'title' },
			{ 'text' : 'date', 'sort_id' : 'date' },
			{ 'text' : 'artist', 'sort_id' : 'artist' },
			{ 'text' : 'rarity', 'sort_id' : 'rarity_rank' },
			{ 'text' : 'estimated value', 'sort_id' : 'estimated_value' },
			{ 'text' : 'condition', 'sort_id' : 'condition' },
			{ 'text' : 'features', 'sort_id' : 'feature_count' },
			{ 'text' : 'xp rating', 'sort_id' : 'xp_rating' },
		];

		return header_array;
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
	},

	'valueColor' : function(value) {
		return 255 - Math.floor(value * 255);
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
	},

	'click #toggle-view' : function() {
		Session.set('list_view', !Session.get('list_view'));
	},

	'click .preview.enabled' : function(element) {
		var item_id = $(element.target).closest('tr').data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('fullViewModal');
	},

	'click .reroll.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('rerollModal');
	},

	'click .perm-collection.inactive' : function(element) {
		var item_id = $(element.target).data('item_id');
		items.update(item_id, {$set: {'status' : 'permanent'}});
		items.update(item_id, {$set: {'permanent_post' : moment()._d.toISOString()}});
	},

	'click .perm-collection.active' : function(element) {
		var item_id = $(element.target).data('item_id');
		items.update(item_id, {$set: {'status' : 'claimed'}});
		items.update(item_id, {$unset: {'permanent_post' : ""}});
	}
})

Template.inventory.created = function() {
	Session.set('inventory_sort', 'title');
	Session.set('inventory_ascending', true);
	Session.set('list_view', false);
	this.handle = Meteor.setInterval((function() {
		var now = moment();
		Session.set('inventory_now', now.toISOString());
	}), 1000);
}

Template.inventory.destroyed = function() {
	Meteor.clearInterval(this.handle);
}

//	HEADERS
Template.inventoryHeaderTemplate.events({
	'click th': function(element) {
		var sort = $(element.target).closest('.table-header').data('sort');

		if (sort && Session.get('inventory_sort')) {
			var ascending = (Session.get('inventory_sort') != sort ? true : !Session.get('inventory_ascending'));
			Session.set('inventory_ascending', ascending);
			Session.set('inventory_sort', sort);
		}
	}
})

Template.inventoryHeaderTemplate.helpers({
	'sorted' : function() {
		var table_id = this.table_id;
		return {
			'sort' : Session.get('inventory_sort') == this.sort_id,
			'ascending' : Session.get('inventory_ascending')
		}
	}
})