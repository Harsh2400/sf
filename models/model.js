// Step 3 - this is the code for ./models.js

var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    adid: String,
    firstname: String,
    lastname: String,
    gender: String,
    phone: String,
    state: String,
    city: String,
    district: String,
    pincode: String,
    address: String,
    landmark: String,
    wifi: String,
    parking: String,
    ac: String,
    balcony: String,
    metro: String,
    ms_name: String,
    kitchen: String,
    washroom: String,
    ttl_accom: String,
    vcnt_accom: String,
    price: String,
    img: {
        data: Buffer,
        contentType: String
    },
    desc: String
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model('searchtest', imageSchema);