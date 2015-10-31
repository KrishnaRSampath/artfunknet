var item_value_dep = new Tracker.Dependency;

var addItemValueToView = function(item_id, value_type, view) {
	Meteor.call('getItemValue', item_id, value_type, function(error, result) {
		if (error)
			console.log(error.message);

		else {
			Blaze.getData(view)[item_id + "_value"] = result;
			item_value_dep.changed();
		}
	})
}

Template.registerHelper('getItemValue', function(item_id, value_type) {
	if (item_id) {
		item_value_dep.depend();
		var value_data = Blaze.getData(Blaze.currentView)[item_id + "_value"];
		if (value_data) 		
			return getCommaSeparatedValue(value_data);

		else {
			addItemValueToView(item_id, value_type, Blaze.currentView);
			return "";
		}
	}
})

Template.registerHelper('getHTMLColorFromValue', function(value) {
	var red_value = 255 - Math.floor(value * 255);
	var color_string = "rgb(" + red_value + " , 0, 0)";
	return color_string;
})

Template.registerHelper('userIsAdmin', function() {
	return Meteor.user() && Meteor.user().profile.user_type == "admin";
})

Template.registerHelper('displayAsMoneyValue', function(value) {
	return "$" + getCommaSeparatedValue(value);
})

Template.registerHelper('commaSeparatedValue', function(value) {
	return getCommaSeparatedValue(value);
})

Template.registerHelper('positionFromIndex', function(index) {
	return index + 1;
})