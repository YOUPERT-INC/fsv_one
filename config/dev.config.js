module.exports = {
    'secret': 'protectedSecretToken',
    'database': {
        'username': 'fsvonline',
        'password': 'fsvonline',
        'host': 'localhost',
        'database': 'fsvonline'
    },
    "AppDev": "http://localhost:8000/",
    "AppProd": "",
    "fromName": "Alex Test",
    "fromEmail": "addyouremail@gmail.com",
    "authEmail": "addyouremail@gmail.com",
    "authpwd": "Password",
    "sessname": "sid",
    "sesstime" : parseInt(3600000*2),
    "googleCaptchaSecretKey": "addYourKey",
    "googleCaptchaVerificationUrl": "https://www.google.com/recaptcha/api/siteverify?secret=",
    "verifymail1" : "http://localhost/fsvonline/fsv-online/verification.html?issuccess=",
    "verifymail2" : "&message="
};