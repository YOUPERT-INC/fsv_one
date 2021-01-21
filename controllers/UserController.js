let express = require('express');
let router = express.Router();
let bcrypt = require('bcryptjs');
let multer = require('multer');
let moment = require('moment');
var geoip = require('geoip-lite');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-express-middleware');
const Backend = require('i18next-node-fs-backend');
let { body, validationResult, checkSchema } = require('express-validator');
let path = require("path");
let _ = require('lodash');
let nodemailer = require('nodemailer');
let constants = require('../config/constants.json');
let config = require('../config/config');
const isDisposable = require('is-disposable-email-domain');
//libraries
let generateJwtToken = require('../libraries/generateJwtToken');
let createUsersObject = require('../libraries/createUsersObject');
let createVideosObject = require('../libraries/createVideosObject');
let authorize = require('../libraries/auth');

const async = require('async');

// models
let User = require('../models/User');
let Video = require('../models/Video');
let logger = require("../libraries/logger").Logger;
const request = require('request');
var otp,host,link;
/* Signup API */
router.post('/signUp', [
        body('email').notEmpty().withMessage(constants.emailValRequired).isEmail().withMessage(constants.emailValRequired1),
        body('password').notEmpty().withMessage(constants.pwdValRequired).isLength({ min: 8 }).withMessage(constants.pwdValRequired1)
    ],
    async function (req, res) {

        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);

        if (req.body['gRecaptchaResponse'] === undefined || req.body['gRecaptchaResponse'] === '' || req.body['gRecaptchaResponse'] === null) {
            return res.json({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.googleCaptchaError, data: {}});
        }

        var secretKey = config.googleCaptchaSecretKey;
        var verificationUrl = config.googleCaptchaVerificationUrl + secretKey + "&response=" + req.body['gRecaptchaResponse'] + "&remoteip=" + req.connection.remoteAddress;

        await request(verificationUrl, async function(error,response,body) {

            if (error) {
                requestBody = JSON.stringify(req.body);
                logger.error(req.url,requestBody,err);
                return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
            }

            body = JSON.parse(body);
            // Success will be true or false depending upon captcha validation.
            if(body.success == undefined || body.success==false) {
                return res.json({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.googleCaptchaServerError, data: {}});
            }

            if(isDisposable.isDisposable(req.body.whatIWant) == true)
            {
                return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailInvalid, data: {}});
            }

            // Serverside Validation error
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let reserrmsg = convertErrrmsg(errors.array(),lang);
                return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: reserrmsg, data: {}});
            } else {

                var email = req.body.email;
                if (req.body.email) {
                    let emailPattern = /\S+@\S+\.\S+/;
                    if(!emailPattern.test(req.body.email)) {
                        return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailInvalid, data: {}});
                    }
                    let getUser = await User.countDocuments({ email: req.body.email, isverified: 1 }).exec();
                    if (getUser > 0) {
                        return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailExists, data: {}});
                    } else {
                        email = req.body.email.toLowerCase();
                    }
                }

                // this will convert any number sequence into 6 character.
                otp = randomOtp();
                host = req.get('host');
                link = req.protocol + "://" + host + "/api/verify?id=" + otp;
                var html = 'Hello,<br> Please click on the link to verify your Account. <a href="' + link + '" target="_blank">Click here</a>';

                const mailmessage = {
                                    from: '"' + returnlangmsg.mailfrom1 + '"<' + config.fromEmail + '>',
                                    to: email,
                                    subject: returnlangmsg.mailsubject1,
                                    html : html
                                };

                var transporter = nodemailer.createTransport({
                    host: 'smtp.ionos.com',
                    port: 587,
                    secure: false, // use SSL
                    auth: {
                        user: config.authEmail,
                        pass: config.authpwd
                    }
                });

                let hashedPassword = await bcrypt.hashSync(req.body.password, 8);

                let userReqObj = {
                    name: req.body.name,
                    email: email,
                    password: req.body.password, //hashedPassword,
                    isverified: 0,
                    active: 0,
                    emailtoken: otp
                }

                await User.findOne({ email: req.body.email }, async function (err, user) {
                    if (err) {
                        // Add Log Data
                        requestBody = JSON.stringify(req.body);
                        logger.error(req.url,requestBody,err);
                        return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                    } else if (user) {
                        if (user.isverified == 0) {
                            user = await _.merge(user, userReqObj);
                            user.save();
                            const token = await generateJwtToken(user._id);
                            user.token = token;
                            user.active = 0;
                            user.emailtoken = otp;
                            const userObj = createUsersObject(user);

                            transporter.sendMail(mailmessage, function(mailerr, info) {
                                if (mailerr) {
                                    // Add Log Data
                                    requestBody = JSON.stringify(req.body);
                                    logger.error(req.url,requestBody,mailerr);
                                }
                            });

                            // send users response
                            return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.userRegisterSuccessfully, data: userObj});
                        } else if (user.active == 0) {
                            return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotActive, data: {}});
                        } else {
                            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailExists, data: {}});
                        }
                    } else {
                        // store users information
                        User.create(userReqObj, async function (err, user) {
                            if (err) {
                                // Add Log Data
                                requestBody = JSON.stringify(req.body);
                                logger.error(req.url,requestBody,err);
                                return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                            } else {

                                const token = await generateJwtToken(user._id);
                                user.token = token;
                                const userObj = createUsersObject(user);

                                transporter.sendMail(mailmessage, function(mailerr, info) {
                                    if (mailerr) {
                                        // Add Log Data
                                        requestBody = JSON.stringify(req.body);
                                        logger.error(req.url,requestBody,mailerr);
                                    }
                                });

                                // send users response
                                return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.userRegisterSuccessfully, data: userObj});
                            }
                        });
                    }
                });
            }


          });


    }
);

