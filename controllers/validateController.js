var models = require('../models/index');
var sequelize  = require('sequelize');

module.exports = function () {
    
    var module = {};

    // middleware to prevent cacheing
    module.noCache = function nocache(req, res, next) {
       // return function nocache(req, res, next) {
            res.setHeader('Surrogate-Control', 'no-store')
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            res.setHeader('Pragma', 'no-cache')
            res.setHeader('Expires', '0')

            next()
        };
    /**
     * GET /validate/user/username
     */
    module.validateUserUsernameGet = async function (req, res) {
        var userName = req.query.userName;// || req.params.userName ;
        var user;
        if (userName) {
            userName = userName.toLowerCase();
            try {
                user = await models.User.findOne({ where: { userName: userName } });
            } catch (ex) {
                //res.json('This username is already taken!');
                //return;
            }
        } else {
            res.json('The username is not defined');
            return;
        }


        if (user) {
            res.json('This username is already taken!');
        } else
            res.json(true);
        return;
    };

/**
     * GET /validate/group/groupname
     */
    module.validateUserGroupnameGet = async function (req, res) {
        var itemName = req.query.name;// || req.params.userName ;
        var item;
        if (itemName) {
            itemName = itemName.toLowerCase();
            try {
                item = await models.Group.findOne(
                    //{ where: { name: itemName } }
                    {where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), itemName)}
                    );
            } catch (ex) {
                //res.json('This username is already taken!');
                //return;
            }
        } else {
            res.json('The group name is not defined');
            return;
        }


        if (item) {
            res.json('This group name is already taken!');
        } else
            res.json(true);
        return;
    };
    /**
     * GET /validate/user/:id/email
     */
    module.validateUserEmailGet = async function (req, res) {
        var userId = req.params.id;
        req.sanitize('email').normalizeEmail({
            remove_dots: false,
            gmail_remove_dots:false
        });
        var email = req.query.email;
        try {
            userId = parseInt(userId);
        } catch (ex) { }

        var user;
        if (email) {
            email = email.toLowerCase();
            try {
                user = await models.User.findOne({ where: { email: email } });
            } catch (ex) {
                //res.json('This email is already taken!');
                //return;
            }
        } else {
            res.json('The email is not defined');
            return;
        }


        if (user && user.id != userId) {
            res.json('The email address you have entered is already associated with another account.');
        } else
            res.json(true);
        return;
    };
   
    return module;
}
