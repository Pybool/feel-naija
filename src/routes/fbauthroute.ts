import express from 'express';
import passport from "passport";

var router = express.Router();

router.get('/', function (req, res) {
  res.render('index.ejs'); // load the index.ejs file
});

router.get('/profile', function (req, res) {
  res.send("You authentication was sucessfull")
});

router.get('/error', isLoggedIn, function (req, res) {
  res.render('pages/error.ejs');
});

router.get('/auth/facebook', passport.authenticate('facebook', {
  scope: ['public_profile', 'email']
}));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/error'
  }));

router.get('/logout', function (req:any, res:any) {
  req.logout();
  res.redirect('/');
});

function isLoggedIn(req:any, res:any, next:any) {
  // if (req?.isAuthenticated())
  return next();
  res.redirect('/');
}

export default router