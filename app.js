var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { check, validationResult } = require('express-validator');
const validator = require("express-validator");
var sitemap = require('express-sitemap')();



// import mongoose
var mongoose = require("mongoose");
require('dotenv').config();
var expressSession = require("express-session");

const pasport = require("passport");
const flash = require("connect-flash");

// import express handlebars
var expressHbs = require("express-handlebars");

// imports routers
var indexRouter = require('./routes/indexRouter');
var adminRouter = require('./routes/adminRouter');
var usersRouter = require('./routes/usersRouter');
const passport = require('passport');


// DataBas Connections
const localDB = "mongodb://localhost/aux_kart";
mongoose.connect(process.env.CONNSTR, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected");
  }).catch((err) => {
    console.log(err);
  });

require("./config/passport");

var app = express();

// view engine setup
app.engine(".hbs", expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use("/css", express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));



app.use(expressSession({
  secret: "Attainu",
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());
app.use(passport.initialize())
app.use(passport.session());

app.use((req, res, next)=>{
  res.locals.login = req.isAuthenticated();
  res.locals.cart = req.session.cart || [];
  res.locals.user = req.session.user || {};
  next();
})


app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/users', usersRouter);

sitemap.generate(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
