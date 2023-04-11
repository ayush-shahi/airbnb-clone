const { MongoClient } = require("mongodb");



const url = "mongodb+srv://dbuser:dbuser@mybase.go33q53.mongodb.net/test";
let client = new MongoClient(url);

const url2 = "mongodb://127.0.0.1:27017/"
let client2 = new MongoClient(url2);




async function userconnect(){
    let db = await client.connect();
    db = db.db("Airbnb");
    return db.collection("user");
}
async function hotelconnect(){
    let db = await client.connect();
    db = db.db("Airbnb");
    return db.collection("Hotel");
}
async function bookingsconnect(){
    let db = await client.connect();
    db = db.db("Airbnb");
    return db.collection("Bookings");
}


module.exports = { userconnect , hotelconnect , bookingsconnect } ;