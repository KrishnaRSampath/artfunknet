var drop_count = 6;

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

		Meteor.call('giveDailyDrop', function(error, returned_rarity) {
			if (error)
				console.log(error.message);

			else {
				Session.set('rolledQuality', returned_rarity);

				setTimeout(function() {
					Modal.hide("dropAnimationModal");		
				}, 3000);
			}
		})

	},

	'crateQuality' : function() {
		return Session.get('rolledQuality');
	}
})

Template.dropAnimationModal.rendered = function() {
	$('.pick-section').show();
	$('.reward').hide();

	this.handle = Meteor.setInterval((function() {
		var possible_qualities = [
			'bronze', 'bronze', 'bronze', 'bronze',  'bronze',
			'silver', 'silver', 'silver', 'silver',
			'gold', 'gold', 'gold', 
			'platinum', 'platinum', 
			//'diamond'
		];

		Session.set('lotteryQuality', possible_qualities[Math.floor(Math.random() * possible_qualities.length)]);
	}), 100);
}

Template.dropAnimationModal.destroyed = function() {
	Meteor.clearInterval(this.handle);
}