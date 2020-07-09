// import
const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const { router } = require("../app");
const msg91 = require('msg91-sms');

// Create a blank controller
const controller = {};


// create signup controller
controller.signup = (req, res, next) => {
    const message = req.flash("error");
    res.render("users/signup", { csrfToken: req.csrfToken(), data: req.flash("data")[0], message: message[0], hasError: message.length > 0 });
}

// check signup controller
controller.getSignup = (req, res, next) => {
    const body = {
        user_name: req.body.user_name,
        user_email: req.body.user_email,
        user_password: req.body.user_password,
        user_mobile: req.body.user_mobile,
    }
    const userData = new userModel(body);
    userData.save((err, data) => {
        if (!err) {
            res.redirect("/");
        }
        else {
            const formError = {};
            if (err.name == 'ValidationError') {

                for (field in err.errors) {
                    formError[field] = err.errors[field].message;
                }
                res.render("users/signup", { status: 0, formError });
            } else if (err.name == "MongoError") {
                formError.product_name = err.keyValue["user_mobile"] + " allready exist";
                res.render("users/signup", { status: 0, formError });
            }
            else {
                console.log('Error during record insertion : ' + err);
            }

        }
    });
}

// address controller
controller.address = (req, res, next) => {
    req.session.current_url = req.url;
    const success = req.flash("success");
    const user_id = req.session.user._id;
    addressModel.find({ user_id: user_id }, (err, data) => {
        if (!err) return res.render("users/address", { data: data, success: success, isSuccess: success.length > 0 });
        return res.render("users/address", { data: [], success: '', isSuccess: false });
    }).lean();
}

// address controller
controller.addAddress = (req, res, next) => {
    
    const error = req.flash("error");
    const success = req.flash("success");

    // console.log('data',req.flash("data")[0])
    // console.log('message',req.flash("message")[0])


    res.render("users/add-address", { csrfToken: req.csrfToken(), error: error, success: success, hasError: error.length > 0, isSuccess: success.length > 0, data: req.flash("data")[0], message: req.flash("message")[0] });
}

// Add address controller
controller.getAddAddress = (req, res, next) => {
    const body = req.body;
    body.user_id = req.session.user._id;
    req.checkBody("user_name", "Required Field").notEmpty();
    req.checkBody("user_mobile", "Required Field").notEmpty();
    req.checkBody("address", "Required Field").notEmpty();
    req.checkBody("landmark", "Required Field").notEmpty();
    req.checkBody("pincode", "Required Field").notEmpty();
    req.checkBody("address_type", "Required Field").notEmpty();
    const errors = req.validationErrors();
    if (errors) {
        let obj = {}
        errors.forEach(element => {
            obj[element.param + "_error"] = element.msg;
            obj[element.param] = req.body[element.param];
        });

        req.flash("message", obj);
        req.flash("data", body);
        return res.redirect("/users/addAddress");
    }

    if (body.pincode != "854301") {
        req.flash("message", { pincode_error: "Order is not accepting to this pin code" });
        req.flash("data", body);
        return res.redirect("/users/addAddress");
    }
    const addressData = new addressModel(body);
    addressData.save((err, data) => {
        let url = '/users/address';
        if (!err) {
            req.flash("success", "Address Added uccessfully");
            
            if(req.session.current_url == "/checkout"){
                url = "/checkout";
            }else{
                url = "/users/address";
            }
            return res.redirect(url);
        }
        req.flash("error", "Oops Error Occured!!");
        return res.redirect(url);
    })

}

// Add address controller
controller.deleteAddress = (req, res, next) => {
    const id = req.query.id;
    addressModel.findByIdAndDelete({ _id: id }, (err, data) => {
        if (!err) return res.send({ status: 1, title: "Deleted", message: "Address Deleted Successfully!", modal: "success" });
        return res.send({ status: 0, title: "Oops Error", message: "Address Not Deleted!", modal: "error" });
    });
}


// signin controller
controller.signin = (req, res, next) => {
    const message = req.flash("error");
    res.render("users/signin", { csrfToken: req.csrfToken(), message: message, hasError: message.length > 0 });
}

// Enter OTP
controller.enterOTP = (req, res, next) => {
    const user_info = req.session.otp;
    // if(user_info === undefined){
    //     return res.render("users/enter-otp", { csrfToken: req.csrfToken(), hasError: true, err_msg: "OTP Not Send." });
    // }
    //Authentication Key 
    var authkey = '224991AuVykO8pSsz5b4313bf';

    //for single number
    var number = user_info.mobile;

    //message
    var message = 'Hii ' + user_info.name + ', Thanks for registration to PurneaShop. Your OTP is : ' + user_info.otp;

    //Sender ID
    var senderid = 'PUSHOP';

    //Route
    var route = '4';

    //Country dial code
    var dialcode = '91';


    //send to single number
    // if (!user_info === undefined) {
        
    // }
    msg91.sendOne(authkey, number, message, senderid, route, dialcode, function (response) {
        //Returns Message ID, If Sent Successfully or the appropriate Error Message
        console.log(response);
        req.session.passport = {};
        return res.render("users/enter-otp", { csrfToken: req.csrfToken(), isSuccess: true, success_msg: "OTP Send Successfully." });
    });
}

controller.verifyOTP = (req, res, next) => {
    const user_info = req.session.otp;
    const form_otp = req.body.otp;
    if (user_info.otp == form_otp) {
        userModel.findByIdAndUpdate({ _id: user_info._id }, { user_status: 1 }, (err, data) => {
            if (!err) {
                req.session.passport = { user: req.session.otp._id };
                req.session.user = { name: user_info.name, _id: user_info._id };
                req.session.otp = {};
                return res.send({ status: 1, message: "OTP Verified Successfuy" })
            } else {
                return res.send({ status: 0, message: "OTP Verified But DataBase Error" })
            }
        });
    } else {
        return res.send({ status: 0, message: "OTP Invalid, Please Enter Valid OTP" })
    }
}

// logout  controller
controller.logout = (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect("/");
}

// account controller
controller.account = (req, res, next) => {
    res.render("users/account");
}


module.exports = controller;
