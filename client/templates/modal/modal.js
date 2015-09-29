Template.modal.events({
    "click #close-modal": function(e, template){
        e.preventDefault();
        Modal.hide('modal');
    },
    'click #ok-modal': function() {
    	Modal.hide('modal');
    }
})

Template.modal.helpers({
	'modalText': function() {
		return {
			'messageText': Session.get('modalText'),
			'okText': Session.get('modalOkText')
		};
	}
})