let jwt = require('jsonwebtoken');
let config = require('../config/config');
let constants = require('../config/constants.json');

// Verifie Auth Token
function authorize(req, res, next) {
    if (req.headers['x-access-token'] && req.headers['x-access-token'] != 'null') {
        jwt.verify(req.headers['x-access-token'], config.secret, (err, decoded) => {
            if (err && err.name == 'TokenExpiredError') {
                return res.send({status: constants.errorAuthorize,issuccess: constants.error, message: constants.authenticationFailed, data: {}});
            } else if(decoded && decoded.id) {
                id = decoded.id;
                req.userId = decoded.id;
                next();
            } else {
                return res.send({status: constants.errorAuthorize,issuccess: constants.error, message: constants.tokenDecodeError, data: {}});
            }
        });
    } else {
        return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.accessDenied, data: {}});
    }
}

module.exports = authorize;