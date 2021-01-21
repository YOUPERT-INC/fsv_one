var mongoose = require('mongoose');

// User Model Schema
var UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    isverified: { type: Number, default: 0 },
    active: { type: Number, default: 1 },
    emailtoken: String,
    tokenexpiretime: Date,
}, {
	timestamps: true, collection: 'fsv_user'
});

module.exports = mongoose.model('User', UserSchema);
