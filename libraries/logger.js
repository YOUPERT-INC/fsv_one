// File Storage Library
var fs = require("fs");
// Current Time with TimeZone
let getCurrentTime = require('./timeZone.js');
// Logger Object
var Logger = (exports.Logger = {});
// Create Directory if Not Exists.
var dir = './logs';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
// Write Log File
var infoStream = fs.createWriteStream("./logs/info.txt");
var errorStream = fs.createWriteStream("./logs/error.txt");

// Store Info Log
Logger.info = function(url="",data="",err="") {
    var message = "======================================================" + "\n";
        message +="           Time : " + getCurrentTime() + "\n"; //new Date().toISOString() + "\n";
        message += "======================================================" + "\n";
        message += "URL : " + url + "\n";
        message += "Data : " + data + "\n";
        message += "Message : " + err + "\n";
    infoStream.write(message);
};

// Store Error Log
Logger.error = function(url="",data="",err="") {
    var message = "======================================================" + "\n";
        message +="           Time : " + getCurrentTime() + "\n"; //new Date().toISOString() + "\n";
        message += "======================================================" + "\n";
        message += "URL : " + url + "\n";
        message += "Data : " + data + "\n";
        message += "Message : " + err + "\n";
    errorStream.write(message);
};