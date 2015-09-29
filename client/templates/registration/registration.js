var validateAndCreateUser = function(userObject, confirmedPass) {
    try {
        var errors = [];

        // try{
        //     validatePassword(userObject.password);
        // } catch(e) {
        //     errors.push(e.message);
        // }

        if (Meteor.users.find({'email': userObject.email}).count() > 0)
            errors.push("A user with that email address already exists");

        if (userObject.password != confirmedPass)
            errors.push("Password fields do not match");

        // if (!validateEmail(userObject.email)) {
        //     errors.push("Please enter a valid email address");
        // }

        // if (!notBlank(userObject.profile.gender)) {
        //     errors.push("Please specify your gender");
        // }

        // if (!notBlank(userObject.profile.birth_year + "") && !isNaN(userObject.profile.birth_year)) {
        //     errors.push("Please enter a valid birth year");
        // }

        // if (!notBlank(userObject.profile.first_name, userObject.profile.last_name)) {
        //     errors.push("Please specify first and last name");
        // }

        // if (!notBlank(userObject.profile.state)) {
        //     errors.push("Please specify your state");
        // }

        //Only make the call to the server if none of the client side validation failed
        if (errors.length == 0) {
            Meteor.call("registerUser", userObject, function(err){
                if (err)
                    console.log(err.message);

                else {
                    Meteor.loginWithPassword(userObject.email, userObject.password, function(error) {
                        if (!error)
                            Router.go('/');

                        else console.log("error logging in newly created user: " + err.message);
                    });
                }
            });
        }

        return errors;
    }

    catch(error) {
        console.log("registration error: " + error.message);
    }
}

Template.registration.events({
    'click #register-button' : function(event, template) {
        event.preventDefault();

        var illness_array = [];

        $(".tag > span").each( function() {
            var illness = $(this).text().toLowerCase();
            illness_array[illness_array.length] = illness.substring(0, illness.length - 2);
        });

        var last_drop = moment().add(-1, 'days');

        var user = {
            "username": template.find('#email').value.toLowerCase(),
            "email": template.find('#email').value.toLowerCase(),
            "password": template.find('#password').value,
            "profile": {
                "screen_name": template.find('#screen_name').value,
                "user_type": "player",
                "bank_balance" : 1000000,
                "last_drop" : last_drop._d.toISOString()
            }
        };

        Session.set('registrationErrors', validateAndCreateUser(user, template.find('#rtpassword').value));

        if (Session.get('registrationErrors')) {
            $('#errors').show();
        }

        else $('#errors').hide();
    },
})

Template.registration.helpers({
    'error' : function() {
        var errors = Session.get('registrationErrors');
        return errors;
    }
})

Template.registration.rendered = function() {
    $('#errors').hide();
}