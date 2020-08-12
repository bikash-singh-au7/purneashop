// import
const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const { router } = require("../app");
const msg91 = require('msg91-sms');
const { Mongoose } = require("mongoose");

// Create a blank controller
const controller = {};


// create signup controller
controller.signup = (req, res, next) => {
    const message = req.flash("error");
    req.session.current_url = "/account";
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

// create forget password controller
controller.forgotPassword = async (req, res, next) => {
    const message = req.flash("error");
    const categoryData = await categoryModel.find({ category_status: 1 }).lean();
    res.render("users/forgot-password/forgot-password", { csrfToken: req.csrfToken(), catList: categoryData });
}

controller.checkUserIsRegistered = (req, res) => {
    const mobile = req.body.user_mobile;
    const regX = /^[0]?[789]\d{9}$/;
    if (mobile == "") {
        return res.send({ status: 0, message: "Please Enter Mobile Number" });
    } else if (regX.test(mobile)) {
        userModel.findOne({ user_mobile: mobile }, (err, data) => {
            if (err) {
                return res.send({ status: 0, message: "Oops Some Error Occured !!" });
            } else if (!data) {
                return res.send({ status: 0, message: "This Mobile Number is Not Registered" });
            } else {

                //Authentication Key 
                var authkey = '224991AuVykO8pSsz5b4313bf';

                //for single number
                var number = mobile;

                //message
                let otp = Math.floor(Math.random() * (9999 - 1000)) + 1000;
                var message = 'Your OTP is ' + otp + ' Team www.purneashop.com. Ab Onine Karega Purnea';

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
                    if (/^[a-zA-Z0-9]{24}$/g.test(response)) {
                        // req.flash({success:"OTP Send Successfuy !"});
                        req.session.forgotPassword = {
                            mobile: mobile,
                            otp: otp,
                            _id: data._id
                        };
                        return res.send({ status: 1, success: "OTP Send Successfuy !" });
                        // console.log(response, "send");
                    } else {
                        return res.send({ status: 0, message: "Some Error Occured While Sending OTP Please Support to Us." })
                    }

                });
            }
        });
    } else {
        return res.send({ status: 0, message: "Please Enter Valid Mobile Number" });
    }
}

controller.verifyForgotOtp = async (req, res) => {
    const form_otp = req.body.otp;
    const gen_otp = req.session.forgotPassword.otp;
    if (form_otp == gen_otp) {
        return res.send({ status: 1, message: 'Otp Verified', csrfToken: req.csrfToken(), });
    } else {
        return res.send({ status: 0, message: 'You Entered Wrong OTP, Plese Enter Correct OTP' });
    }
}

controller.createPasswordForm = async (req, res) => {
    const gen_otp = req.session.forgotPassword;
    if (gen_otp === undefined) {
        return res.redirect("/users/forgotPassword");
    } else {
        const categoryData = await categoryModel.find({ category_status: 1 }).lean();
        return res.render("users/forgot-password/create-password", { csrfToken: req.csrfToken(), catList: categoryData });
    }



}

controller.createPassword = async (req, res) => {
    const new_password = req.body.new_password;
    const confirm_password = req.body.confirm_password;
    req.checkBody("new_password", "Required Field").notEmpty();
    req.checkBody("confirm_password", "Required Field").notEmpty();
    req.checkBody('confirm_password', 'Passwords do not match.').equals(new_password);

    const errors = req.validationErrors();
    if (errors) {
        let obj = {};
        errors.forEach(element => {
            obj[element.param + "_error"] = element.msg;
            obj[element.param] = req.body[element.param];
        });
        console.log(obj)
        return res.send({ status: 0, message: obj, data: req.body });
    }
    const gen_otp = req.session.forgotPassword;
    const userData = new userModel();
    const user_password = userData.encryptPassword(req.body.confirm_password);
    userModel.findByIdAndUpdate({ _id: gen_otp._id }, { user_password: user_password }, (err, data) => {
        if (!err) return res.send({ status: 1, message: "Password Changed Successfully" });
        else return res.send({ status: 0, message: "Some Error Occured" });
    })


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

    if (body.pincode == "854301" || body.pincode == "854302" || body.pincode == "854303" || body.pincode == "854304" || body.pincode == "854301") {
        const addressData = new addressModel(body);
        addressData.save((err, data) => {
            let url = '/users/address';
            if (!err) {
                req.flash("success", "Address Added uccessfully");

                if (req.session.current_url == "/checkout") {
                    url = "/checkout";
                } else {
                    url = "/users/address";
                }
                return res.redirect(url);
            }
            req.flash("error", "Oops Error Occured!!");
            return res.redirect(url);
        })
    } else {
        req.flash("message", { pincode_error: "Order is not accepting to this pin code" });
        req.flash("data", body);
        return res.redirect("/users/addAddress");
    }


}

