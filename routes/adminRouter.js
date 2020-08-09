const express = require("express");
const router = express.Router();

const adminController = require("../controller/adminController");
const { check, validationResult } = require('express-validator');
const multer = require("multer");
const validator = require("express-validator");

// File Upoads
const upload = require("../config/multer");
require("../config/cloudinaryConfig");
const cloudinary = require("cloudinary");
const fs = require("fs");

// default or login routes
router.get("/", adminController.login);

// check login routes
router.post("/auth", adminController.auth);

// home routes
router.get("/home", adminController.home);

// Category routes
router.get("/category", adminController.category);
router.post("/addCategory", adminController.addCategory);
router.post("/getCategory", adminController.getCategory);
router.put("/updateCategory", adminController.updateCategory);
router.delete("/deleteCategory", adminController.deleteCategory);


// Products Routes
router.get("/products", adminController.products);




router.post("/addProduct", upload.single("product_image"), adminController.addProduct);
// router.post("/addProduct",[
//     // check("product_name").trim().notEmpty().withMessage("Product Name required"),
//     // check("product_category").trim().notEmpty().withMessage("Product Category required"),
// ], adminController.addProduct);
router.delete("/deleteProduct", adminController.deleteProduct);


// Logout
router.get("/logout", adminController.logout);

router.post("/save", adminController.saveData);


// Users Routes
router.get("/users", adminController.users);

//================Orders Routes============
// Pending Orders
router.get("/pendingOrders", adminController.pendingOrders);
router.put("/orderConfirm", adminController.orderConfirm);
router.get("/unshippedOrders", adminController.unshippedOrders);
router.get("/shippedOrders", adminController.shippedOrders);
router.get("/todayShippedOrders", adminController.todayShippedOrders);
router.put("/orderDelevered", adminController.orderDelevered);

router.post("/getProduct", adminController.getProduct);
router.put("/updateProduct", adminController.updateProduct);

router.get("/offlineOrder", adminController.offlineOrder);
router.post("/manualOrder", adminController.manualOrder);
router.post("/clearManualOrder", adminController.clearManualOrder);
router.get("/updateCart/:index", adminController.updateCart);
router.post("/getOfflineOrder", adminController.getOfflineOrder);
router.get("/showOfflineOrder", adminController.showOfflineOrder);



// Delete Order
router.delete("/orderDelete", adminController.orderDelete);


router.get("/test", (req, res)=>{
    console.log("delete")
    // cloudinary.uploader.destroy("bz1poffxmt050ugxjhi3", function(result) { console.log(result) });
})

// export modules
module.exports = router;