/* Login API */
router.post('/login', [
        body('email').notEmpty().withMessage(constants.emailValRequired).isEmail().withMessage(constants.emailValRequired1),
        body('password').notEmpty().withMessage(constants.pwdValRequired).isLength({ min: 8 }).withMessage(constants.pwdValRequired1)
    ], async function(req, res) {
        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let reserrmsg = convertErrrmsg(errors.array(),lang);
            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: reserrmsg, data: {}});
        } else {

            var email = req.body.email;
            if (req.body.email) {
                let emailPattern = /\S+@\S+\.\S+/;
                if(!emailPattern.test(req.body.email)) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailInvalid, data: {}});
                } else {
                    email = req.body.email.toLowerCase();
                }
            }

            User.findOne({ email: req.body.email }, async function (err, user) {
                if (err) {
                    // Add Log Data
                    requestBody = JSON.stringify(req.body);
                    logger.error(req.url,requestBody,err);
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else if (!user) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailNotExists, data:{}});
                } /*else if(req.body.password != user.password) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.passwordIncorrect, data: {}});
                }*/ else if (user.isverified == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotVerify, data: {}});
                } else if (user.active == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotActive, data: []});
                } else {
                    const token = await generateJwtToken(user._id);
                    user.token = token;
                    const userObj = createUsersObject(user);
                    // Store User Id to Session in Db
                    req.session.user = { userId : user._id, userEmail: user.email };
                    return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.userLoggedInSuccessfully, data: userObj});
                }
            });
        }
    }
);

