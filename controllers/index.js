//
var express = require('express');
var router = express.Router();


//
router.get('/', function (req, res) {
    res.render('index');
});
//
router.get('/usecase', function (req, res) {
    res.render('usecase');
});
//
router.get('/terms', function (req, res) {
    res.render('terms');
});
//
router.get('/privacy', function (req, res) {
    res.render('privacy');
});
//
router.get('/api', function (req, res) {
    res.render('api');
});
//
router.get('/signup', function (req, res) {
    res.render('signup');
});
//
router.get('/login', function (req, res) {
    res.render('login');
});
//
router.get('/forgot-password', function (req, res) {
    res.render('forgot-password');
});
//
router.get('/video', function (req, res) {
    res.render('video');
});
//
router.get('/signup-success', function (req, res) {
    res.render('signup-success');
});
//
router.get('/forgot-password', function (req, res) {
    res.render('forgot-password');
});
//
router.get('/verify-password', function (req, res) {
    res.render('verify-password');
});
//
router.get('/reset-password', function (req, res) {
    res.render('reset-password');
});
//
router.get('/verification', function (req, res) {
    res.render('verification');
});
//
router.get('/opensource', function (req, res) {
    res.render('opensource');
});
module.exports = router;
