addFunds = function(user_id, amount) {
    if (isNaN(amount))
        throw "invalid amount";

    var actual_amount = Number(amount).toFixed(2);

    var current_balance = Number(Meteor.users.findOne({'_id': user_id}).profile.bank_balance).toFixed(2);
    var new_balance = Math.ceil((Number(current_balance) + Number(actual_amount)) * 100) / 100;
    Meteor.users.update(user_id, {$set: {"profile.bank_balance" : new_balance}});
}

chargeAccount = function(user_id, amount) {
    if (isNaN(amount))
        throw "invalid amount";

    var actual_amount = Number(amount).toFixed(2);

    var current_balance = Number(Meteor.users.findOne({'_id': user_id}).profile.bank_balance).toFixed(2);
    var new_balance = Math.ceil((Number(current_balance) - Number(actual_amount)) * 100) / 100;
    Meteor.users.update(user_id, {$set: {"profile.bank_balance" : new_balance}});
}

Meteor.methods({
    'registerUser': function(user) {
        var emailExists = !! Meteor.users.findOne({ emails: { $elemMatch: { address: user.email } } });
        var screenNameExists;

        // TODO: Compare screennames and emails by case
        if (user.profile.screen_name.length == 0) {
            screenNameExists = false;
        }

        else {
            screenNameExists = !! Meteor.users.findOne({'profile.screen_name': user.profile.screen_name });
        }

        if (emailExists){
            throw new Meteor.Error("Email already exists");
        }

        else if (screenNameExists) {
            throw new Meteor.Error("Screen Name already exists");
        }

        else {
            createUser(user);
        }
    },

    'validateCreateLogin' : function(user_object, confirmed_password) {
        try {
            var errors = [];

            if (user_object.password != confirmed_password)
                errors.push("Password fields do not match");

            if (user_object.profile.screen_name == "" || Meteor.users.find({'profile.screen_name': user_object.profile.screen_name}).count() > 0)
                errors.push("Invalid user handle");

            if (user_object.email == "")
                errors.push("Invalid email address");

            if (user_object.password == "")
                errors.push("Invalid password");

            if (Meteor.users.find({'emails.0.address': user_object.email}).count() > 0)
                errors.push("A user with that email address already exists");

            if (errors.length == 0) {
                createUser(user_object);
            }

            return errors;
        }

        catch(error) {
            return [error.message];
        }
    },

    'emailIsTaken' : function(email_address) {
        return Meteor.users.find({'emails.0.address': email_address}).count() > 0;
    },

    'chargeAccount' : function(user_id, amount) {
        chargeAccount(user_id, amount);
    },

    'clearUnclaimed' : function(user_id) {
        items.remove({'owner': user_id, 'status': 'unclaimed'});
    },

    'alertAllUsers' : function(message) {
        var admin = Meteor.user().emails[0].address == "jpollack320@gmail.com";
        if (admin) {
            var all_users = Meteor.users.find();

            all_users.forEach(function(db_object) {
                var alert_object = {
                    'user_id' : db_object._id,
                    'message' : message,
                    'link' : '/',
                    'icon' : 'fa-exclamation',
                    'sentiment' : "neutral",
                    'time' : moment()
                };

                alerts.insert(alert_object);
            })
        }
    },

    'clearAlerts' : function() {
        alerts.remove({'user_id' : Meteor.userId()}, {multi : true});
    },

    'removeAlert' : function(alert_id) {
        alerts.remove(alert_id);
    },

     'levelUp' : function() {
        levelUp(Meteor.userId());
    },

    'addXP' : function(amount) {
        addXP(Meteor.userId(), amount);
    },

    'sendResetPasswordEmail': function(email_address) {
        var user = Meteor.users.findOne({"emails.0.address": email_address});

        if (user) {
            Accounts.sendResetPasswordEmail(user._id);
            return true;
        }

        else return null;
    },

    'purchaseTicket' : function(buyer_id, owner_id) {
        // var ticket_duration = 10000;
        var ticket_duration = 1800000;
        var ticket_expiration = moment().add(ticket_duration, 'milliseconds')._d.toISOString();
        var entry_fee = Meteor.users.findOne(owner_id).profile.entry_fee;

        if (entry_fee > Meteor.user().profile.bank_balance)
            return;

        var current_tickets = Meteor.users.findOne(buyer_id).profile.tickets;

        if (current_tickets == undefined) {
            var ticket_object = {};
            ticket_object[owner_id] = ticket_expiration;
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : ticket_object}});
        }

        else {
            if (Object.keys(current_tickets).length >= Meteor.users.findOne(buyer_id).profile.ticket_cap)
                return;

            current_tickets[owner_id] = ticket_expiration;
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : current_tickets}});
        }

        Meteor.setTimeout(function() {
            var buyer_object = Meteor.users.findOne(buyer_id);
            var current_tickets = buyer_object.profile.tickets;
            delete current_tickets[owner_id];
            Meteor.users.update(buyer_id, {$set: {'profile.tickets' : current_tickets}});
        }, ticket_duration);

        addFunds(owner_id, entry_fee);
        addXPChunkPercentage(owner_id, .02);
        chargeAccount(buyer_id, entry_fee);
    },

    'updateEntryFee' : function(value) {
        if (value < 0)
            return;
        
        Meteor.users.update(Meteor.userId(), {$set: {'profile.entry_fee' : value}});
        galleries.update({'owner_id' : Meteor.userId()}, {$set: {'entry_fee' : value}});
    }
})