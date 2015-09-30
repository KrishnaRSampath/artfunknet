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