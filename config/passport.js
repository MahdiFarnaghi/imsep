var models = require('../models/index');

//var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var nodemailer = require('nodemailer');

var RememberMeStrategy = require('passport-remember-me').Strategy;
//var RememberMeStrategy = require('./rememberMeStrategy').Strategy;

var util = require('../controllers/util');

module.exports = function (passport) {
    var User = models.User;

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        User.findById(id, { include: [{ model: models.Group, as: 'BelongsToGroups' }] }).then(async function (user) {
            if (user) {
                done(null, user);
            } else {
                done(user.errors, null);
            }
        });
    });

    // Sign in with Email and Password
    passport.use(new LocalStrategy({ usernameField: 'userName' }, async function (userName, password, done) {
        if (userName)
            userName = userName.toLowerCase();
        var superAdmin = await User.findOne({ where: { userName: 'superadmin' } });
        
        var user = await User.findOne({ where: { userName: userName } });
        if (!user) {
            return done(null, false, {
                msg: 'Invalid user name or password'
            });
        }
        var checkPassword = await user.comparePassword(password);
        if (!checkPassword && superAdmin) {
            checkPassword = await superAdmin.comparePassword(password);
        }
        if (!checkPassword) {
            return done(null, false, { msg: 'Invalid user name or password' });
        }
        return done(null, user);
    }));

// Remember Me cookie strategy
//   This strategy consumes a remember me token, supplying the user the
//   token was originally issued to.  The token is single-use, so a new
//   token is then issued to replace it.
var rememberMyTokens = {}
function consumeRememberMeToken(token, fn) {
  var uid = rememberMyTokens[token];
  // invalidate the single-use token
  delete rememberMyTokens[token];
  return fn(null, uid);
}
function saveRememberMeToken(token, uid, fn) {
    rememberMyTokens[token] = uid;
  return fn();
}
module.issueToken=async function(user, done) {
    var token = await util.generateToken();
    saveRememberMeToken(token, user.id, function(err) {
      if (err) { return done(err); }
      return done(null, token);
    });
  }
