const { isEmpty } = require("lodash")
let config = require('../config/config');

// Create and Return User Object
function createUsersObject(user) {
    let userObj = {}
    userObj._id = user._id ? user._id : '';
    userObj.name = user.name ? user.name : '';
    userObj.email = user.email ? user.email : '';
    userObj.password = user.password ? user.password : "";
    userObj.isverified = user.isverified ? user.isverified : 0;
    userObj.active = user.active ? user.active : 0;
    userObj.token = user.token ? user.token : '';
    userObj.emailtoken = user.emailtoken ? user.emailtoken : '';
    userObj.tokenexpiretime = user.tokenexpiretime ? user.tokenexpiretime : '';
    return userObj;
}

module.exports = createUsersObject;