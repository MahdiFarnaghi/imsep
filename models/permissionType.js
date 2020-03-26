'use strict';
module.exports = (sequelize, DataTypes) => {
    var PermissionType = sequelize.define('PermissionType', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        contentType: DataTypes.STRING(60),
        caption: DataTypes.STRING,
        accessType: DataTypes.STRING(60),
        // accessType: {
        //     type: DataTypes.ENUM,
        //     values:['menu','tool','data]
        // },
        
        permissionNames: DataTypes.STRING,
        displayOrder: DataTypes.INTEGER,
        extra: DataTypes.TEXT
    }, {
        indexes: [
            {
                unique: true,
                fields: ['contentType']
            }
            ]
        });
   
    PermissionType.associate = function (models) {
        // associations can be defined here
       

     
    };
    return PermissionType;
};