// Add address controller
controller.deleteAddress = (req, res, next) => {
    const id = req.query.id;
    addressModel.findByIdAndDelete({ _id: id }, (err, data) => {
        if (!err) return res.send({ status: 1, title: "Deleted", message: "Address Deleted Successfully!", modal: "success" });
        return res.send({ status: 0, title: "Oops Error", message: "Address Not Deleted!", modal: "error" });
    });
}


// Add to Kart controller
controller.addToCart = (req, res, next) => {
    const slag = req.params.slag;
    const qty = req.query.qty;
    productModel.findOne({ product_slag: slag }, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            let newItem = true;
            if (typeof req.session.cart == "undefined") {
                req.session.cart = [];
                req.session.cart.push(
                    {
                        product_image: data.product_image,
                        product_name: data.product_name,
                        product_slag: data.product_slag,
                        product_price: data.product_price,
                        qty: qty,
                    }
                )
            } else {
                let cart = req.session.cart;
                for (let i = 0; i < cart.length; i++) {
                    if (cart[i]["product_slag"] == slag) {
                        cart[i].qty++;
                        newItem = false;
                        break;
                    }
                }
                if (newItem) {
                    req.session.cart.push(
                        {
                            product_image: data.product_image,
                            product_name: data.product_name,
                            product_price: data.product_price,
                            product_slag: data.product_slag,
                            qty: qty,
                        }
                    )
                }
            }
        }
        // req.flash("success", "Product Added");
        // res.redirect("back");

        res.send({ status: true, value: 'Product Added', cart: req.session.cart });
    }).lean();
}

// View your cart controller
controller.yourCart = (req, res, next) => {
    req.session.current_url = req.url;
    let cart = req.session.cart;
    let totalAmount = 0;
    let order = true;
    if (typeof cart == "undefined") {
        cart = [];
    } else {

        for (let i = 0; i < cart.length; i++) {
            cart[i].subtotal = (cart[i].product_price * cart[i].qty).toFixed(2);
            totalAmount += Number(cart[i].subtotal);
        }
    }

    if (totalAmount < 400) {
        order = false;
    }
    res.render("users/cart", { cart: cart, success: req.flash("success"), totalAmount: totalAmount, order: order });
}

// checkout controller
controller.checkout = (req, res, next) => {
    req.session.current_url = req.url;
    addressModel.find({ user_id: req.session.user._id }, (err, data) => {
        if (!err) return res.render("users/checkout", { errors: req.flash("error"), list: data, success: req.flash("success"), csrfToken: req.csrfToken(), });
        return res.render("users/checkout", { errors: req.flash("error"), list: err, success: [], csrfToken: req.csrfToken(), });
    }).lean();
}

// check checkout controller
controller.getCheckout = (req, res, next) => {
    req.checkBody("address", "Address is Required").notEmpty();
    req.checkBody("payment_mode", "Mode is Required").notEmpty();
    const errors = req.validationErrors();
    if (errors) {
        const message = [];
        errors.forEach(element => {
            message.push(element.msg);
        });
        req.flash("error", message);
        return res.redirect("/users/checkout");
    }


    let cart = req.session.cart;
    let totalAmount = 0;
    if (typeof cart == "undefined") {
        cart = [];
    } else {

        for (let i = 0; i < cart.length; i++) {
            cart[i].subtotal = (cart[i].product_price * cart[i].qty).toFixed(2);
            totalAmount += Number(cart[i].subtotal);
        }
    }

    const body = req.body;
    body.cart = cart;
    body.user_id = req.session.passport.user;
    body.total_amount = totalAmount;



    const orderData = new orderModel(body);
    orderData.save((err, data) => {
        if (err) {
            return console.log(err);
        } else {
            const mobile = req.session.user.mobile;

            console.log(mobile, "mono");
            //Authentication Key 
            var authkey = '224991AuVykO8pSsz5b4313bf';

            //for single number
            var number = mobile;

            //message
            const msg = "Hi " + req.session.user.name + ", Your Order Pending and Order Id is: " + data._id + " Wait for Confirm Your Order. Team www.purneashop.com.";

            //Sender ID
            var senderid = 'PUSHOP';

            //Route
            var route = '4';

            //Country dial code
            var dialcode = '91';
            //send to single number
            // if (!user_info === undefined) {

            // }
            msg91.sendOne(authkey, number, msg, senderid, route, dialcode, function (response) {
                //Returns Message ID, If Sent Successfully or the appropriate Error Message
                if (/^[a-zA-Z0-9]{24}$/g.test(response)) {
                    // req.flash({success:"OTP Send Successfuy !"});
                    console.log("mobile",number, "sms", response);
                    
                    delete req.session.cart;
                    req.flash("success", "Order Successfull Competed, Check Your Inbox.");
                    return res.redirect("/users/order");
                    // console.log(response, "send");
                } else {
                    req.flash("success", "Order Successfull Competed");
                    return res.redirect("/users/order");
                }

            });
        }
    })

}

