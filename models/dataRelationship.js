'use strict';
module.exports = (sequelize, DataTypes) => {
    var DataRelationship = sequelize.define('DataRelationship', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        originDatasetId: DataTypes.INTEGER,
        backwardLabel:DataTypes.STRING,
        destinationDatasetId:DataTypes.INTEGER,
        forwardLabel:DataTypes.STRING,
        cardinality:{
            type: DataTypes.ENUM('OneToOne', 'OneToMany','ManyToMany')
        },
        
        relationDatasetId: DataTypes.INTEGER,// for manyToMany relations

        originPrimaryKey:DataTypes.STRING,
        originForeignKey:DataTypes.STRING,
        destinationPrimaryKey:DataTypes.STRING,
        destinationForeignKey:DataTypes.STRING,

        extra: DataTypes.TEXT
        
    }, {

    });
    DataRelationship.associate = function (models) {
        
    };
    return DataRelationship;
};