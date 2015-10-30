var adminDataTracker = new Tracker.Dependency;

var updateAdminData = function(template) {
	Meteor.call('getAdminData', function(error, admin_data) {
		if (error)
			console.log(error.message);

		else {
			template.data = {"admin_data" : admin_data};
			adminDataTracker.changed();
		}
	})
}

var setAdminData = function(set_id, value, template) {
	switch(set_id) {
		case 'set_level': 
			Meteor.call('setPlayerLevel', Number(value), function(error) {
				if (error)
					console.log(error.message);

				else updateAdminData(template);
			});
			break;

		case 'set_daily_drop': 
			Meteor.call('updateDailyDropCount', Number(value), function(error) {
				if (error)
					console.log(error.message);

				else updateAdminData(template);
			});
			break;

		case 'set_crate_drop': 
			Meteor.call('updateCrateDropCount', Number(value), function(error) {
				if (error)
					console.log(error.message);

				else updateAdminData(template);
			})
			break;

		case 'set_bank_balance':
			Meteor.call('setBankBalance', Number(value), function(error) {
				if (error)
					console.log(error.message);

				else updateAdminData(template);
			})
			break;

		default: return;
	}

	adminDataTracker.changed();
}

// "set_level" current=player_level button_id="level-set" button_label="set level"}}
// 					{{> settable_field set_id="set_daily_drop" current=daily_drop_count button_id="update-daily-drop-count" button_label="daily drop count"}}
// 					{{> settable_field set_id="set_crate_drop" current=crate_drop_count button_id="update-crate-drop-count" button_label="crate count"}}
// 					{{> settable_field set_id="set_bank_balance"

Template.adminTools.events({
	'click #reset-daily' : function(element) {
		Meteor.call('resetDailyDrop', function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click #generate-for-sale' : function(element) {
		Meteor.call('generateForSale', function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click #clear-unclaimed' : function(element) {
		Meteor.call('clearUnclaimed', function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click #clear-for-sale' : function(element) {
		Meteor.call('clearForSale', function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click #generate-npc' : function(element) {
		var attribute_id = $('.npc-selector').val();
		Meteor.call('generateNPC', attribute_id, function(error) {
			if (error)
				console.log(error.message);
		})
	},

	'click .text-field' : function(element) {
		var current = $(element.target).html();
		$(element.target).replaceWith('<input class="set-field" value="' + current + '"></textarea>');
	},

	'blur .set-field' : function(element) {
		var target = $(element.target);
		var value = target.val();
		var set_id = target.closest('.set-container').data().set_id;
		target.replaceWith('<p class="text-field">' + value + '</p>');

		setAdminData(set_id, value, Template.instance());
	},

	'keydown .set-field' : function(element) {
        if (element.keyCode == 13) {
			var target = $(element.target);
			var value = target.val();
			var set_id = target.closest('.set-container').data().set_id;
			target.replaceWith('<p class="text-field">' + value + '</p>');

			setAdminData(set_id, value, Template.instance());
        }
    },
})

Template.adminTools.helpers({
	'adminData' : function() {
		adminDataTracker.depend();

		console.log(Template.instance().data)

		if (Template.instance().data == null) {
			updateAdminData(Template.instance());
			return {};
		}

		else return Template.instance().data[admin_data];
	}
})