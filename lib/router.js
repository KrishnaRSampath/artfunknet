Router.configure({
	'layoutTemplate' : "layout"
});

Router.route('/', function() {
    if (Meteor.user()){
        Router.go("MyDashboard");
    } else if (Meteor.loggingIn()) {
        this.render("loading");
    } else {
        this.render("Home");
    }
});

Router.route('MyDashboard', function() {
	if (Meteor.user())
		this.render("dashboard");

	else Router.go("login");
})

Router.route( 'uploadArtwork', function() {
	this.render('uploadArtwork');
});

Router.route( 'testing', function() {
    this.render('testTemplate');
});

Router.route( 'registerArtist', function() {
	this.render('registerArtist');
});

Router.route( 'adminDashboard', function() {
	this.render('adminDashboard');
});

Router.route( 'Loot', function() {
	this.render('randomDrop');
});

Router.route('reset', function() {
    this.render('forgotPassword');
});

Router.route('register', function() {
	if (Meteor.user())
		Router.go("/MyDashboard");

	else this.render("registration");
})

Router.route('logout', function() {
    Meteor.logout(function() {
        Router.go('/');
    });
});

Router.route('login', function() {
    if (Meteor.user()){
        Router.go("MyDashboard");
    } 

    else if (Meteor.loggingIn()) {
        this.render("loading");
    } 

    else {
        this.render("login");
    }
});

Router.route('auctions', function(){
    if (Meteor.user()){
        this.render("auctions");
    } 

    else if (Meteor.loggingIn()) {
        this.render("loading");
    } 

    else {
        Router.go("login");
    }
});

Router.route('user/:screen_name', function() {
    this.render("userGallery", {
        data: {
            'screen_name' : this.params.screen_name
        }
    });
});