const passport = require("passport");
const userModel = require("../models/userModel");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt-nodejs");

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    userModel.findById(id, (err, user) => {
        done(err, user);
    })
});


passport.use('local.signup', new localStrategy({
    usernameField: 'user_mobile',
    passwordField: 'user_password',
    passReqToCallback: true
}, function (req, user_mobile, user_password, done) {
    req.checkBody("user_name", "Required Field").notEmpty().trim();
    req.checkBody("user_mobile", "Enter a Valid Number").notEmpty().isLength({max:10, min:10}).isInt();
    req.checkBody("user_password", "Password must greater then 5").notEmpty().isLength({min:5});
    const errors = req.validationErrors();
    
    if (errors) {
        let obj = {}
        errors.forEach(element => {
            obj[element.param+"_error"] = element.msg;
            obj[element.param] = req.body[element.param];
        });
        
        // req.flash("message", obj);
        // req.flash("data", body);
        // // return res.redirect("/users/addAddress");

        // const message = [];
        // errors.forEach(element => {
        //     message.push(element.msg);
        // });
        req.flash("data", req.body);
        return done(null, false, req.flash("error", obj));
    }


    userModel.findOne({ 'user_mobile': user_mobile }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (user) {
            req.flash("data", req.body);
            return done(null, false, req.flash("error", {user_mobile_error: "Mobile Number allready exist"}));
        }

        const userData = new userModel();
        userData.user_name = req.body.user_name;
        userData.user_email = req.body.user_email;
        userData.user_mobile = user_mobile;
        userData.user_password = userData.encryptPassword(user_password);
        userData.save((err, user) => {
            if (err) {
                return done(err);
            }
            req.session.user = {
                name: user.user_name,
                _id: user._id,
                mobile: user.user_mobile
            };

            req.session.otp = {
                name: user.user_name,
                _id: user._id,
                mobile: user.user_mobile,
                otp: Math.floor(Math.random() * (9999 - 1000) ) + 1000
            };
            return done(null, userData);
        })

    })
}));


passport.use('local.signin', new localStrategy({
    usernameField: 'user_email',
    passwordField: 'user_password',
    passReqToCallback: true
}, function (req, user_mobile, user_password, done) {
    req.checkBody("user_email", "Invalid Mobile Number").notEmpty().isLength({max:10, min:10}).isInt();
    req.checkBody("user_password", "Invalid Password").notEmpty().isLength({min:5});
    const errors = req.validationErrors();
    if (errors) {
        const message = [];
        errors.forEach(element => {
            message.push(element.msg);
        });
        return done(null, false, req.flash("error", message));
    }


    userModel.findOne({ 'user_mobile': user_mobile, user_status: 1 }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: "No user found" });
        }

        if (!user.validPassword(user_password)) {
            return done(null, false, { message: "Wrong Password" });
        }
        req.session.user = {
            name: user.user_name,
            _id: user._id,
            mobile: user.user_mobile
        };
        return done(null, user);

    })
}));


module.exports = passport;