/* Verify User Account */
router.get('/verify', async function(req,res){
    if (req.query.id != "") {
        await User.findOne({ emailtoken: req.query.id }, async function (err, user) {
            if (err) {
                // Add Log Data
                requestBody = JSON.stringify(req.body);
                logger.error(req.url,requestBody,err);
                //return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.serverMessage, data: {}});
                return res.redirect(config.verifymail1+constants.error+config.verifymail2+'3');
                return response.end();
            } else if (!user) {
                //return res.send({status: constants.errorStatus,issuccess: constants.error, message: constants.userNotExists, data:{}});
                return res.redirect(config.verifymail1+constants.error+config.verifymail2+'2');
                return response.end();
            }
            else
            {
                if(req.query.id == user.emailtoken)
                {
                    const token = await generateJwtToken(user._id);
                    user.isverified = 1;
                    user.active = 1;
                    user.emailtoken = "";
                    user.token = token;
                    await user.save();
                    const userObj = await createUsersObject(user);
                    //return res.send({status: constants.successStatus,issuccess: constants.success, message: constants.userVerifySuccessfully, data: userObj});
                    return res.redirect(config.verifymail1+constants.success+config.verifymail2+'1');
                    return response.end();
                }
                else
                {
                    //return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.badRequest, data: {}});
                    return res.redirect(config.verifymail1+constants.error+config.verifymail2+'4');
                    return response.end();
                }
            }
        });
    }
    else
    {
        //return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.badRequest, data: {}});
        return res.redirect(config.verifymail1+constants.error+config.verifymail2+'4');
        return response.end();
    }
});

/* Logout API */
router.post('/logout', authorize, async function(req,res){
    if (!req.session.user) {
        return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.badRequest, data: {}});
    }
    else
    {
        req.session.destroy(function(err) {
            if (err) {
                // Add Log Data
                requestBody = JSON.stringify(req.body);
                logger.error(req.url,requestBody,err);
                return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.serverMessage, data: {}});
            }
            res.clearCookie(config.sessname);
            return res.send({status: constants.successStatus,issuccess: constants.success, message: "Session Destroy.", data: "Session Destroy."});
        });
    }
});

/* Check Session API */
router.post('/checksession', authorize, async function(req,res){
    if (!req.session.user) {
        return res.send({status: constants.serverStatus,issuccess: constants.error, message: constants.badRequest, data: {}});
    }
    else
    {
        return res.send({status: constants.successStatus,issuccess: constants.success, message: req.session.user, data: req.session.user});
    }
});

/* Sent 6 Digit Code on Email for Forgot Password */
router.post('/forgot-password', [
        body('email').notEmpty().withMessage(constants.emailValRequired).isEmail().withMessage(constants.emailValRequired1),
    ], async function(req,res){

        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let reserrmsg = convertErrrmsg(errors.array(),lang);
            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: reserrmsg, data: {}});
        } else {
            await User.findOne({ email: req.body.email }, async function (err, user) {
                if (err) {
                    // Add Log Data
                    requestBody = JSON.stringify(req.body);
                    logger.error(req.url,requestBody,err);
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else if (!user) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailNotExists, data:{}});
                } else if (user.isverified == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotVerify, data: {}});
                } else if (user.active == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotActive, data: []});
                } else {

                    var email = req.body.email;
                    if (req.body.email) {
                        let emailPattern = /\S+@\S+\.\S+/;
                        if(!emailPattern.test(req.body.email)) {
                            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailInvalid, data: {}});
                        } else {
                            email = req.body.email.toLowerCase();
                        }
                    }

                    // this will convert any number sequence into 6 character.
                    otp = resetpwdOtp(); //randomOtp();
                    var html = 'Hello, <br>Your verification code for password reset is : ' + otp;

                    const mailmessage = {
                                        from: '"' + returnlangmsg.mailfrom1 + '"<' + config.fromEmail + '>',
                                        to: email,
                                        subject: returnlangmsg.mailsubject2,
                                        html : html
                                    };

                    var transporter = nodemailer.createTransport({
                        host: 'smtp.ionos.com',
                        port: 587,
                        secure: false, // use SSL
                        auth: {
                        user: config.authEmail,
                            pass: config.authpwd
                    }
                    });
                    let valid = true;
                    await transporter.sendMail(mailmessage, function(mailerr, info) {
                        if (mailerr) {
                            valid = false;
                            // Add Log Data
                            requestBody = JSON.stringify(req.body);
                            logger.error(req.url, requestBody,mailerr);
                        }
                        else
                        {
                            valid = true;
                        }
                        return res.end();
                    });

                    if (valid == true) {
                        // emailtoken Expire Time
                        var d1 = new Date ();
                        var d2 = new Date ( d1 );
                        d2 = d2.setMinutes ( d1.getMinutes() + 10 );

                        user.emailtoken = otp;
                        user.tokenexpiretime = d2;
                        await user.save();
                        user.emailtoken = "";
                        user.tokenexpiretime = d2;
                        const userObj = createUsersObject(user);
                        return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.VerificationCodeSent, data: userObj});
                    }
                    else
                    {
                        return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.mailNotSend, data: {}});
                    }
                }
            });
        }
});

