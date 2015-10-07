Template.forgotPassword.events({
	'click #send-reset': function(event, template) {
		console.log("pressed");
		var email_address = template.find('#reset-email').value.toLowerCase();
		console.log("sending reset email to " + email_address);

		Meteor.call("sendResetPasswordEmail", email_address, function(error, result) {
			if (error)
				console.log(error);
		});
	}
});