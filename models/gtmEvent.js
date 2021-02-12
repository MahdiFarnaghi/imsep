'use strict';
module.exports = (sequelize, DataTypes) => {
    var GtmEvent = sequelize.define('GtmEvent', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        active:{
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        name: DataTypes.STRING,
        topicwords: DataTypes.STRING(500),
        
        latitude_min:DataTypes.FLOAT,
        latitude_max:DataTypes.FLOAT,
        longitude_min:DataTypes.FLOAT,
        longitude_max:DataTypes.FLOAT,
        
        date_time_min: DataTypes.DATE,
        date_time_max: DataTypes.DATE,
        
        mapId: DataTypes.INTEGER,
        details: DataTypes.TEXT
    }, {

        });
    GtmEvent.associate = function (models) {
        GtmEvent.belongsTo(models.User, { foreignKey: 'ownerUser', targetKey: 'id', as: 'OwnerUser' ,onDelete: 'CASCADE' });
    };
    return GtmEvent;
};