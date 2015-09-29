Template.adminDashboard.helpers({
	'artwork': function() {
		return artworks.find({'status': 'pending'});
	},

	'artist': function() {
		return artists.find({'status': 'pending'});
	}
});

//Template.artworkEntry.events

Template.artworkEntry.rendered = function(){	
	console.log('artworkEntry rendered: ' + this.data.title)
	var img_url = this.data.imageURL;

	var img_width = $("#image_" + this.data._id).get(0).naturalWidth;
    var img_height = $("#image_" + this.data._id).get(0).naturalHeight;

	var scale_factor = 1.0;

	if (img_width > img_height) {
		if (img_width > 460)
			scale_factor = 460 / img_width;
	}

	else if (img_height > 460)
		scale_factor = 460 / img_height;

	$("#image_" + this.data._id).css('width', img_width * scale_factor);
	$("#image_" + this.data._id).css('height', img_height * scale_factor);

	var title = this.data.title;
	var _id = this.data._id;
	$("#approve_" + this.data._id).click( function () {
		artworks.update({"_id": _id}, {$set: {"status": "approved"}});
		console.log("approve " + title);
	});

	$("#deny_" + this.data._id).click( function () {
		artworks.update({"_id": _id}, {$set: {"status": "denied"}});
		console.log("deny " + title);
	});
}

Template.artistEntry.rendered = function(){	
	console.log('artistEntry rendered: ' + this.data.title)
	var name = this.data.artistName;
	var _id = this.data._id;
	$("#approve_" + this.data._id).click( function () {
		artists.update({"_id": _id}, {$set: {"status": "approved"}});
		console.log("approve " + name);
	});

	$("#deny_" + this.data._id).click( function () {
		artists.update({"_id": _id}, {$set: {"status": "denied"}});
		console.log("deny " + name);
	});
}

Template.adminDashboard.rendered = function() {
	console.log("admin rendered");
}