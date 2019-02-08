'use strict';
var bcrypt = require('bcrypt');
var util = require('../controllers/util');

module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userName: { type: DataTypes.STRING },// unique: true },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: { type: DataTypes.STRING },// unique: true },
        emailVerified:DataTypes.BOOLEAN,
        emailVerifyToken: DataTypes.STRING,
        emailVerifyExpires: DataTypes.DATE,

        password: DataTypes.STRING,
        passwordResetToken: DataTypes.STRING,
        passwordResetExpires: DataTypes.DATE,

        gender: DataTypes.STRING(20),
        location: DataTypes.STRING,
        phone: DataTypes.STRING,
        website: DataTypes.STRING,
        picture: DataTypes.STRING,
        avatar:DataTypes.BLOB('medium'),
        //avatar:DataTypes.TEXT,
        google: DataTypes.STRING,
        facebook: DataTypes.STRING,
        twitter: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active'
        },
        parent: DataTypes.INTEGER
    }, {
            indexes: [
                {
                    unique: true,
                    fields: ['userName']
                },
                {
                    unique: true,
                    fields: ['email'],
                    where: {
                        email: {
                            [sequelize.Op.ne]: null
                        }
                    }
                }
                ]
        });
    //User.associate = function(models) {
    //  // associations can be defined here
    //    User.hasMany(models.Listing);
    //};
    User.associate = function (models) {
        // associations can be defined here
        if (models.User.sequelize.dialect.connectionManager.dialectName !== 'mssql') {
            User.hasMany(models.User, { foreignKey: 'parent', as: 'ChildUsers', onDelete: 'CASCADE' });
            User.belongsTo(models.User, { foreignKey: 'parent', as: 'ParentUser', onDelete: 'CASCADE' });
            
        } else {
            User.hasMany(models.User, { foreignKey: 'parent', as: 'ChildUsers', onDelete: 'CASCADE' });
            User.belongsTo(models.User, { foreignKey: 'parent', as: 'ParentUser', onDelete: 'CASCADE' });

        }
        User.hasMany(models.Group, { foreignKey: 'ownerUser', sourceKey: 'id', as: 'HasGroups', onDelete: 'CASCADE' });
        User.belongsToMany(models.Group, { through: 'GroupUsers', as: 'BelongsToGroups' });

        User.hasMany(models.Permission, { foreignKey: 'insertedByUserId', sourceKey: 'id', as: 'HasCreatedPermissions',onDelete: 'CASCADE' });

        User.hasMany(models.DataLayer, { foreignKey: 'ownerUser', sourceKey: 'id', as: 'HasDataLayers', onDelete: 'CASCADE' });
        User.hasMany(models.Map, { foreignKey: 'ownerUser', sourceKey: 'id', as: 'HasMaps', onDelete: 'CASCADE' });

        User.hasMany(models.Permission, {
            as: 'Permissions',
            foreignKey: 'grantToId',
            constraints: false,
            scope: {
                grantToType: 'user'
            }
        });
    };
    User.prototype.checkAccessAsync = async function (models,options) {
        var me = this;
        if (options) {
            for (var key in options) { // to check in order
                if (key == 'user' && options.user) {
                    if (options.user === me.userName) {
                        return true;
                    }
                } else if (key == 'users' && options.users) {
                    // check any user in the list
                    var users = Array.isArray(options.users) ? options.users : (options.users + '').split(',');
                    if (users.some(user => { return (user === me.userName); })) {
                        return true;
                    }
                } else if (key == 'role' && options.role) {
                    if (await me.isInGroupAsync(options.role)) {
                        return true;
                    }
                } else if (key == 'anyOfRoles' && options.anyOfRoles) {
                    // check any role in the list
                    var roles = Array.isArray(options.anyOfRoles) ? options.anyOfRoles : (options.anyOfRoles + '').split(',');
                    // note: some does not work as expected with async calls
                    //if (await roles.some(async role => { return (await me.isInGroupAsync(role)); })) {
                    //    next();
                    //    return;
                    // }

                    //todo: ? Promise.all
                    var anyChecked = false;
                    for (const role of roles) {
                        if (await me.isInGroupAsync(role)) {
                            anyChecked = true;
                            break;
                        }
                    }
                    if (anyChecked) {
                        return true;
                    }
                } else if (key == 'allRoles' && options.allRoles) {
                    // check any role in the list
                    var roles = Array.isArray(options.allRoles) ? options.allRoles : (options.allRoles + '').split(',');

                    // note: every does not work as expected with async calls
                    //if (await roles.every(async role => { return (await me.isInGroupAsync(role)); })) {
                    //    next();
                    //    return;
                    //}

                    //todo: ? Promise.all
                    var allChecked = roles.length > 0;
                    for (const role of roles) {
                        if (!await me.isInGroupAsync(role)) {
                            allChecked = false;
                            break;
                        }
                    }
                    if (allChecked) {
                        return true;
                    }

                }
                else if (key == 'permissionName' && options.permissionName && options.contentType) {
                    var [err, cp] = await util.call(me.checkPermissionAsync(models, options));
                    //var cp= await me.checkPermissionAsync(models, options) ;
                    //if (await me.checkPermissionAsync(models, options)) {
                    if(cp){
                        return true;
                    }
                } else if (key == 'check' && options.check) {
                    var [err, c] = await util.call(options.check(me));
                    if (c) {
                        return true;
                    }
                }
            }


        }

        return false;
    };
    User.prototype.checkPermissionAsync = async function (models,{ permissionName, contentType, contentId } = {}) {
        var where1= {};
        if (permissionName)
            where1.permissionName = permissionName;
        if (contentType)
            where1.contentType = contentType;
        if (contentId)
            where1.contentId = contentId;
        where1.grantToType = 'user';
        try {
            var result_user = await models.Permission.findAll({
                where: where1,
                include: [
                    {
                        model: models.User, as: 'assignedToUser',
                        required: true,
                        where: {
                            id: this.id
                        }
                    }
                ]
            }
            );
            if (result_user && result_user.length > 0)
                return true;
        } catch (ex) {
            var a = 1;
        }

        try {
            where1.grantToType = 'group';
            var result_groups = await models.Permission.findAll({
                where: where1,
                include: [
                    {
                        model: models.Group, as: 'assignedToGroup',
                        required: true,
                        include: [
                            {
                                model: models.User, as: 'Users',
                                required: true,
                                where: {
                                    id: this.id
                                }
                            }
                        ]
                    }
                ]
            }
            );
        } catch (ex) {
        }
        if (result_groups && result_groups.length > 0)
            return true;

        return false;
    };
    User.prototype.isInGroupAsync = async function (group) {
        var r = false;
        var t = typeof group;
        if (t == 'object')
            r = await this.hasBelongsToGroups(group);
        else if (t == 'string') {
            r = await this.isInGroupByNameAsync(group);
        }
        return r;
    };
    User.prototype.isInGroupByNameAsync0 = async function (groupName) {
        var groups = await this.getBelongsToGroups();
        var r = false;
        if (groups) {
            var group = groups.find((v) => {
                return v.name == groupName;
            });
            r = (group ? true : false);
        }
        return r;
    };
    User.prototype.isInGroupByNameAsync = async function (groupName) {
        var groups = await this.getBelongsToGroups({ where: { name: groupName } });
        var r = groups.length > 0;
        return r;
    };

    async function onBeforeSave(user, options) {
        //encryptPasswordIfChanged
        if (user.changed('password')) {
           user.password= await user.hashPassword(user.get('password'))
        }

        if (user.changed('userName')) {
            user.userName = user.get('userName') ? user.get('userName').toLowerCase() : user.get('userName');
        }
        if (user.changed('email')) {
            user.email = user.get('email') ? user.get('email').toLowerCase() : user.get('email');
        }
    }
    User.prototype.hashPassword = async function (password) {

        if (typeof password === 'undefined')
            password = this.password;
        const saltRounds = 10;
        // generate a salt
        const salt = await bcrypt.genSalt(saltRounds);

        //const salt= bcrypt.genSaltSync(saltRounds);

        // hash the password along with our new salt
        const hashedPassword = await bcrypt.hash(password, salt);
        // override the cleartext password with the hashed one

       

        //const hashedPassword = await new Promise((resolve, reject) => {
        //    bcrypt.hash(password, salt, function (err, hash) {
        //        if (err) reject(err)
        //        resolve(hash)
        //    });
        //})


        return hashedPassword;
    };

    User.prototype.comparePassword = async function (password) {
        var model = this;
        const isMatch = await bcrypt.compare(password, model.get('password'));
        return isMatch;
    };

    User.beforeCreate(onBeforeSave);
    User.beforeUpdate(onBeforeSave);


    return User;
};