/* Sent 6 Digit Code on Email for Forgot Password */
router.post('/verify-forgot-password', [
        body('emailtoken').notEmpty().withMessage(constants.emailtokenValRequired).isLength({ min: 6,max: 6 }).withMessage(constants.emailtokenValRequired1)
    ], async function(req,res){
        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let reserrmsg = convertErrrmsg(errors.array(),lang);
            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: reserrmsg, data: {}});
        } else {
            await User.findOne({ emailtoken: req.body.emailtoken }, async function (err, user) {
                if (err) {
                    // Add Log Data
                    requestBody = JSON.stringify(req.body);
                    logger.error(req.url,requestBody,err);
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else if (!user) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailNotExists, data:{}});
                } else if (user.isverified == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotVerify, data: {}});
                } else if (user.active == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotActive, data: []});
                } else {
                    const userObj = createUsersObject(user);
                    return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.userVerifySuccessfully, data:userObj});
                }
            });
        }
});

/* Set New Updated Password */
router.post('/set-new-password', [
        body('password').notEmpty().withMessage(constants.pwdValRequired).isLength({ min: 8 }).withMessage(constants.pwdValRequired1)
    ], async function(req,res){
        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let reserrmsg = convertErrrmsg(errors.array(),lang);
            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: errors.array(), data: {}});
        } else {
            User.findOne({ emailtoken: req.body.emailtoken }, async function (err, user) {
                if (err) {
                    // Add Log Data
                    requestBody = JSON.stringify(req.body);
                    logger.error(req.url,requestBody,err);
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else if (!user) {
                    return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: returnlangmsg.emailNotExists, data:{}});
                } else if (user.isverified == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotVerify, data: {}});
                } else if (user.active == 0) {
                    return res.send({status: returnlangmsg.userDeactivatedStatus,issuccess: constants.error, message: returnlangmsg.userNotActive, data: []});
                } else if (req.body.emailtoken == "") {
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else {
                    let hashedPassword = await bcrypt.hashSync(req.body.password, 8);
                    user.password = req.body.password, //hashedPassword;
                    user.emailtoken = "";
                    user.tokenexpiretime = "";
                    await user.save();
                    user.password = "";
                    user.emailtoken = "";
                    user.tokenexpiretime = "";
                    const userObj = await createUsersObject(user);
                    return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.passwordUpdatesuccess, data:userObj});
                }
            });
        }
});

/* Create a Video test */
router.post('/addvideo',
    async function (req, res) {
        var lang = req.body.lang;
        var returnlangmsg = returnMsg(lang);
        // Serverside Validation error
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let reserrmsg = convertErrrmsg(errors.array(),lang);
            return res.send({status: returnlangmsg.errorStatus,issuccess: constants.error, message: reserrmsg, data: {}});
        } else {
            let videoReqObj = {
                code: req.body.code,
                video_url: req.body.video_url,
                title: req.body.title,
                is_active: req.body.is_active,
                updated_time: req.body.updated_time,
                created_time: req.body.created_time,
                img_url: req.body.img_url
            }
            await Video.create(videoReqObj, async function (err, video) {
                if (err) {
                    requestBody = JSON.stringify(req.body);
                    logger.error(req.url,requestBody,err);
                    return res.send({status: returnlangmsg.serverStatus,issuccess: constants.error, message: returnlangmsg.serverMessage, data: {}});
                } else {
                    const videoObj = await createVideosObject(video);
                    return res.send({status: returnlangmsg.successStatus,issuccess: constants.success, message: returnlangmsg.userRegisterSuccessfully, data: videoObj});
                }
            });
        }
    }
);

