var drop_count = 10;
// var drop_frequency = 86400000 //once per day
// var drop_frequency = 60000 //once per minute
//var drop_frequency = 3600000 //once per hour
var drop_frequency = 7200000 //once every 2 hours

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
		return ["bronze", "silver", "gold", "platinum", "diamond"];
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
	}
})

Template.randomDrop.events ({
	'click #drop-button.enabled' :function() {
		Modal.show("dropAnimationModal");
		var now = moment().toISOString();
		Meteor.users.update(Meteor.userId(), {$set: {'profile.last_drop' : now}});
	},

	'click .crate-button.enabled' : function(element) {
		var quality = $(element.target).data('button_quality');
		console.log(quality);
		Meteor.call('openCrate', Meteor.userId(), quality, drop_count, function(error, result) {
			if (error)
				console.log(error.message);
		})
	},

	'click .add-to-inventory' : function(element) {
		var item_id = $(element.target).data('item_id');
		Meteor.call('claimArtwork', Meteor.userId(), item_id, function(error) {
			if (error)
				console.log(error.message);
		});
	}, 

	'click .quick-sell' : function(element) {
		var item_id = $(element.target).data('item_id');
		Meteor.call('sellArtwork', Meteor.userId(), item_id, function(error) {
			if (error)
				console.log(error.message);
		});
	}
})

Template.randomDrop.rendered = function() {
	this.handle = Meteor.setInterval((function() {
		Session.set('now', moment().toISOString());
	}), 1000);
};

Template.randomDrop.destroyed = function() {
	Meteor.call('clearUnclaimed', Meteor.userId());
	Meteor.clearInterval(this.handle);
};

window.onbeforeunload = function(e) {
	Meteor.call('clearUnclaimed', Meteor.userId());
};

Template.dropAnimationModal.helpers({
	'quality' : function() {
		return Session.get('lotteryQuality');
	},

	'crateQuality' : function() {
		return Session.get('rolledQuality');
	}
})

Template.dropAnimationModal.events({
	'click #stop-button' : function() {
		$('.reward').show();
		$('.pick-section').hide();

		setTimeout(function() {
			Modal.hide("dropAnimationModal");

			Meteor.call('generateItems', Meteor.userId(), Session.get('rolledQuality'), drop_count, function(error, result) {
				if (error)
					console.log(error.message);
			})
		}, 3000);
	},

	'crateQuality' : function() {
		return Session.get('rolledQuality') ? Session.get('rolledQuality') : "";
	}
})

Template.dropAnimationModal.rendered = function() {
	$('.pick-section').show();
	$('.reward').hide();

	Meteor.call('getCrateQuality', function(error, result) {
		if (error)
			console.log(error.message);

		else Session.set('rolledQuality', result);
	});

	this.handle = Meteor.setInterval((function() {
		var possible_qualities = [
			'bronze', 'bronze', 'bronze', 'bronze',  'bronze',
			'silver', 'silver', 'silver', 'silver',
			'gold', 'gold', 'gold', 
			'platinum', 'platinum', 
			'diamond'
		];

		Session.set('lotteryQuality', possible_qualities[Math.floor(Math.random() * possible_qualities.length)]);
	}), 100);
}

Template.dropAnimationModal.destroyed = function() {
	Meteor.clearInterval(this.handle);
}