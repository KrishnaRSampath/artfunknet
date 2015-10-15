Template.standardNPCMessageModal.helpers({
	'message' : function() {
		var npc_interaction = Session.get('npc_interaction');
		if (npc_interaction == undefined)
			return "";

		else return npc_interaction.message;
	}
})

Template.standardNPCMessageModal.events({
	'click #ok-modal': function(){
    	Session.set('npc_interaction', undefined);
        Modal.hide('standardNPCMessageModal');
    }
})