router.post('/getvideos', async function (req, res) {
    var recordsPerPage = req.body.recordsPerPage !== undefined && req.body.recordsPerPage !== '' ? req.body.recordsPerPage : 12;
    var recordsOffset = req.body.recordsOffset !== undefined && req.body.recordsOffset !== '' ? req.body.recordsOffset : 0;
    //final data object
    var data = {};
    var condition = {};
    var allcount = {};
    var options = {};
    options.skip = parseInt(recordsOffset);
    options.limit = parseInt(recordsPerPage);
    condition.is_active = 1;
    await Video.countDocuments(condition).exec(async function (err,count){
        allcount = count;
        await async.parallel([
            function (cb) {
                //get videos as per condition
                Video.find(condition)
                    .skip(options.skip)
                    .limit(options.limit)
                    .exec(function (err, videoList) {
                        if (err) {
                            var err = {
                                message: "Oops! something went wrong, please try again later."
                            };
                            cb(err);
                        } else {
                            data = videoList;
                            cb(null);
                        }
                    });
            },
        ], function (err) {
            //get final result and send the response to API.
            if (err) {
                res.json(err);
            } else {
                res.json({
                    data: data,
                    allcount : allcount
                });
            }
        });
    });
});

/* Get User Ip Address and Switch Language */
router.post('/checklang', async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({status: constants.errorStatus,issuccess: constants.error, message: errors.array(), data: {}});
        } else {

            // User Ip Address
            var ip = req.headers['x-forwarded-for'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
            console.log(ip);
            //var ip = "207.97.227.239"; // US
            //var ip = "175.45.176.0"; // KO
            //var ip = "52.78.86.95 "; // OTHER
            var geo = await geoip.lookup(ip);
            var country = geo.country;
            console.log(country);
            //country = "US";
            var lang = "EN";
            if (country == "") {
                lang = "EN";
            }
            else if (country == "KP" || country == "KR" || country == "KO")
            {
                lang = "KO";
            }
            else
            {
                lang = "EN";
            }
            console.log(lang);
            // var lngs = req.i18n.changeLanguage(lang); // will not load that!!! assert it was preloaded
            // var exists = req.i18n.exists('myKey')
            // var translation = req.t('myKey')
            return res.send({status: constants.successStatus,issuccess: constants.success, message: ip, data: lang, lang: lang, ip: ip});
        }
    }
);

module.exports = router;

/* This Function is Use for Send Rendom OTP to User's Email Id for Verify Account */
function randomOtp(argument) {
    var numbers = "0123456789";
    var chars= "acdefhiklmnoqrstuvwxyz";
    var code_length = 6;
    var number_count = 3;
    var letter_count = 3;
    var code = '';
    for(var i=0; i < code_length; i++) {
        var letterOrNumber = Math.floor(Math.random() * 2);
        if((letterOrNumber == 0 || number_count == 0) && letter_count > 0) {
            letter_count--;
            var rnum = Math.floor(Math.random() * chars.length);
            code += chars[rnum];
        }
        else {
            number_count--;
            var rnum2 = Math.floor(Math.random() * numbers.length);
            code += numbers[rnum2];
        }
    }
    return code;
}

function resetpwdOtp(){
    return Math.floor(100000 + Math.random() * 900000);
}

