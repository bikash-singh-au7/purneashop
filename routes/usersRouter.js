var express = require('express');
var router = express.Router();
var http = require("https");
const userController = require("../controller/usersController");
const { check, validationResult } = require('express-validator');
const csrf = require("csurf");
const msg91 = require('msg91-sms');
const sms = require("../helper/sendSms");
const passport = require('passport');
const csrfProtection = csrf();
router.use(csrf());

router.get('/account', isLoggedIn, userController.account);
router.get('/address', isLoggedIn, userController.address);
router.get('/addAddress', isLoggedIn, userController.addAddress);
router.post('/getAddAddress', isLoggedIn, userController.getAddAddress);
router.get('/deleteAddress', isLoggedIn, userController.deleteAddress);
router.get('/logout', isLoggedIn, userController.logout);

// Password Reset
router.get('/forgotPassword', userController.forgotPassword);
router.post('/checkUserIsRegistered', userController.checkUserIsRegistered);
router.post('/verifyForgotOtp', userController.verifyForgotOtp);
router.get('/createPasswordForm', userController.createPasswordForm);
router.post('/createPassword', userController.createPassword);

router.get("/sms", (req, res) => {
  //Authentication Key 
  var authkey = '224991AuVykO8pSsz5b4313bf';

  //for multiple numbers
  var numbers = [];
  numbers.push('');

  //for single number
  var number = '9117162463';

  //message
  var message = 'welcome';

  //Sender ID
  var senderid = 'AUXOUS';

  //Route
  var route = '4';

  //Country dial code
  var dialcode = '91';


  //send to single number

  msg91.sendOne(authkey, number, message, senderid, route, dialcode, function (response) {

    //Returns Message ID, If Sent Successfully or the appropriate Error Message
    console.log(response);
    res.send(response)
  });
})

router.get("/sendSms", (req, res)=>{  
  sms.sendSMS(9117162463, "wecome");
  
})
router.get("/enterOTP", userController.enterOTP);
router.post("/verifyOTP", userController.verifyOTP);

router.use("/", notLoggedIn, (req, res, next) => {
  next();
})

/* GET users listing. */
router.get('/signup', userController.signup);

router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/users/enterOTP',
  failureRedirect: '/users/signup',
  failureFlash: true
}));

router.get('/signin', userController.signin);

router.post('/signin', passport.authenticate('local.signin', {
  successRedirect: '/yourCart',
  failureRedirect: '/users/signin',
  failureFlash: true
}));

// router.post('/signup', userController.getSignup);



module.exports = router;


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/signin");
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}