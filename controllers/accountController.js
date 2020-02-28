const { Op } = require('sequelize');
//var async = require('async');
var sharp= require('sharp');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
const jwt = require('jsonwebtoken');
var util = require('./util');
//var User = require('../models/User');

var models = require('../models/index');

module.exports = function (passportConfig) {
 //   const models = models;
    var module = {};
    /**
     * Login required middleware
     */
    module.ensureAuthenticated = function (req, res, next) {
        if (req.isAuthenticated()) {
            if(req.user &&req.user.status==='inactive'){
                req.flash('notify', {
                    type:'danger',
                    notify:true,
                    delay:10000, msg: 'Account is deactivated.' });
                //delete req.session.returnToUrl;    
                //return res.redirect('/login')
                     module.logout(req,res);
            }else{
                next();
            }
        } else {
            req.session.returnToUrl = req.url; 
            res.redirect('/login');
        }
    };
    module.ensureAuthenticatedOrGuest =async function (req, res, next) {
        if (req.isAuthenticated()) {
            if(req.user &&req.user.status==='inactive'){
                req.flash('notify', {
                    type:'danger',
                    notify:true,
                    delay:10000, msg: 'Account is deactivated.' });
                // delete req.session.returnToUrl;    
                // return res.redirect('/login')
                 module.logout(req,res);
            }else{
                next();
            }
        } else {
            req.user = await models.User.findOne({ where: { userName: 'guest' } , include: [{ model: models.Group, as: 'BelongsToGroups' }] });
            if(req.user &&req.user.status==='active'){
                delete req.session.returnToUrl;
                next();
            }else{
                req.session.returnToUrl = req.url; 
                res.redirect('/login');
            }
            
        }
    };
    // Make autorize middleware
    module.makeAuthorizeMiddleware = function (options) {
        
        return async function (req, res, next) {
            var _options = options;
            if (req.user) {
                [error, access] = await util.call(req.user.checkAccessAsync(models,options));
                if (access) {
                    next();
                    return;
                }
            }
        
            next(new util.HttpError(403, 'Insufficient permissions to access resource'));
            return;
        }
    };
    module.initIdentityInfo = async function (req, res, next) {
        var uglify_ = require('../Grunt_Uglify.js');
        res.locals.uglify = uglify_;
        res.locals.identity = {
            isAnonymous: true,
            name: 'anonymous'
        };
        //if(!req.user){
        //    req.user = await models.User.findOne({ where: { userName: 'guest' } , include: [{ model: models.Group, as: 'BelongsToGroups' }] });
        // }
        // if (req.i18n_lang == 'fa' || req.i18n_lang == 'ar') {
        //     res.locals.i18n_layout = 'rtl';
        // } else {
        //     res.locals.i18n_layout = 'ltr';
        // }
        // res.locals.i18n_lang = req.i18n_lang;
    
        res.locals.user = req.user ? req.user : null;
        res.locals.displayOptions = res.locals.displayOptions || {};
        // res.locals.displayOptions.uglify=uglify_;
    
        if (res.locals.user) {
            res.locals.identity.isAnonymous = false;
            res.locals.identity.name = res.locals.user.userName;
            res.locals.identity.firstName = res.locals.user.firstName;
            res.locals.identity.lastName = res.locals.user.lastName;
            res.locals.identity.email = res.locals.user.email;
            res.locals.identity.id = res.locals.user.id;
            //res.locals.identity.organizationId = res.locals.user.organizationId;
    
            var roles = res.locals.user.BelongsToGroups.map(v => {
                return v.name;
            });
            res.locals.identity.roles = roles;
    
    
            if (res.locals.identity.name.toLowerCase() === 'admin' ||
                res.locals.identity.name.toLowerCase() === 'superadmin'
            ) {
                res.locals.identity.isAdministrator = true;
                res.locals.identity.isAdmin = true;
                if (res.locals.identity.name.toLowerCase() === 'superadmin') {
                    res.locals.identity.isSuperAdministrator = true;
                }
            } else {
                res.locals.identity.isAdministrator = roles.includes('administrators');
            }
            res.locals.identity.isPowerUser = roles.includes('powerUsers');
            res.locals.identity.isDataManager = roles.includes('dataManagers');
            res.locals.identity.isDataAnalyst = roles.includes('dataAnalysts');
    
            res.locals.displayOptions.showMaps = true;
    
            if (await res.locals.user.checkPermissionAsync(models, {
                    permissionName: 'Edit',
                    contentType: 'Users'
                })) {
                res.locals.displayOptions.showUsers = true;
                res.locals.displayOptions.showManagement = true;
            }
            if (await res.locals.user.checkPermissionAsync(models, {
                    permissionName: 'Edit',
                    contentType: 'Groups'
                })) {
                res.locals.displayOptions.editUsers = true;
    
            }
            // if (await res.locals.user.checkPermissionAsync(models, {
            //         permissionName: 'Edit',
            //         contentType: 'Organizations'
            //     })) {
            //     res.locals.displayOptions.editOrganizations = true;
    
            // }
    
            // if(req.user.userName=='guest'){
            //     req.user=null;
            // }
        }
    
        next();
    };
    /**
     * GET /login
     */
    module.loginGet = function (req, res) {
        if (req.user) {
            return res.redirect('/');
        }
        res.render('account/login', {
            title: 'Log in'
        });
    };

    /**
     * POST /login
     */
    module.loginPost = function (req, res, next) {
       // req.assert('email', 'Email is not valid').isEmail();
       // req.assert('email', 'Email cannot be blank').notEmpty();
        req.assert('userName', 'User name cannot be blank').notEmpty();
        req.assert('password', 'Password cannot be blank').notEmpty();
       // req.sanitize('email').normalizeEmail({ remove_dots: false });
        if (process.env.LOGIN_CAPTCHA=='true') {
            req.assert('captcha', 'Captcha check failed').equals(req.session.captcha);
        }
        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
           // return res.redirect('/login');
            res.render('account/login', {
                title: 'Log in',
                userName: req.body.userName
                //,password: req.body.password
            });
            return;
        }
        //if (!(req.body.digits == req.session.captcha)) {
        //    req.flash('error', { msg: 'Captcha failed' });
        //    res.render('account/login', {
        //        title: 'Log in',
        //        userName: req.body.userName
        //        //,password: req.body.password
        //    });
        //    return;
        //}

        passport.authenticate('local', function (err, user, info) {
            if (!user) {
                req.flash('error', info);
                return res.redirect('/login')
            }
            if(user.status==='inactive'){
               // req.flash('error', 'Account is deactivated');
                req.flash('notify', {
                    type:'danger',
                    notify:true,
                    delay:10000, msg: 'Account is deactivated.' });
                return res.redirect('/login')
            }
            
            req.logIn(user, async function (err) {
                var emailVerified=true;
                if(process.env.FORCE_EMAIL_VERIFICATION && process.env.FORCE_EMAIL_VERIFICATION=='true' ){
                    if(user.email && !user.emailVerified && user.emailVerifyToken){
                        emailVerified=false;
                    }   
                }
                if(emailVerified){
                    if ('remember_me' in req.body && user){
                        passportConfig.issueToken(user, function(err, token) {
                            if (err) { return next(err); }
                            try{
                            res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 7*24*3600000 });// 1 week
                            }catch(ex0){
                                var t=1;
                            }
                        // return next();
                        res.redirect(req.session.returnToUrl || '/');
                        delete req.session.returnToUrl;
                        });
                    }else{
                
                        res.redirect(req.session.returnToUrl || '/');
                        delete req.session.returnToUrl;
                        }
                }else{
                    var emailToken = user.emailVerifyToken;
                    if(!emailToken){
                        emailToken=await util.generateUrlSafeToken();
                    } 
                    user.set('emailVerified',false);
                    user.set('emailVerifyToken',emailToken);
                    user.set('emailVerifyExpires',new Date(Date.now() + (30*24*3600000)));
                    await user.save();
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
                      
                    req.flash('info', { msg: 'We have sent an email with a confirmation link to your email address. Please, follow the instructions in it to activate your account.' });      
                    delete req.session.returnToUrl;
                    res.clearCookie('remember_me');
                    req.logout();
                    res.redirect('/');
                    

                }
            });
        })(req, res, next);
    };

    /**
     * POST /api/login
     */
    module.api_loginPost = function (req, res, next) {
         req.assert('userName',  'User name cannot be blank').notEmpty();
         req.assert('password', 'Password cannot be blank').notEmpty();
        //  if (process.env.LOGIN_CAPTCHA=='true') {
        //      req.assert('captcha', 'Captcha check failed').equals(req.session.captcha);
        //  }
         var errors = req.validationErrors();
 
         if (errors) {
          return  res.status(500).json({ 
                success:false,
                error: "Error signing token",
                raw: errors });  
             
         }
         
 
         passport.authenticate('local', {session: false},function (err, user, info) {
             if (!user) {
                return  res.status(500).json({ 
                    success:false,
                    error: "Error signing token",
                    raw: info });  
             }
             if(user.status==='inactive'){
                return  res.status(500).json({ 
                    success:false,
                    error: 'Account is deactivated.',
                    raw: errors });
             }
             
             req.logIn(user,{session: false}, async function (err) {
                 var emailVerified=true;
                 if(process.env.FORCE_EMAIL_VERIFICATION && process.env.FORCE_EMAIL_VERIFICATION=='true' ){
                     if(user.email && !user.emailVerified && user.emailVerifyToken){
                         emailVerified=false;
                     }   
                 }
                 if(emailVerified){
                    const payload ={
                        id:user.id,
                        userName:user.userName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email:user.email,
                        organizationId:user.organizationId
                    }  ;

                    var roles = user.BelongsToGroups.map(v => {
                        return v.name;
                    });
                    
            
            
                    if (user.userName.toLowerCase() === 'admin' ||
                    user.userName.toLowerCase() === 'superadmin'
                    ) {
                        payload.isAdministrator = true;
                        payload.isAdmin = true;
                        if (user.userName.toLowerCase() === 'superadmin') {
                            payload.isSuperAdministrator = true;
                        }
                    } else {
                        payload.isAdministrator = roles.includes('administrators');
                    }
                    payload.isPowerUser = roles.includes('powerUsers');
                    payload.isDataManager = roles.includes('dataManagers');
                    payload.isDataAnalyst = roles.includes('dataAnalysts');
            
                   
                    const token = jwt.sign(payload, process.env.JWT_SECRET);
                     return res.json({success:true, user:payload,token:token});
                 }else{
                    
                    return res.status(400).json({
                        success:false,
                        message: 'Email is not verified'
                    });
                     
 
                 }
             });
         })(req, res, next);
     };

    /**
     * GET /logout
     */
    module.logout = function (req, res) {
        delete req.session.returnToUrl;
        res.clearCookie('remember_me');
        req.logout();
        res.redirect('/');
    };

    /**
     * GET /signup
     */
    module.signupGet = function (req, res) {
        
        if (req.user) {
            return res.redirect('/');
        }
        if(process.env.FREE_SIGN_UP !=='true')
        {
            return res.redirect('/login');
        }
        res.render('account/signup', {
            title: 'Sign up'
        });
    };

    /**
     * POST /signup
     */
    module.signupPost =async function (req, res,  next) {
        if(process.env.FREE_SIGN_UP !=='true')
        {
            res.redirect('/');
            return;
        }
        req.assert('userName', 'User name cannot be blank').notEmpty();
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.assert('password', 'Password must be at least 4 characters long').len(4);
       // req.assert("password", "Password should be combination of one uppercase , one lower case, one special char, one digit and min 8 , max 20 char long").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i");

        req.assert('confirm', 'Passwords must match').equals(req.body.password);
        req.sanitize('email').normalizeEmail({ remove_dots: false });
        req.assert('captcha', 'Captcha check failed').equals(req.session.captcha);

        req.sanitizeBody('userName').trim();
        req.sanitizeBody('userName').escape();
       


        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            //return res.redirect('/signup');
            res.render('account/signup', {
                title: 'Sign up',
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password
            });
            return;
        }
        var superAdmin = await models.User.findOne({ where: { userName: 'superadmin' } });
        var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
        var emailToken = await util.generateUrlSafeToken();
        var emailSent=false;
        try {
            var newUser = await models.User.create({
                userName: req.body.userName,
                email: req.body.email,
                emailVerified:false,
                emailVerifyToken:emailToken,
                emailVerifyExpires:new Date(Date.now() + (30*24*3600000)),//expires in 1 month
                password: req.body.password
                , parent: (superAdmin ? superAdmin.id : 0)
            });
            if(newUser){
                try{
                    allUsers.addUser(newUser);
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
                    to: newUser.email,
                    from: process.env.SUPPORT_EMAIL,
                    subject: '✔ Verify your email on ' + process.env.SITE_NAME,
                    text: 'You are receiving this email because this email address is linked to an account in this site.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete email verification process:\n\n' +
                        'http://' + req.headers.host + '/verifyemail/' + emailToken + '\n\n' +
                        ''
                    };
                    emailSent=true;
                try {
                    await transporter.sendMail(mailOptions);
                    
                } catch (ex) {
                   
                }

            }
            if (newUser) {
               // req.logIn(newUser, function (err) {
               //     res.redirect('/');
               // });
               if(emailSent){
                req.flash('info', { msg: 'We have sent an email with a confirmation link to your email address. Please, follow the instructions in it to activate your account.' });      
               }
               delete req.session.returnToUrl;
               res.clearCookie('remember_me');
               req.logout();
               res.redirect('/');
            }else{
               
                    req.flash('error', { msg: 'Failed to create new account!' });
                //return res.redirect('/signup');
                res.render('account/signup', {
                    title: 'Sign up',
                    userName: req.body.userName,
                    email: req.body.email,
                    password: req.body.password
                });
            }
        } catch (ex) {
            if (ex && ex.errors) {
                //req.flash('error', ex.errors);
                req.flash('error', { msg: 'Already exists!' });
            }else
                req.flash('error', { msg: 'Unknow error!' });
            //return res.redirect('/signup');
            res.render('account/signup', {
                title: 'Sign up',
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password
            });
            return;
        }
       
    };

    /**
     * GET /account
     */
    module.accountGet = function (req, res) {
        res.render('account/profile', {
            title: 'My Account'
        });
    };

    /**
     * PUT /account
     * Update profile information OR change password.
     */
    module.accountPut = async function (req, res,  next) {
        if ('password' in req.body) {
            req.assert('password', 'Password must be at least 4 characters long').len(4);
            req.assert('confirm', 'Passwords must match').equals(req.body.password);
        } else {
            req.assert('email', 'Email is not valid').isEmail();
            req.assert('email', 'Email cannot be blank').notEmpty();
            req.sanitize('email').normalizeEmail({ remove_dots: false });
        }
        
        req.sanitizeBody('firstName').escape();
        req.sanitizeBody('lastName').escape();
        req.sanitizeBody('location').escape();
        

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('/account');
        }
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (!user) {
            req.flash('error', { msg: 'User not found!' });
            return res.redirect('/account');
        }
        try {
            if ('password' in req.body) {
                 user.set('password', req.body.password);
                await user.save({ fields: ['password'] });
            } else {
                var emailVerified=user.get('emailVerified');
                if(user.get('email')!==req.body.email){
                    emailVerified=false;
                }
                user.set('email', req.body.email);
                user.set('emailVerified', emailVerified);
                user.set('firstName', req.body.firstName);
                user.set('lastName', req.body.lastName);
                user.set('gender', req.body.gender);
                user.set('location', req.body.location);
                user.set('website', req.body.website);
                await user.save();
            }


            if ('password' in req.body) {
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'Your password has been changed.' });
            } else {
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'Your profile information has been updated.' });
            }
            res.redirect('/account');
        } catch (err) {
            if (err.original && err.original.code =='SQLITE_CONSTRAINT') {
                req.flash('error', { msg: 'The email address you have entered is already associated with another account.' });
            } else {
                req.flash('error', { msg: 'Error in updating profile infos!' });
            }
            //res.redirect('/account');
            res.render('account/profile', {
                title: 'My Account',
                user: {
                    'email': req.body.email,
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'gender': req.body.gender,
                    'location': req.body.location,
                    'website': req.body.website
                }
            });
        }
       
    };

    
    /**
     * GET /account/:id/avatar
     */
    module.avatarGet = async function (req, res, next) {

        var user,err;
        if (req.params.id && req.params.id != '-1') {
            
          [err, user] = await util.call(models.User.findOne({
                    where: {
                        id: req.params.id
                    }
                })
                );

            
            if (!user) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }
            if (!user.avatar) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }
            res.set('Content-Type', 'image/png');
            res.end(user.avatar, 'binary');
            return;
            
        }
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
        return;
    };
      /**
     * POST /account/avatar
     * Update profile avatar.
     */
    module.avatarPost = async function (req, res,  next) {
        
       //  req.assert('avatar', 'Avatar cannot be blank').notEmpty();
        

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('/account');
        }
        if (!('file' in req)) {
            req.flash('error', { msg: 'Failed to upload file!' });
            return res.redirect('/account');
        }
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (!user) {
            req.flash('error', { msg: 'User not found!' });
            return res.redirect('/account');
        }
        try {
            
            const data = await sharp(req.file.buffer)
                .resize(96)
                .png()
                .toBuffer();
          //  var dataUri= 'data:image/png;base64,' + data.toString('base64');
          //      user.set('avatar', dataUri);
          user.set('avatar', data);
                await user.save();
            


          
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'Your avatar image  has been updated.' });
            
            res.redirect('/account');
        } catch (err) {
            
             req.flash('error', { msg: 'Error in updating avatar image!' });
            
            res.redirect('/account');
            // res.render('account/profile', {
            //     title: 'My Account',
            //     user: {
            //         'id':req.body.id,
            //         'email': req.body.email,
            //         'firstName': req.body.firstName,
            //         'lastName': req.body.lastName,
            //         'gender': req.body.gender,
            //         'location': req.body.location,
            //         'website': req.body.website,
            //         'avatar': req.body.avatar
            //     }
            // });
        }
       
    };
 /**
     * DELETE /account/avatar
     */
    module.avatarDelete = async function (req, res, next) {
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (user) {
            user.set('avatar', null);
            user.save().then(function () {
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                     msg: 'Your avatar has been deleted.' });
                res.redirect('/account');
            });
        } else {
            res.redirect('/');
        }
    
    };
    /**
     * DELETE /account
     */
    module.accountDelete = function (req, res, next) {

        var user = req.user;
        if (user.userName == 'superadmin'
            || user.userName == 'admin') {
            req.flash('error', { msg: 'This account can not be deleted.' });
            res.redirect('/');
            return;
        }
        

        new User({ id: req.user.id }).destroy().then(async function (user) {
            req.logout();
            req.flash('info', { msg: 'Your account has been permanently deleted.' });

            try{
                var tryDeletePermissions = await models.Permission.destroy(
                    {
                         where: {
                            grantToType: 'user',
                            grantToId:  req.user.id
                             }
                    });
                }catch(ex){}

            res.redirect('/');
        });
    };

    /**
     * GET /unlink/:provider
     */
    module.unlink = async function (req, res, next) {
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (user) {
            if(!user.password){
                req.flash('error', { msg: 'It is required that you set a password before the unlinking.' });
                return res.redirect('/account');
            }
            switch (req.params.provider) {
                case 'facebook':
                    user.set('facebook', null);
                    user.set('picture',null);
                    break;
                case 'google':
                    user.set('google', null);
                    user.set('picture',null);
                    break;
                case 'twitter':
                    user.set('twitter', null);
                    user.set('picture',null);
                    break;
                case 'vk':
                    user.set('vk', null);
                    user.set('picture',null);
                    break;
                default:
                    req.flash('error', { msg: 'Invalid OAuth Provider' });
                    return res.redirect('/account');
            }
            user.save().then(function () {
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'Your account has been unlinked.' });
                res.redirect('/account');
            });
        } else {
            res.redirect('/');
        }
    
    };

    /**
     * GET /forgot
     */
    module.forgotGet = function (req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        res.render('account/forgot', {
            title: 'Forgot Password'
        });
    };

    /**
     * POST /forgot
     */
    module.forgotPost = async function (req, res, next) {
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.sanitize('email').normalizeEmail({ remove_dots: false });
        req.assert('captcha', 'Captcha check failed').equals(req.session.captcha);

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            res.render('account/forgot', {
                title: 'Forgot Password',
                email: req.body.email
            });
            return;
        }
        var token = await util.generateUrlSafeToken();

        var user;
        try {
            user = await models.User.findOne({ where: { email: req.body.email } });
        } catch (ex) {
            var ee = 1;
        }
        if (!user) {
            req.flash('error', { msg: 'The email address ' + req.body.email + ' is not associated with any account.' });
            res.render('account/forgot', {
                title: 'Forgot Password',
                email: req.body.email
            });
            return;
        }
        user.set('passwordResetToken', token);
        user.set('passwordResetExpires', new Date(Date.now() + 3600000)); // expire in 1 hour
        try {
            await user.save();
        } catch (ex) {
            req.flash('error', { msg: 'Process faild. Please try again.' });
            res.render('account/forgot', {
                title: 'Forgot Password',
                email: req.body.email
            });
            return;
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
            subject: '✔ Reset your password on ' + process.env.SITE_NAME,
            text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
       
        try {
            await transporter.sendMail(mailOptions);
            req.flash('info', { msg: 'An email has been sent to ' + user.email + ' with further instructions.' });
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to send email to the user!'
            });
            res.render('account/forgot', {
                title: 'Forgot Password',
                email: req.body.email
            });
            return;
        }
        res.redirect('/forgot');
    };
    /**
     * GET /reset/:token
     */
    module.resetGet = async function (req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
       // const Op = models.Sequelize.Op;
        var user;
        try {
            user = await models.User.findOne({
                where: {
                    [Op.and]: {
                    //$and: {
                        //passwordResetToken: { $eq: req.params.token },
                        passwordResetToken: { [Op.eq]: req.params.token },
                        passwordResetExpires: { [Op.gt]: new Date() },
                    }
                }
            });
        } catch (ex) {
            var ee = 1;
        }
        if (!user) {
            req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('/forgot');
        }
        res.render('account/reset', {
            title: 'Password Reset'
        });
        
    };

    /**
     * POST /reset/:token
     */
    module.resetPost =async function (req, res,  next) {
        req.assert('password', 'Password must be at least 4 characters long').len(4);
        req.assert('confirm', 'Passwords must match').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('back');
        }

        //const Op = models.Sequelize.Op;
        var user;
        try {
            user = await models.User.findOne({
                where: {
                    [Op.and]: {
                        passwordResetToken: { [Op.eq]: req.params.token },
                        passwordResetExpires: { [Op.gt]: new Date() },
                    }
                }
            });
        } catch (ex) {
            var ee = 1;
        }
        if (!user) {
            req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
        }

        user.set('password', req.body.password);
        user.set('emailVerified', true);
        user.set('passwordResetToken', null);
        user.set('passwordResetExpires', null);
        user.set('emailVerifyToken',null);
        
        await user.save();
        req.logIn(user, function (err) {
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
                from: process.env.SUPPORT_EMAIL,
                to: user.email,
                subject: 'Your ' + process.env.SITE_NAME +' password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' +user.userName + ' (' + user.email + ') has just been changed.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'Your password has been changed successfully.' });
                res.redirect('/account');
            });


        });

       
    };
    /**
     * GET /verifyemail/
     */
    module.verifyemail_requestGet = async function (req, res, next) {
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (user) {
            if(user.get('emailVerified')){
                req.flash('notify', {
                    type:'info',
                    notify:true,
                    delay:3000, msg: 'Your email has already been verified.' });
                res.redirect('/account');
            }
            var emailToken = await util.generateUrlSafeToken();

            user.set('emailVerified',false);
            user.set('emailVerifyToken',emailToken);
            user.set('emailVerifyExpires',new Date(Date.now() + (30*24*3600000)));

            await user.save();
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
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000, msg: 'We have sent an email with a confirmation link to your email address.' });
            
               res.redirect('/account');
            
        } else {
            res.redirect('/');
        }
    
    };
    /**
     * GET /verifyemail/:token
     */
    module.verifyemailGet = async function (req, res) {
        // if (req.isAuthenticated()) {
        //     return res.redirect('/');
        // }
       // const Op = models.Sequelize.Op;
        var user;
        try {
            user = await models.User.findOne({
                where: {
                    [Op.and]: {
                    //$and: {
                        //passwordResetToken: { $eq: req.params.token },
                        emailVerifyToken: { [Op.eq]: req.params.token },
                        emailVerifyExpires: { [Op.gt]: new Date() },
                    }
                }
            });
        } catch (ex) {
            var ee = 1;
        }
        if (!user) {
            req.flash('error', { msg: 'Email verification token is invalid or has expired.' });
            return res.redirect('/');
        }else{

        }
        
        try{
            user.set('emailVerified', true);
            user.set('emailVerifyToken', null);
            user.set('emailVerifyExpires', null);
            await user.save();
            req.flash('success', { msg: 'You have successfully verified your email address.' });
        }catch(ex){
            req.flash('error', { msg: 'Email verification failed.' });
        }
        return res.redirect('/');
        
    };
    return module;
}