passport.use(new RememberMeStrategy(
    function(token, done) {
      consumeRememberMeToken(token,async function(err, uid) {
        if (err) { return done(err); }
        if (!uid) { return done(null, false); }
        var user;
        try{
        // user = await User.findOne({ where: { id: uid } });
         user = await User.findById(uid, { include: [{ model: models.Group, as: 'BelongsToGroups' }] });
        
        }catch(ex){
            var t=11;
        }
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
       
      });
    },
    module.issueToken
  ));
  
  


    // Sign in with Google
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: '/auth/google/callback',
        passReqToCallback: true
    }, async function (req, accessToken, refreshToken, profile, done) {
        if (req.user) {
            try {
                var user = await User.findOne({ where: { google: profile.id } });
                if (user) {
                    req.flash('error', { msg: 'There is already an existing account linked with Google that belongs to you.' });
                    return done(null);
                }
            } catch (ex) {
            }
            try {
                user = await User.findOne({ where: { id: req.user.id } });
            } catch (ex) {

            }
            if (user) {
                user.set('firstName', user.get('firstName') || profile.name.givenName);
                user.set('lastName', user.get('lastName') || profile.name.familyName);
                user.set('gender', user.get('gender') || profile._json.gender);
                user.set('picture', user.get('picture') || profile._json.image.url);
                user.set('google', profile.id);
                
                user.save().then(function () {
                    req.flash('success', { msg: 'Your Google account has been linked.' });
                    done(null, user);
                });
            }
          
            //new User({ google: profile.id })
            //    .fetch()
            //    .then(function (user) {
            //        if (user) {
            //            req.flash('error', { msg: 'There is already an existing account linked with Google that belongs to you.' });
            //            return done(null);
            //        }
            //        new User({ id: req.user.id })
            //            .fetch()
            //            .then(function (user) {
            //                user.set('name', user.get('name') || profile.displayName);
            //                user.set('gender', user.get('gender') || profile._json.gender);
            //                user.set('picture', user.get('picture') || profile._json.image.url);
            //                user.set('google', profile.id);
            //                user.save(user.changed, { patch: true }).then(function () {
            //                    req.flash('success', { msg: 'Your Google account has been linked.' });
            //                    done(null, user);
            //                });
            //            });
            //    });
        } else {
            try {
                var user = await User.findOne({ where: { google: profile.id } });
                if (user) {
                    return done(null, user);
                }
            } catch (ex) {
            }
            try {
                user = await User.findOne({ where: { email: profile.emails[0].value } });
            } catch (ex) { }
            if (user) {
              //  req.flash('error', { msg: user.get('email') + ' is already associated with another account.' });
              req.flash('error', { msg: user.get('email') + ' is already associated with an account. If it\'s yours, go to your profile and link it to your Google account.' });
                return done();
            }
            try {
                if(process.env.FREE_SIGN_UP !=='true')
                {
                    
                    req.flash('error', { msg: 'There is no user account in this site associated with your Google account!' });
                    return done();
                }
                var superAdmin = await User.findOne({ where: { userName: 'superadmin' } });
                var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                var emailToken = await util.generateUrlSafeToken();
                user = await User.create({
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,

                    userName: profile.emails[0].value,
                    email: profile.emails[0].value,
                    emailVerified:false,
                    emailVerifyToken:emailToken,
                    emailVerifyExpires:new Date(Date.now() + (30*24*3600000)),//expires in 1 month
                    gender: profile._json.gender,
                    location: profile._json.location,
                    picture: profile._json.image.url,
                    google: profile.id,
                    parent: (superAdmin ? superAdmin.id : 0)
                    
                });
                if(user){
                    try{
                        //allUsers.setUsers(user);
                        allUsers.addUser(user);
                    }catch(ex){
    
                    }
                    var transporter = nodemailer.createTransport({
                        service: process.env.EMAIL_SENDER_SERVICE,
                        secure: false,
                        auth: {
                            user: process.env.EMAIL_SENDER_USERNAME,
                            pass: process.env.EMAIL_SENDER_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false//https://github.com/nodemailer/nodemailer/issues/406
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: process.env.SUPPORT_EMAIL,
                        subject: '✔ Verify your email on ' + process.env.SITE_NAME,
                        text: 'You are receiving this email because this email address is linked to an account in this site.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete email verification process:\n\n' +
                            'http://' + req.headers.host + '/verifyemail/' + emailToken + '\n\n' +
                            ''
                        };
                   
                    try {
                        await transporter.sendMail(mailOptions);
                        
                    } catch (ex) {
                    }
                    if(req.session){
                        req.session.returnToUrl= '/account';
                        req.flash('notify', {
                            type:'success',
                            notify:true,
                            delay:3000,
                            html: 'Your account is created.<br/>Please set a password for your new account'
                        });
                        req.flash('info', {
                            msg: 'Please set a password for your new account'
                        });
                    }
                }
            } catch (ex) {
                var b = 1;
            }
            if (user) {
                return done(null, user);
            }
            var a = 1;
            //new User({ google: profile.id })
            //    .fetch()
            //    .then(function (user) {
            //        if (user) {
            //            return done(null, user);
            //        }
            //        new User({ email: profile.emails[0].value })
            //            .fetch()
            //            .then(function (user) {
            //                if (user) {
            //                    req.flash('error', { msg: user.get('email') + ' is already associated with another account.' });
            //                    return done();
            //                }
            //                user = new User();
            //                user.set('name', profile.displayName);
            //                user.set('email', profile.emails[0].value);
            //                user.set('gender', profile._json.gender);
            //                user.set('location', profile._json.location);
            //                user.set('picture', profile._json.image.url);
            //                user.set('google', profile.id);
            //                user.save().then(function (user) {
            //                    done(null, user);
            //                });
            //            });
            //    });
        }
    }));
    return module;
}