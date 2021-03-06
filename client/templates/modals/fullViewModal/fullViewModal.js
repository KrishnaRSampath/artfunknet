Template.fullViewModal.helpers({
	'itemId' : function() {
		if (Session.get('selectedItem')) 
			return Session.get('selectedItem');

		else return "";
	},

	'itemData' : function() {
		try {
			if (Session.get('selectedItem')) {
				var item_object = items.findOne(Session.get('selectedItem'));
				var artwork_object = artworks.findOne(item_object.artwork_id);
					
				return {
					'title' : artwork_object.title,
					'artist' : artwork_object.artist,
				}
			}

			else return {
				'title' : "",
				'artist' : "",
			}
		}

		catch(error) {
			return {
				'title' : "",
				'artist' : "",
			}
		}
	},

	'imageInfo' : function(item_id) {
		try {
			var item_object = items.findOne(item_id);
			var artwork_object = artworks.findOne(item_object.artwork_id);

			var info_object = {
				'filename' : artwork_object.filename,
			};

			return info_object;
		}

		catch(error) {
			return {
				'filename' : ""
			};
		}
	},
})

Template.fullViewModal.events({
	'click #close-button' : function() {
		Modal.hide('fullViewModal');
	}
})

Template.fullViewModal.rendered = function() {
	Session.set('actual_value', false);
};