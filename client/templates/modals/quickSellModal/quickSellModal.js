Template.quickSellModal.helpers({
	'itemId' : function() {
		if (Session.get('selectedItem')) 
			return Session.get('selectedItem');

		else return "";
	},

	'sellData' : function() {
		try {
			if (Session.get('selectedItem')) {
				var item_object = items.findOne(Session.get('selectedItem'));
				var artwork_object = artworks.findOne(item_object.artwork_id);
					
				return {
					'item_id' : item_object._id,
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

			var max_dimension = 400;

			var width = artwork_object.width;
			var height = artwork_object.height;
			var ratio = width / height;

			var info_object = {
				'image_width' : 0,
				'image_height' : 0,
				'filename' : artwork_object.filename,
				'imageURL' : artwork_object.img_link == "" ? "http://go-grafix.com/data/wallpapers/35/painting-626297-1920x1080-hq-dsk-wallpapers.jpg" : artwork_object.img_link
			};

			if (width > height) {
				info_object.image_width = max_dimension;
				info_object.image_height = Math.floor(max_dimension / ratio);
			}

			else {
				info_object.image_height = max_dimension;
				info_object.image_width = Math.floor(max_dimension * ratio);
			}

			return info_object;
		}

		catch(error) {
			return {
				'image_width' : 0,
				'image_height' : 0,
				'filename' : ""
			};
		}
	},
})

Template.quickSellModal.events({
	'click #close-button' : function() {
		Modal.hide('quickSellModal');
	},

	'click #sell-artwork' : function() {
		if (Session.get('selectedItem')) {
			Meteor.call('sellArtwork', Session.get('selectedItem'), function(error) {
				if (error)
					console.log(error.message);

				else Modal.hide('quickSellModal');
			});
		}
	}
})