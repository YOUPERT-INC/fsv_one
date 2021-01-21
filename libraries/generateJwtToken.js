let jwt = require('jsonwebtoken');
let config = require('../config/config');

// Generates JWT Auth Token
function generateJwtToken(id)
{
    let token = jwt.sign({ id: id }, config.secret, {
        expiresIn: 86400
    });
    return token;
}

module.exports = generateJwtToken;