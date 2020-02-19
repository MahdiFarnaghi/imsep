﻿const  Sequelize  = require('sequelize');
const { Op } = require('sequelize');
var path= require('path');
var fs = require('fs');
var util = require('./util');
const nativeUtil = require('util');

var models = require('../models/index');
var sharp= require('sharp');
var ogr2ogr= require('../ogr2ogr');

module.exports = function (postgresWorkspace) {
    var module = {};
    /**
     * GET /datalayers
     */
    module.dataLayersGet = async function (req, res) {
        
        var items;
        var format=undefined;
        
        var include_details=false;
        if(req.query && 'details' in req.query){
            include_details= req.query.details?true:false;
        }
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if(req.path.startsWith("/api/")){
            format='json';
        }
        req.sanitizeQuery('filterExpression').escape();
        req.sanitizeQuery('filterexpression').escape();
        var filterExpression= req.query.filterExpression || req.query.filterexpression;
        var start= req.query.start;
        var limit= req.query.limit;
        var orderby=req.query.orderby || req.query.orderBy;
        var extent=req.query.extent;
        var authors=req.query.author || req.query.Author;
        if(authors){
            if(!Array.isArray(authors)){
                authors=[authors];
            }
        }
        var datasetTypes= req.query.datasetType || req.query.datasettype;
        if(datasetTypes){
            if(!Array.isArray(datasetTypes)){
                datasetTypes=[datasetTypes];
            }
        }
        var keywords= req.query.keyword || req.query.keyword;
        if(keywords){
            if(!Array.isArray(keywords)){
                keywords=[keywords];
            }
        }
        if(format=='json'){
            if(!limit){
                limit=-1;
            }
        }else{
            if(!limit){
                limit=20;
            }
            if(limit<0){
                limit= -limit;
            }
        }
        if(!start || start<1){
            start=1;
        }
        try{     start=parseInt(start)  }catch(ex){start=1}
        if(limit){
            try{     limit=parseInt(limit)  }catch(ex){}
        }
        var where={};
        var whereExpressions=[];
        if(filterExpression){
            filterExpression=filterExpression.toLowerCase();
            whereExpressions.push({
                [Op.or]:[
                    //{
                     //     name:{[Op.iLike]:'%'+ filterExpression+'%'}
                        
                   // },// or
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('DataLayer.name')),'LIKE','%'+ filterExpression+'%'),
                    {
                        description:{[Op.iLike]:'%'+ filterExpression+'%'}
                    },
                    {
                        keywords:{[Op.iLike]:'%'+ filterExpression+'%'}
                    },
                    
                     Sequelize.where(Sequelize.cast(Sequelize.col('DataLayer.id'),'varchar'),'=', filterExpression)
                    
                ]
            })
        }
        if(false && extent ){
            var extentArray= extent.split(',');
            try{
                var ext_west= parseFloat(extentArray[0]);
                var ext_south= parseFloat(extentArray[1]);
                var ext_east= parseFloat(extentArray[2]);
                var ext_north= parseFloat(extentArray[3]);
                //not (minx> extent.maxx|| maxx< extent.minx || miny>extent.maxy || maxy<extent.miny ){
                whereExpressions.push({
                    [Op.or]:[
                        // {[Op.or]:[
                        //     {ext_west:null},
                        //     {ext_east:null},
                        //     {ext_south:null},
                        //     {ext_north:null}
                        // ]},
                        {[Op.not]:[
                            {[Op.or]:[
                                {ext_west:{[Op.gt]:ext_east}},
                                {ext_east:{[Op.lt]:ext_west}},
                                {ext_south:{[Op.gt]:ext_north}},
                                {ext_north:{[Op.lt]:ext_south}}
                            ]}
                        ]}
                    ]
                });

            }catch(ex){}
        }
        if(whereExpressions && whereExpressions.length){
            where={
                [Op.and]:whereExpressions
            }
        }
        if (res.locals.identity.isAdministrator) {
            items = await models.DataLayer.findAll( {
                attributes: ['id','name',
                'description','keywords',
                //'ext_north','ext_east','ext_south','ext_west',
                //'thumbnail',
                [models.DataLayer.sequelize.literal(`CASE  WHEN thumbnail isnull THEN false ELSE true END`), 'thumbnail'],
                'dataType',
              
                'ownerUser','createdAt','updatedAt'
            ], 
            //where: { ownerUser: req.user.id },
            where:where,
                include: [ { model: models.User, as: 'OwnerUser',  attributes: ['userName','id','firstName','lastName','parent'] }],
                order:[     ['updatedAt','DESC'] ]                        
                        });
        } else {
            items = await models.DataLayer.findAll({ 
                 attributes: ['id','name',
                    'description','keywords',
                    //'ext_north','ext_east','ext_south','ext_west',
                    //'thumbnail',
                    [models.DataLayer.sequelize.literal(`CASE  WHEN thumbnail isnull THEN false ELSE true END`), 'thumbnail'],
                    'dataType',
                  
                    'ownerUser','createdAt','updatedAt'
                ], 
                
                where:where,
                include: [ { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']}
                            ,{ model: models.Permission, as: 'Permissions'
                                ,include: [
                                    {
                                        model: models.User, as: 'assignedToUser',
                                        required: false,
                                        where: {
                                            id:  req.user.id
                                        }
                                    },
                                    {
                                        model: models.Group, as: 'assignedToGroup',
                                        required: false,
                                        include: [
                                            {
                                                model: models.User, as: 'Users',
                                                required: true,
                                                where: {
                                                    id: req.user.id
                                                }
                                            }
                                        ]
                                    }
                                ]
                                }
                        ],
                            
                order:[     ['updatedAt','DESC'] ]
            });

            var filteredItems = items.filter((v) => {
                if(v.ownerUser == req.user.id){
                    v._userHasPermission_EditSchema=true;
                    return true;
                }
                if(v.OwnerUser && (v.OwnerUser.parent == req.user.id)){
                    v._userHasPermission_EditSchema=true;
                    return true;
                }
                if(v.Permissions && v.Permissions.length){
                    var hasPermission= v.Permissions.some((p)=>{
                     
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else return false;
                    });
                    var hasPermission_EditSchema= v.Permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='EditSchema' );
                        }else return false;
                    });
                    if(hasPermission_EditSchema){
                        v._userHasPermission_EditSchema=true;
                    }
                    return (hasPermission);
                }
                return false;
            });
            items=filteredItems;
        }



        var jsonArray=[];
        var datasetTypeMap={};
        var keywordMap={};
        var authorMap={};
        for(var i=0;i<items.length;i++){
            var m= items[i];
             var item={};
             item.id=m.id;
             item.dataType=m.dataType;
             item.updatedAt=m.updatedAt;
             item.thumbnail= (m.thumbnail)?`/datalayer/${m.id}/thumbnail`:false;
             //item.subType= m.subType;
             item.name=m.name;
             item.description=m.description;
             item.keywords=m.keywords;
             item.ext_north=m.ext_north;
             item.ext_east=m.ext_east;
             item.ext_south=m.ext_south;
             item.ext_west=m.ext_west;
             if(m.OwnerUser){
                 item.OwnerUser={
                     id:m.OwnerUser.id,
                    userName:m.OwnerUser.userName,
                    parent:m.OwnerUser.parent
                 };
                 item.author= m.OwnerUser.userName;   
             }
             item._userHasPermission_EditSchema= m._userHasPermission_EditSchema;
             item._userHasOwnerPermission=m._userHasOwnerPermission;
             if(include_details){
                 item.details=m.details;
             }

             if(item.author){
                if ( authorMap.hasOwnProperty(item.author)) {
                    authorMap[item.author]++;
                } else {
                    authorMap[item.author] = 1;
                }
             }

             if (datasetTypeMap.hasOwnProperty(item.dataType)) {
                datasetTypeMap[item.dataType]++;
              } else {
                datasetTypeMap[item.dataType] = 1;
              }

              if(item.keywords){
                  var keywords_= item.keywords.split(/[ ,.،]+/);
                  keywords_.forEach(function (key) {
                      if(key.length>1){
                            if (keywordMap.hasOwnProperty(key)) {
                                keywordMap[key]++;
                            } else {
                                keywordMap[key] = 1;
                            }
                     }
                  });
              }

             //check filters
             var filtered=false;
             if(!filtered && authors){
                var found= authors.some(function(m) {
                    return item.author==m;
                  });
                  filtered= !found;
              }
             if(!filtered && datasetTypes){
               var found= datasetTypes.some(function(m) {
                   return item.dataType==m;
                 });
                 filtered= !found;
             }

             if(!filtered && keywords ){
               var found= keywords.some(function(m) {
                   if(item.keywords)
                       return item.keywords.indexOf(m) >-1;
                    else
                       return false;   
                 });
                 filtered= !found;
             }
             
             if(!filtered){
               jsonArray.push(item);
             }

        }
        var authorArray = [];
        authorArray = Object.keys(authorMap).map(function (key) {
          return {
            name: key,
            total: authorMap[key]
          };
        });
        authorArray.sort(function (a, b) {
          return b.total - a.total;
        });

        var datasetTypeArray = [];
        datasetTypeArray = Object.keys(datasetTypeMap).map(function (key) {
          return {
            name: key,
            total: datasetTypeMap[key]
          };
        });
        datasetTypeArray.sort(function (a, b) {
          return b.total - a.total;
        });

        var keywordArray = [];
        keywordArray = Object.keys(keywordMap).map(function (key) {
          return {
            name: key,
            total: keywordMap[key]
          };
        });
        keywordArray.sort(function (a, b) {
          return b.total - a.total;
        });

        if(orderby){
            var orderkey=orderby+'';
            var dir=1;
            if (orderkey[0] === '-') { dir = -1; orderkey=orderkey.substring(1); }
            jsonArray= jsonArray.sort(function(a,b){
                if (a[orderkey] > b[orderkey]) return dir;
                if (a[orderkey] < b[orderkey]) return -(dir);
                return 0;
            });
        }
        var count=jsonArray.length;

        if(limit && limit >0 ){
            if(start> count){
                start=1;
            }
            jsonArray=  jsonArray.slice(start-1,start-1+limit);
        }
        if(format==='json'){
          //  return res.json(jsonArray);
          return res.json({
            items: jsonArray,
            pagination:{
                totalItems:count,
                limit:limit,
                start:start,
                orderby:orderby,
                
                filterExpression:util.unescape(filterExpression),
                extent:extent,
                authors:authors,
                datasetTypes:datasetTypes,
                keywords:keywords
            },
            statistics:{
                authors:authorArray,
                keywords:keywordArray,
                datasetTypes:datasetTypeArray
            }
        });
        }else{
            res.render('dataLayer/dataLayers', {
                title: 'Data layers',
                data: {
                    items: jsonArray,
                    pagination:{
                        totalItems:count,
                        limit:limit,
                        start:start,
                        orderby:orderby,
                        
                        filterExpression:util.unescape(filterExpression),
                        extent:extent,
                        authors:authors,
                        datasetTypes:datasetTypes,
                        keywords:keywords
                    },
                    statistics:{
                        authors:authorArray,
                        keywords:keywordArray,
                        datasetTypes:datasetTypeArray
                    }
                }
            });
         }
    };
    module.dataLayersGet__ = async function (req, res) {
        
        var items;
        var format=undefined;
        // const sleep = m => new Promise(r => setTimeout(r, m))
        // await sleep (3000);
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if (res.locals.identity.isAdministrator) {
            items = await models.DataLayer.findAll( {
                include: [ { model: models.User, as: 'OwnerUser',  attributes: ['userName','id','firstName','lastName','parent'] }],
                order:[     ['updatedAt','DESC'] ]                        
                        });
        } else {
            items = await models.DataLayer.findAll({ 
                //where: { ownerUser: req.user.id },
                include: [ { model: models.User, as: 'OwnerUser', attributes: ['userName','id','firstName','lastName','parent']}
                            ,{ model: models.Permission, as: 'Permissions'
                                ,include: [
                                    {
                                        model: models.User, as: 'assignedToUser',
                                        required: false,
                                        where: {
                                            id:  req.user.id
                                        }
                                    },
                                    {
                                        model: models.Group, as: 'assignedToGroup',
                                        required: false,
                                        include: [
                                            {
                                                model: models.User, as: 'Users',
                                                required: true,
                                                where: {
                                                    id: req.user.id
                                                }
                                            }
                                        ]
                                    }
                                ]
                                }
                        ],
                            
                order:[     ['updatedAt','DESC'] ]
            });

            var filteredItems = items.filter((v) => {
                if(v.ownerUser == req.user.id){
                    v._userHasPermission_EditSchema=true;
                    return true;
                }
                if(v.OwnerUser && (v.OwnerUser.parent == req.user.id)){
                    v._userHasPermission_EditSchema=true;
                    return true;
                }
                if(v.Permissions && v.Permissions.length){
                    var hasPermission= v.Permissions.some((p)=>{
                     
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else return false;
                    });
                    var hasPermission_EditSchema= v.Permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='EditSchema' );
                        }else return false;
                    });
                    if(hasPermission_EditSchema){
                        v._userHasPermission_EditSchema=true;
                    }
                    return (hasPermission);
                }
                return false;
            });
            items=filteredItems;
        }
        if(format==='json'){
            return res.json(items);
        }else{
            res.render('dataLayer/dataLayers', {
                title: 'Data layers',
                items: items
            });
         }
    };
 /**
     * GET /datalayer/:id/info
     */
    module.dataLayerInfoGet = async function (req, res) {
      var id=req.params.id;
      var err,layer;
    [err, layer] = await util.call(models.DataLayer.findByPk(id,{
        include: [ 
            { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}
            ,{ model: models.Permission, as: 'Permissions'
                ,include: [
                    {
                        model: models.User, as: 'assignedToUser',
                        required: false,
                        where: {
                            id:  req.user.id
                        }
                    },
                    {
                        model: models.Group, as: 'assignedToGroup',
                        required: false,
                        include: [
                            {
                                model: models.User, as: 'Users',
                                required: true,
                                where: {
                                    id: req.user.id
                                }
                            }
                        ]
                    }
                ]
            }
        ]}
        ) );
        if(layer){
            var item= layer.toJSON();
            if(item.ownerUser == req.user.id){
                item._userIsOwner=true;
                item._userHasPermission_EditSchema=true;
                item._userHasPermission_Edit=true;
                item._userHasPermission_View=true;
                
            }else if(item.OwnerUser && (item.OwnerUser.parent == req.user.id)){
                item._userIsOwnerParent=true;
                item._userHasPermission_EditSchema=true;
                item._userHasPermission_Edit=true;
                item._userHasPermission_View=true;
                
            }else if(item.Permissions && item.Permissions.length){
                item._userHasPermission_View= item.Permissions.some((p)=>{
                    if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                        return (p.permissionName=='Edit'|| p.permissionName=='View' );
                    }else return false;
                });
                item._userHasPermission_Edit= item.Permissions.some((p)=>{
                    if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                        return (p.permissionName=='Edit' );
                    }else return false;
                });
                item._userHasPermission_EditSchema= item.Permissions.some((p)=>{
                    if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                        return (p.permissionName=='EditSchema' );
                    }else return false;
                    
                });
                
            }

            return res.json(item);
        }else{
            return res.json({status:false});
        }
    }
    /**
     * GET /datalayer/:id
     */
    module.dataLayerGet = async function (req, res) {
        var item,err;
        var userHasViewPermission=false;
        var userHasEditPermission=false;
        var userIsOwnerOfItem=false;
        var grantViewPermissionToAllUsers=false;
        var grantEditPermissionToAllUsers=false;
        var usersWhoCanViewData=[];
        var usersWhoCanEditData=[];
        var groupsWhoCanViewData=[];
        var groupsWhoCanEditData=[];
        var isNew=false;
        var dataType='vector';
        if(req.query && 'dataType' in req.query){
            dataType=req.query.dataType;
        }
        var format;
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if(req.path.startsWith("/api/")){
            format='json';
        }
        // if (!(res.locals.identity.isAdministrator ||  res.locals.identity.isDataManager )) {
        //     req.flash('error', {
        //         msg: 'Access denied'
        //     });
        //     return res.redirect('/');
        // }
        //#region getitem
        if (req.params.id && req.params.id == '-1' && dataType=='vector') {
            
            if (!(res.locals.identity.isAdministrator || res.locals.identity.isPowerUser ||  res.locals.identity.isDataManager || res.locals.identity.isDataAnalyst )) {
                if(format=='json'){
                    return res.json({
                        status:false,
                        message:'Access denied'
                    });
                }else{
                    req.flash('error', {
                        msg: 'Access denied'
                    });
                    return res.redirect('/');
                }
            }
            item={
                id:-1,
                dataType:dataType,
                details:{
                    isNew:true
                }
            }
            // var newLayer = await models.DataLayer.create(
            //     { 
            //         name: '',
            //         dataType: dataType,
            //         description:'',
            //         keywords:'',
            //         ownerUser: (req.user.id), 
            //         details:JSON.stringify({isNew:true })
            // });
            // [err, item] = await util.call(models.DataLayer.findOne({
            //     where: {
            //         [Op.and]: {
                        
            //             id: { [Op.eq]: newLayer.id },
            //             ownerUser: { [Op.eq]:  req.user.id },
            //         }
            //     },include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}] 
            // }));
            // if (!item) {
            //     req.flash('error', {
            //         msg: 'Faild to create new Datalayer!'
            //     });
            //     return res.redirect('/');
               
            // }
            // /* Redirect to edit new DataLayer*/
            // return res.redirect('/datalayer/' + item.id+'?dataType='+dataType);
        }else if (req.params.id){
            if (res.locals.identity.isAdministrator) {
                [err, item] = await util.call(models.DataLayer.findOne({
                    where: {
                        [Op.and]: {
                            id: { [Op.eq]: req.params.id },
                            dataType: { [Op.eq]:  dataType }
                        }
                    },include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent'] }] 
                }));
                if(item){
                    userHasEditPermission=true;
                    userHasViewPermission=true;
                    userIsOwnerOfItem=true;
                }
            }else{
                [err, item] = await util.call(models.DataLayer.findOne({
                    where: {
                        [Op.and]: {
                            id: { [Op.eq]: req.params.id },
                            dataType: { [Op.eq]:  dataType }
                            //, ownerUser: { [Op.eq]:  req.user.id },
                        }
                    },include: [ { model: models.User, as: 'OwnerUser' ,attributes: ['userName','id','firstName','lastName','parent']}] 
                }));
                if(item){
                    
                    if(item.ownerUser!==req.user.id){
                        if(item.OwnerUser && item.OwnerUser.parent===req.user.id){
                        }else{
                            item=null;
                        }
                        if (!(res.locals.identity.isAdministrator || res.locals.identity.isPowerUser||  res.locals.identity.isDataManager )) {
                            item=null;
                        }
                    }
                }
                if(!item){
                    
                 }else{
                     userHasEditPermission=true;
                     userHasViewPermission=true;
                     userIsOwnerOfItem=true;
                 }
            }
            if(item){// get AllUserPermission
                var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                var permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'DataLayer',
                            contentId: item.id,
                            grantToType: 'group',
                            grantToId: allUsers.id
                        }
                    }); 
                if(permissions){
                    grantViewPermissionToAllUsers= permissions.some((p)=>{
                        return (p.permissionName=='Edit'|| p.permissionName=='View' );
                    });
                    grantEditPermissionToAllUsers= permissions.some((p)=>{
                        return (p.permissionName=='Edit' );
                    });
                }
                //#region groupsWhoCan...Map
                permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'DataLayer',
                            contentId: item.id,
                            grantToType: 'group'
                            ,[Op.or]:[
                                {
                                    permissionName:'Edit'
                                },
                                {
                                    permissionName:'View'
                                }
                            ]
                            
                        },
                        include:[
                            {
                                model: models.Group, as: 'assignedToGroup',
                                attributes: ['name','id','description','type','ownerUser']
                                ,required: true
                            }
                        ]
                    }); 
                    if(permissions){
                        for(var i=0;i<permissions.length;i++){
                            var p=permissions[i];
                            if(p.assignedToGroup){
                                groupsWhoCanViewData.push(
                                    {
                                        id:p.assignedToGroup.id,
                                        name:p.assignedToGroup.name,
                                        type:p.assignedToGroup.type,
                                        description:p.assignedToGroup.description,
                                        ownerUser:p.assignedToGroup.ownerUser
                                    }
                                );
                                if(p.permissionName==='Edit'){
                                    groupsWhoCanEditData.push(
                                        {
                                            id:p.assignedToGroup.id,
                                            name:p.assignedToGroup.name,
                                            type:p.assignedToGroup.type,
                                            description:p.assignedToGroup.description,
                                            ownerUser:p.assignedToGroup.ownerUser
                                        }
                                    );
                                }
                            }
                        }
                    }
                    //#end region
                //#region usersWhoCan...Map
                permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'DataLayer',
                            contentId: item.id,
                            grantToType: 'user'
                            ,[Op.or]:[
                                {
                                    permissionName:'Edit'
                                },
                                {
                                    permissionName:'View'
                                }
                            ]
                            
                        },
                        include:[
                            {
                                model: models.User, as: 'assignedToUser',
                                attributes: ['userName','id','firstName','lastName','parent']
                                ,required: true
                            }
                        ]
                    }); 
                    if(permissions){
                        for(var i=0;i<permissions.length;i++){
                            var p=permissions[i];
                            if(p.assignedToUser){
                                usersWhoCanViewData.push(
                                    {
                                        id:p.assignedToUser.id,
                                        userName:p.assignedToUser.userName
                                    }
                                );
                                if(p.permissionName==='Edit'){
                                    usersWhoCanEditData.push(
                                        {
                                            id:p.assignedToUser.id,
                                            userName:p.assignedToUser.userName
                                        }
                                    );
                                }
                            }
                        }
                    }
                    //#end region

            }
            if (!item) {
                if(format=='json'){
                    return res.json({
                        status:false,
                        message:'Dataset not found, or access denied!'
                    })
                }else{
                    req.flash('error', {
                        msg: 'Datalayer not found, or access denied!'
                    });
                    return res.redirect('/');
                }
            }
        }else
        {
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Dataset not found!'
                })
            }else{
                req.flash('error', {
                    msg: 'Datalayer not found!'
                });
                return res.redirect('/');
            }
        }
        //#endregion
        
       
        
        var details= item.details;
        
        try{
          details= JSON.parse( item.details);
          
        }catch(ex){}
        if(!details){
            details={}
        }
        isNew= details.isNew;

        if(dataType=='vector'){
            details.datasetType='vector';

            if(!details.workspace)
                details.workspace='postgres';
            if(!details.shapeType)
                details.shapeType='Point';
            if(!details.fields)
                details.fields=[];
            if(!details.styles)
                details.styles=[];
            if(!details.defaultField)
                details.defaultField='';
            if(!details.shapeField)
                details.shapeField='geom';                
            if(!details.oidField)
                details.oidField='gid';   
            if(!details.spatialReference)
                details.spatialReference={name: 'EPSG:3857',alias:'Google Maps Global Mercator',srid:3857};                
        }else if(dataType=='raster'){
            details.datasetType='raster';

            if(!details.workspace)
                details.workspace='postgres';
            if(!details.dataType)
                details.dataType='geotiff';
            if(!details.numberOfBands)
                 details.numberOfBands=undefined;
            if(!details.rasterWidth)
                details.rasterWidth=undefined;
            if(!details.rasterHeight)
                details.rasterHeight=undefined;
            if(!details.geotransform)
                 details.geotransform=undefined;
            if(!details.rasterField)
                details.rasterField='rast';                
            if(!details.oidField)
                details.oidField='rid';   
            if(!details.spatialReference)
                details.spatialReference={name: 'EPSG:3857',alias:'Google Maps Global Mercator',srid:3857};
        }
        if(format=='json'){
            return res.json({
                status:true,
                title: 'Dataset'
                , dataset: item,
                details:details,
                isNew:isNew,
              //  projectList:projectList,
                userHasViewPermission:userHasViewPermission,
                userHasEditPermission:userHasEditPermission,
                userIsOwnerOfItem:userIsOwnerOfItem,
                grantViewPermissionToAllUsers:grantViewPermissionToAllUsers,
                grantEditPermissionToAllUsers:grantEditPermissionToAllUsers,
                usersWhoCanViewData:usersWhoCanViewData,
                usersWhoCanEditData:usersWhoCanEditData,
                groupsWhoCanViewData:groupsWhoCanViewData,
                groupsWhoCanEditData:groupsWhoCanEditData
            })
        }else{
        res.render('dataLayer/dataLayer_'+ dataType , {
            title: 'Data layer'
            , dataLayer: item,
            details:details,
            isNew:isNew,
            userHasViewPermission:userHasViewPermission,
            userHasEditPermission:userHasEditPermission,
            userIsOwnerOfItem:userIsOwnerOfItem,
            grantViewPermissionToAllUsers:grantViewPermissionToAllUsers,
            grantEditPermissionToAllUsers:grantEditPermissionToAllUsers,
            usersWhoCanViewData:usersWhoCanViewData,
            usersWhoCanEditData:usersWhoCanEditData,
            groupsWhoCanViewData:groupsWhoCanViewData,
            groupsWhoCanEditData:groupsWhoCanEditData
        });
      }
    };
     /**
     * POST /datalayer/:id
    */
   module.dataLayerPost = async function (req, res) {
    // if (!(res.locals.identity.isAdministrator ||  res.locals.identity.isDataManager )) {
    //     req.flash('error', {
    //         msg: 'Access denied'
    //     });
    //     return res.redirect('/');
    // }
    var item,err;
    var dataType='vector';
    if(req.query && 'dataType' in req.query){
        dataType=req.query.dataType;
    }
    var format;
    if(req.query && 'format' in req.query){
        format=req.query.format;
    }
    if(req.path.startsWith("/api/")){
        format='json';
    }
    var result={
        status:false
    };
    req.assert('name', 'Datalayer name cannot be blank').notEmpty();
    
    req.sanitizeBody('name').trim();
    req.sanitizeBody('name').escape();
    req.sanitizeBody('description').trim();
    req.sanitizeBody('description').escape();
    req.sanitizeBody('keywords').trim();
    req.sanitizeBody('keywords').escape();
    
    req.sanitizeBody('updatedAt').toInt();
    req.body.grantViewPermissionToAllUsers = ('grantViewPermissionToAllUsers' in req.body) ? true : false;
    req.body.grantEditPermissionToAllUsers = ('grantEditPermissionToAllUsers' in req.body) ? true : false;
    
    var layerId = req.params.id || -1;
    try {
        layerId = parseInt(layerId);
    } catch (ex) { }
    var errors = req.validationErrors();
    //prepare body fields
            
    if (req.body.updatedAt) {
        try {
            req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
        } catch (ex) {
        }
    }
    if (errors) {
        result.status=false;
        result.id=layerId;
        result.message= errors;
        return res.json(result) ;
    }

    var owner = req.user;
    if (layerId == -1) {
        if (!(res.locals.identity.isAdministrator || res.locals.identity.isPowerUser ||  res.locals.identity.isDataManager  ||  res.locals.identity.isDataAnalyst)) {
            result.status=false;
            result.message= 'Access denied';
            return res.json(result) ;          
        }
        try {
            var newLayer = await models.DataLayer.create(
                { 
                    name:  req.body.name,
                    dataType: dataType,
                    description:req.body.description,
                    keywords:req.body.keywords,
                    ownerUser: (owner ? owner.id : 0), 
                    details:JSON.stringify({isNew:true })
            });
            layerId= newLayer.id;

        } catch (ex) {
            result.status=false;
            result.id=layerId;
            if (ex && ex.errors) {
                result.errors= ex.errors;
                result.message= ex.message;
            }
            return res.json(result) ;
        }
    }

    if (res.locals.identity.isAdministrator) {
        [err, item] = await util.call(models.DataLayer.findOne({
            where: {
                [Op.and]: {
                    id: { [Op.eq]: layerId },
                    dataType: { [Op.eq]:  dataType }
                }
            },include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent'] }] 
        }));
    }else{
        [err, item] = await util.call(models.DataLayer.findOne({
            where: {
                [Op.and]: {
                    id: { [Op.eq]: layerId },
                    dataType: { [Op.eq]:  dataType }
                    //,ownerUser: { [Op.eq]:  req.user.id },
                }
            },include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent'] }] 
        }));
        if(item){
            if(item.ownerUser!==req.user.id){
                if(item.OwnerUser && item.OwnerUser.parent===req.user.id){
                }else{
                    item=null;
                }
                if (!(res.locals.identity.isAdministrator ||  res.locals.identity.isDataManager )) {
                  item=null;       
                }
            }
        }
    }
    if(!item){
        //todo: permission check
       
            var userHasEditSchemaPermission=false;
            var err,item;
            [err, item] = await util.call(models.DataLayer.findOne({
                where: {  id: layerId },
                include: [ 
                        { model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                },
                                {
                                    model: models.Group, as: 'assignedToGroup',
                                    required: false,
                                    include: [
                                        {
                                            model: models.User, as: 'Users',
                                            required: true,
                                            where: {
                                                id: req.user.id
                                            }
                                        }
                                    ]
                                }
                            ]
                            }
                    ]
            }));

            if(item){// get permission
                var permissions = item.Permissions;
                if(permissions){
                    userHasEditPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='EditSchema' );
                        }else return false;
                        
                    });
                }
                map=item;
            }
             
            if(!userHasEditSchemaPermission){
                result.status=false;
                result.message= 'Access denied';
                return res.json(result) ;
            }
        
    }
    if (!item) {
        result.status=false;
        result.id= layerId;
        result.message= 'Datalayer not found';
        return res.json(result) ;
    }
    var details={};
    try{
      details= JSON.parse( req.body.details);
    }catch(ex){}
    isNew= details.isNew;

    if(dataType=='vector'){
        details.datasetType='vector';

        if(!details.workspace)
            details.workspace='postgres';
        if(!details.shapeType)
            details.shapeType='Point';
        if(!details.fields)
            details.fields=[];
        if(!details.styles)
            details.styles=[];
        if(!details.defaultField)
            details.defaultField='';
        if(!details.shapeField)
            details.shapeField='geom';                
        if(!details.oidField)
            details.oidField='gid';   
        if(!details.spatialReference)
            details.spatialReference={name: 'EPSG:3857',alias:'Google Maps Global Mercator',srid:3857};                     
    }else if(dataType=='raster'){
        details.datasetType='raster';

        if(!details.workspace)
            details.workspace='postgres';
        if(!details.dataType)
            details.dataType='geotiff';
        if(!details.numberOfBands)
             details.numberOfBands=undefined;
        if(!details.rasterWidth)
            details.rasterWidth=undefined;
        if(!details.rasterHeight)
            details.rasterHeight=undefined;
        if(!details.geotransform)
             details.geotransform=undefined;
        if(!details.rasterField)
            details.rasterField='rast';                
        if(!details.oidField)
            details.oidField='rid';   
        if(!details.spatialReference)
            details.spatialReference={name: 'EPSG:3857',alias:'Google Maps Global Mercator',srid:3857};
    }
    if(isNew){
        var creationSucceeded=false;
        if(dataType=='vector'){
            try{
                 var createResult=await postgresWorkspace.createVectorTable(details);
                if(!createResult.status){
                    result.status=false;
                    result.id= item.id;
                    result.message= 'Table creation failed,'+createResult.message;
                    return res.json(result) ;      
                }
                details= createResult.details;
                var history= [];
                history.push({
                     task:'vectorTableCreated',
                     settings:{
                       name:req.body.name
                     }
                 });
                 details.history=history;
                creationSucceeded=true;
            }catch(ex){
                result.status=false;
                result.id= item.id;
                result.message= 'Table creation failed,'+ ex.message;
                return res.json(result) ; 
            }
        }else if (dataType=='raster'){
            creationSucceeded=true;
        }
        if(creationSucceeded){
            if(details.isNew)
                delete details.isNew;
            details.name=req.body.name;    
            item.set('name', req.body.name);
            item.set('description', req.body.description);
            item.set('keywords', req.body.keywords);
            item.set('details',JSON.stringify(details));
            
            [err, item] = await util.call(item.save());
            if(err){
                result.status=false;
                result.message=err.message;
                result.id= item.id;
                return res.json(result) ;
            }else
            {
                if(item.ownerUser===req.user.id || res.locals.identity.isAdministrator ){
                    //clear and set all group permissions
                    try{
                        await models.Permission.destroy(
                       {
                            where: {
                                 contentType: 'DataLayer',
                                 contentId: item.id,
                                 [Op.or]:[
                                    {
                                        permissionName:'Edit'
                                    },
                                    {
                                        permissionName:'View'
                                    }
                                ],
                                 grantToType: 'group'
                                 //, grantToId: ?
                                }
                             
                       });
                   }catch(ex){}
                       if(req.body.groupsWhoCanViewData && req.body.groupsWhoCanViewData.length){
                           for(var i=0;i<req.body.groupsWhoCanViewData.length;i++){
                               try{
                                   var data_grantViewViewToGroup = await models.Permission.create(
                                       {
                                           contentType: 'DataLayer',
                                           contentId: item.id,
                                           permissionName: 'View',
                                           grantToType: 'group',
                                           grantToId: req.body.groupsWhoCanViewData[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                       if(req.body.groupsWhoCanEditData && req.body.groupsWhoCanEditData.length){
                        for(var i=0;i<req.body.groupsWhoCanEditData.length;i++){
                            try{
                                var data_grantEditToEditGroup = await models.Permission.create(
                                    {
                                        contentType: 'DataLayer',
                                        contentId: item.id,
                                        permissionName: 'Edit',
                                        grantToType: 'group',
                                        grantToId: req.body.groupsWhoCanEditData[i],
                                        insertedByUserId: req.user.id
                                    });
                            }catch(ex){}
                        }
                    }
                    var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                    if(allUsers){
                        if(req.body.grantViewPermissionToAllUsers){
                            try{
                                var tryDeletePrevPermisssions = await models.Permission.destroy(
                                    {
                                         where: {
                                              contentType: 'DataLayer',
                                              contentId: item.id,
                                              permissionName: 'View',
                                              grantToType: 'group',
                                              grantToId: allUsers.id
                                             }
                                          
                                    });
                            }catch(ex0){}
                            var map_shareViewWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'DataLayer',
                                    contentId: item.id,
                                    permissionName: 'View',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareViewWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'DataLayer',
                                          contentId: item.id,
                                          permissionName: 'View',
                                          grantToType: 'group',
                                          grantToId: allUsers.id
                                         }
                                      
                                });
                               
                        }

                        if(req.body.grantEditPermissionToAllUsers){
                            try{
                                var tryDeletePrevPermisssions = await models.Permission.destroy(
                                    {
                                         where: {
                                            contentType: 'DataLayer',
                                            contentId: item.id,
                                            permissionName: 'Edit',
                                            grantToType: 'group',
                                            grantToId: allUsers.id
                                             }
                                          
                                    });
                            }catch(ex0){}
                            var map_shareEditWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'DataLayer',
                                    contentId: item.id,
                                    permissionName: 'Edit',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareEditWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'DataLayer',
                                          contentId: item.id,
                                          permissionName: 'Edit',
                                          grantToType: 'group',
                                          grantToId: allUsers.id
                                         }
                                      
                                });
                               
                        }
                    }

                    //clear all user permissions
                    try{
                        await models.Permission.destroy(
                       {
                            where: {
                                 contentType: 'DataLayer',
                                 contentId: item.id,
                                // permissionName: 'View',
                                 grantToType: 'user'
                                 //, grantToId: ?
                                }
                             
                       });
                   }catch(ex){}
                       if(req.body.usersWhoCanViewData && req.body.usersWhoCanViewData.length){
                           for(var i=0;i<req.body.usersWhoCanViewData.length;i++){
                               try{
                                   var map_grantViewToUser = await models.Permission.create(
                                       {
                                           contentType: 'DataLayer',
                                           contentId: item.id,
                                           permissionName: 'View',
                                           grantToType: 'user',
                                           grantToId: req.body.usersWhoCanViewData[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                       if(req.body.usersWhoCanEditData && req.body.usersWhoCanEditData.length){
                        for(var i=0;i<req.body.usersWhoCanEditData.length;i++){
                            try{
                                var map_grantEditToUser = await models.Permission.create(
                                    {
                                        contentType: 'DataLayer',
                                        contentId: item.id,
                                        permissionName: 'Edit',
                                        grantToType: 'user',
                                        grantToId: req.body.usersWhoCanEditData[i],
                                        insertedByUserId: req.user.id
                                    });
                            }catch(ex){}
                        }
                    }
                }

                result.status=true;
                result.id= item.id;
                result.item=item;
                return res.json(result) ;
            }
            
        }
    } // alter
    {
        var alterSucceeded=false;
        if(dataType=='vector'){
            try{
                 var alterResult=await postgresWorkspace.alterVectorTable(details);
                if(!alterResult.status){
                    result.status=false;
                    result.id= item.id;
                    result.message= 'Table modification failed,'+alterResult.message;
                    return res.json(result) ;      
                }
                details= alterResult.details;
                var history= details.history;
                if(!history){
                    history=[];
                }
                history.push({
                     task:'vectorTableAltered',
                     settings:{
                       name:req.body.name
                     }
                 });
                 details.history=history;
                alterSucceeded=true;
            }catch(ex){
                result.status=false;
                result.id= item.id;
                result.message= 'Table modification failed,'+ ex.message;
                return res.json(result) ; 
            }
        }else if (dataType=='raster'){
            alterSucceeded=true;
        }
        if(alterSucceeded){
            if(details.isNew){
                delete details.isNew;
            }
            var history= details.history;
            if(!history){
                history=[];
            }
            history.push({
                    task:'updated',
                    settings:{
                    name:req.body.name
                    }
                });
                details.history=history;
            details.name= req.body.name;   
            item.set('name', req.body.name);
            item.set('description', req.body.description);
            item.set('keywords', req.body.keywords);
            item.set('details',JSON.stringify(details));
            
            [err, item] = await util.call(item.save());
            if(err){
                result.status=false;
                result.message=err.message;
                result.error=err;
                result.id= item.id;
                return res.json(result) ;
            }else
            {
                
                var isOwner=false;
                if(item.ownerUser== req.user.id) {
                    isOwner=true;
                }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
                    isOwner=true;
                }
          
                if(isOwner || res.locals.identity.isAdministrator ){
                     //clear and set all group permissions
                     try{
                        await models.Permission.destroy(
                       {
                            where: {
                                 contentType: 'DataLayer',
                                 contentId: item.id,
                                 [Op.or]:[
                                    {
                                        permissionName:'Edit'
                                    },
                                    {
                                        permissionName:'View'
                                    }
                                ],
                                 grantToType: 'group'
                                 //, grantToId: ?
                                }
                             
                       });
                   }catch(ex){}
                       if(req.body.groupsWhoCanViewData && req.body.groupsWhoCanViewData.length){
                           for(var i=0;i<req.body.groupsWhoCanViewData.length;i++){
                               try{
                                   var data_grantViewViewToGroup = await models.Permission.create(
                                       {
                                           contentType: 'DataLayer',
                                           contentId: item.id,
                                           permissionName: 'View',
                                           grantToType: 'group',
                                           grantToId: req.body.groupsWhoCanViewData[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                       if(req.body.groupsWhoCanEditData && req.body.groupsWhoCanEditData.length){
                        for(var i=0;i<req.body.groupsWhoCanEditData.length;i++){
                            try{
                                var data_grantEditToEditGroup = await models.Permission.create(
                                    {
                                        contentType: 'DataLayer',
                                        contentId: item.id,
                                        permissionName: 'Edit',
                                        grantToType: 'group',
                                        grantToId: req.body.groupsWhoCanEditData[i],
                                        insertedByUserId: req.user.id
                                    });
                            }catch(ex){}
                        }
                    }
                    var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                    if(allUsers){
                        if(req.body.grantViewPermissionToAllUsers){
                            try{
                                var tryDeletePrevPermisssions = await models.Permission.destroy(
                                    {
                                         where: {
                                            contentType: 'DataLayer',
                                            contentId: item.id,
                                            permissionName: 'View',
                                            grantToType: 'group',
                                            grantToId: allUsers.id
                                             }
                                          
                                    });
                            }catch(ex0){}
                            var map_shareViewWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'DataLayer',
                                    contentId: item.id,
                                    permissionName: 'View',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareViewWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'DataLayer',
                                          contentId: item.id,
                                          permissionName: 'View',
                                          grantToType: 'group',
                                          grantToId: allUsers.id
                                         }
                                      
                                });
                               
                        }

                        if(req.body.grantEditPermissionToAllUsers){
                            try{
                                var tryDeletePrevPermisssions = await models.Permission.destroy(
                                    {
                                         where: {
                                            contentType: 'DataLayer',
                                            contentId: item.id,
                                            permissionName: 'Edit',
                                            grantToType: 'group',
                                            grantToId: allUsers.id
                                             }
                                          
                                    });
                            }catch(ex0){}
                            var map_shareEditWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'DataLayer',
                                    contentId: item.id,
                                    permissionName: 'Edit',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareEditWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'DataLayer',
                                          contentId: item.id,
                                          permissionName: 'Edit',
                                          grantToType: 'group',
                                          grantToId: allUsers.id
                                         }
                                      
                                });
                               
                        }
                    }
                      //clear all user permissions
                      try{
                        await models.Permission.destroy(
                       {
                            where: {
                                 contentType: 'DataLayer',
                                 contentId: item.id,
                                // permissionName: 'View',
                                 grantToType: 'user'
                                 //, grantToId: ?
                                }
                             
                       });
                   }catch(ex){}
                       if(req.body.usersWhoCanViewData && req.body.usersWhoCanViewData.length){
                           for(var i=0;i<req.body.usersWhoCanViewData.length;i++){
                               try{
                                   var map_grantViewToUser = await models.Permission.create(
                                       {
                                           contentType: 'DataLayer',
                                           contentId: item.id,
                                           permissionName: 'View',
                                           grantToType: 'user',
                                           grantToId: req.body.usersWhoCanViewData[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                       if(req.body.usersWhoCanEditData && req.body.usersWhoCanEditData.length){
                        for(var i=0;i<req.body.usersWhoCanEditData.length;i++){
                            try{
                                var map_grantEditToUser = await models.Permission.create(
                                    {
                                        contentType: 'DataLayer',
                                        contentId: item.id,
                                        permissionName: 'Edit',
                                        grantToType: 'user',
                                        grantToId: req.body.usersWhoCanEditData[i],
                                        insertedByUserId: req.user.id
                                    });
                            }catch(ex){}
                        }
                    }
                }
                result.status=true;
                result.id= item.id;
                result.item=item;
                return res.json(result) ;
            }
            
        }
    }
    result.status=true;
    result.id= item.id;
    return res.json(result) ;
   
};
      /**
     * DELETE /datalayer/:id/delete
     */
    module.dataLayerDelete = async function (req, res, next) {
        var err,item;
        var format;
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if(req.path.startsWith("/api/")){
            format='json';
        }
        if (req.params.id && req.params.id != '-1') {
            // try {
            //     item = await models.DataLayer.findOne({
            //         where: {
            //             id: req.params.id
            //         }
            //     });
            // } catch (ex) {
            //     var ee = 1;
            // }
         
            var itemId=req.params.id;
            [err, item] = await util.call(models.DataLayer.findByPk(itemId,{include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );
       
        }
        if (!item) {
            
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Dataset not found!'
                })
            }else{
                req.flash('error', {
                    msg: 'Data layer not found!'
                });
                return res.redirect('/');
            }
        }
        
        var isOwner=false;
        if(item.ownerUser== req.user.id) {
            isOwner=true;
        }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
            isOwner=true;
        }
  
        if(!isOwner && !res.locals.identity.isAdministrator  ){
            
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Access denied!'
                })
            }else{
                req.flash('error', { msg: `Access denied!` });
                return res.redirect('/datalayers');
            }
        }
        
        // if (item.ownerUser !== req.user.id) {
        //     req.flash('error', { msg: `Access denied.` });
        //     return res.redirect('/datalayers');
            
        // }
        // delete from workspace
        var details={};
        try{
          details= JSON.parse( item.details);
        }catch(ex){}
        if(!details){
            details={};
        }
        //todo: workspace selection

       var tableName= details.datasetName || item.name;
       var queryText=`DROP TABLE if exists public."${tableName}";`
       await postgresWorkspace.query({
          text:queryText
       }).catch(ex=>{
         //
         console.log(ex);
       } );
       if(item.dataType=='raster'){
            var queryText=`DROP TABLE if exists public."o_2_${tableName}";
            DROP TABLE if exists public."o_4_${tableName}";
            DROP TABLE if exists public."o_8_${tableName}";
            DROP TABLE if exists public."o_16_${tableName}";
            DROP TABLE if exists public."o_32_${tableName}";
            DROP TABLE if exists public."o_64_${tableName}";
            DROP TABLE if exists public."o_128_${tableName}";
            DROP TABLE if exists public."o_256_${tableName}";`
            await postgresWorkspace.query({
                text:queryText
            }).catch(ex=>{
            //
                           console.log(ex);
            } );
       }
        try {
            await item.destroy();
        } catch (ex) {
           
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Failed to delete Dataset!'
                })
            }else{
                req.flash('error', {
                    msg: 'Failed to delete Data layer!'
                });
                return res.redirect('/datalayers');
            }
        }
        try{
            var tryDeletePermissions = await models.Permission.destroy(
                {
                     where: {
                          contentType: 'DataLayer',
                          contentId:  req.params.id
                         }
                });
            }catch(ex){}
        

        if(format=='json'){
            return res.json({
                status:true,
                message:`Dataset has been permanently deleted.`
            })
        }else{   
            req.flash('info', {
                msg: `Data layer has been permanently deleted.`
            });
    
            res.redirect('/datalayers');
        }

    };
    /**
     * GET /datalayer/:id/thumbnail
     */
    module.thumbnailGet = async function (req, res, next) {

        var item,err;
        if (req.params.id && req.params.id != '-1') {
            
          [err, item] = await util.call(models.DataLayer.findByPk(req.params.id) );

            
            if (!item) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }
            if (!item.thumbnail) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }
            res.set('Content-Type', 'image/png');
            res.end(item.thumbnail, 'binary');
            return;
            
        }
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
        return;
    };
     /**
     * POST /datalayer/:id/thumbnail
     */
    module.thumbnailPost = async function (req, res,  next) {
        
        var result={
            status:false
        };
         
 
         var errors = req.validationErrors();
 
         if (errors) {
            result.status=false;
            result.message= errors;
            return res.json(result) ;
        }
         if (!('file' in req)) {
             result.status=false;
             result.message= 'Failed to upload file!';
            return res.json(result) ;
         }
         var err,item;
         var itemId=req.params.id;
         [err, item] = await util.call(models.DataLayer.findByPk(itemId,{include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );
         if (!item) {
             result.status=false;
             result.message= 'Data layer not found!';
            return res.json(result) ;
         }
         var isOwner=false;
        if(item.ownerUser== req.user.id) {
            isOwner=true;
        }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
            isOwner=true;
        }
  
        if(!isOwner && !res.locals.identity.isAdministrator  )
         {
             var userHasEditPermission=false;
             var err;
             [err, item] = await util.call(models.DataLayer.findOne({
                 where: {  id: itemId },
                 include: [ 
                         { model: models.Permission, as: 'Permissions'
                             ,include: [
                                 {
                                     model: models.User, as: 'assignedToUser',
                                     required: false,
                                     where: {
                                         id:  req.user.id
                                     }
                                 },
                                 {
                                     model: models.Group, as: 'assignedToGroup',
                                     required: false,
                                     include: [
                                         {
                                             model: models.User, as: 'Users',
                                             required: true,
                                             where: {
                                                 id: req.user.id
                                             }
                                         }
                                     ]
                                 }
                             ]
                             }
                     ]
             }));

             if(item){// get permission
                 var permissions = item.Permissions;
                 if(permissions){
                     userHasEditPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit' );
                        }else return false;
                     });
                 }
                 
             }
              
             if(!userHasEditPermission){
                 result.status=false;
                 result.message= 'Access denied';
                 return res.json(result) ;
             }
         }
         try {
             
             const data = await sharp(req.file.buffer)
                .resize(160,100,{
                    fit: sharp.fit.inside
                })
                 .png()
                 .toBuffer();
           //  var dataUri= 'data:image/png;base64,' + data.toString('base64');
           
            item.set('thumbnail', data);
                await item.save();
             
                result.status=true;
                result.message= undefined;
                return res.json(result) ;
         } catch (err) {
            result.status=false;
            result.message= 'Error in updating thumbnail image';
            return res.json(result) ;
         }
        
     };
     /**
     * GET /datalayer/uploadshapefile
     */
    module.uplaodShapefileGet= async function (req, res) {
        
        res.render('dataLayer/uploadShapefile', {
            title: 'Upload Shapefile'
            //,
           // users: users
        });
    };
      /**
     * POST /datalayer/uploadshapefile
     * 
     */
    module.uplaodShapefilePost = async function (req, res,  next) {
         var errors = req.validationErrors();
       //  req.sanitizeBody('encoding').escape();
        //  req.sanitizeBody('projection').escape();
        var defaultEncoding= req.body['encoding'];
        var defaultProjection=req.body['projection'];
         if (errors) {
             req.flash('error', errors);
             return res.redirect('/datalayer/uploadshapefile');
         }
         if (!('files' in req)) {
             req.flash('error', { msg: 'Failed to upload file!' });
             return res.redirect('/datalayer/uploadshapefile');
         }
         var user = await models.User.findOne({ where: { id: req.user.id } });
         if (!user) {
             req.flash('error', { msg: 'User not found!' });
             return res.redirect('/datalayer/uploadshapefile');
         }
         try {
            var rootPath=__basedir;
            var results=[];
             for(var i=0; i< req.files.length;i++){
                 var filePath= path.join(rootPath, req.files[i].path);
                 var filename= req.files[i].filename;
                 var ext= path.extname(filename).toLowerCase();
                 if(ext==='.shp'){
                     try{
                        var importResult=await postgresWorkspace.importShapefile(filePath,models.DataLayer, req.user.id,{
                            defaultEncoding:defaultEncoding,
                            defaultProjection:defaultProjection
                        });
                        if(importResult){
                        if( importResult.status)
                        {
                            results.push(importResult);   
                        }else if(importResult.message)
                        {
                            req.flash('notify', {
                                type:'danger',
                                notify:true,
                                delay:3000,
                                msg: `Failed to upload.Error:`+ importResult.message
                            });
                        }
                        }
                     }catch(ex){
                        req.flash('notify', {
                            type:'danger',
                            notify:true,
                            delay:3000,
                            msg: `Failed to upload.Error:`+ ex.message
                        });
                     }
                 }else if (ext==='.zip'){
                     try{
                        var importResult=await postgresWorkspace.importZipfile(filePath,models.DataLayer, req.user.id,{
                            defaultEncoding:defaultEncoding,
                            defaultProjection:defaultProjection
                        });
                        if(importResult && importResult.length>0){
                            results.push(... importResult); 
                        }
                    
                     }catch(ex){

                     }
                 }
             }
             
             if(results.length>0){
                if(results.length==1){
                    req.flash('notify', {
                        type:'success',
                        notify:true,
                        delay:3000,
                        msg: `${results.length} shapefile has been added successfully.`
                    });
                }else{
                    req.flash('notify', {
                        type:'success',
                        notify:true,
                        delay:3000,
                        msg: `${results.length} shapefiles have been added successfully.`
                    });
                }
             }
             
             //res.redirect('/datalayer/uploadshapefile');
             var result={
                 flash: req.flash('notify'),
                error: '',
                errorkeys: [], // array of thumbnail keys/identifiers that have errored out (set via key property in initialPreviewConfig
                initialPreview: [
                ], // initial preview configuration 
                initialPreviewConfig: [
                    // initial preview configuration if you directly want initial preview to be displayed with server upload data
                ],
                initialPreviewThumbTags: [
                    // initial preview thumbnail tags configuration that will be replaced dynamically while rendering
                ],
                append: false // whether to append content to the initial preview (or set false to overwrite)
            }
            return res.json(result);
         } catch (err) {
             
              req.flash('error', { msg: 'Error in updating files!' });
             
             res.redirect('/datalayer/uploadshapefile');
            
         }
        
     };

      /**
     * POST /datalayer/createfromgeojson
     * 
     */
    module.createFromGeoJSONPost = async function (req, res,  next) {
        var errors = req.validationErrors();
      //  req.sanitizeBody('encoding').escape();
       //  req.sanitizeBody('projection').escape();
      
        if (errors) {
            
            return res.json({
                status:false,
                errors:errors
            }) ;
        }
        if (!('file' in req)) {
           
            return res.json({
                status:false,
                msg: 'Failed to upload file!'
            }) ;
           
        }
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (!user) {
            req.flash('error', { msg: 'User not found!' });
            return res.json({
                status:false,
                msg: 'User not found!'
            }) ;
        }
        try {
           var rootPath=__basedir;
           var results=[];
        
            var filePath= path.join(rootPath, req.file.path);
            var filename= req.file.filename;
            var ext= path.extname(filename).toLowerCase();
            
            const readFile = nativeUtil.promisify(fs.readFile);
            //var geoJSON = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            var geoJSON =  JSON.parse( await readFile(filePath, 'utf8'));
            var layerInfo= JSON.parse(req.body.layerInfo);

            var importResult=await postgresWorkspace.importGeoJSON(layerInfo,geoJSON,models.DataLayer, req.user.id,{  });

            return res.json(importResult) ;

            // if(ext==='.shp'){
            //     try{
            //         var importResult=await postgresWorkspace.importShapefile(filePath,models.DataLayer, req.user.id,{
            //             defaultEncoding:defaultEncoding,
            //             defaultProjection:defaultProjection
            //         });
            //         if(importResult){
            //         if( importResult.status)
            //         {
            //             results.push(importResult);   
            //         }else if(importResult.message)
            //         {
            //             req.flash('notify', {
            //                 type:'danger',
            //                 notify:true,
            //                 delay:3000,
            //                 msg: `Failed to upload.Error:`+ importResult.message
            //             });
            //         }
            //         }
            //     }catch(ex){
            //         req.flash('notify', {
            //             type:'danger',
            //             notify:true,
            //             delay:3000,
            //             msg: `Failed to upload.Error:`+ ex.message
            //         });
            //     }
            // }
            
           
        } catch (err) {
            
             
            
             return res.json({
                status:false,
                msg: 'Error in importing geojson!'
            }) ;
           
        }
       
    };

      /**
     * POST /datalayer/toShapefile
     * 
     */
    module.geoJsonToShapefilePost = async function (req, res,  next) {
        var errors = req.validationErrors();
      //  req.sanitizeBody('encoding').escape();
       //  req.sanitizeBody('projection').escape();
      
        if (errors) {
            
            return res.json({
                status:false,
                errors:errors
            }) ;
        }
        if (!('file' in req)) {
           
            return res.json({
                status:false,
                msg: 'Failed to upload file!'
            }) ;
           
        }
        var user = await models.User.findOne({ where: { id: req.user.id } });
        if (!user) {
            req.flash('error', { msg: 'User not found!' });
            return res.json({
                status:false,
                msg: 'User not found!'
            }) ;
        }
        try {

           var rootPath=__basedir;
           var results=[];
        
            var filePath= path.join(rootPath, req.file.path);
            var filename= req.file.filename;
            var ext= path.extname(filename).toLowerCase();
            
            var filePathFolder = path.dirname(filePath);
            var outfilePath = path.join(filePathFolder, 'shapefile' + '.zip');
            //const readFile = nativeUtil.promisify(fs.readFile);
            
            //var geoJSON =  JSON.parse( await readFile(filePath, 'utf8'));
            //var layerInfo= JSON.parse(req.body.layerInfo);

            var promise=new Promise(function(resolve, reject) {
                try{
                var shapefile = ogr2ogr(filePath)
                .format('ESRI Shapefile')
                .skipfailures()
                .options(["--config", "CPL_DEBUG", "ON","-lco", "ENCODING=UTF-8" ])
                .onStderr(function(data) {
                  //  console.log(data);
                })
                .onFinish(function(code,errbuf) {
                    //console.log(code);
                    if(code){
                        reject(errbuf);
                    }else{
                        //resolve(outfilePath);
                    }
                })
                .stream()
                var outStream=fs.createWriteStream(outfilePath);
                outStream.on('finish',function(){
                    resolve(outfilePath);
                });
                shapefile.pipe(outStream)
            }catch(exx){
                reject(exx);
            }

            });
            var resultFile;
            try{
            resultFile= await promise;
            }catch(exx){
                return res.json({
                    status:false,
                    msg:exx.message
                }) ;
            }

            if ( !resultFile || !fs.existsSync(resultFile)) {
                return res.json({
                    status:false,
                    msg:'failed'
                }) ;
            }
            return res.download(resultFile);

            // if(ext==='.shp'){
            //     try{
            //         var importResult=await postgresWorkspace.importShapefile(filePath,models.DataLayer, req.user.id,{
            //             defaultEncoding:defaultEncoding,
            //             defaultProjection:defaultProjection
            //         });
            //         if(importResult){
            //         if( importResult.status)
            //         {
            //             results.push(importResult);   
            //         }else if(importResult.message)
            //         {
            //             req.flash('notify', {
            //                 type:'danger',
            //                 notify:true,
            //                 delay:3000,
            //                 msg: `Failed to upload.Error:`+ importResult.message
            //             });
            //         }
            //         }
            //     }catch(ex){
            //         req.flash('notify', {
            //             type:'danger',
            //             notify:true,
            //             delay:3000,
            //             msg: `Failed to upload.Error:`+ ex.message
            //         });
            //     }
            // }
            
           
        } catch (err) {
            
             
            
             return res.json({
                status:false,
                msg: 'Exporting shapefile failed!'
            }) ;
           
        }
       
    };
   /**
     * GET /datalayer/:id/geojson
     */
    module.geojsonGet = async function (req, res, next) {
       
        var item,err;
        var bbox= req.query.bbox;
        var itemId=req.params.id;
        var settings= req.query.settings;
        var itemId=req.params.id;
        if(settings){
            try{
                settings= JSON.parse(settings);
            }catch(ex){
                settings=null;  
            }
        }
        if(!settings){
            settings={};
        }
        if (req.params.id && req.params.id != '-1') {
            
          [err, item] = await util.call(models.DataLayer.findByPk(itemId,{include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );

            
            if (!item) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }

         
             if (!item.details) {
                 res.set('Content-Type', 'text/plain');
                 res.status(404).end('Not found');
                 return;
             }
              //todo: permission check
               var isOwner=false;
               if(item.ownerUser== req.user.id) {
                   isOwner=true;
               }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
                   isOwner=true;
               }
              if(!isOwner && !res.locals.identity.isAdministrator  )
              {
                
                var userHasViewPermission=false;
                var err;
                [err, item] = await util.call(models.DataLayer.findOne({
                    where: {  id: itemId },
                    include: [ 
                            { model: models.Permission, as: 'Permissions'
                                ,include: [
                                    {
                                        model: models.User, as: 'assignedToUser',
                                        required: false,
                                        where: {
                                            id:  req.user.id
                                        }
                                    },
                                    {
                                        model: models.Group, as: 'assignedToGroup',
                                        required: false,
                                        include: [
                                            {
                                                model: models.User, as: 'Users',
                                                required: true,
                                                where: {
                                                    id: req.user.id
                                                }
                                            }
                                        ]
                                    }
                                ]
                                }
                        ]
                }));

                if(item){// get permission
                    var permissions = item.Permissions;
                    if(permissions){
                        userHasViewPermission= permissions.some((p)=>{
                            if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                return (p.permissionName=='Edit'|| p.permissionName=='View' );
                            }else return false;
                        });
                    }
                    
                }
                
                if(!userHasViewPermission){
                    res.set('Content-Type', 'text/plain');
                    res.status(403).end('Access denied');
                    return;
                }
                
                
              }
              var details={};
              try{
                details= JSON.parse( item.details);
              }catch(ex){}
              if(!details){
                details={};
              }
              //todo: workspace selection

             var tableName= details.datasetName || item.name;
             var oidField= details.oidField || 'gid';
             var shapeField=details.shapeField || 'geom';
             var filter= settings.filter || details.filter || {};
             var validate= settings.validate?true:false;
             var  onlyIds= settings.onlyIds?true:false;
             var srid=3857;
             if(details.spatialReference){
                 srid=  details.spatialReference.srid || 3857;
             }
             if(!filter){
                 filter={};
             }
             var byFeaturesOfLayerItem_details;
             if(filter.spatialFilter && filter.spatialFilter.byFeaturesOfLayer){
                 
                
                [err, byFeaturesOfLayerItem] = await util.call(models.DataLayer.findOne({ where: {  id: filter.spatialFilter.byFeaturesOfLayer }}));
                if(byFeaturesOfLayerItem!=null){
                    
                    try{
                        filter.spatialFilter.byFeaturesOfLayerItem_details= JSON.parse( byFeaturesOfLayerItem.details);
                    }catch(ex){}
                }
             }
             
             if(bbox){
                 var bboxExpr=`ST_Intersects(${shapeField},ST_MakeEnvelope(${bbox}))`;
                 if(!filter.expression)
                     filter.expression=bboxExpr;
                else
                    filter.expression='('+filter.expression+') AND ('+ bboxExpr +')';
             }
             try{
                
                    var result=await postgresWorkspace.getGeoJson({
                        tableName:tableName,
                        oidField:oidField,
                        shapeField:shapeField,
                        filter:filter,
                        onlyIds:onlyIds,
                        srid:srid,
                        fields:details.fields
                    });
                    if(validate){
                        var rowCount=0;
                        if(result && result.features){
                            rowCount= result.features.length;
                        }
                        return res.json({
                            status:true,
                            rowCount:rowCount
                        });
                    }else{
                        return res.json(result);
                    }
                
            }catch(ex){
                if(!(validate || onlyIds) ){
                    res.set('Content-Type', 'text/plain');
                    res.status(404).end('Not found.('+ ex.message +')' );
                    return;
                }else{
                    return res.json({
                        status:false,
                        message:ex.message
                    }); 
                }
            }
            
            
        }else{
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }
    };

    /**
     * GET /datalayer/:id/vectorextent
     */
    module.vectorextentGet = async function (req, res, next) {
       
        var item,err;
        var bbox= req.query.bbox;
        var itemId= req.params.id;
        if (req.params.id && req.params.id != '-1') {
            
          [err, item] = await util.call(models.DataLayer.findByPk(req.params.id) );

            
            if (!item) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }

         
             if (!item.details) {
                 res.set('Content-Type', 'text/plain');
                 res.status(404).end('Not found');
                 return;
             }
              //todo: permission check

              if(req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator  )
              {
                   
                var userHasViewPermission=false;
                var err;
                [err, item] = await util.call(models.DataLayer.findOne({
                    where: {  id: itemId },
                    include: [ 
                            { model: models.Permission, as: 'Permissions'
                                ,include: [
                                    {
                                        model: models.User, as: 'assignedToUser',
                                        required: false,
                                        where: {
                                            id:  req.user.id
                                        }
                                    },
                                    {
                                        model: models.Group, as: 'assignedToGroup',
                                        required: false,
                                        include: [
                                            {
                                                model: models.User, as: 'Users',
                                                required: true,
                                                where: {
                                                    id: req.user.id
                                                }
                                            }
                                        ]
                                    }
                                ]
                                }
                        ]
                }));

                if(item){// get permission
                    var permissions = item.Permissions;
                    if(permissions){
                        userHasViewPermission= permissions.some((p)=>{
                            if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                return (p.permissionName=='Edit'|| p.permissionName=='View' );
                            }else return false;
                        });
                    }
                    
                }
                if(!userHasViewPermission){
                    res.set('Content-Type', 'text/plain');
                    res.status(403).end('Access denied');
                    return;
                }
              }
              var details={};
              try{
                details= JSON.parse( item.details);
              }catch(ex){}
              if(!details){
                details={};
               }
              //todo: workspace selection

             var tableName= details.datasetName || item.name;
             var oidField= details.oidField || 'gid';
             var shapeField=details.shapeField || 'geom';
             var where='';
             if(bbox){
                 var bboxExpr=`ST_Intersects(${shapeField},ST_MakeEnvelope(${bbox}))`;
                 if(!where)
                    where=bboxExpr;
                else
                    where='('+where+') AND ('+ bboxExpr +')';
             }
             try{
                var result=await postgresWorkspace.getVectorExtentJson({
                    tableName:tableName,
                    shapeField:shapeField,
                    where:where
                });
                return res.json(result);
            }catch(ex){
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found.('+ ex.message +')' );
                return;
            }
            
            
        }else{
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }
    };

     /**
     * POST /datalayer/:id/geojson/:row
    */
   module.geojsonRowPost = async function (req, res) {
    var item,err;
    var itemId=req.params.id;
    
    if (req.params.id && req.params.id != '-1') {
        
        [err, item] = await util.call(models.DataLayer.findByPk(itemId,{include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );

        
        if (!item) {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }

     
         if (!item.details) {
             res.set('Content-Type', 'text/plain');
             res.status(404).end('Not found');
             return;
         }
          //todo: permission check
          var isOwner=false;
          if(item.ownerUser== req.user.id) {
              isOwner=true;
          }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
              isOwner=true;
          }
          if(!isOwner && !res.locals.identity.isAdministrator  )
          {
            // if(!res.locals.identity.isDataManager){ //is applyed in UI
            //     res.set('Content-Type', 'text/plain');
            //     res.status(403).end('Access denied');
            //     return;
            // }   
            var userHasEditPermission=false;
            var err;
            [err, item] = await util.call(models.DataLayer.findOne({
                where: {  id: itemId },
                include: [ 
                        { model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                },
                                {
                                    model: models.Group, as: 'assignedToGroup',
                                    required: false,
                                    include: [
                                        {
                                            model: models.User, as: 'Users',
                                            required: true,
                                            where: {
                                                id: req.user.id
                                            }
                                        }
                                    ]
                                }
                            ]
                            }
                    ]
            }));

            if(item){// get permission
                var permissions = item.Permissions;
                if(permissions){
                    userHasEditPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit' );
                        }else return false;
                    });
                }
                
            }
            if(!userHasEditPermission){
                res.set('Content-Type', 'text/plain');
                res.status(403).end('Access denied');
                return;
            }
          }
          var details={};
          try{
            details= JSON.parse( item.details);
          }catch(ex){}
          if(!details){
            details={};
           }

          //todo: workspace selection
          var action=req.body.action;
          var geoJSON=req.body.geoJSON;

         var tableName= details.datasetName || item.name;
         var oidField= details.oidField || 'gid';
         var shapeField=details.shapeField || 'geom';
         try{
            var succeeded=false;
            var result;
            if(action=='insert'){
               result=await postgresWorkspace.insertVector(details,geoJSON);
               succeeded=true;
               //return res.json(result);
            }else if(action==='update')
            {
               result=await postgresWorkspace.updateVector(details,geoJSON);
               succeeded=true;
               //return res.json(result);
               
            }else if (action==='delete'){ 
                result=await postgresWorkspace.deleteRow(details,geoJSON.id);
                succeeded=true;
               //return res.json(result);

            }else
            {
               return res.json({status:false,message:'This action is not supported'});
            }
            if(succeeded){
          
             //  await postgresWorkspace.updateVectorLayerExtent(item);
            //    var metadata= await item.getMetadata();
            //    if(metadata){ //update metadata
            //        await module.updateLayerMetadata({datasetItem:item,create:false});
            //     }
               return res.json(result);
            }
       }catch(ex){
           return res.json({
               status:false,
               message:ex.message
           });
       }
        
        
    }else{
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
        return;
    }
   }

   /**
     * POST /dataset/:id/geojson/sync
    */
   module.geojsonSyncRowsPost = async function (req, res) {
    var item,err;
    var itemId=req.params.id;
    
    if (req.params.id && req.params.id != '-1') {
        
        [err, item] = await util.call(models.DataLayer.findByPk(itemId,{include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );

        
        if (!item) {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }

     
         if (!item.details) {
             res.set('Content-Type', 'text/plain');
             res.status(404).end('Not found');
             return;
         }
          //todo: permission check
          var isOwner=false;
          if(item.ownerUser== req.user.id) {
              isOwner=true;
          }else if (item.OwnerUser && item.OwnerUser.parent==req.user.id){
              isOwner=true;
          }
          if(!isOwner && !res.locals.identity.isAdministrator  )
          {
            // if(!res.locals.identity.isDataManager){ //is applyed in UI
            //     res.set('Content-Type', 'text/plain');
            //     res.status(403).end('Access denied');
            //     return;
            // }   
            var userHasEditPermission=false;
            var err;
            [err, item] = await util.call(models.DataLayer.findOne({
                where: {  id: itemId },
                include: [ 
                        { model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                },
                                {
                                    model: models.Group, as: 'assignedToGroup',
                                    required: false,
                                    include: [
                                        {
                                            model: models.User, as: 'Users',
                                            required: true,
                                            where: {
                                                id: req.user.id
                                            }
                                        }
                                    ]
                                }
                            ]
                            }
                    ]
            }));

            if(item){// get permission
                var permissions = item.Permissions;
                if(permissions){
                    userHasEditPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit' );
                        }else return false;
                    });
                }
                
            }
            if(!userHasEditPermission){
                res.set('Content-Type', 'text/plain');
                res.status(403).end('Access denied');
                return;
            }
          }
          var details={};
          try{
            details= JSON.parse( item.details);
          }catch(ex){}
          if(!details){
            details={};
           }
          
           var tableName= details.datasetName || item.name;
           var oidField= details.oidField || 'gid';
           var shapeField=details.shapeField || 'geom';
           var srid=   3857;
           if(details.spatialReference){
               srid=  details.spatialReference.srid ;
           }

          //todo: workspace selection
          var geojsons=req.body.geojsons || [];

         // var action=req.body.action;
          var insert_count=0;
          var update_count=0;
          var delete_count=0;
           for(var i=0;i< geojsons.length;i++){
               var geoJSON=geojsons[i];
               if(geoJSON){
                    var _cacheInfo=undefined;
                    if( geoJSON.properties){
                        _cacheInfo=  geoJSON.properties['_cacheInfo'];
                    }
                    if(!_cacheInfo){
                        continue;
                    }
                    var action=_cacheInfo.action;
                    try{
                        if(action=='insert'){
                            _cacheInfo.result=await postgresWorkspace.insertVector(details,geoJSON);
                            if(_cacheInfo.result.status){
                                insert_count++;
                            }
                        }else if(action==='update')
                        {
                            _cacheInfo.result=await postgresWorkspace.updateVector(details,geoJSON);
                            if(_cacheInfo.result.status){
                                update_count++;
                            }
                        }else if (action==='delete'){ 
                            _cacheInfo.result=await postgresWorkspace.deleteRow(details,geoJSON.id);
                            if(_cacheInfo.result.status){
                                delete_count++;
                            }
                        }
                    }catch(ex){
                        _cacheInfo.result={
                            status:false,
                            message:ex.message
                        };
                    }




               }

            
           }
       
            
            try{
              //      await postgresWorkspace.updateVectorLayerExtent(item);
                    // var metadata= await item.getMetadata();
                    // if(metadata){ //update metadata
                    //     await module.updateLayerMetadata({datasetItem:item,create:false});
                    // }
            }catch(ex){
            
            }
        
            return res.json({
                insert_count:insert_count,
                update_count:update_count,
                delete_count:delete_count,
                status:true,geojsons:geojsons
            });
            
    }else{
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
        return;
    }
   }

     /**
     * GET /datalayer/uploadraster
     */
    module.uplaodRasterGet= async function (req, res) {
        
        res.render('dataLayer/uploadRaster', {
            title: 'Upload Raster'
            //,
           // users: users
        });
    };
      /**
     * POST /datalayer/uploadraster
     * 
     */
    module.uplaodRasterPost = async function (req, res,  next) {
         var errors = req.validationErrors();
       //  req.sanitizeBody('encoding').escape();
        //  req.sanitizeBody('projection').escape();
        var defaultEncoding= req.body['encoding'];
        var defaultProjection=req.body['projection'];
         if (errors) {
             req.flash('error', errors);
             return res.redirect('/datalayer/uploadraster');
         }
         if (!('files' in req)) {
             req.flash('error', { msg: 'Failed to upload file!' });
             return res.redirect('/datalayer/uploadraster');
         }
         var user = await models.User.findOne({ where: { id: req.user.id } });
         if (!user) {
             req.flash('error', { msg: 'User not found!' });
             return res.redirect('/datalayer/uploadraster');
         }
         try {
            var rootPath=__basedir;
            var results=[];
             for(var i=0; i< req.files.length;i++){
                 var filePath= path.join(rootPath, req.files[i].path);
                 var filename= req.files[i].filename;
                 var ext= path.extname(filename).toLowerCase();
                 if(ext==='.tif' || ext==='.tiff' || ext==='.geotif' || ext==='.geotiff' || ext==='.jpg' || ext==='.jpeg' || ext==='.png'){
                     var importResult=await postgresWorkspace.importRaster(filePath,models.DataLayer, req.user.id,{
                        
                        });
                        if(importResult){
                        if( importResult.status)
                        {
                            results.push(importResult);   
                        }else if(importResult.message)
                        {
                            req.flash('notify', {
                                type:'danger',
                                notify:true,
                                delay:3000,
                                msg: `Failed to upload.Error:`+ importResult.message
                            });
                        }
                        }
                    //  try{
                    //      var gdal= require('gdal');
                    //     var dataset = gdal.open(filePath);
    
                    //     console.log("number of bands: " + dataset.bands.count());
                    //     console.log("width: " + dataset.rasterSize.x);
                    //     console.log("height: " + dataset.rasterSize.y);
                    //     console.log("geotransform: " + dataset.geoTransform);
                    //     console.log("srs: " + (dataset.srs ? dataset.srs.toWKT() : 'null'));
                    //  }catch(ex){

                    //  }

                    //  const util = require('util');
                    //     const execFile = util.promisify(require('child_process').execFile);
                    //     // var fs_promises = require('fs').promises;
                    //     // var batchScript = `set PGPASSWORD=postgres
                    //     // "d:/Program Files/PostgreSQL/10/bin/raster2pgsql" -s 4326 -I -d -C -M "d:/Works/iMSEP/data/geotiff/test1_3857.tif" -t 100x100 public.test1_3857 | "d:/Program Files/PostgreSQL/10/bin/psql" -p 5432 -U postgres -d postgis_24_sample`;
                    //     // try{
                    //     //     await fs_promises.writeFile('d:\\Works\\iMSEP\\data\\geotiff\\temp.txt', batchScript);
                    //     // }catch(exx){
                    //     //     console.log(exx);
                    //     // }
                        
                    //     const fs_writeFile = util.promisify(require('fs').writeFile)
                    //     var batchScript = `set PGPASSWORD=postgres
                    //     "d:/Program Files/PostgreSQL/10/bin/raster2pgsql" -s 4326 -I -d -C -M "d:/Works/iMSEP/data/geotiff/test1_3857.tif" -t 100x100 public.test1_3857 | "d:/Program Files/PostgreSQL/10/bin/psql" -p 5432 -U postgres -d postgis_24_sample`;
                    //     try{
                    //         await fs_writeFile('d:\\Works\\iMSEP\\data\\geotiff\\temp.bat', batchScript);
                    //     }catch(exx){
                    //         console.log(exx);
                    //     }

                    //     //const { stdout, stderr } = await exec(`set PGPASSWORD=postgres
                    //     //"d:/Program Files/PostgreSQL/10/bin/raster2pgsql" -s 4326 -I -d -C -M "d:/Works/iMSEP/data/geotiff/test1_3857.tif" -t 100x100 public.test1_3857 | "d:/Program Files/PostgreSQL/10/bin/psql" -p 5432 -U postgres -d postgis_24_sample`
                    //     //);
                    //     //d:\Works\iMSEP\data\geotiff\import.bat 
                    //     const { stdout, stderr } = await execFile('d:\\Works\\iMSEP\\data\\geotiff\\temp.bat');
                    //     console.log('stdout:', stdout);
                    //     console.log('stderr:', stderr);
                        
                 }else if(ext==='.shp'){
                     try{
                        // var importResult=await postgresWorkspace.importShapefile(filePath,models.DataLayer, req.user.id,{
                        //     defaultEncoding:defaultEncoding,
                        //     defaultProjection:defaultProjection
                        // });
                        // if(importResult){
                        // if( importResult.status)
                        // {
                        //     results.push(importResult);   
                        // }else if(importResult.message)
                        // {
                        //     req.flash('notify', {
                        //         type:'danger',
                        //         notify:true,
                        //         delay:3000,
                        //         msg: `Failed to upload.Error:`+ importResult.message
                        //     });
                        // }
                        // }
                     }catch(ex){
                        req.flash('notify', {
                            type:'danger',
                            notify:true,
                            delay:3000,
                            msg: `Failed to upload.Error:`+ ex.message
                        });
                     }
                 }else if (ext==='.zip'){
                     try{
                        var importResult=await postgresWorkspace.importZipfile(filePath,models.DataLayer, req.user.id,{
                            importRasters:true,
                            defaultEncoding:defaultEncoding,
                            defaultProjection:defaultProjection
                        });
                        if(importResult && importResult.length>0){
                            results.push(... importResult); 
                        }
                    
                     }catch(ex){

                     }
                 }
             }
             
             if(results.length>0){
                if(results.length==1){
                    req.flash('notify', {
                        type:'success',
                        notify:true,
                        delay:3000,
                        msg: `${results.length} raster has been added successfully.`
                    });
                }else{
                    req.flash('notify', {
                        type:'success',
                        notify:true,
                        delay:3000,
                        msg: `${results.length} rasters have been added successfully.`
                    });
                }
             }
             
             //res.redirect('/datalayer/uploadshapefile');
             var result={
                 flash: req.flash('notify'),
                error: '',
                errorkeys: [], // array of thumbnail keys/identifiers that have errored out (set via key property in initialPreviewConfig
                initialPreview: [
                ], // initial preview configuration 
                initialPreviewConfig: [
                    // initial preview configuration if you directly want initial preview to be displayed with server upload data
                ],
                initialPreviewThumbTags: [
                    // initial preview thumbnail tags configuration that will be replaced dynamically while rendering
                ],
                append: false // whether to append content to the initial preview (or set false to overwrite)
            }
            return res.json(result);
         } catch (err) {
             
              req.flash('error', { msg: 'Error in updating files!' });
             
             res.redirect('/datalayer/uploadraster');
            
         }
        
     };
     /**
     * GET /datalayer/:id/raster
     */
    module.rasterGet = async function (req, res, next) {
       
        var item,err;
        var bbox= req.query.bbox;
        var out_srid= req.query.srid;// reproject to srid
        var request=req.query.request || 'png';
        
        var display= req.query.display;
        var itemId=req.params.id;
        if(out_srid){
            try{
                out_srid=parseInt(out_srid);
                if(isNaN(out_srid))
                    out_srid=undefined;
            }catch(ex){}
        }
        if(display){
            try{
                display= JSON.parse(display);
            }catch(ex){}
        }
        var getMetadata=req.query.metadata || request==='metadata';// return only  reater metadata i.e. raster georeference info

        var x,y;
        if(request==='value'){
            x=req.query.x;
            y=req.query.y;
        }
        if (req.params.id && req.params.id != '-1') {
            
          [err, item] = await util.call(models.DataLayer.findByPk(itemId) );

            
            if (!item) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }

         
             if (!item.details) {
                 res.set('Content-Type', 'text/plain');
                 res.status(404).end('Not found');
                 return;
             }
              //todo: permission check

            //todo: permission check
            if(req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator  )
            {
              
              var userHasViewPermission=false;
              var err;
              [err, item] = await util.call(models.DataLayer.findOne({
                  where: {  id: itemId },
                  include: [ 
                          { model: models.Permission, as: 'Permissions'
                              ,include: [
                                  {
                                      model: models.User, as: 'assignedToUser',
                                      required: false,
                                      where: {
                                          id:  req.user.id
                                      }
                                  },
                                  {
                                      model: models.Group, as: 'assignedToGroup',
                                      required: false,
                                      include: [
                                          {
                                              model: models.User, as: 'Users',
                                              required: true,
                                              where: {
                                                  id: req.user.id
                                              }
                                          }
                                      ]
                                  }
                              ]
                              }
                      ]
              }));

              if(item){// get permission
                  var permissions = item.Permissions;
                  if(permissions){
                      userHasViewPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else return false;
                      });
                  }
                  
              }
              
              if(!userHasViewPermission){
                  res.set('Content-Type', 'text/plain');
                  res.status(403).end('Access denied');
                  return;
              }
              
              
            }
              var details={};
              try{
                details= JSON.parse( item.details);
              }catch(ex){}
              if(!details){
                details={};
               }

              //todo: workspace selection

             var tableName= details.datasetName || item.name;
             var oidField= details.oidField || 'rid';
             var rasterField=details.rasterField || 'raster';
             var srid=  details.spatialReference.srid || 3857;
             if(!out_srid)
              {
                  out_srid=details.spatialReference.srid || 3857;
              }
            
              var BBand=3;
             if(details.numberOfBands<3)
                BBand=details.numberOfBands;
             var GBand=2;
                if(details.numberOfBands<2)
                   GBand=details.numberOfBands;   
             var RBand=1;
             if(details.bands && details.bands.length){
                 for(var i=0;i< details.bands.length;i++){
                     var band=details.bands[i];
                     if(!band.name){
                        band.name=band.colorInterpretation;
                     }
                     if(band.name==='Red'){
                         RBand= band.id;
                     }
                     if(band.name==='Green'){
                        GBand= band.id;
                    }
                    if(band.name==='Blue'){
                        BBand= band.id;
                    }
                 }
             }
             if(!display){
                display= details.display;
             }
             if(!display){
                 if(details.numberOfBands>1){
                     display={
                        displayType:'RGB',
                        RBand:RBand,
                        GBand:GBand,
                        BBand:BBand,
                        ABand:undefined,
                        reclass:false
                     }
                 }else{
                    display={
                        displayType:'colorMap',
                        band:1,
                        colorMap:'grayscale',
                        reclass:false
                     }
                 }
             }

             var where='';
             if(bbox){
                 var bboxExpr=`ST_Intersects(${rasterField},ST_Transform(ST_MakeEnvelope(${bbox}),${srid}))`;
                 if(!where)
                    where=bboxExpr;
                else
                    where='('+where+') AND ('+ bboxExpr +')';
             }
             try{
                if(request==='value'){
                    
                    var result=await postgresWorkspace.getRasterValue({
                        tableName:tableName,
                        oidField:oidField,
                        rasterField:rasterField,
                        srid:srid,
                        out_srid:out_srid,
                        x:x,
                        y:y,
                        bands:details.bands
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else  if(getMetadata){
                    
                    var result=await postgresWorkspace.getRasterMetadata({
                        tableName:tableName,
                        oidField:oidField,
                        rasterField:rasterField,
                        srid:out_srid,
                        where:where
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else  if(request==='geotiff' || request=='tiff'){
                    var result=await postgresWorkspace.getRasterAsGeotiff({
                        tableName:tableName,
                        oidField:oidField,
                        rasterField:rasterField,
                        srid:out_srid,
                        where:where
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    res.set('Content-Type', 'image/tiff');
                    res.end(result.output, 'binary');
                    return;
                } else{
                    var result=await postgresWorkspace.getRasterAsPng({
                        tableName:tableName,
                        oidField:oidField,
                        rasterField:rasterField,
                        srid:out_srid,
                        bands:details.bands,
                        display:display,
                        where:where
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    res.set('Content-Type', 'image/png');
                    res.end(result.output, 'binary');
                    return;
                }
            }catch(ex){
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found.('+ ex.message +')' );
                return;
            }
            
            
        }else{
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }
    };
     /**
     * GET /datalayer/:id/rastertile
     */
    module.rasterTileGet = async function (req, res, next) {
       
        var item,err;
        //var bbox= req.query.bbox;
        var x,y,z;
        x=req.query.x;
        y=req.query.y;
        z=req.query.z;
        var ref_z= req.query.ref_z || 18;
        try{
            ref_z=  parseInt(ref_z);
        }catch(ex){}
        try{
            x=  parseInt(x);
        }catch(ex){}
        try{
            y=  parseInt(y);
        }catch(ex){}
        try{
            z=  parseInt(z);
        }catch(ex){}
        var out_srid= 3857;//req.query.srid;// reproject to srid
        var request=req.query.request || 'png';
        var tileSize=req.query.size || 256;
        var display= req.query.display;
        var itemId=req.params.id;
        
        if(display){
            try{
                display= JSON.parse(display);
            }catch(ex){}
        }
        if(!(req.params.id && req.params.id != '-1')){ 
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }
                    
        [err, item] = await util.call(models.DataLayer.findByPk(itemId) );

            
        if (!item) {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }

        
        if (!item.details) {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
            return;
        }
        //todo: permission check

        //todo: permission check
        if(req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator  )
        {
            
            var userHasViewPermission=false;
            var err;
            [err, item] = await util.call(models.DataLayer.findOne({
                where: {  id: itemId },
                include: [ 
                        { model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                },
                                {
                                    model: models.Group, as: 'assignedToGroup',
                                    required: false,
                                    include: [
                                        {
                                            model: models.User, as: 'Users',
                                            required: true,
                                            where: {
                                                id: req.user.id
                                            }
                                        }
                                    ]
                                }
                            ]
                            }
                    ]
            }));

            if(item){// get permission
                var permissions = item.Permissions;
                if(permissions){
                    userHasViewPermission= permissions.some((p)=>{
                    if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                        return (p.permissionName=='Edit'|| p.permissionName=='View' );
                    }else return false;
                    });
                }
                
            }
            
            if(!userHasViewPermission){
                res.set('Content-Type', 'text/plain');
                res.status(403).end('Access denied');
                return;
            }
            
            
        }

        
        var details={};
        try{
          details= JSON.parse( item.details);
        }catch(ex){}
        if(!details){
            details={};
        }

        //todo: workspace selection

        var tableName= details.datasetName || item.name;
        var oidField= details.oidField || 'rid';
        var rasterField=details.rasterField || 'raster';
        var srid=  details.spatialReference.srid || 3857;
        if(!out_srid)
        {
            out_srid=details.spatialReference.srid || 3857;
        }
    
        var BBand=3;
        if(details.numberOfBands<3)
          BBand=details.numberOfBands;
        var GBand=2;
        if(details.numberOfBands<2)
            GBand=details.numberOfBands;   
        var RBand=1;
        if(details.bands && details.bands.length){
            for(var i=0;i< details.bands.length;i++){
                var band=details.bands[i];
                if(!band.name){
                band.name=band.colorInterpretation;
                }
                if(band.name==='Red'){
                    RBand= band.id;
                }
                if(band.name==='Green'){
                GBand= band.id;
            }
            if(band.name==='Blue'){
                BBand= band.id;
            }
            }
        }
        if(!display){
        display= details.display;
        }
        if(!display){
            if(details.numberOfBands>1){
                display={
                displayType:'RGB',
                RBand:RBand,
                GBand:GBand,
                BBand:BBand,
                ABand:undefined,
                reclass:false
                }
            }else{
            display={
                displayType:'colorMap',
                band:1,
                colorMap:'grayscale',
                reclass:false
                }
            }
        }
        var themeKey=util.hashString(JSON.stringify(display)); 

        //var cacheKey=util.hashString(req.url);
        var app_dataDirectory = path.join(__basedir, 'app_data/');
        var tilecacheDirectory = path.join(app_dataDirectory, 'tilecache/');
        var cacheDirectory = path.join(app_dataDirectory, 'tilecache/'+ item.id+'/');
        var cacheThemeDirectory = cacheDirectory + `/${themeKey}/`;
        var cacheFilePath = cacheThemeDirectory + `${z}_${x}_${y}.png`;
        try{
            fs.existsSync(app_dataDirectory) || fs.mkdirSync(app_dataDirectory);// ensure  upload directory exists
            fs.existsSync(tilecacheDirectory) || fs.mkdirSync(tilecacheDirectory);// ensure  tilecacheDirectory exists
            
            fs.existsSync(cacheDirectory) || fs.mkdirSync(cacheDirectory);// ensure  tilecacheDirectory exists
            fs.existsSync(cacheThemeDirectory) || fs.mkdirSync(cacheThemeDirectory);// ensure  cacheThemeDirectory exists
        }catch(ex){
            logger.log({
                level: 'error',
                message: ex.message,
                date: new Date()
            });
        } 
        if(fs.existsSync(cacheFilePath)){
            res.download(cacheFilePath);
            res.set('Cache-Control', 'public, max-age=2592000'); //30 days cache header
            res.set('theme-key',themeKey);
            return;
        }
        
        try{
           var result=await postgresWorkspace.getRasterTileAsPng({
                    tableName:tableName,
                    oidField:oidField,
                    rasterField:rasterField,
                    srid:out_srid,
                    bands:details.bands,
                    display:display,
                    origRaster_srid:details.spatialReference.srid || 3857,
                    
                    x:x,y:y,z:z,
                    tileSize:tileSize,
                    
                    ref_z:ref_z,
                    details:details
                });
                if(!result){
                    res.set('Content-Type', 'text/plain');
                    res.status(404).end('Not found');
                    return;
                }
                
                try {
                    await nativeUtil.promisify(fs.writeFile)(cacheFilePath, result.output);
                } catch (exx) {
                    console.log(exx);
                }
                res.set('Content-Type', 'image/png');
                res.set('Cache-Control', 'public, max-age=2592000'); //30 days cache header
                res.set('theme-key',themeKey);
                res.end(result.output, 'binary');
                return;
            
        }catch(ex){
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found.('+ ex.message +')' );
            return;
        }
            
            
        
    };
     /**
     * GET /datalayer/:id/analysis
     */
    module.analysisGet = async function (req, res, next) {
       
        var item,err;
        var out_srid= req.query.srid;// reproject to srid
        var request=req.query.request || 'copy';
        request=request.toLowerCase();
        var settings= req.query.settings;
        var itemId=req.params.id;
        if(settings){
            try{
                settings= JSON.parse(settings);
            }catch(ex){
                settings=null;  
            }
        }
        if(!settings){
            settings={};
        }
        if(out_srid){
            try{
                out_srid=parseInt(out_srid);
                if(isNaN(out_srid))
                    out_srid=undefined;
            }catch(ex){}
        }
        
        if (req.params.id && req.params.id != '-1') {
            
          [err, item] = await util.call(models.DataLayer.findByPk(itemId) );

            
            if (!item) {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
                return;
            }

         
             if (!item.details) {
                 res.set('Content-Type', 'text/plain');
                 res.status(404).end('Not found');
                 return;
             }
              //todo: permission check

            //todo: permission check
            if(req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator  )
            {
              
              var userHasViewPermission=false;
              var err;
              [err, item] = await util.call(models.DataLayer.findOne({
                  where: {  id: itemId },
                  include: [ 
                          { model: models.Permission, as: 'Permissions'
                              ,include: [
                                  {
                                      model: models.User, as: 'assignedToUser',
                                      required: false,
                                      where: {
                                          id:  req.user.id
                                      }
                                  },
                                  {
                                      model: models.Group, as: 'assignedToGroup',
                                      required: false,
                                      include: [
                                          {
                                              model: models.User, as: 'Users',
                                              required: true,
                                              where: {
                                                  id: req.user.id
                                              }
                                          }
                                      ]
                                  }
                              ]
                              }
                      ]
              }));

              if(item){// get permission
                  var permissions = item.Permissions;
                  if(permissions){
                      userHasViewPermission= permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                            return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else return false;
                      });
                  }
                  
              }
              
              if(!userHasViewPermission){
                  res.set('Content-Type', 'text/plain');
                  res.status(403).end('Access denied');
                  return;
              }
              
              
            }
              var details={};
              try{
                details= JSON.parse( item.details);
                details.name= item.name;
              }catch(ex){}
              if(!details){
                details={};
              }

              //todo: workspace selection

             var tableName= details.datasetName || item.name;
             var oidField= details.oidField || 'rid';
             var rasterField=details.rasterField || 'raster';
             var srid=  details.spatialReference.srid || 3857;
             if(!out_srid)
              {
                  out_srid= 3857;
              }
            
            
            
             try{
                if(request==='bandDistinctValuecount'.toLowerCase()){
                    var band;
                    if(settings){
                        band= settings.band;
                    }
                    
                    var result=await postgresWorkspace.getRasterBandDistinctValueCount({
                        tableName:details.datasetName,
                        oidField:details.oidField,
                        rasterField:details.rasterField,
                        band:band || 1
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                }else  if(request==='slope'){
                    
                    var result=await postgresWorkspace.createRaster_Slope(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName || (item.name+'-Slope'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='hillshade'){
                    
                    var result=await postgresWorkspace.createRaster_Hillshade(models.DataLayer, req.user.id,{
                        details:details,
                        outputName:settings.outputName ||(item.name+'-Hillshade'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else  if(request==='clipraster'){
                    
                    var result=await postgresWorkspace.createRaster_Clip(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName || (item.name+'-Clipped'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='reclass'){
                    
                    var result=await postgresWorkspace.createRaster_Reclass(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName || (item.name+'-Reclass'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='rasterToPolygon'.toLowerCase()){
                    
                    var result=await postgresWorkspace.rasterToPolygon(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName || (item.name+'-Polygon'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='rasterBandHistogram'.toLowerCase()){
                    var band=1;
                    if(settings){
                        band= settings.band;
                    }
                    var result=await postgresWorkspace.getRasterBandHistogram({
                        tableName: details.datasetName,
                        oidField:details.oidField,
                        rasterField:details.rasterField,
                        band:band
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='buffer'){
                    
                    var result=await postgresWorkspace.makeBuffer(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName ||(item.name+'-Buffer'),
                        settings:settings,
                        where:''
                        ,out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='intersection'){
                    var err,otherLayerItem,otherDetails;
                    [err, otherLayerItem] = await util.call(models.DataLayer.findOne({ where: {  id: settings.otherLayer }}));
                    if(otherLayerItem!=null){
                        
                        try{
                            otherDetails= JSON.parse( otherLayerItem.details);
                        }catch(ex){}
                    }
                    if(!otherDetails){
                        return res.json({
                            status:false,
                            message:'Intersecting layer not found'
                        });
                    }
                    var result=await postgresWorkspace.intersection(models.DataLayer, req.user.id,{
                        details:details,
                        settings:{
                            otherLayerId:settings.otherLayer,
                            otherLayerName:otherLayerItem.name,
                            otherDetails:otherDetails
                        },
                        outputName: settings.outputName ||(item.name+ '_'+ otherLayerItem.name +'-Intersection'),
                        out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='identity'){
                    var err,otherLayerItem,otherDetails;
                    [err, otherLayerItem] = await util.call(models.DataLayer.findOne({ where: {  id: settings.otherLayer }}));
                    if(otherLayerItem!=null){
                        
                        try{
                            otherDetails= JSON.parse( otherLayerItem.details);
                        }catch(ex){}
                    }
                    if(!otherDetails){
                        return res.json({
                            status:false,
                            message:'Intersecting layer not found'
                        });
                    }
                    var result=await postgresWorkspace.identity(models.DataLayer, req.user.id,{
                        details:details,
                        settings:{
                            otherLayerId:settings.otherLayer,
                            otherLayerName:otherLayerItem.name,
                            otherDetails:otherDetails
                        },
                        outputName: settings.outputName ||(item.name+ '_'+ otherLayerItem.name +'-Overlay'),
                        out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='clipVector'.toLowerCase()){
                    var err,otherLayerItem,otherDetails;
                    [err, otherLayerItem] = await util.call(models.DataLayer.findOne({ where: {  id: settings.otherLayer }}));
                    if(otherLayerItem!=null){
                        
                        try{
                            otherDetails= JSON.parse( otherLayerItem.details);
                        }catch(ex){}
                    }
                    if(!otherDetails){
                        return res.json({
                            status:false,
                            message:'Intersecting layer not found'
                        });
                    }
                    var result=await postgresWorkspace.clipVector(models.DataLayer, req.user.id,{
                        details:details,
                        settings:{
                            otherLayerId:settings.otherLayer,
                            otherLayerName:otherLayerItem.name,
                            otherDetails:otherDetails,
                            clipOutside:settings.clipOutside
                        },
                        outputName: settings.outputName ||(item.name+ '_ClippedBy_'+ otherLayerItem.name ),
                        out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }else if(request==='dissolve'){
                    
                    var result=await postgresWorkspace.dissolve(models.DataLayer, req.user.id,{
                        details:details,
                        outputName: settings.outputName ||(item.name+'-Dissolve'),
                        settings:settings,
                        out_srid:out_srid,
                    });
                    if(!result){
                        res.set('Content-Type', 'text/plain');
                        res.status(404).end('Not found');
                        return;
                    }
                    return res.json(result);
                    
                }
                else{
                    res.set('Content-Type', 'text/plain');
                    res.status(404).end('Request is not supported');
                    return;
                }
            }catch(ex){
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found.('+ ex.message +')' );
                return;
            }
            
            
        }else{
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');

            return;
        }
    };
    return module;
}