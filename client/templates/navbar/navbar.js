Template.navbar.helpers({
	'screen_name' : function() {
		return Meteor.user().profile.screen_name;
	}
})

Template.navbar.events({
	'mouseover .nav-icon' : function(element) {
		var button_title = element.target.dataset.title;

		setFootnote(button_title, Math.floor(Math.random() * 1000));
	}
})