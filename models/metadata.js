'use strict';
module.exports = (sequelize, DataTypes) => {
    var Metadata = sequelize.define('Metadata', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        contentType: DataTypes.STRING(20),
        contentId: DataTypes.INTEGER,
      

        identifier:DataTypes.STRING,
        title:DataTypes.STRING,
        alternative:DataTypes.STRING,
        abstract: DataTypes.TEXT,//<xsl:for-each select="gmd:abstract/gco:CharacterString">
      
        spatial:DataTypes.STRING(100),//EPSG:3857

        subject:DataTypes.TEXT,//<xsl:for-each select="gmd:descriptiveKeywords/gmd:MD_Keywords/gmd:keyword/gco:CharacterString">
        theme: DataTypes.TEXT,

        created:DataTypes.STRING(100),
        date:DataTypes.STRING(100),
        modified:DataTypes.STRING(100),//<xsl:for-each select="gmd:date/gmd:CI_Date[gmd:dateType/gmd:CI_DateTypeCode/@codeListValue='revision']/gmd:date/gco:Date">
        creator:DataTypes.STRING,// <xsl:for-each select="gmd:citedResponsibleParty/gmd:CI_ResponsibleParty[gmd:role/gmd:CI_RoleCode/@codeListValue='originator']/gmd:organisationName/gco:CharacterString">
        publisher:DataTypes.STRING,//<xsl:for-each select="gmd:citedResponsibleParty/gmd:CI_ResponsibleParty[gmd:role/gmd:CI_RoleCode/@codeListValue='publisher']/gmd:organisationName/gco:CharacterString">
        contributor:DataTypes.STRING,//<xsl:for-each select="gmd:citedResponsibleParty/gmd:CI_ResponsibleParty[gmd:role/gmd:CI_RoleCode/@codeListValue='author']/gmd:organisationName/gco:CharacterString">

        rights:DataTypes.TEXT, //<xsl:for-each select="gmd:resourceConstraints/gmd:MD_LegalConstraints"> ...<xsl:for-each select="*/gmd:MD_RestrictionCode/@codeListValue">, <xsl:for-each select="otherConstraints/gco:CharacterString">

        language:DataTypes.STRING,//<xsl:for-each select="gmd:language/gco:CharacterString">
        type:DataTypes.STRING,//(dataset,tile, service,...)  <xsl:for-each select="gmd:hierarchyLevel/gmd:MD_ScopeCode/@codeListValue">
        format:DataTypes.STRING,// (grid,vector,...   )<xsl:for-each select="gmd:distributionInfo/gmd:MD_Distribution"> ... <xsl:for-each select="gmd:distributionFormat/gmd:MD_Format/gmd:name/gco:CharacterString">

        ext_north:DataTypes.FLOAT,
        ext_east:DataTypes.FLOAT,
        ext_south:DataTypes.FLOAT,
        ext_west:DataTypes.FLOAT,

        references:  {type:DataTypes.ARRAY(DataTypes.STRING)},
        
        source:DataTypes.STRING,
        relation:DataTypes.STRING,

        insertedByUserId: DataTypes.INTEGER,
        updateddByUserId: DataTypes.INTEGER,
        thumbnail:DataTypes.TEXT,
        publish_ogc_service:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        extra: DataTypes.TEXT
    }, {

        });
   
    Metadata.associate = function (models) {
        // associations can be defined here
        if (models.Metadata.sequelize.dialect.connectionManager.dialectName !== 'mssql') {
            Metadata.belongsTo(models.User, { foreignKey: 'insertedByUserId', targetKey: 'id', as: 'OwnerUser', onDelete: 'CASCADE' }); // ERROR for SQLSERVER
            Metadata.belongsTo(models.User, { foreignKey: 'updateddByUserId', targetKey: 'id', as: 'EditedByUser', onDelete: 'CASCADE' }); // ERROR for SQLSERVER
        } else {
            Metadata.belongsTo(models.User, { foreignKey: 'insertedByUserId', targetKey: 'id', as: 'OwnerUser' })//, onDelete: 'CASCADE' }); // ERROR for SQLSERVER
            Metadata.belongsTo(models.User, { foreignKey: 'updateddByUserId', targetKey: 'id', as: 'EditedByUser' }); // ERROR for SQLSERVER
            // sql error: Introducing FOREIGN KEY constraint 'FK__Permissio__inser__6C190EBB' on table 'Metadatas' may cause cycles or multiple cascade paths. Specify ON DELETE NO ACTION or ON UPDATE NO ACTION, or modify other FOREIGN KEY constraints.
        }

        // Metadata.hasMany(models.MetadataItem, {
        //     as: 'MetadataItems', onDelete:'CASCADE'
        //     ,foreignKey: 'metadataId'
        // });
        // Metadata.belongsTo(models.Project, {
        //     as: 'belongsToProject', foreignKey: 'contentId', targetKey: 'id',constraints: false//, onDelete: 'CASCADE' //has confilict with datalayers
            
        // });
        Metadata.belongsTo(models.Map, {
            as: 'belongsToMap', foreignKey: 'contentId', targetKey: 'id',constraints: false//, onDelete: 'CASCADE' //has confilict with datalayers
            
        });
        Metadata.belongsTo(models.DataLayer, {
            as: 'belongsToDataset', foreignKey: 'contentId', targetKey: 'id',constraints: false//, onDelete: 'CASCADE'

        });
        // Metadata.belongsTo(models.Document, {
        //     as: 'belongsToDocument', foreignKey: 'contentId', targetKey: 'id',constraints: false//, onDelete: 'CASCADE'

        // });
       
    };
    return Metadata;
};