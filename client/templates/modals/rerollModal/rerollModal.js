Template.rerollModal.events ({
	'click #cancel-modal' : function(event, template) {
    	Modal.hide("rerollModal");
    },

    'click .xp-reroll-button.enabled' : function() {
    	Meteor.call('rerollXPRating', Session.get('selectedItem'), function(error, result) {
    		if (error)
    			console.log(error.message);
    	});
    },

    'click .reroll-value-button.enabled' : function(element) {
    	var attribute_id = $(element.target).data('attribute_id');
		Meteor.call('rerollAttributeValue', Session.get('selectedItem'), attribute_id, function(error, result) {
			if (error)
				console.log(error.message);
		});
    },

    'click .reroll-attribute-button.enabled' : function(element) {
    	var attribute_id = $(element.target).data('attribute_id');
		Meteor.call('rerollAttribute', Session.get('selectedItem'), attribute_id, function(error, result) {
			if (error)
				console.log(error.message);
		});
    },
})

Template.rerollModal.helpers({
	'itemData' : function() {
		var item_object = items.findOne(Session.get('selectedItem'));
		if (!!item_object) {
			var artwork_object = artworks.findOne(item_object.artwork_id);

			var primary_attributes = [];
			var secondary_attributes = [];
			var attributes = item_object.attributes;

			for(var i=0; i < attributes.length; i++) {
				if (attributes[i].type == "primary")
					primary_attributes.push(attributes[i]);

				else secondary_attributes.push(attributes[i]);
			}

			return {
				'title' : artwork_object.title,
				'artist' : artwork_object.artist,
				'xp_rating' : Math.floor(item_object.xp_rating * 100),
				'roll_count' : item_object.roll_count,
				'show_primary' : primary_attributes.length,
				'primary_attribute' : primary_attributes,
				'show_secondary' : secondary_attributes.length,
				'secondary_attribute' : secondary_attributes
			}
		}

		else return {
			'title' : "",
			'artist' : "",
			'xp_rating' : "",
			'roll_count' : "",
			'show_primary' : false,
			'primary_attribute' : [],
			'show_secondary' : false,
			'secondary_attribute' : []
		}
	},

	'error' : function() {
		return Session.get('createAuctionErrors');
	},

	'rerollCost' : function() {
		Meteor.call('getRerollCost', Session.get('selectedItem'), function(error, result) {
			if (error)
				console.log(error.message);

			else {
				Session.set('reroll_cost', result);
			}
		});

		if (Session.get('reroll_cost'))
			return getCommaSeparatedValue(Session.get('reroll_cost'));

		else return 0;
	},

	'bankBalance' : function() {
		return getCommaSeparatedValue(Meteor.user().profile.bank_balance);
	},

	'canReroll' : function() {
		Meteor.call('getRerollCost', Session.get('selectedItem'), function(error, result) {
			if (error)
				console.log(error.message);

			else {
				Session.set('can_reroll', result <= Meteor.user().profile.bank_balance);
			}
		});

		if (Session.get('can_reroll') !== undefined)
			return Session.get('can_reroll');

		else return false;
	},

	'valueColor' : function(value) {
		return 255 - Math.floor(value * 255);
	},

	'attributeValueText' : function(value) {
		return Math.floor(value * 100);
	}
})