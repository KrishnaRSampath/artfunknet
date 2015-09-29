setupMail = function() {
    Accounts.emailTemplates.from = 'Artfunkel <artfunkelgame@gmail.com>';
    Accounts.emailTemplates.siteName = 'http://www.artfunkelgame.com';
   
    Accounts.emailTemplates.verifyEmail.subject = function(user) {
        return 'Artfunkel: Please Confirm Your Email Address';
    };

    Accounts.emailTemplates.verifyEmail.html = function(user, url) {
        return 'Thank you for registering with Artfunkel! Please <a href="' + url + '">click here</a> to verify your account. Alternatively, you can copy and paste the link below into your browser.<br><br>' + url;
    };

    var smtp = {
        username: 'artfunkelgame@gmail.com', 
        password:  '1amtehartfunkel',   
        server:   'smtp.gmail.com',
        port: 465
    }
    process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
};

Meteor.methods({
    sendVEmail: function (uId) {
        check([uId], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        //actual email sending method
        Accounts.sendVerificationEmail(uId);  
     },

    rsPassword: function (uId,newpassword) {
        check([uId,newpassword], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        
        Accounts.setPassword(uId, newpassword,{logout: false});
     },

    changeScreen: function (uId,screenname) {
        check([uId,screenname], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        
        Meteor.users.update({_id : uId}, {$set:{"username":screenname}});
     },

    changeMEmail: function (uId,emailAdd) {
      // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
  
        Meteor.users.update({_id : uId}, {$set:{'emails.0.address':emailAdd}});
     } 
});