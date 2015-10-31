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
	return items.find({'owner': Meteor.userId(), 'status' : {$in: ['claimed', 'displayed', 'auctioned', 'permanent']}}).count() >= Meteor.user().profile.inventory_cap;
}

itemIsOwnedAndClaimed = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var claimed_status = item_object && item_object.status == "claimed";

	return owned && claimed_status ? item_object : undefined;
}

canDisplayItem = function(item_id) {
	var item_object = itemIsOwnedAndClaimed(item_id);
	var can_display = items.find({'owner' : Meteor.userId(), 'status' : "displayed"}).count() < Meteor.user().profile.display_cap;
	return can_display ? item_object : undefined;
}

canAuctionItem = function(item_id) {
	var item_object = itemIsOwnedAndClaimed(item_id);
	var can_auction = items.find({'owner' : Meteor.userId(), 'status' : "auctioned"}).count() < Meteor.user().profile.auction_cap;
	return can_auction ? item_object : undefined; 
}

canSetPermanent = function(item_id) {
	var item_object = itemIsOwnedAndClaimed(item_id);
	var under_cap = items.find({'owner' : Meteor.userId(), 'status' : "permanent"}).count() < Meteor.user().profile.pc_cap;
	return under_cap ? item_object : undefined;
}

canUnsetPermanent = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = item_object && item_object.owner == Meteor.userId();
	return owned ? item_object : undefined;
}

canRerollItem = function(item_id) {
	var item_object = itemIsOwnedAndClaimed(item_id);
	var can_afford = getRerollCost(item_id) <= Meteor.user().profile.bank_balance;
	return can_afford ? item_object : undefined;
}

canSellItem = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var status_ok = item_object && (item_object.status == "claimed" || item_object.status == "unclaimed");
	return owned && status_ok ? item_object : undefined;
}

canClaimItem = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var status_ok = item_object && item_object.status == "unclaimed";
	var not_full = !inventoryIsFull();
	return owned && status_ok && not_full ? item_object : undefined;
}

canDeclineItem = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var status_ok = item_object && item_object.status == "for_sale";
	return owned && status_ok ? item_object : undefined;
}

canPurchaseItemFromDealer = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var status_ok = item_object && item_object.status == "for_sale";
	var can_afford = Meteor.userId() && getItemValue(item_id, "dealer") <= Meteor.user().profile.bank_balance;
	var not_full = !inventoryIsFull();
	return owned && status_ok && can_afford && not_full ? item_object : undefined;
}

canSellToCollector = function(item_id) {
	var item_object = items.findOne(item_id);
	var owned = Meteor.userId() && item_object && item_object.owner == Meteor.userId();
	var status_ok = item_object && (item_object.status == "claimed" || item_object.status == "permanent");
	return owned && status_ok ? item_object : undefined;
}