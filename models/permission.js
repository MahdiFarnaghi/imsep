'use strict';
module.exports = (sequelize, DataTypes) => {
    var Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        contentType: DataTypes.STRING(20),
        contentId: DataTypes.INTEGER,
        permissionName: DataTypes.STRING(100),
        grantToType: {
            type: DataTypes.ENUM,
            values:['user','group']
        },
        grantToId: DataTypes.INTEGER,
        insertedByUserId: DataTypes.INTEGER

        ,extra: DataTypes.TEXT
    }, {

        });
   
    Permission.associate = function (models) {
        // associations can be defined here
        if (models.Permission.sequelize.dialect.connectionManager.dialectName !== 'mssql') {
            Permission.belongsTo(models.User, { foreignKey: 'insertedByUserId', targetKey: 'id', as: 'OwnerUser', onDelete: 'CASCADE' }); // ERROR for SQLSERVER
        } else {
            Permission.belongsTo(models.User, { foreignKey: 'insertedByUserId', targetKey: 'id', as: 'OwnerUser' })//, onDelete: 'CASCADE' }); // ERROR for SQLSERVER
            // sql error: Introducing FOREIGN KEY constraint 'FK__Permissio__inser__6C190EBB' on table 'Permissions' may cause cycles or multiple cascade paths. Specify ON DELETE NO ACTION or ON UPDATE NO ACTION, or modify other FOREIGN KEY constraints.
        }

     //   Permission.hasMany(models.Group, { foreignKey: 'ownerUser', sourceKey: 'id', as: 'HasGroups' });
     //   Permission.belongsToMany(models.Group, { through: 'GroupUsers', as: 'BelongsToGroups' });

        Permission.belongsTo(models.Group, {
            as: 'assignedToGroup', foreignKey: 'grantToId', targetKey: 'id',constraints: false
            
        });
        Permission.belongsTo(models.User, {
            as: 'assignedToUser', foreignKey: 'grantToId', targetKey: 'id',constraints: false

        });

        //Permission.belongsTo(models.DataLayer, {
        //    as: 'belongsToDataLayer', foreignKey: 'contentId', targetKey: 'id',
        //    scope: { contentType: 'DataLayer' }
        //});

        //todo: check if we need scope or not?
        Permission.belongsTo(models.DataLayer, {
            as: 'forDataLayer', foreignKey: 'contentId', targetKey: 'id',constraints: false
        });

        Permission.belongsTo(models.Map, {
            as: 'forMap', foreignKey: 'contentId', targetKey: 'id',constraints: false
        });
    };
    return Permission;
};