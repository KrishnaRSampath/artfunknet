var drop_count = 10;

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