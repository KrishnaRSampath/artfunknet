Template.dashboard.helpers({
	'userData' : function() {
		return Meteor.user();
	},

	'bank_balance' : function() {
		return getCommaSeparatedValue(Meteor.user().profile.bank_balance);
	}
})