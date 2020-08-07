var express = require('express');
var router = express.Router();

// import the index controller
const indexController = require("../controller/indexController");

/* GET home page. */
router.get('/', indexController.index);
router.get('/products/:slag', indexController.products);
router.get('/category/:slag', indexController.category);


// Both are the extra router for SEO Purpose
router.get('/order', (req, res)=>{
  res.redirect("/users/order");
});
router.get('/yourCart', (req, res)=>{
  res.redirect("/users/yourCart");
});


router.post('/search', indexController.search);
router.get('/sitemap.xml', indexController.sitemap);

// Terms & Conditions
router.get("/terms-condition", indexController.termsCondition);


// Privacy & Policy
router.get("/privacy-policy", indexController.privacyPolicy);


module.exports = router;

function isLoggedIn(req, res, next){
    req.session.current_url = req.url;
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/users/signin");
  }