'use strict';
var Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    var CswProvider = sequelize.define('CswProvider', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        url: DataTypes.STRING,
        enabled:{
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
           
    });
    CswProvider.associate = function (models) {
        
    };
    
    return CswProvider;
};