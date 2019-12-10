const { Op } = require('sequelize');
var nodemailer = require('nodemailer');
var util = require('./util');
var models = require('../models/index');
module.exports = function () {
    var module = {};

    /**
     * GET /users
     */
    module.allUsersGet = async function (req, res) {
        var items;
        //var users = await models.User.findAll({ where: { parent: req.user.id } });
        items = await models.User.findAll({
                attributes: ['userName','id','firstName','lastName','parent'] ,
                where: { userName:{[Op.ne]:'superadmin'} } ,
                
                order:[     ['userName'] ]   
            } );
        
        return res.json(items);
    };

    /**
     * GET /admin/users
     */
    module.usersGet = async function (req, res) {
        var items;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        if (res.locals.identity.isAdministrator) {
            items = await models.User.findAll();
        } else {
            items = await models.User.findAll({ where: { parent: req.user.id } });
        }
        res.render('admin/users', {
            title: 'Users',
            items: items
        });
    };
    

    /**
     * GET /user/:id
     */
    module.userGet = async function (req, res) {
        var user,err;
        if (req.params.id && req.params.id != '-1') {
            
                  
                if (res.locals.identity.isAdministrator) {
                    [err, user] = await util.call(models.User.findOne({
                        where: {
                            id: req.params.id
                        },
                        include: [{ model: models.Group, as: 'BelongsToGroups' }]
                    })
                    );
                } else{
                   
                    [err, user] = await util.call(models.User.findOne({
                        where: {
                            id: req.params.id,
                            parent: req.user.id 
                        },
                        include: [{ model: models.Group, as: 'BelongsToGroups' }]
                    })
                    );
                }  
            
            if (!user) {
                req.flash('error', {
                    msg: 'User not found!'
                });
                return res.redirect('/');
            }

            //user.isAdministrator = (user.BelongsToGroups.find((v) => { return v.name == 'administrators'; }) != null);
            //user.isPowerUser = (user.BelongsToGroups.find((v) => { return v.name == 'powerUsers'; }) != null);
            //user.isDataManager = (user.BelongsToGroups.find((v) => { return v.name == 'dataManagers'; }) != null);
            //user.isDataAnalyst = (user.BelongsToGroups.find((v) => { return v.name == 'dataAnalysts'; }) != null);

            var roles = user.BelongsToGroups.map(v => {
                return v.name;
            });
            
            user.isAdministrator = roles.includes('administrators');
            user.isPowerUser = roles.includes('powerUsers');
            user.isDataManager = roles.includes('dataManagers');
            user.isDataAnalyst = roles.includes('dataAnalysts');
        }

        res.render('admin/user', {
            title: 'User',
            _user: user || {
                id: -1
            }
        });
    };

    /**
     * POST /user/:id
     */
    module.userPost = async function (req, res) {
        if ('password' in req.body) {
            req.assert('password', 'Password must be at least 4 characters long').len(4);
            req.assert('confirm', 'Passwords must match').equals(req.body.password);
        }
        req.assert('userName', 'User name cannot be blank').notEmpty();
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.sanitize('email').normalizeEmail({
            remove_dots: false
        });
        req.sanitizeBody('userName').escape();
        req.sanitizeBody('firstName').escape();
        req.sanitizeBody('lastName').escape();
        req.sanitizeBody('location').escape();
        var userId = req.params.id || -1;
        try {
            userId = parseInt(userId);
        } catch (ex) { }
        var errors = req.validationErrors();
        //prepare body fields
        req.body.status = ('status' in req.body) ? 'active' : 'inactive';
        req.body.isAdministrator = ('isAdministrator' in req.body) ? true : false;
        req.body.isPowerUser = ('isPowerUser' in req.body) ? true : false;
        req.body.isDataManager = ('isDataManager' in req.body) ? true : false;
        req.body.isDataAnalyst = ('isDataAnalyst' in req.body) ? true : false;

        if (req.body.updatedAt) {
            try {
                req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
            } catch (ex) {
            }
        }

        if (errors) {
            req.flash('error', errors);
            res.render('admin/user', {
                title: 'User',
                _user: {
                    id: userId,
                    avatar:req.body.avatar,
                    picture:req.body.picture,

                    updatedAt:req.body.updatedAt,
                    userName: req.body.userName,
                    email: req.body.email,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    location: req.body.location,
                    website: req.body.website,
                    gender: req.body.gender,
                    status: req.body.status,

                    isAdministrator: req.body.isAdministrator,
                    isPowerUser: req.body.isPowerUser,
                    isDataManager: req.body.isDataManager,
                    isDataAnalyst: req.body.isDataAnalyst

                }
            });
            return;
        }
        var owner = req.user;
        //var administrators, powerUsers, dataManagers, dataAnalysts;
        var [, administrators] = await util.call(models.Group.findOne({ where: { name: 'administrators' } }));
        var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
        var [, powerUsers] = await util.call( models.Group.findOne({ where: { name: 'powerUsers' } }));
        var [, dataManagers] = await util.call (models.Group.findOne({ where: { name: 'dataManagers' } }));
        var [, dataAnalysts] = await util.call(models.Group.findOne({ where: { name: 'dataAnalysts' } }));

        if (userId == -1) {
            var emailToken =null;
            try{
                emailToken =await util.generateUrlSafeToken();
            }catch(ex){}
                   
            try {
                var newUser = await models.User.create({
                    userName: req.body.userName,
                    email: req.body.email,
                    emailVerified:false,
                    emailVerifyToken:emailToken,
                    emailVerifyExpires:new Date(Date.now() + (30*24*3600000)),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    location: req.body.location,
                    website: req.body.website,
                    gender: req.body.gender,
                    password: req.body.password,
                    status: req.body.status,
                    parent: (owner ? owner.id : 0)
                });
               
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                    msg: 'Changes successfully saved!'
                });
                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(newUser);
                    //} else {
                    //}
                } catch (ex) { }
                try {
                    
                    allUsers.addUser(newUser);
                    
                } catch (ex) { }
                try {
                    if (res.locals.identity.isAdministrator) {
                        if (req.body.isPowerUser) {
                            powerUsers.addUser(newUser);
                        } else {
                        }
                    }
                } catch (ex) { }
                try {
                    
                    if (req.body.isDataManager) {
                        dataManagers.addUser(newUser);
                    } else {
                    }
                } catch (ex) { }
                try {
                    if (req.body.isDataAnalyst) {
                        dataAnalysts.addUser(newUser);
                    } else {
                    }
                } catch (ex) { }

                
                try {
                    var transporter = nodemailer.createTransport({
                        service: process.env.EMAIL_SENDER_SERVICE,
                        secure: false,
                        auth: {
                            user: process.env.EMAIL_SENDER_USERNAME,
                            pass: process.env.EMAIL_SENDER_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false //https://github.com/nodemailer/nodemailer/issues/406
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
                    var info = await transporter.sendMail(mailOptions);
                } catch (ex) {
                    req.flash('info', {
                        msg: 'Failed to send inform email to the user!'
                    });
        
                }

                return res.redirect('/admin/user/' + newUser.id);
            } catch (ex) {
                if (ex && ex.errors) {
                    req.flash('error', {
                        msg: 'Already exists!'
                    });
                } else
                    req.flash('error', {
                        msg: 'Unknow error!'
                    });
                res.render('admin/user', {
                    title: 'User',
                    _user: {
                        id: userId,
                        avatar:undefined,
                        picture:undefined,

                        updatedAt: req.body.updatedAt,
                        userName: req.body.userName,
                        email: req.body.email,
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        location: req.body.location,
                        website: req.body.website,
                        gender: req.body.gender,
                        password: req.body.password,
                        status: req.body.status,

                        isAdministrator: req.body.isAdministrator,
                        isPowerUser: req.body.isPowerUser,
                        isDataManager: req.body.isDataManager,
                        isDataAnalyst: req.body.isDataAnalyst
                    }
                });
                return;
            }
        } else {
            try {
                var user ;
                
                if (res.locals.identity.isAdministrator) {
                    user = await models.User.findOne({
                        where: {
                            id: userId
                        }
                    });
                } else{
                    
                    user = await models.User.findOne({
                        where: {
                            id: userId,
                            parent: req.user.id 
                        }
                    });
                }  
                if (!user) {
                    req.flash('error', {
                        msg: 'User not found!'
                    });

                    return res.redirect('/admin/user/' + userId);
                }
               
                if (req.body.updatedAt && user.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                        msg: 'Information has been edited by another user. Please refresh the page and try again.'
                    });
                   
                    res.render('admin/user', {
                        title: 'User',
                        _user: {
                            id: userId,
                            avatar:user.avatar,
                            picture:req.body.picture,

                            updatedAt: req.body.updatedAt,
                            userName: req.body.userName,
                            'email': req.body.email,
                            'firstName': req.body.firstName,
                            'lastName': req.body.lastName,
                            'gender': req.body.gender,
                            'location': req.body.location,
                            'website': req.body.website,
                            'status': req.body.status,

                            isAdministrator: req.body.isAdministrator,
                            isPowerUser: req.body.isPowerUser,
                            isDataManager: req.body.isDataManager,
                            isDataAnalyst: req.body.isDataAnalyst
                        }
                    });
                        return;
                }
                var emailVerified=user.get('emailVerified');
                if(user.get('email')!==req.body.email){
                    emailVerified=false;
                }
                //skip userName
                user.set('email', req.body.email);
                user.set('emailVerified', emailVerified);
                user.set('firstName', req.body.firstName);
                user.set('lastName', req.body.lastName);
                user.set('gender', req.body.gender);
                user.set('location', req.body.location);
                user.set('website', req.body.website);
                user.set('status', req.body.status);
                await user.save();


                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(user);
                    //} else {
                    //    administrators.removeUsers(user);
                    //}
                } catch (ex) { }
                try {
                    if (res.locals.identity.isAdministrator) {
                        if (req.body.isPowerUser) {
                            powerUsers.addUser(user);
                        } else {
                            powerUsers.removeUsers(user);
                        }
                    }
                } catch (ex) { }
                try {
                    if (req.body.isDataManager) {
                        dataManagers.addUser(user);
                    } else {
                        dataManagers.removeUsers(user);
                    }
                } catch (ex) { }
                try {
                    if (req.body.isDataAnalyst) {
                        dataAnalysts.addUser(user);
                    } else {
                        dataAnalysts.removeUsers(user);
                    }
                } catch (ex) { }
                //req.flash('success', {
                req.flash('notify', {
                    type:'success',
                    msg: 'Changes successfully saved!',
                    notify:true,
                    delay:3000
                });
                try {
                    var transporter = nodemailer.createTransport({
                        service: process.env.EMAIL_SENDER_SERVICE,
                        secure: false,
                        auth: {
                            user: process.env.EMAIL_SENDER_USERNAME,
                            pass: process.env.EMAIL_SENDER_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false //https://github.com/nodemailer/nodemailer/issues/406
                        }
                    });
                   
                    var mailOptions = {
                        to: user.email,
                        from: process.env.SUPPORT_EMAIL,
                        subject: '✔ Account is modified (' + process.env.SITE_NAME+')',
                        text: 'You are receiving this email because your account in this site is modified by "' + req.user.userName+'".\n\n' +
                            ''
                        };
                    var info = await transporter.sendMail(mailOptions);
                } catch (ex) {
                    req.flash('info', {
                        msg: 'Failed to send inform email to the user!'
                    });
        
                }
                return res.redirect('/admin/user/' + userId);
            } catch (err) {
                if (err.original && err.original.code == 'SQLITE_CONSTRAINT') {
                    req.flash('error', {
                        msg: 'The email address you have entered is already associated with another account.'
                    });
                } else {
                    req.flash('error', {
                        msg: 'Error in updating profile infos!'
                    });
                }

                res.render('admin/user', {
                    title: 'User',
                    _user: {
                        id: userId,
                        avatar:(user?user.avatar:null),
                        picture:req.body.picture,
                        
                        updatedAt: req.body.updatedAt,
                        userName: req.body.userName,
                        'email': req.body.email,
                        'firstName': req.body.firstName,
                        'lastName': req.body.lastName,
                        'gender': req.body.gender,
                        'location': req.body.location,
                        'website': req.body.website,
                        'status': req.body.status,

                        isAdministrator: req.body.isAdministrator,
                        isPowerUser: req.body.isPowerUser,
                        isDataManager: req.body.isDataManager,
                        isDataAnalyst: req.body.isDataAnalyst
                    }
                });
                return;
            }

        }
    };

    /**
     * PUT /resetUserPassword/:id
    Permission: Administrators 
    */
    module.resetUserPasswordPut = async function (req, res, next) {
        req.assert('password', 'Password must be at least 4 characters long').len(4);
        req.assert('confirm', 'Passwords must match').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('back');
        }
        var user;
        if (req.params.id && req.params.id != '-1') {
            
            [err, user] = await util.call(models.User.findOne({
                where: {
                    id: req.params.id
                }
            }));

        }
        if (!user) {
            req.flash('error', {
                msg: 'User not found!'
            });
            return res.redirect('/');
        }
        
            user.set('password', req.body.password);
         [err,]=   await util.call( user.save());
         if(err) {
            req.flash('error', {
                msg: 'Failed to change password!'
            });
            return res.redirect('/admin/user/' + user.id);
        }
        req.flash('notify', {
            type:'success',
            notify:true,
            delay:3000,
            msg: 'User\'s password has been changed.'
        });
        try {
            var transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SENDER_SERVICE,
                secure: false,
                auth: {
                    user: process.env.EMAIL_SENDER_USERNAME,
                    pass: process.env.EMAIL_SENDER_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false //https://github.com/nodemailer/nodemailer/issues/406
                }
            });
            var mailOptions = {
                from: process.env.SUPPORT_EMAIL,
                to: user.email,
                subject: 'Your ' + process.env.SITE_NAME + ' password has been changed by ' + req.user.userName,
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.userName + ' (' + user.email + ') has just been changed.\n'
            };
            var info = await transporter.sendMail(mailOptions);
            req.flash('notify', {
                type:'success',
                notify:true,
                delay:3000,
                msg: 'An email was sent to inform ' + user.userName
            });
        } catch (ex) {
            req.flash('info', {
                msg: 'Failed to send inform email to the user!'
            });

        }
        return res.redirect('/admin/user/' + user.id);
    };

    /**
     * DELETE /admin/user/:id/delete
     */
    module.deleteUserDelete = async function (req, res, next) {
        var user;
        if (req.params.id && req.params.id != '-1') {
            try {
                user = await models.User.findOne({
                    where: {
                        id: req.params.id
                    }
                });
            } catch (ex) {
                var ee = 1;
            }
        }
        if (!user) {
            req.flash('error', {
                msg: 'User not found!'
            });
            return res.redirect('/');
        }
        var userName = user.userName;
        
        if (userName == 'superadmin'
            || userName == 'admin') {
            req.flash('error', { msg: `${userName} account can not be deleted.` });
            return res.redirect('/admin/user/' + user.id);
            
        }
        var childUsers = await user.getChildUsers();
        //if (await user.hasChildUsers()) { // does not work correctly
        if (childUsers.length > 0) {
            req.flash('error', { msg: `${userName} account can not be deleted. This account is the parent of some other user accounts!` });
            return res.redirect('/admin/user/' + user.id);
        }
        try {
            await user.destroy();
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete account!'
            });
            return res.redirect('/admin/user/' + user.id);
        }

        try{
            var tryDeletePermissions = await models.Permission.destroy(
                {
                     where: {
                        grantToType: 'user',
                        grantToId:  req.params.id
                         }
                });
            }catch(ex){}

        req.flash('info', {
            msg: `Account (${userName}) has been permanently deleted.`
        });

        res.redirect('/admin/users');

    };
    
      /**
     * GET /groups
     */
    module.allGroupsGet = async function (req, res) {
        var items;
        items = await models.Group.findAll({
            where: { type:{[Op.ne]:'hidden'} }, 
            order:[ 
                   ['type','DESC'],
                   ['name']
                ]   
            } );
        
        return res.json(items);
    };

    /**
     * GET /admin/groups
     */
    module.groupsGet = async function (req, res) {
        var items;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        
        if (res.locals.identity.isSuperAdministrator) {
            items = await models.Group.findAll(
                {
                    // where: { type:{[Op.ne]:'hidden'} }, 
                     include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                    ],
                    order:[ 
                            ['type','DESC'],
                            [{model: models.User, as: 'OwnerUser'}, 'userName', 'ASC'],
                            ['name']
                         ]   
                }
                
            );
        } else if (res.locals.identity.isAdministrator) {
            items = await models.Group.findAll(
                {
                     where: { type:{[Op.ne]:'hidden'} }, 
                     include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                    ],
                    order:[ 
                            ['type','DESC'],
                            [{model: models.User, as: 'OwnerUser'}, 'userName', 'ASC'],
                            ['name']
                         ]   
                }
                
            );
        } else {
            items = await models.Group.findAll(
                {
                     where: { ownerUser: req.user.id },type:{[Op.ne]:'hidden'} ,
                     include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                    ],
                    order:[ 
                        ['type','DESC'],
                        [{model: models.User, as: 'OwnerUser'}, 'userName', 'ASC'],
                        ['name']
                     ]   

                    });
           //items = await models.Group.findAll();
        }
        res.render('admin/groups', {
            title: 'Groups',
            items: items
        });
    };
     /**
     * GET /admin/group/:id
     */
    module.groupGet = async function (req, res) {
        var item,err;
        var availableUsers;
        var memberUsers;
        if (req.params.id && req.params.id != '-1') {
            if (res.locals.identity.isSuperAdministrator) {
                [err, item] = await util.call(models.Group.findOne({
                where: {
                  //  type:{[Op.ne]:'hidden'},
                    id: req.params.id
                },
                include: [
                    { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                    { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                ]
                })
            );
        } else if (res.locals.identity.isAdministrator) {
                    [err, item] = await util.call(models.Group.findOne({
                    where: {
                        type:{[Op.ne]:'hidden'},
                        id: req.params.id
                    },
                    include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                        { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                    ]
                    })
                );
            } else{
                [err, item] = await util.call(models.Group.findOne({
                    where: {
                        type:{[Op.ne]:'hidden'},
                        id: req.params.id,
                        ownerUser: req.user.id 
                    },
                    include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                        { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                    ]
                    })
                );
            }  
            
            if (!item) {
                req.flash('error', {
                    msg: 'Group not found!'
                });
                return res.redirect('/');
            }

           
            // var roles = user.BelongsToGroups.map(v => {
            //     return v.name;
            // });
            
            // user.isAdministrator = roles.includes('administrators');
            // user.isPowerUser = roles.includes('powerUsers');
            // user.isDataManager = roles.includes('dataManagers');
            // user.isDataAnalyst = roles.includes('dataAnalysts');
           
            var availableUsers_=[];
            if (res.locals.identity.isAdministrator) {
                availableUsers_ = await models.User.findAll(
                    {
                        
                        where: { userName:{[Op.ne]:'superadmin'} } ,
                        attributes: ['userName','id','firstName','lastName','parent'] ,
                        order:[     ['userName'] ]   
                    }
                );
                
            } else {
                availableUsers_ = await models.User.findAll(
                {
                         where: {
                            parent: req.user.id,
                            userName:{[Op.ne]:'superadmin'} 
                         },
                         attributes: ['userName','id','firstName','lastName','parent'] ,
                         order:[     ['userName'] ]       
                });
            }

            var memberUsers=item.Users;
            availableUsers=[];
            for(var i=0;i< availableUsers_.length;i++){
                var aUser= availableUsers_[i];
                var cUser = memberUsers.find((v) => {
                    return v.id == aUser.id;
                });
                if(!cUser){
                    availableUsers.push(aUser);
                }
            }    
            
        }

        res.render('admin/group', {
            title: 'Group',
            item: item || {
                id: -1
            },
            availableUsers:availableUsers||[],
            memberUsers:memberUsers||[]
        });
    };
    
     /**
     * POST /group/:id
     */
    module.groupPost = async function (req, res) {
        
        req.assert('name', 'Group name cannot be blank').notEmpty();
        req.sanitizeBody('name').escape();
        var groupId = req.params.id || -1;
        try {
            groupId = parseInt(groupId);
        } catch (ex) { }
        var errors = req.validationErrors();
        
        if (req.body.updatedAt) {
            try {
                req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
            } catch (ex) {
            }
        }

        if (errors) {
            req.flash('error', errors);
            res.render('admin/group', {
                title: 'Group',
                item: {
                    id: groupId,
                    name: req.body.name,
                    description: req.body.description
                }
            });
            return;
        }
        var owner = req.user;
       
        if (groupId == -1) {
            try {
                var newGroup = await models.Group.create({
                    name: req.body.name,
                    description: req.body.description,
                    ownerUser: (owner ? owner.id : 0)
                });
               
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                    msg: 'Changes successfully saved!'
                });
                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(newUser);
                    //} else {
                    //}
                } catch (ex) { }
               
                return res.redirect('/admin/group/' + newGroup.id);
            } catch (ex) {
                if (ex && ex.errors) {
                    req.flash('error', {
                        msg: 'Already exists!'
                    });
                } else
                    req.flash('error', {
                        msg: 'Unknow error!'
                    });
                res.render('admin/group', {
                    title: 'Group',
                    item: {
                        id: groupId,
                        updatedAt: req.body.updatedAt,
                        name: req.body.name,
                        description: req.body.description
                    }
                });
                return;
            }
        } else {
            try {
                var group;
              
                if (res.locals.identity.isSuperAdministrator) {
                    group = await models.Group.findOne({
                        where: {
                        //    type:{[Op.ne]:'hidden'},
                            id: groupId
                        }
                    });
                } else   if (res.locals.identity.isAdministrator) {
                    group = await models.Group.findOne({
                        where: {
                            type:{[Op.ne]:'hidden'},
                            id: groupId
                        }
                    });
                } else{
                    
                    group = await models.Group.findOne({
                        where: {
                            type:{[Op.ne]:'hidden'},
                            id: groupId,
                            ownerUser: req.user.id 
                        }
                    });
                }  

                if (!group) {
                    req.flash('error', {
                        msg: 'Group not found!'
                    });

                    return res.redirect('/admin/group/' + groupId);
                }
               
                if (req.body.updatedAt && group.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                        msg: 'Information has been edited by another user. Please refresh the page and try again.'
                    });
                   
                    res.render('admin/group', {
                        title: 'Group',
                        item: {
                            id: groupId,
                            updatedAt: req.body.updatedAt,
                            name: req.body.name,
                            'description': req.body.description
                        }
                    });
                        return;
                }
               
                //skip userName
                group.set('description', req.body.description);
                
                await group.save();

               
                //req.flash('success', {
                req.flash('notify', {
                    type:'success',
                    msg: 'Changes successfully saved!',
                    notify:true,
                    delay:3000
                });
                return res.redirect('/admin/group/' + groupId);
            } catch (err) {
               
                    req.flash('error', {
                        msg: 'Error in updating group infos!'
                    });
                

                res.render('admin/group', {
                    title: 'Group',
                    item: {
                        id: groupId,
                        
                        updatedAt: req.body.updatedAt,
                        name: req.body.name,
                        'description': req.body.description
                    }
                });
                return;
            }

        }
    };
     /**
     * POST /group/:id/members
     */
    module.groupMembersPost = async function (req, res) {
        
        req.sanitizeBody('name').escape();
        var groupId = req.params.id || -1;
        try {
            groupId = parseInt(groupId);
        } catch (ex) { }
        var errors = req.validationErrors();
        
        if (req.body.updatedAt) {
            try {
                req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
            } catch (ex) {
            }
        }

        if (errors) {
            //req.flash('error', errors);
            req.flash('notify', {
                type:'error',
                notify:true,
                delay:3000,
                msg: errors
            });
            return res.redirect('/admin/group/' + newGroup.id);
            return;
        }
        var owner = req.user;
       
        if (groupId == -1) {
                req.flash('notify', {
                    type:'error',
                    notify:true,
                    delay:3000,
                    msg: 'Group not found!'
                });
                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(newUser);
                    //} else {
                    //}
                } catch (ex) { }
               
                return res.redirect('/admin/groups');
          
        } else {
            try {
                var group;
                if (res.locals.identity.isSuperAdministrator) {
                    group = await models.Group.findOne({
                        where: {
                           // type:{[Op.ne]:'hidden'},
                            id: groupId
                        },
                        include: [
                            { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                            { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                        ]
                    });
                } else if (res.locals.identity.isAdministrator) {
                    group = await models.Group.findOne({
                        where: {
                            type:{[Op.ne]:'hidden'},
                            id: groupId
                        },
                        include: [
                            { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                            { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                        ]
                    });
                } else{
                    
                    group = await models.Group.findOne({
                        where: {
                            type:{[Op.ne]:'hidden'},
                            id: groupId,
                            ownerUser: req.user.id 
                        },
                        include: [
                            { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                            { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                        ]
                    });
                }  

                if (!group) {
                    req.flash('error', {
                        msg: 'Group not found!'
                    });

                    return res.redirect('/admin/group/' + groupId);
                }
               
                if (req.body.updatedAt && group.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                        msg: 'Group information has been edited by another user. Please try again.'
                    });
                   
                    return res.redirect('/admin/group/' + groupId);
                        
                }
                var addmembers=[];
                if(req.body.addmembers)
                     addmembers=req.body.addmembers.split(',');
                var removemembers=[];
                if(req.body.removemembers)
                    removemembers=req.body.removemembers.split(',');
                var currentMembers= group.Users;
                //group.set('description', req.body.description);
                var addmembers_users;
                if(addmembers && addmembers.length){
                    if (res.locals.identity.isAdministrator) {
                        addmembers_users = await models.User.findAll(
                        {
                                where: {
                                    [Op.and]: [
                                        {
                                        userName:{[Op.ne]:'superadmin'},
                                        },
                                        {
                                            id:addmembers
                                        }
                                    ]
                                } 
                        });
                    } else {
                        addmembers_users = await models.User.findAll(
                        {
                            where: {
                                [Op.and]: [
                                    {parent: req.user.id},
                                    {
                                    userName:{[Op.ne]:'superadmin'},
                                    },
                                    {
                                        id:addmembers
                                    }
                                ]
                            } 
                        });
                    }
                }
                var removemembers_users;
                if(removemembers && removemembers.length){
                    if (res.locals.identity.isAdministrator) {
                        removemembers_users = await models.User.findAll(
                        {
                            where: {
                                [Op.and]: [
                                    {
                                    userName:{[Op.ne]:'superadmin'},
                                    },
                                    {
                                        id:removemembers
                                    }
                                ]
                            } 
                        });
                    } else {
                        removemembers_users = await models.User.findAll(
                        {
                            where: {
                                [Op.and]: [
                                    {parent: req.user.id},
                                    {
                                    userName:{[Op.ne]:'superadmin'},
                                    },
                                    {
                                        id:removemembers
                                    }
                                ]
                            } 
                        });
                    }
                }
                var addmembers_count=0
                if(addmembers_users && addmembers_users.length){
                    addmembers_count=addmembers_users.length;
                    group.addUsers(addmembers_users);
                }
                var removemembers_count=0;
                if(removemembers_users && removemembers_users.length){
                    removemembers_count= removemembers_users.length;
                    group.removeUsers(removemembers_users);
                }

                await group.save();

               
                //req.flash('success', {
                req.flash('notify', {
                    type:'success',
                    html: `Changes successfully saved!<br/>
<b> Added:</b> ${addmembers_count} user(s)<br/>
<b> Removed:</b> ${removemembers_count} user(s)`,
                    notify:true,
                    delay:3000
                });
                return res.redirect('/admin/group/' + groupId);
            } catch (err) {
               
                    req.flash('error', {
                        msg: 'Error in updating group members! try again.'
                    });
                

                    return res.redirect('/admin/group/' + groupId);
            }

        }
    };

     /**
     * DELETE /admin/group/:id/delete
     */
    module.deleteGroupDelete = async function (req, res, next) {
        var group;
        var groupId;
        var groupName;
        if (req.params.id && req.params.id != '-1') {
            groupId= req.params.id;
            if (res.locals.identity.isAdministrator) {
                group = await models.Group.findOne({
                    where: {
                        type:'normal',
                        id: groupId
                    },
                    include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                        { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                    ]
                });
            } else{
                
                group = await models.Group.findOne({
                    where: {
                        type:'normal',
                        id: groupId,
                        ownerUser: req.user.id 
                    },
                    include: [
                        { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']},
                        { model: models.User, as: 'Users',through: 'GroupUsers',attributes: ['userName','id','firstName','lastName','parent'] }
                    ]
                });
            }  

            if (!group) {
                req.flash('error', {
                    msg: 'Group not found or can not be deleted!'
                });

                return res.redirect('/admin/group/' + groupId);
            }
        }
        
        
        try {
            groupName= group.name;
            await group.destroy();
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete group!'
            });
            return res.redirect('/admin/group/' + groupId);
        }

        try{
            var tryDeletePermissions = await models.Permission.destroy(
                {
                     where: {
                        grantToType: 'group',
                        grantToId:  req.params.id
                         }
                });
            }catch(ex){}

        req.flash('info', {
            msg: `Group (${groupName}) has been permanently deleted.`
        });

        res.redirect('/admin/groups');

    };
    return module;
}