'use strict';
module.exports = (sequelize, DataTypes) => {
    var Group = sequelize.define('Group', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: DataTypes.STRING,
        caption:{type:DataTypes.STRING,allowNull: true},
        description: DataTypes.TEXT
        ,type: {
            type: DataTypes.ENUM('normal', 'system','hidden'),
            defaultValue: 'normal'
        }
       ,ownerUser: DataTypes.INTEGER
  }, {
     
      });
  Group.associate = function(models) {
    // associations can be defined here
      if (models.Group.sequelize.dialect.connectionManager.dialectName !== 'mssql') {
          Group.belongsTo(models.User, { foreignKey: 'ownerUser', targetKey: 'id', as: 'OwnerUser', onDelete: 'CASCADE' });
      } else {
          Group.belongsTo(models.User, { foreignKey: 'ownerUser', targetKey: 'id', as: 'OwnerUser' });
          //sql error
          //Introducing FOREIGN KEY constraint 'FK__GroupUser__UserI__1DB06A4F' on table 'GroupUsers' may cause cycles or multiple cascade paths. Specify ON DELETE NO ACTION or ON UPDATE NO ACTION, or modify other FOREIGN KEY constraints.
      }
      Group.belongsToMany(models.User, { through: 'GroupUsers', as: 'Users' });

      Group.hasMany(models.Permission, {as: 'Permissions',
          foreignKey: 'grantToId',
          constraints: false,
          scope: {
              grantToType: 'group'
          }
      });
  };
    return Group;
};