var footnote_duration = 5000;

Template.footnote.helpers({
	'text' : function() {
		if (Session.get('footnote_text') != undefined) {
			$('#footnote-area').show();
			return Session.get('footnote_text');
		}

		else $('#footnote-area').hide();
	}
})