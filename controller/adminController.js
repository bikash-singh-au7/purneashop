// import admin model
const adminModel = require("../models/adminModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const multer = require("multer");
const { check, validationResult } = require('express-validator');
const { order } = require("./indexController");
const upload = require("../config/multer");
require("../config/cloudinaryConfig");
const cloudinary = require('cloudinary');
var fs = require('fs');
const { router } = require("../app");

const controller = {};

// Login Controller
controller.login = (req, res, next) => {
    if (req.session.user) return res.redirect("/admin/home");
    res.render("admin/login/login", { layout: 'backend' });
};

// Login Authentication
controller.auth = (req, res, next) => {
    const body = {
        user_name: req.body.user_name,
        user_password: req.body.user_password
    };

    adminModel.findOne(body, (err, data) => {
        if (err || !data) {
            res.send({ login: false });
        } else {
            req.session.user = data;
            res.send({ login: true, data: data });
        }
    });
};

// Home Controller
controller.home = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    let users = [];
    let pendingOrders = [];
    let unshippedOrders = [];
    let todayShippedOrders = [];
    let totalShippedOrders = [];

    // All Users
    try {
        users = await userModel.find({});
    } catch (error) {
        console.log("User model Error", error);
    }

    // Pending Orders
    try {
        pendingOrders = await orderModel.find({ order_status: 0 });
    } catch (error) {
        console.log("Pending Order model error", error);
    }

    // Undhipped Order
    try {
        unshippedOrders = await orderModel.find({ order_status: 1 });
    } catch (error) {
        console.log("Pending Order model error", error);
    }

    // Total shipped Order
    try {
        totalShippedOrders = await orderModel.find({ order_status: 2 });
    } catch (error) {
        console.log(" Total shipped Order model error", error);
    }

    // Today shipped Order
    try {
        let start = new Date();
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        end.setHours(23, 59, 59, 999);
        todayShippedOrders = await orderModel.find({ order_status: 2, shipped_date: { $gte: start, $lt: end } });
    } catch (error) {
        console.log(" Today shipped Order model error", error);
    }

    res.render("admin/home/index", { layout: 'backend', users: users, pendingOrders: pendingOrders, unshippedOrders: unshippedOrders, todayShippedOrders: todayShippedOrders, totalShippedOrders: totalShippedOrders });
};



// Users Controler
controller.users = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    userModel.find((err, data) => {
        if (!err) {
            return res.render("admin/users/users", { layout: "backend", list: data });
        }
        else return res.render("admin/users/users", { layout: "backend", list: data });
    }).lean()
}

// Category
controller.category = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    categoryModel.find((err, data) => {
        if (!err) return res.render("admin/category/category", { layout: "backend", list: data });
        else return res.render("admin/category/category", { layout: "backend", list: data });
    }).lean()
}

//================= Order===============
// pending Order
controller.pendingOrders = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    let pendingOrder = [];
    let order = [];
    try {
        pendingOrder = await orderModel.find({ order_status: 0 });
    } catch (e) {
        console.log(err);
    }
    if (pendingOrder.length == 0) {
        return res.render("admin/orders/pending-orders", { layout: "backend", list: pendingOrder, success: req.flash("success"), error: req.flash("error") });
    } else {
        for (let i = 0; i < pendingOrder.length; i++) {
            let user_id = pendingOrder[i].user_id;
            try {
                const users = await userModel.findOne({ _id: user_id });
                pendingOrder[i].user_name = users.user_name;
            } catch (e) {
                console.log(err);
            }
            let status = "Pending";
            if (pendingOrder[i].order_status == 1) {
                status = "Confirmed";
            } else if (pendingOrder[i].order_status == 2) {
                status = "Delevered";
            } else if (pendingOrder[i].order_status == 3) {
                status = "Canceled";
            }
            order.push({
                user_name: pendingOrder[i].user_name,
                _id: pendingOrder[i]._id,
                qty: pendingOrder[i].qty,
                order_date: pendingOrder[i].order_date.toDateString(),
                order_status: status,
                address: pendingOrder[i].address,
                cart: pendingOrder[i].cart,
                total_amount: pendingOrder[i].total_amount,
                address: pendingOrder[i].address
            });
        }
        return res.render("admin/orders/pending-orders", { layout: "backend", list: order, success: req.flash("success"), error: req.flash("error") });
    }
}

