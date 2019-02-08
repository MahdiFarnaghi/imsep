﻿'use strict';
module.exports = (sequelize, DataTypes) => {
    var DataLayer = sequelize.define('DataLayer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: DataTypes.STRING,
        dataType: DataTypes.STRING(50),
        description: DataTypes.TEXT,
        keywords: DataTypes.STRING(200),
        details: DataTypes.TEXT,
        thumbnail:DataTypes.BLOB('medium')
        
    }, {

        });
    DataLayer.associate = function (models) {
        DataLayer.belongsTo(models.User, { foreignKey: 'ownerUser', targetKey: 'id', as: 'OwnerUser' ,onDelete: 'CASCADE' });
        DataLayer.hasMany(models.Permission, {
            as: 'Permissions',//, onDelete:'CASCADE',
            foreignKey: 'contentId', sourceKey:'id',
            constraints: false,
            scope: {
                contentType: 'DataLayer'
            }
        });
    };
    return DataLayer;
};