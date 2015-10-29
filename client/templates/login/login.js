Template.login.events({
    'click button#login': function(event, template) {
        event.preventDefault();
        $(event.target).blur();

        var email = template.find('#login-email').value.toLowerCase();
        var password = template.find('#login-password').value;

        Meteor.loginWithPassword(email, password, function(error){
            if(error){
                alert('Login attempt failed. Please try again.');
            }
        });  
    }
});

Template.login.rendered = function() {
    window.scrollTo(0,0);
}