alerts = new Mongo.Collection("alerts");
artists = new Mongo.Collection("artists");
artworks = new Mongo.Collection("artworks");
attributes = new Mongo.Collection("attributes");
auctions = new Mongo.Collection("auctions");
items = new Mongo.Collection("items");

if (Meteor.isServer) {
    Meteor.publish("alerts", function() {
        return alerts.find({"user_id": this.userId});
    });

    Meteor.publish("artists", function() {
        return artists.find({});
    });

    Meteor.publish("artworks", function() {
        return artworks.find({});
    });

    Meteor.publish("attributes", function() {
        return attributes.find({});
    });

    Meteor.publish("auctions", function() {
        return auctions.find({});
    });

    Meteor.publish("items", function() {
        return items.find({});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe("alerts");
    Meteor.subscribe("artists");
    Meteor.subscribe("artworks");
    Meteor.subscribe("attributes");
    Meteor.subscribe("auctions");
    Meteor.subscribe("items");
}

artworkImages = new FS.Collection("artworkImages", { stores: [new FS.Store.FileSystem("artworkImages")] });
profilePhotos = new FS.Collection("profilePhotos", { stores: [new FS.Store.FileSystem("profilePhotos")] });
