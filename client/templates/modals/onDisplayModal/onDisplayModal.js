Template.onDisplayModal.events ({
	'click #ok-modal': function(event, template) {
		var errors = [];

		if (Session.get('display_duration') == 'default') {
			errors.push('invalid duration');
		}

		if (errors.length > 0) {
    		Session.set('onDisplayErrors', errors);
    		$('.errors').show();
    	}

		else {
			Meteor.call('displayArtwork', Session.get('selectedItem'), Session.get('display_duration'), function(error) {
				if (error)
					console.log(error.message);

				else Modal.hide("onDisplayModal");
			});
			Session.set('onDisplayErrors', []);
    		$('.errors').hide();
	    }

    },

    'click #cancel-modal' : function(event, template) {
    	Modal.hide("onDisplayModal");
    },

    'change #duration' : function(event) {
    	Session.set('display_duration', event.target.value);
    	Meteor.call('getDisplayDetails', Session.get('selectedItem'), event.target.value, function(error, result) {
    		if (error)
    			console.log(error.message);

    		else Session.set('display_details', result);
    	})
    }
})

Template.onDisplayModal.helpers({
	'itemData' : function() {
		var item_object = items.findOne(Session.get('selectedItem'));
		if (!!item_object) {
			var artwork_object = artworks.findOne(item_object.artwork_id);
			return {
				'title' : artwork_object.title,
				'artist' : artwork_object.artist
			}
		}

		else return {
			'title' : "",
			'artist' : "",
		}
	},

	'error' : function() {
		return Session.get('onDisplayErrors');
	},

	'displayDetails' : function() {
		if (Session.get('display_duration') && Session.get('display_duration') != 'default' && Session.get('display_details')) {
			var details = {
				'money' : "$" + getCommaSeparatedValue(Session.get('display_details').money),
				'xp' : getCommaSeparatedValue(Session.get('display_details').xp),
				'end' : getTimeString(moment(Session.get('display_details').end)),
			}

			return details;
		}

		else return {
			'money' : '-',
			'xp' : '-',
			'end' : "-"
		}
	}
})

Template.onDisplayModal.rendered = function() {
	Session.set('display_duration', 'default');
	Session.set('onDisplayErrors', []);
};