Template.navbar.helpers({
	'screen_name' : function() {
		return Meteor.user().profile.screen_name;
	},

	'ticket' : function() {
		try {
			var tickets = Meteor.user().profile.gallery_tickets;
			var ticket_array = [];
			for (var i=0; i < tickets.length; i++) {
				var gallery_object = galleries.findOne({'owner_id' : tickets[i].owner_id});
				var met_npcs = npcs.find({'owner_id': gallery_object.owner_id, 'players_met': {$ne: Meteor.userId()}}).count();

				if (gallery_object) {
					var ticket_object = {
						'owner_name' : gallery_object.owner,
						'owner_id' : tickets[i].owner_id,
						'expiration_string' : getTimeString(moment(tickets[i].expiration)),
						'unmet_npcs' : met_npcs > 0
					}
					ticket_array.push(ticket_object);
				}
			}

			return ticket_array;
		}

		catch(error) {
			return [];
		}
	}
})

Template.navbar.events({
	'mouseover .nav-icon' : function(element) {
		var button_title = element.target.dataset.title;

		setFootnote(button_title, Math.floor(Math.random() * 1000));
	}
})