controller.orderConfirm = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    const order_id = req.params.order_id;
    orderModel.findByIdAndUpdate({ _id: order_id }, { order_status: 1 }, (err, data) => {
        if (!err) {
            req.flash("success", "Order Updated");
            return res.redirect("back");
        } else {
            req.flash("error", "Oops Error!! Try agail later.");
            return res.redirect("back");
        }
    })
}

controller.unshippedOrders = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    let unshippedOrders = [];
    let order = [];
    try {
        unshippedOrders = await orderModel.find({ order_status: 1 });
    } catch (e) {
        console.log(err);
    }
    if (unshippedOrders.length == 0) {
        return res.render("admin/orders/confirmed-orders", { layout: "backend", list: unshippedOrders, success: req.flash("success"), error: req.flash("error") });
    } else {
        for (let i = 0; i < unshippedOrders.length; i++) {
            let user_id = unshippedOrders[i].user_id;
            try {
                const users = await userModel.findOne({ _id: user_id });
                unshippedOrders[i].user_name = users.user_name;
            } catch (e) {
                console.log(err);
            }
            let status = "Pending";
            if (unshippedOrders[i].order_status == 1) {
                status = "Confirmed";
            } else if (unshippedOrders[i].order_status == 2) {
                status = "Delevered";
            } else if (unshippedOrders[i].order_status == 3) {
                status = "Canceled";
            }
            order.push({
                user_name: unshippedOrders[i].user_name,
                _id: unshippedOrders[i]._id,
                qty: unshippedOrders[i].qty,
                order_date: unshippedOrders[i].order_date.toDateString(),
                order_status: status,
                address: unshippedOrders[i].address,
                cart: unshippedOrders[i].cart,
                total_amount: unshippedOrders[i].total_amount,
                address: unshippedOrders[i].address
            });
        }
        return res.render("admin/orders/confirmed-orders", { layout: "backend", list: order, success: req.flash("success"), error: req.flash("error") });
    }
}

controller.orderDelevered = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    const order_id = req.params.order_id;
    orderModel.findByIdAndUpdate({ _id: order_id }, { order_status: 2, shipped_date: new Date() }, (err, data) => {
        if (!err) {
            req.flash("success", "Order Updated");
            return res.redirect("back");
        } else {
            req.flash("error", "Oops Error!! Try agail later.");
            return res.redirect("back");
        }
    })
}
controller.shippedOrders = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    let shippedOrder = [];
    let order = [];
    try {
        shippedOrder = await orderModel.find({ order_status: 2 }).sort({ shipped_date: -1 });
    } catch (e) {
        console.log(err);
    }
    if (shippedOrder.length == 0) {
        return res.render("admin/orders/shipped-orders", { layout: "backend", list: shippedOrder, success: req.flash("success"), error: req.flash("error") });
    } else {
        for (let i = 0; i < shippedOrder.length; i++) {
            let user_id = shippedOrder[i].user_id;
            try {
                const users = await userModel.findOne({ _id: user_id });
                shippedOrder[i].user_name = users.user_name;
            } catch (e) {
                console.log(err);
            }
            let status = "Pending";
            if (shippedOrder[i].order_status == 1) {
                status = "Confirmed";
            } else if (shippedOrder[i].order_status == 2) {
                status = "Delevered";
            } else if (shippedOrder[i].order_status == 3) {
                status = "Canceled";
            }
            order.push({
                user_name: shippedOrder[i].user_name,
                _id: shippedOrder[i]._id,
                qty: shippedOrder[i].qty,
                order_date: shippedOrder[i].order_date.toDateString(),
                shipped_date: shippedOrder[i].shipped_date.toDateString(),
                order_status: status,
                address: shippedOrder[i].address,
                cart: shippedOrder[i].cart,
                total_amount: shippedOrder[i].total_amount,
                address: shippedOrder[i].address
            });
        }
        return res.render("admin/orders/shipped-orders", { layout: "backend", list: order, success: req.flash("success"), error: req.flash("error") });
    }
}


