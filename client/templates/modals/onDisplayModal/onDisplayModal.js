var display_details_dep = new Tracker.Dependency;

var display_details = {};

Template.onDisplayModal.rendered = function() {
	Session.set('onDisplayErrors', []);
	var item_id = Session.get('selectedItem');
    refreshDisplayDetails(item_id, $('#duration').val());
};

var refreshDisplayDetails = function(item_id, duration) {
	Meteor.call('getDisplayDetails', item_id, duration, function(error, result) {
		if (error)
			console.log(error.message);

		else {
			display_details = {
				'money' : getCommaSeparatedValue(result.money),
				'xp' : getCommaSeparatedValue(result.xp),
				'end' : getTimeString(moment(result.end))
			};
			display_details_dep.changed();
		}
	})
}

Template.onDisplayModal.events ({
	'click #ok-modal': function(event, template) {
		Meteor.call('displayArtwork', Session.get('selectedItem'), $('#duration').val(), function(error, error_list) {
			if (error)
				console.log(error.message);

			else if (error_list.length > 0) {
				Session.set('onDisplayErrors', error_list);
				$('.errors').show();
			}

			else {
				Session.set('onDisplayErrors', []);
				$('.errors').hide();
				Modal.hide("onDisplayModal");
			}
		});			
    },

    'click #cancel-modal' : function(event, template) {
    	Modal.hide("onDisplayModal");
    },

    'change #duration' : function(event) {
    	var item_id = Session.get('selectedItem');
    	refreshDisplayDetails(item_id, $(event.target).val());
    }
})

Template.onDisplayModal.helpers({
	'itemData' : function() {
		var item_object = items.findOne(Session.get('selectedItem'));
		if (!!item_object) {
			var artwork_object = artworks.findOne(item_object.artwork_id);
			return {
				'item_id' : item_object._id,
				'title' : artwork_object.title,
				'artist' : artwork_object.artist
			}
		}

		else return {
			'item_id' : "",
			'title' : "",
			'artist' : "",
		}
	},

	'error' : function() {
		return Session.get('onDisplayErrors');
	},

	'display_duration' : function() {
		return $('#duration').val();
	},

	'displayDetails' : function() {
		display_details_dep.depend();
		return display_details;
	}
})