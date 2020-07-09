// import
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const addressModel = require("../models/addressModel");
const orderModel = require("../models/orderModel");
const { session } = require("passport");
const mongoose = require("mongoose");
const msg91 = require("msg91-sms");

// Create a blank controller
const controller = {};


// create index controller
controller.index = async (req, res, next) => {
    // Getting Product
    const productData = await productModel.find({ product_status: 1 }).limit(4).lean();

    // Getting All Category
    const categoryData = await categoryModel.find({ category_status: 1 }).lean();
    let categoryWise = {};
    let p = [];

    // Add Discount Properties
    for (let x in productData) {
        const mrp = productData[x].product_mrp;
        const price = productData[x].product_price;
        const per = Math.trunc(100 - ((100 * price) / mrp));
        productData[x].discount = per + "%";
    }

    // Getting Data Category Wise
    for (let x in categoryData) {
        p = await productModel.find({ "product_category._id": categoryData[x]._id, product_status: 1 }).limit(4).lean();
        categoryWise[categoryData[x].category_name] = p;
    }

    // Adding discount property
    for (const [key, value] of Object.entries(categoryWise)) {
        for (const [innerKey, innerValue] of Object.entries(value)) {
            const mrp = innerValue.product_mrp;
            const price = innerValue.product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            categoryWise[key][innerKey].discount = per;
        }
    }


    return res.render('index', { list: productData, catList: categoryData, categoryWise: categoryWise, title: 'Online Grocery', success: req.flash("success") });
}

// category controller
controller.category = (req, res, next) => {
    const slag = mongoose.Types.ObjectId(req.params.slag);
    productModel.find({ "product_category._id": slag }, (err, data) => {
        for (let x in data) {
            const mrp = data[x].product_mrp;
            const price = data[x].product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            data[x].discount = per + "%";
        }
        if (!err) {
            categoryModel.find((e, cat) => {
                if (!err) return res.render('category', { list: data, catList: cat, title: 'Online Grocery', success: req.flash("success") });
                return res.render('category', { list: data, catList: [], title: 'Online Grocery', success: req.flash("success") });
            }).lean();
        }
        else return res.render('category', { list: {}, title: 'Online Grocery' });
    }).lean();
}


// product controller
controller.products = (req, res, next) => {
    productModel.find({ product_slag: req.params.slag }, (err, data) => {
        for (let x in data) {
            const mrp = data[x].product_mrp;
            const price = data[x].product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            data[x].discount = per + "%";
        }
        if (!err) {
            categoryModel.find((e, cat) => {
                if (!err) return res.render('products', { list: data, catList: cat, title: 'Online Grocery', success: req.flash("success") });
                return res.render('index', { list: data, catList: [], title: 'Online Grocery', success: req.flash("success") });
            }).lean();
        }
        // if (!err) return res.render('products', { list: data, title: 'Online Grocery', success: req.flash("success")});
        else return res.render('products', { list: {}, catList: cat, title: 'Online Grocery' });
    }).lean();

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
                            product_image: data.product_imaage,
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
            cart[i].subtotal = cart[i].product_price * cart[i].qty;
            totalAmount += cart[i].subtotal;
        }
    }

    if (totalAmount < 200) {
        order = false;
    }
    res.render("cart", { cart: cart, success: req.flash("success"), totalAmount: totalAmount, order: order });
}

