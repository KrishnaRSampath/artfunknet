artists = new Mongo.Collection("artists");
artworks = new Mongo.Collection("artworks");
auctions = new Mongo.Collection("auctions");
items = new Mongo.Collection("items");
attributes = new Mongo.Collection("attributes");

alerts = new Mongo.Collection("alerts");
// {
// 	'user_id' : "",
// 	'message' : "", 
// 	'highlight' : "",
// 	'link' : "",
// 	'icon' : "",
//	'sentiment' : ""
// }


artworkImages = new FS.Collection("artworkImages", { stores: [new FS.Store.FileSystem("artworkImages")] });
profilePhotos = new FS.Collection("profilePhotos", { stores: [new FS.Store.FileSystem("profilePhotos")] });

// resizeImage = function(fileObj, readStream, writeStream) {
// 	gm(readStream, fileObj.name()).resize('100', '100').stream().pipe(writeStream);
// };

// images = new FS.Collection("images", {
// 	stores: [new FS.Store.FileSystem("images", {path: "../../../../../public/uploaded_images"})]
// });

// image_previews = new FS.Collection("image_previews", {
// 	stores: [new FS.Store.FileSystem("image_previews", {path: "../../../../../public/image_previews", transformWrite: resizeImage})]
// });

// testGM = function() {
// 	console.log("gm: " + gm.isAvailable);
// }

//testGM();

// artists = new Mongo.Collection("artists");
// artworks = new Mongo.Collection("artwork");