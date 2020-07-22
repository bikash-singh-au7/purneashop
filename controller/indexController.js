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
    req.session.current_url = '/account';
    // Getting Product
    const productData = await productModel.find({ product_status: 1}).limit(5).lean();

    // Add Discount Properties
    for (let x in productData) {
        const mrp = productData[x].product_mrp;
        const price = productData[x].product_price;
        const per = Math.trunc(100 - ((100 * price) / mrp));
        productData[x].discount = per + "%";
    }


    // Getting All Category
    const categoryData = await categoryModel.find({ category_status: 1 }).lean();
    const cloneCategory = Array.from(categoryData);
    const arr = cloneCategory.slice(0, 6);
    let categoryWise = {};
    let p = [];
    let categoryId = {};


    // Getting Data Category Wise
    for (let x in arr) {
        p = await productModel.find({ "product_category._id": categoryData[x]._id, product_status: 1 }).limit(5).lean();
        categoryWise[arr[x].category_name] = p;
        categoryId[arr[x].category_name] = arr[x]._id;
    }

    // Adding discount property
    for (const [key, value] of Object.entries(categoryWise)) {
        for (const [innerKey, innerValue] of Object.entries(value)) {
            const mrp = innerValue.product_mrp;
            const price = innerValue.product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            categoryWise[key][innerKey].discount = per + "%";
        }
    }

    return res.render('index', { list: productData, catList: categoryData, categoryWise: categoryWise, title: 'Online Grocery', success: req.flash("success"), catId: categoryId});
}

// category controller
controller.category = (req, res, next) => {
    req.session.current_url = '/account';
    const slag = mongoose.Types.ObjectId(req.params.slag);
    productModel.find({ "product_category._id": slag, product_status: 1 }, (err, data) => {
        if (!err) {
            for (let x in data) {
                const mrp = data[x].product_mrp;
                const price = data[x].product_price;
                const per = Math.trunc(100 - ((100 * price) / mrp));
                data[x].discount = per + "%";
            }

            if(data.length == 0){
                var catName = '';
            }else{
                var catName = data[0].product_category.name;
            }

            categoryModel.find((e, cat) => {
                if (!e) return res.render('category', { list: data, catList: cat, title: 'Online Grocery', success: req.flash("success"), catName: catName });
                return res.render('category', { list: data, catList: [], title: 'Online Grocery', success: req.flash("success"), catName: "" });
            }).lean();
        }
        else return res.render('category', { list: {}, title: 'Online Grocery', catName: "" });
    }).lean();
}


// product controller
controller.products = (req, res, next) => {
    req.session.current_url = '/account';
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


// search controller
controller.search = (req, res, next) => {
    let query = req.body.search_query;
    productModel.find({ product_name: { $regex: new RegExp(query, "i") }, product_status: 1 }, (err, data) => {
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