// Update Kart controller
controller.updateCart = (req, res, next) => {
    let cart = req.session.cart;
    let action = req.query.action;
    let slag = req.params.slag;

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].product_slag == slag) {
            if (action == "add") {
                cart[i].qty++;
            } else if (action == "minus") {
                if (cart[i].qty <= 1) {

                } else {
                    cart[i].qty--;
                }
            } else if (action == "remove") {
                if (cart.length == 1) {
                    delete req.session.cart;
                } else {
                    cart.splice(i, i+1);
                }
            }

        }
    }
    req.flash("success", "Cart Updated");
    res.redirect("back");
}

controller.order = async (req, res, next) => {
    try {
        const data = await orderModel.find({ user_id: req.session.passport.user }).lean().sort({order_date:-1});

        console.log(data);
        for (let i = 0; i < data.length; i++) {
            let shippedDate = data[i].shipped_date == null ? "Not Delevered Yet" : data[i].shipped_date.toDateString();
            data[i].order_date = data[i].order_date.toDateString();
            data[i].shipped_date = shippedDate;
            data[i].sn = i + 1;
            let status = "Pending";
            let isCancel = 0;
            let isCancled = 0;
            if (data[i].order_status == 0) {
                status = "Pending";
                isCancel = 1;
            }else if (data[i].order_status == 1) {
                status = "Confirmed";
                isCancel = 1;
            } else if (data[i].order_status == 2) {
                status = "Delevered";
            } else if (data[i].order_status == 3) {
                status = "Canceled";
                isCancled = 1;
            }
            data[i].order_status = status;
            data[i].isCancel = isCancel;
            data[i].isCancled = isCancled;

            const address = await addressModel.findOne({ _id: data[i].address }).lean();
            data[i].address = address.user_name + ",(" + address.address + "," + address.landmark + "," + address.pincode + ")";
            data[i].name = address.user_name;
        }
        return res.render('users/order', { list: data, csrfToken: req.csrfToken(), title: 'Online Grocery', message: req.flash("success") });
    } catch (e) {
        console.log("Order Page Error", e)
        return res.render('users/order', { list: [], csrfToken: req.csrfToken(), title: 'Online Grocery', message: ["Oops Error Occured"] });
    }

}





// signin controller
controller.signin = (req, res, next) => {
    const message = req.flash("error");
    console.log("url", req.session.current_url)
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

// Cancel order
controller.orderCancel = (req, res, next) => {
    const order_id = req.body.orderId;
    orderModel.findByIdAndUpdate({ _id: order_id }, { order_status: 3 }, (err, data) => {
        if (!err) {
            userModel.findOne({ _id: data.user_id }, (e, user) => {
                if (!e) {
                    //Authentication Key 
                    var authkey = '224991AuVykO8pSsz5b4313bf';

                    //for single number
                    var number = user.user_mobile;;

                    //message
                    const msg = "Hii " + user.user_name + " Your Order is Canceled order Id is: " + data._id + ", Thanks for Choosing www.purneashop.com. Team PurneaShop.";

                    //Sender ID
                    var senderid = 'PUSHOP';

                    //Route
                    var route = '4';

                    //Country dial code
                    var dialcode = '91';
                    //send to single number
                    // if (!user_info === undefined) {

                    // }
                    msg91.sendOne(authkey, number, msg, senderid, route, dialcode, function (response) {
                        //Returns Message ID, If Sent Successfully or the appropriate Error Message
                        if (/^[a-zA-Z0-9]{24}$/g.test(response)) {
                            // req.flash({success:"OTP Send Successfuy !"});
                            console.log("mobile", number, "sms", response);
                            return res.send({ orderId: order_id, status: 1, title: "Done", message: "Updated Successfully!", modal: "success" });
                        } else {
                            return res.send({status: 1, orderId: order_id, title: "Done", message: "Order Canceled!", modal: "success" });
                        }

                    });
                } else {
                    return res.send({ status: 1, orderId: order_id, title: "Done", message: "Order Canceled, But Message Not Send!", modal: "success" });
                }
            })
        } else {
            return res.send({ status: 0, orderId: order_id, title: "Oops Error", message: "Data Does Not Updated", modal: "error" });
        }
    });

}

module.exports = controller;
