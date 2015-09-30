Template.testTemplate.helpers({
	'artwork' : function() {
		return artworks.findOne({'img_link': ""});
	}
})

Template.artworkInfo.helpers({
	'artworkData' : function(artwork_id) {
		try {
			var artwork_object = artworks.findOne(artwork_id);

			var item_data_object = {
				'title' : artwork_object.title,
				'date' : artwork_object.date,
				'artist' : artwork_object.artist,
				'rarity' : artwork_object.rarity,
				'medium' : artwork_object.medium,
				'width' : artwork_object.width,
				'height' : artwork_object.height,
				'filename' : artwork_object.filename
			}

			return item_data_object;
		}

		catch(error) {
			return {
				'title' : "",
				'date' : "",
				'artist' : "",
				'rarity' : "",
				'medium' : "",
				'width' : "",
				'height' : "",
				'filename' : "",
			}
		}
	}
})

Template.artworkThumbnail.helpers({
	'artworkInfo' : function(artwork_id) {
		try {
			var artwork_object = artworks.findOne(artwork_id);

			var overall_dimension = 250;
			var max_dimension = 230;

			var width = artwork_object.width;
			var height = artwork_object.height;
			var ratio = width / height;

			var info_object = {
				'image_width' : 0,
				'image_height' : 0,
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

			info_object.padding_top = Math.floor((overall_dimension - info_object.image_height) / 2);

			return info_object;
		}

		catch(error) {
			return {
				'image_width' : 0,
				'image_height' : 0,
				'imageURL' : "",
				'padding_top' : 0,
			};
		}
	}
})