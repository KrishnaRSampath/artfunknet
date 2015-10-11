var drop_count = 10;
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

	'quality' : function() {
		return ["bronze", "silver", "gold", "platinum"];
		//return ["bronze", "silver", "gold", "platinum", "diamond"];
	},

	'dropButton' : function(quality) {
		Meteor.call('lookupCrateCost', quality, drop_count, function(error, result) {
			if (error)
				console.log(error.message);

			else Session.set(quality + 'Cost', Math.floor(result))
		})

		if (Session.get(quality + 'Cost') && Meteor.user()) {
			return {
				'buttonQuality' : quality,
				'crateCost' : "$" + getCommaSeparatedValue(Session.get(quality + 'Cost')),
				'enabled' : Meteor.user().profile.bank_balance >= Session.get(quality + 'Cost')
			}
		}

		else return {
			'buttonQuality' : quality,
			'crateCost' : "",
			'enabled' : false
		}
	},

	'full' : function() {
		if (Meteor.userId() && Meteor.user())
			return items.find({'owner' : Meteor.userId(), 'status' : {$ne : 'unclaimed'}}).count() >= Meteor.user().profile.inventory_cap;

		else return false;
	},

	'bank_balance' : function() {
		if (Meteor.userId() && Meteor.user())
			return getCommaSeparatedValue(Meteor.user().profile.bank_balance);

		else return 0;
	}
})

Template.randomDrop.events ({
	'click #drop-button.enabled' :function() {
		Modal.show("dropAnimationModal");
		// var now = moment().toISOString();
		// Meteor.users.update(Meteor.userId(), {$set: {'profile.last_drop' : now}});
	},

	'click .crate-button.enabled' : function(element) {
		var quality = $(element.target).data('button_quality');
		Meteor.call('openCrate', Meteor.userId(), quality, drop_count, function(error, result) {
			if (error)
				console.log(error.message);
		})
	},

	'click .add-to-inventory.enabled' : function(element) {
		var item_id = $(element.target).data('item_id');
		Meteor.call('claimArtwork', Meteor.userId(), item_id, function(error) {
			if (error)
				console.log(error.message);
		});
	},

	'click .quick-sell' : function(element) {
		var item_id = $(element.target).data('item_id');
		Session.set('selectedItem', item_id);
		Modal.show('quickSellModal');
	}
})

Template.randomDrop.rendered = function() {
	this.handle = Meteor.setInterval((function() {
		Session.set('now', moment().toISOString());
	}), 1000);
};

Template.randomDrop.destroyed = function() {
	//Meteor.call('clearUnclaimed', Meteor.userId());
	Meteor.clearInterval(this.handle);
};
