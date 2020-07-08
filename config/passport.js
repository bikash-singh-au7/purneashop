const passport = require("passport");
const userModel = require("../models/userModel");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt-nodejs");

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    userModel.findById(id, (err, user)=>{
        done(err, user);
    })
});

passport.use('local.signup', new localStrategy({
    usernameField: 'user_email',
    passwordField: 'user_password',
    passReqToCallback: true
}, function(req, user_email, user_password, done){
    req.checkBody("user_email", "Invalid Email").notEmpty().isEmail();
    req.checkBody("user_name", "Required Field").notEmpty();
    req.checkBody("user_mobile", "Required Field").notEmpty();
    req.checkBody("user_password", "Required Field").notEmpty();
    const errors = req.validationErrors();
    if(errors){
        const message = [];
        errors.forEach(element => {
            message.push(element.msg);
        });
        return done(null, false, req.flash("error", message));
    }


    userModel.findOne({'user_email': user_email}, (err, user)=>{
        if(err){
            return done(err);
        }
        if(user){
            return done(null, false, {message:"Email is allready in use"});
        }

        const userData = new userModel();
        userData.user_name = req.body.user_name;
        userData.user_email = user_email;
        userData.user_mobile = req.body.user_mobile;
        userData.user_password = userData.encryptPassword(user_password);
        userData.save((err, user)=>{
            if(err){
                return done(err);
            }
            req.session.user = {
                name: user.user_name,
                _id: user._id
            };
            return done(null, userData);
        })

    })
}));


passport.use('local.signin', new localStrategy({
    usernameField: 'user_email',
    passwordField: 'user_password',
    passReqToCallback: true
}, function(req, user_email, user_password, done){
    req.checkBody("user_email", "Invalid Email").notEmpty().isEmail();
    req.checkBody("user_password", "Required Field").notEmpty();
    const errors = req.validationErrors();
    if(errors){
        const message = [];
        errors.forEach(element => {
            message.push(element.msg);
        });
        return done(null, false, req.flash("error", message));
    }


    userModel.findOne({'user_email': user_email}, (err, user)=>{
        if(err){
            return done(err);
        }
        if(!user){
            return done(null, false, {message:"No user found"});
        }

        if(!user.validPassword(user_password)){
            return done(null, false, {message:"Wrong Password"});
        }
        req.session.user = {
            name: user.user_name,
            _id: user._id
        };
        return done(null, user)

    })
}));


module.exports = passport;