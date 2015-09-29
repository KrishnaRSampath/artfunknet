Template.auctions.helpers({
	'auctionData' : function() {
		var table_id = "main_auctions";

		var sort_query = {};

		if (Session.get(table_id + '_sort')) {
			var asc = (Session.get(table_id + '_ascending') ? 1 : -1);
		    sort_query[Session.get(table_id + '_sort')] = asc;
		}

		var auction_array = auctions.find({}, {sort: sort_query}).fetch();

		return {
			'auction' : auction_array,
			'table_id' : table_id
		}
	},
});

Template.auctions.rendered = function() {
	Session.set('main_auctions_ascending', true);
	Session.set('main_auctions_sort', "expiration_date");
}