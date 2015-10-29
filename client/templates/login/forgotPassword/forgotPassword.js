Template.forgotPassword.events({
	'click #send-reset': function(event, template) {
		var email_address = template.find('#reset-email').value.toLowerCase();

		Meteor.call("sendResetPasswordEmail", email_address, function(error, result) {
			if (error)
				console.log(error);
		});
	}
});