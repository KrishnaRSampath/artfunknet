var drop_count = 6;
var drop_frequency = 10800000; //once every 3 hours

dailyDropIsEnabled = function() {
	if (Meteor.user()) {
		var last_drop = Meteor.user().profile.last_drop;
		return (moment() - moment(last_drop) > drop_frequency);
	}

	else return false;
}

inventoryIsFull = function() {
	return items.find({'owner': Meteor.userId(), 'status' : {$in: ['claimed', 'displayed', 'auctioned']}}).count() >= Meteor.user().profile.inventory_cap;
}

canDisplay = function() {
	items.find({'owner' : Meteor.userId(), 'status' : "displayed"}).count() < Meteor.user().profile.display_cap;
}

canAuction = function() {
	items.find({'owner' : Meteor.userId(), 'status' : "auctioned"}).count() < Meteor.user().profile.auction_cap;
}

canAddPermanent = function() {
	items.find({'owner' : Meteor.userId(), 'status' : "permanent"}).count() < Meteor.user().profile.pc_cap;
}

canRerollItem = function(item_id) {
	return getRerollCost(item_id) <= Meteor.user().profile.bank_balance;
}