setupMail = function() {
    Accounts.emailTemplates.from = 'Artfunkel <artfunkelgame@gmail.com>';
    Accounts.emailTemplates.siteName = 'http://www.artfunkelgame.com';
   
    Accounts.emailTemplates.verifyEmail.subject = function(user) {
        return 'Artfunkel: Please Confirm Your Email Address';
    };

    Accounts.emailTemplates.verifyEmail.html = function(user, url) {
        return 'Thank you for registering with Artfunkel! Please <a href="' + url + '">click here</a> to verify your account. Alternatively, you can copy and paste the link below into your browser.<br><br>' + url;
    };

    Accounts.emailTemplates.resetPassword.subject = function(user) {
        return user.profile.screen_name + ', Here is Your Reset Password Link!'
    }

    Accounts.emailTemplates.resetPassword.html = function(user, url) {
        return '<h2>Hello ' + user.profile.screen_name + ',</h2> <p>Here is a link to reset your password for artfunkel.meteor.com:</p> <a href="' + url + '">Click here to reset your password</a> <p>If you did not request your password to be reset, you may safely ignore this email.</p>';
    }

    var smtp = {
        username: 'artfunkelgame@gmail.com', 
        password:  '4rtfunk3lPW',   
        server:   'smtp.gmail.com',
        port: 465
    }
    process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
};

Meteor.methods({
    sendVEmail: function (user_id) {
        check([user_id], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        //actual email sending method
        Accounts.sendVerificationEmail(user_id);  
     },

    rsPassword: function (user_id, newpassword) {
        check([user_id, newpassword], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        
        Accounts.setPassword(user_id, newpassword,{logout: false});
     },

    changeScreen: function (user_id, screenname) {
        check([user_id,screenname], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        
        Meteor.users.update({_id : user_id}, {$set:{"username":screenname}});
     },

    changeMEmail: function (user_id, emailAdd) {
      // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
  
        Meteor.users.update({_id : user_id}, {$set:{'emails.0.address':emailAdd}});
     } 
});