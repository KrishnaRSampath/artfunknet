var leaderboard_data = undefined;

var leaderboard_data_tracker = new Tracker.Dependency;

var setLeaderboardData = function() {
	Meteor.call('getLeaderboardData', function(error, result) {
		if (error)
			console.log(error.message);

		else {
			leaderboard_data = result;
			leaderboard_data_tracker.changed();
		}
	})
}

Template.leaderboard.helpers({
	'leaderboard_data': function() {
		leaderboard_data_tracker.depend();
		if (leaderboard_data == undefined) {
			setLeaderboardData();
		}

		else return leaderboard_data;
	},

	'rank' : function(index) {
		return index + 1;
	}
})

Template.leaderboard.rendered = function() {
	setLeaderboardData();
}