controller.todayShippedOrders = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    let shippedOrder = [];
    let order = [];
    try {
        let start = new Date();
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        end.setHours(23, 59, 59, 999);
        shippedOrder = await orderModel.find({ order_status: 2, shipped_date: { $gte: start, $lt: end } }).sort({ shipped_date: -1 });
    } catch (e) {
        console.log(err);
    }
    if (shippedOrder.length == 0) {
        return res.render("admin/orders/shipped-orders", { layout: "backend", list: shippedOrder, success: req.flash("success"), error: req.flash("error") });
    } else {
        for (let i = 0; i < shippedOrder.length; i++) {
            let user_id = shippedOrder[i].user_id;
            try {
                const users = await userModel.findOne({ _id: user_id });
                shippedOrder[i].user_name = users.user_name;
            } catch (e) {
                console.log(err);
            }
            let status = "Pending";
            if (shippedOrder[i].order_status == 1) {
                status = "Confirmed";
            } else if (shippedOrder[i].order_status == 2) {
                status = "Delevered";
            } else if (shippedOrder[i].order_status == 3) {
                status = "Canceled";
            }
            order.push({
                user_name: shippedOrder[i].user_name,
                _id: shippedOrder[i]._id,
                qty: shippedOrder[i].qty,
                order_date: shippedOrder[i].order_date.toDateString(),
                shipped_date: shippedOrder[i].shipped_date.toDateString(),
                order_status: status,
                address: shippedOrder[i].address,
                cart: shippedOrder[i].cart,
                total_amount: shippedOrder[i].total_amount,
                address: shippedOrder[i].address
            });
        }
        return res.render("admin/orders/shipped-orders", { layout: "backend", list: order, success: req.flash("success"), error: req.flash("error") });
    }
}



controller.addCategory = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    const body = req.body;
    const categoryData = new categoryModel(body);
    categoryData.save((err, data) => {
        if (!err) {
            const row = `<tr id="row-${data._id}">
                <td>${data.category_name}</td>
                <td class="text-center">
                    <span class='badge badge-info'>Active</span> </td>
                <td>${data.category_slag}</td>

                <td><button class="btn btn-info px-2 py-1" onclick="getId('${data._id}')"> <i class="fa fa-edit"></i> </button></td>
                <td><button class="btn btn-danger px-2 py-1" onclick="deleteData('${data._id}')"> <i class="fa fa-trash"></i> </button></td>
            </tr> `;
            res.send({ status: 1, title: "Done!", message: "Category Added successfully", modal: "success", lastRow: row });

        } else {
            if (err.name == 'ValidationError') {
                const formError = {};
                for (field in err.errors) {
                    switch (err.errors[field].path) {
                        case 'category_name':
                            formError['category_name'] = err.errors[field].message;
                            break;
                        default:
                            break;
                    }
                }
                res.send({ status: 0, formError });
            } else if (err.name == "MongoError") {
                console.log(err);
                const formError = {};
                for (field in err.errors) {
                    switch (err.errors[field].path) {
                        case 'category_name':
                            formError['category_name'] = err.errors[field].message;
                            break;
                        default:
                            break;
                    }
                }
                res.send({ status: 0, formError });
            }
            else
                console.log('Error during record insertion : ' + err);
        }
    })

}

