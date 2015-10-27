var drop_count = 6;
// var drop_frequency = 86400000 //once per day
//var drop_frequency = 60000 //once per minute
//var drop_frequency = 3600000 //once per hour
//var drop_frequency = 7200000 //once every 2 hours
var drop_frequency = 10800000 //once every 3 hours
// var drop_frequency = 1000 //once per second

Template.randomDrop.helpers({
	'drop': function() {
		return items.find({'owner': Meteor.userId(), 'status': 'unclaimed'}).fetch();
	},

	'dailyDropEnabled' : function() {
		if (Meteor.user()) {
			var last_drop = Meteor.user().profile.last_drop;
			return (moment(Session.get('now')) - moment(last_drop) > drop_frequency);
		}

		else return false;
	},

	'dailyDropText' : function(enabled) {
		if (enabled)
			return "get daily drop!";

		else if (Meteor.user()) {
			var last_drop = Meteor.user().profile.last_drop;
			var remaining = drop_frequency - (moment(Session.get('now'))  - moment(last_drop));
			return getCountdownString(remaining);
		}
	},

	'full' : function() {
		if (Meteor.userId() && Meteor.user())
			return items.find({'owner' : Meteor.userId(), 'status' : {$nin : ['unclaimed', 'for_sale']}}).count() >= Meteor.user().profile.inventory_cap;

		else return false;
	}
})

Template.randomDrop.events ({
	'click #drop-button.enabled' :function() {
		Modal.show("dropAnimationModal");
	},

	'click .add-to-inventory.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Meteor.call('claimArtwork', item_id, function(error) {
			if (error)
				console.log(error.message);
		});
	},

	'click .quick-sell' : function(element) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('quickSellModal');
	},

	'mouseover .quick-sell' : function(event) {
		var enabled = $(event.target).hasClass("enabled");
		var footnote_string = "sell artwork" + (enabled ? "" : " (unavailable)");
		setFootnote(footnote_string, Math.floor(Math.random() * 100000));
	},

	'mouseover .add-to-inventory' : function(event) {
		var enabled = $(event.target).hasClass("enabled");
		var footnote_string = "add to inventory" + (enabled ? "" : " (unavailable)");
		setFootnote(footnote_string, Math.floor(Math.random() * 100000));
	},
})

Template.randomDrop.rendered = function() {
	this.handle = Meteor.setInterval((function() {
		Session.set('now', moment().toISOString());
	}), 1000);
};

Template.randomDrop.destroyed = function() {
	Meteor.clearInterval(this.handle);
};