// checkout controller
controller.checkout = (req, res, next) => {
    req.session.current_url = req.url;
    addressModel.find({ user_id: req.session.user._id }, (err, data) => {
        if (!err) return res.render("checkout", { errors: req.flash("error"), list: data, success: req.flash("success") });
        return res.render("checkout", { errors: req.flash("error"), list: err, success: [] });
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
        return res.redirect("/checkout");
    }


    let cart = req.session.cart;
    let totalAmount = 0;
    if (typeof cart == "undefined") {
        cart = [];
    } else {

        for (let i = 0; i < cart.length; i++) {
            cart[i].subtotal = cart[i].product_price * cart[i].qty;
            totalAmount += cart[i].subtotal;
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
            const msg = "Hii " + req.session.user.name + " Your Order is Confirmed and Order Id is: " + data._id + ", Thanks for Choosing Purneashop.com.";
            
            //Authentication Key 
            var authkey = '224991AuVykO8pSsz5b4313bf';

            //for single number
            var number = mobile;

            //message
            var message = msg;

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
                delete req.session.cart;
                req.flash("success", "Order Successfull");
                return res.redirect("/order");
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
                    cart.splice(i, i);
                }
            }

        }
    }
    req.flash("success", "Cart Updated");
    res.redirect("back");
}

controller.order = async (req, res, next) => {
    try {

        const data = await orderModel.find({ user_id: req.session.passport.user }).lean();

        for (let i = 0; i < data.length; i++) {
            let shippedDate = data[i].shipped_date == null ? "Not Delevered Yet" : data[i].shipped_date.toDateString();
            data[i].order_date = data[i].order_date.toDateString();
            data[i].shipped_date = shippedDate;
            data[i].sn = i + 1;
            let status = "Confirm";
            if (data[i].order_status == 1) {
                status = "Dispatched";
            } else if (data[i].order_status == 2) {
                status = "Delevered";
            } else if (data[i].order_status == 3) {
                status = "Canceled";
            }
            data[i].order_status = status;



            const address = await addressModel.findOne({ _id: data[i].address }).lean();
            data[i].address = address.user_name + ",(" + address.address + "," + address.landmark + "," + address.pincode + ")";
            data[i].name = address.user_name;
        }
        return res.render('order', { list: data, title: 'Online Grocery' });
    } catch (e) {
        console.log("Order Page Error", e)
    }

    //     }else{
    //         return res.render('order', { list: {}, title: 'Online Grocery' });
    //     } 
    // }).lean();

}

// create order controller
// controller.order = (req, res, next) => {
//     orderModel.find({user_id: req.session.passport.user},(err, data) => {
//         if (!err) {
//             for(let i = 0; i < data.length; i++){
//                 let shippedDate = data[i].shipped_date == null? "Not Delevered Yet" : data[i].shipped_date.toDateString();
//                 data[i].order_date = data[i].order_date.toDateString();
//                 data[i].shipped_date = shippedDate;
//                 data[i].sn = i+1;
//                 let status = "Confirm";
//                 if(data[i].order_status == 1) {
//                     status = "Dispatched";
//                 }else if(data[i].order_status == 2){
//                     status = "Delevered";
//                 }else if(data[i].order_status == 3){
//                     status = "Canceled";
//                 }
//                 data[i].order_status = status;
//             }
//             addressModel.findOne({_id: })



//             return res.render('order', { list: data, title: 'Online Grocery'});
//         }else{
//             return res.render('order', { list: {}, title: 'Online Grocery' });
//         } 
//     }).lean();

// }


// search controller
controller.search = (req, res, next) => {
    let query = req.body.search_query;
    productModel.find({ product_name: { $regex: new RegExp(query, "i") } }, (err, data) => {
        if (err) return res.send({ list: "Oops Error!!" });
        if (data.length == 0) return res.send({ list: "No Item Available", isData: false })
        return res.send({ list: data, isData: true });
    }).sort({ product_name: 1, product_slag: 1 }).limit(5);

}

// Generate Sitemap
controller.sitemap = function (req, res, next) {
    res.sendFile('sitemap.xml');



    // let xml_content = [
    //   '<?xml version="1.0" encoding="UTF-8"?>',
    //   '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    //   '  <url>',
    //   '    <loc>https://www.purneashop.com/</loc>',
    //   '    <lastmod>2020-06-07</lastmod>',
    //   '  </url>',
    //   '</urlset>'
    // ]
    // res.set('Content-Type', 'text/xml')
    // res.send(xml_content.join('\n'))
}

// exporting the controller
module.exports = controller;