/* Consatnt for Language Change */
function returnMsg(lang) {
    if (lang == "") { lanf = "EN"; } else { lang = lang; }
    if (lang=="EN") {
        langs = {
                    "successStatus" : 200,
                    "errorStatus" : 400,
                    "errorStatusAuthorize" : 401,
                    "errorAuthorize" : 403,
                    "serverStatus" : 500,
                    "success": "success",
                    "error": "error",
                    "serverMessage" : "Something Went Wrong, Please Try Again!",
                    "authenticationFailed" : "Your Authentication Failed, Please Try Again!",
                    "tokenDecodeError" : "Your Authentication Token Wrong, Please Try Again!",
                    "accessDenied" : "Access Denied, Please Try Again!",
                    "emailValRequired" : "Email Field is Required.",
                    "emailValRequired1" : "Please Enter valid Email Address.",
                    "pwdValRequired" : "Password Field is Required.",
                    "pwdValRequired1" : "Please Enter atleast minimum 8 Digit Password.",
                    "emailInvalid" : "Please Enter Valid Email Address!",
                    "emailExists" : "This Email Id is Already Registered with us, Please Enter New Email Id!",
                    "userRegisterSuccessfully" : "We will Sent Verification Link to Registered Email Id, Please Verify your Account!",
                    "userNotActive" : "Your Account was Inactive, Please Contact to Admin!",
                    "userDeactivatedStatus" : 501,
                    "userNotVerify" : "Your Account was not Verified, Please Verify!",
                    "passwordIncorrect" : "Your Password is not Match with Our Data, Please Try Again!",
                    "emailNotExists" : "Email Not Exists in our Database!",
                    "unknownSource" : "Request is from Unknown Source, Please Try Again!",
                    "userLoggedInSuccessfully" : "Login Successfully!",
                    "badRequest" : "Bad Request, Please Try Again!",
                    "userNotExists" : "User Not Fount in Our Database, Please Try Again!",
                    "userVerifySuccessfully" : "Your account is activated. Please log in now.",
                    "mailNotSend" : "Verification Code Not Sent on Email, Please Try Again!",
                    "VerificationCodeSent" : "Verification Code Sent on Your Email, Please check Your Email!",
                    "emailtokenValRequired" : "Verification Code Field is Required.",
                    "emailtokenValRequired1" : "Verification Code Length is 6 Digit Required.",
                    "passwordUpdatesuccess" : "Your Password was Update Successfully, Please Login!",
                    "googleCaptchaError": "Please Verify Google Re-Captcha.",
                    "googleCaptchaServerError": "Google Re-Captcha Verification Failed.",
                    "googleCaptchaServerSuccess": "Google Re-Captcha Verification Successfully.",
                    "mailfrom1" : "Free Stock Video account",
                    "mailsubject1" : 'Verify your Free Stock Video account',
                    "mailsubject2" : "Free Stock Video account password reset code"
                };
    }
    else
    {
        langs = {
                    "successStatus" : 200,
                    "errorStatus" : 400,
                    "errorStatusAuthorize" : 401,
                    "errorAuthorize" : 403,
                    "serverStatus" : 500,
                    "success": "성공",
                    "error": "오류",
                    "serverMessage" : "문제가 발생했습니다. 다시 시도하십시오!",
                    "authenticationFailed" : "인증에 실패했습니다. 다시 시도하십시오!",
                    "tokenDecodeError" : "인증 토큰이 잘못되었습니다. 다시 시도하십시오!",
                    "accessDenied" : "액세스가 거부되었습니다. 다시 시도하십시오!",
                    "emailValRequired" : "이메일 필드는 필수입니다.",
                    "emailValRequired1" : "유효한 이메일 주소를 입력하십시오.",
                    "pwdValRequired" : "비밀번호 필드는 필수입니다.",
                    "pwdValRequired1" : "최소 8 자리 비밀번호를 입력하세요.",
                    "emailInvalid" : "유효한 이메일 주소를 입력하십시오!",
                    "emailExists" : "이 이메일 ID는 이미 등록되어 있습니다. 새 이메일 ID를 입력하십시오!",
                    "userRegisterSuccessfully" : "등록 된 이메일 ID로 확인 링크를 보내드립니다. 계정을 확인하십시오!",
                    "userNotActive" : "귀하의 계정이 비활성화되었습니다. 관리자에게 문의하십시오!",
                    "userDeactivatedStatus" : 501,
                    "userNotVerify" : "계정이 확인되지 않았습니다. 확인하십시오!",
                    "passwordIncorrect" : "귀하의 암호가 당사 데이터와 일치하지 않습니다. 다시 시도하십시오!",
                    "emailNotExists" : "데이터베이스에 이메일이 없습니다!",
                    "unknownSource" : "출처를 알 수없는 요청입니다. 다시 시도하십시오!",
                    "userLoggedInSuccessfully" : "로그인 성공!",
                    "badRequest" : "잘못된 요청입니다. 다시 시도하십시오!",
                    "userNotExists" : "사용자가 데이터베이스에 관심이 없습니다. 다시 시도하십시오!",
                    "userVerifySuccessfully" : "당신의 계정이 활성화 되었습니다. 지금 로그인 하세요.",
                    "mailNotSend" : "이메일로 확인 코드가 전송되지 않았습니다. 다시 시도하십시오!",
                    "VerificationCodeSent" : "이메일로 확인 코드가 전송되었습니다. 이메일을 확인하십시오!",
                    "emailtokenValRequired" : "확인 코드 필드는 필수입니다.",
                    "emailtokenValRequired1" : "확인 코드 길이는 6 자리입니다.",
                    "passwordUpdatesuccess" : "암호가 성공적으로 업데이트되었습니다. 로그인하십시오!",
                    "googleCaptchaError": "Google Re-Captcha를 확인하십시오.",
                    "googleCaptchaServerError": "Google Re-Captcha 확인에 실패했습니다.",
                    "googleCaptchaServerSuccess": "Google Re-Captcha 확인이 성공했습니다.",
                    "mailfrom1" : "Free Stock Video account",
                    "mailsubject1" : 'Free Stock Video 계정을 인증해 주세요',
                    "mailsubject2" : "Free Stock Video 패스워드 재설정 코드"
                };
    }
    return langs;
}

