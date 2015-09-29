Template.admin.rendered = function() {
	$('#clear-artists').click( function() {
		artists.remove({});
	});

	$('#clear-artwork').click( function() {
		artwork.remove({});
	});
}