controller.getCategory = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    categoryModel.findById({ _id: req.body.category_id }, (err, data) => {
        if (!err) return res.send({ list: data });
        else return res.send({ list: data });
    }).lean()
}
controller.updateCategory = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    if (req.body.category_name == "") {
        return res.send({ status: 0, formError: { category_name: "Field is required" } });
    }

    const body = {
        category_name: req.body.category_name,
        category_status: req.body.category_status,
        category_slag: req.body.category_slag
    };
    categoryModel.findOneAndUpdate({ _id: req.body.category_id }, body, (err, data) => {

        if (!err) {
            let status = "<span class='badge badge-danger'>Disabled</span> </td>";
            if (Number(body.category_status)) {
                status = "<span class='badge badge-info'>Active</span> </td>";
            }
            const row = `
                <td>${body.category_name}</td>
                <td class="text-center">
                    ${status}
                <td>${body.category_slag}</td>
                <td><button class="btn btn-info px-2 py-1" onclick="getId('${data._id}')"> <i class="fa fa-edit"></i> </button></td>
                <td><button class="btn btn-danger px-2 py-1" onclick="deleteData('${data._id}')"> <i class="fa fa-trash"></i> </button></td>`;
            return res.send({ updatedRow: row, rowId: "row-" + data._id, status: 1, title: "Done", message: "Updated Successfully!", modal: "success" });
        }
        else {
            if (err.name == "MongoError") {
                return res.send({ status: 0, formError: { category_name: "Field must be unique value" } });
            }
        }
    }).lean()
}

controller.deleteCategory = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    categoryModel.findOneAndRemove({ _id: req.body.category_id }, (err, data) => {
        if (!err) return res.send({ rowId: "row-" + data._id, status: 1, title: "Done", message: "Deleted Successfully!", modal: "success" });
        else return res.send({ status: 0, title: "Oops error", message: "Error occured try after sometime", modal: "error" });
    }).lean()
}



// Products
controller.products = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");

    productModel.find((err, data) => {
        if (!err) {
            categoryModel.find({ category_status: 1 }, (errors, cat) => {
                if (!errors) return res.render("admin/products/product", { layout: "backend", list: data, cat: cat, error: req.flash("error"), message: req.flash("message")[0] });
                else return res.render("admin/products/product", { layout: "backend", list: data, error: req.flash("error"), message: req.flash("message")[0] });
            }).lean();
        } else {
            res.render("admin/products/product", { layout: "backend", list: data, error: req.flash("error"), message: req.flash("message")[0] });
        }
    }).lean()
}



controller.addProduct = async (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");

    const result = await cloudinary.v2.uploader.upload(req.file.path);

    const body = req.body;
    body.user_id = req.session.user._id;
    body.product_image = result.url;

    categoryModel.findById({ _id: body.product_category }, (err, data) => {
        if (!err) {
            body.product_category = {
                name: data.category_name,
                _id: data._id
            }

            const productData = new productModel(body);
            productData.save((err, data) => {
                if (!err) {
                    req.flash("error", "Product Added")
                    res.redirect("/admin/products")

                }
                else {
                    const formError = {};
                    if (err.name == 'ValidationError') {

                        for (field in err.errors) {
                            formError[field] = err.errors[field].message;
                        }
                        req.flash("error", "Product Not Added")
                        res.redirect("/admin/products")
                    } else if (err.name == "MongoError") {
                        formError.product_name = err.keyValue["product_name"] + " allready exist";
                        req.flash("error", "Product Not Added")
                        res.redirect("/admin/products")
                    }
                    else {
                        console.log('Error during record insertion : ' + err);
                    }

                }
            });


        }else{
            req.flash("error", "Product Not Added")
            res.redirect("/admin/products")
        }
    });
}


controller.deleteProduct = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");


    productModel.findOneAndRemove({ _id: req.body.product_id }, (err, data) => {
        if (!err) {
            
            const url = data.product_image;
            let y = url.split("/");
            let imgName = (y[y.length-1]).split(".")[0];
            cloudinary.uploader.destroy(imgName, function(result) { console.log(result) });

            return res.send({ rowId: "row-" + data._id, status: 1, title: "Done", message: "Deleted Successfully!", modal: "success" });
        }
        else return res.send({ status: 0, title: "Oops error", message: "Error occured try after sometime", modal: "error" });
    }).lean()
}



// Logout Routes
controller.logout = (req, res) => {
    req.session.destroy();
    // console.log("Session destroid");
    res.redirect("/admin");
}

controller.saveData = (req, res, next) => {
    if (!req.session.user) return res.redirect("/admin");
    const body = req.body;

    const admin = new adminModel(body);
    admin.save((err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    })
};



module.exports = controller;