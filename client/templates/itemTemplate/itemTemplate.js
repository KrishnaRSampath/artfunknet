Template.itemTemplate.helpers({
	'itemData' : function(item_id) {
		try {
			var item_object = items.findOne(item_id);
			var artwork_object = artworks.findOne(item_object.artwork_id);

			var item_data_object = {
				'title' : artwork_object.title,
				'date' : artwork_object.date,
				'artist' : artwork_object.artist,
				'rarity' : artwork_object.rarity,
				'medium' : artwork_object.medium,
				'width' : artwork_object.width,
				'height' : artwork_object.height,
				'condition' : Math.floor(item_object.condition * 100) + '%',
				'attirbutes' : item_object.attributes,
				'item_id' : item_object._id
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
				'condition' : "",
				'attirbutes' : "",
				'item_id' : "",
			}
		}
	},

	'itemValue' : function(item_id) {
		Meteor.call('getItemValue', item_id, 'actual', function(error, result) {
			if (error)
				console.log(error.message)

			else {
				var value_string = "$" + getCommaSeparatedValue(result);
				Session.set(item_id + '_value', value_string)
			}
		})

		return Session.get(item_id + '_value');
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
				'imageURL' : ""
			};
		}
	},

	// 'imageURL' : function(item_id) {
	// 	Meteor.call('getItemImageURL', item_id, function(error, result) {
	// 		if (error)
	// 			console.log(error.message);

	// 		else Session.set(item_id + "_url", result);
	// 	});

	// 	if (Session.get(item_id + "_url"))
	// 		return Session.get(item_id + "_url");

	// 	else return "";
	// }
})