function convertErrrmsg(message,lang) {
    let returnmsgerrs = [];
    let chnagemsg = '';
    for (var i = 0; i < message.length; i++) {
        let rtn = message[i].msg;
        if (lang == "EN") {
            if (rtn == "Email Field is Required.") {
                chnagemsg += "Email Field is Required."+"\n";
            }
            if (rtn == "Please Enter valid Email Address.") {
                chnagemsg += "Please Enter valid Email Address."+"\n";
            }
            if (rtn == "Password Field is Required.") {
                chnagemsg += "Password Field is Required."+"\n";
            }
            if (rtn == "Please Enter atleast minimum 8 Digit Password.") {
                chnagemsg += "Please Enter atleast minimum 8 Digit Password."+"\n";
            }
            if (rtn == "Verification Code Field is Required.") {
                chnagemsg += "Verification Code Field is Required."+"\n";
            }
            if (rtn == "Verification Code Length is 6 Digit Required.") {
                chnagemsg += "Verification Code Length is 6 Digit Required."+"\n";
            }
        }
        else
        {
            if (rtn == "Email Field is Required.") {
                chnagemsg += "이메일 필드는 필수입니다."+"\n";
            }
            if (rtn == "Please Enter valid Email Address.") {
                chnagemsg += "유효한 이메일 주소를 입력하십시오."+"\n";
            }
            if (rtn == "Password Field is Required.") {
                chnagemsg += "비밀번호 필드는 필수입니다."+"\n";
            }
            if (rtn == "Please Enter atleast minimum 8 Digit Password.") {
                chnagemsg += "최소 8 자리 비밀번호를 입력하세요."+"\n";
            }
            if (rtn == "Verification Code Field is Required.") {
                chnagemsg += "확인 코드 필드는 필수입니다."+"\n";
            }
            if (rtn == "Verification Code Length is 6 Digit Required.") {
                chnagemsg += "확인 코드 길이는 6 자리입니다."+"\n";
            }
        }

    }
    return chnagemsg = chnagemsg.substring(0, chnagemsg.length - 1);
}
