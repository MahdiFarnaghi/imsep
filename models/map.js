'use strict';
module.exports = (sequelize, DataTypes) => {
    var Map = sequelize.define('Map', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        keywords: DataTypes.STRING(200),
        ext_north:DataTypes.FLOAT,
        ext_east:DataTypes.FLOAT,
        ext_south:DataTypes.FLOAT,
        ext_west:DataTypes.FLOAT,
        details: DataTypes.TEXT,
//        thumbnail:DataTypes.BLOB('medium')
        thumbnail:DataTypes.BLOB,

        theme: DataTypes.STRING
        ,permissionTypes:  {type:DataTypes.ARRAY(DataTypes.INTEGER)}
        
    }, {

        });
    Map.associate = function (models) {
        Map.belongsTo(models.User, { foreignKey: 'ownerUser', targetKey: 'id', as: 'OwnerUser' ,onDelete: 'CASCADE' });
        Map.hasMany(models.Permission, {
            as: 'Permissions',// onDelete:'CASCADE',
            foreignKey: 'contentId', sourceKey:'id',
            constraints: false,
            scope: {
                contentType: 'Map'
            }
        });

        Map.hasOne(models.Metadata, {
            as: 'Metadata',// onDelete:'CASCADE',
            foreignKey: 'contentId', sourceKey:'id',
            constraints: false,
            scope: {
                contentType: 'Map'
            }
        });
    };
    return Map;
};