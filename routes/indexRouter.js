var express = require('express');
var router = express.Router();

// import the index controller
const indexController = require("../controller/indexController");

/* GET home page. */
router.get('/', indexController.index);
router.get('/products/:slag', indexController.products);
router.get('/addToCart/:slag', indexController.addToCart);
router.get('/checkout/', isLoggedIn, indexController.checkout);
router.post('/checkout/', isLoggedIn, indexController.getCheckout);
router.get('/updateCart/:slag', indexController.updateCart);
router.get('/yourCart', indexController.yourCart);
router.get('/order', isLoggedIn, indexController.order);
router.get('/category/:slag', indexController.category);

router.post('/search', indexController.search);
router.get('/sitemap.xml', indexController.sitemap);



module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/users/signin");
  }