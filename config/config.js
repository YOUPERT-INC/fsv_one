module.exports = {
    'secret': 'protectedSecretToken',
    'database': {
        'username': 'yourusername',
        'password': 'yourpassword',
        'host': 'localhost',
        'database': 'fsvonline'
    },
    "AppDev": "http://localhost:3001",
    "AppProd": "",
    "fromName": "FSV Online",
    "fromEmail": "support@fsv.one",
    "authEmail": "support@fsv.one",
    "authpwd": "your pass",
    "sessname": "sid",
    "sesstime" : parseInt(3600000*2),
    "googleCaptchaSecretKey": "your key",
    "googleCaptchaVerificationUrl": "https://www.google.com/recaptcha/api/siteverify?secret=",
    "verifymail1" : "http://localhost:3001/verification.?issuccess=",
    "verifymail2" : "&message="
};
