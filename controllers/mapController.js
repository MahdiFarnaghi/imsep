const  Sequelize  = require('sequelize');
const { Op } = require('sequelize');
var models = require('../models/index');
var util = require('./util');
var sharp= require('sharp');
var dataRelationshipController=require('./dataRelationshipController')();
module.exports = function () {
    var module = {};

    /**
     * GET /maps
     */
    module.mapsGet = async function (req, res) {
        var items;
        var format=undefined;
        
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
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('Map.name')),'LIKE','%'+ filterExpression+'%'),
                    {
                        description:{[Op.iLike]:'%'+ filterExpression+'%'}
                    },
                    {
                        keywords:{[Op.iLike]:'%'+ filterExpression+'%'}
                    },
                    
                     Sequelize.where(Sequelize.cast(Sequelize.col('Map.id'),'varchar'),'=', filterExpression)
                    
                ]
            })
        }
        if(extent ){
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
            items = await models.Map.findAll( {
                attributes: ['id','name',
                    'description','keywords','ext_north','ext_east','ext_south','ext_west',
                    //'thumbnail',
                    [models.Map.sequelize.literal(`CASE  WHEN thumbnail isnull THEN false ELSE true END`), 'thumbnail'],
                    
                    'ownerUser','createdAt','updatedAt'
                ], 
                where:where,
                include: [ {
                     model: models.User, as: 'OwnerUser',
                     attributes: ['userName','id','firstName','lastName','parent']
                }]
            ,order:[ 
                ['updatedAt','DESC']
                //['id', 'DESC']
            ]
         });
        } else {
            // items = await models.Map.findAll({
            //      where: { ownerUser: req.user.id },
            //      include: [ { model: models.User, as: 'OwnerUser' }]
            // ,order:[ 
            //     ['updatedAt','DESC']
            //     //['id', 'DESC']
            // ]
            // });
             items = await models.Map.findAll({ 
                attributes: ['id','name',
                'description','keywords','ext_north','ext_east','ext_south','ext_west',
                //'thumbnail',
                [models.Map.sequelize.literal(`CASE  WHEN thumbnail isnull THEN false ELSE true END`), 'thumbnail'],
                
                'ownerUser','createdAt','updatedAt'
            ], 
            where:where,
            //where: { ownerUser: req.user.id },
               include: [ { model: models.User, as: 'OwnerUser',
                    attributes: ['userName','id','firstName','lastName','parent']}
                        ,{ model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                }          ,
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
                    return true;
                }
                if(v.OwnerUser && (v.OwnerUser.parent == req.user.id)){
                    return true;
                }
                if(v.Permissions && v.Permissions.length){
                    var hasPermission= v.Permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else
                        {
                            return false;
                        }
                    });
                    return (hasPermission);
                }
                return false;
            });
            items=filteredItems;
        }


        var jsonArray=[];
        var keywordMap={};
        var authorMap={};
        for(var i=0;i<items.length;i++){
            var m= items[i];
             var item={};
             item.id=m.id;

            
             item.keywords=m.keywords;
             item.ext_north=m.ext_north;
             item.ext_east=m.ext_east;
             item.ext_south=m.ext_south;
             item.ext_west=m.ext_west;
             

             item.updatedAt=m.updatedAt;
             item.thumbnail= (m.thumbnail)?`/map/${m.id}/thumbnail`:false;
             
             item.name=m.name;
             item.description=m.description;
             if(m.OwnerUser){
                 item.OwnerUser={
                     id:m.OwnerUser.id,
                    userName:m.OwnerUser.userName,
                    parent:m.OwnerUser.parent
                 };
                 item.author= m.OwnerUser.userName;   
             }
            
             if(item.author){
                if ( authorMap.hasOwnProperty(item.author)) {
                    authorMap[item.author]++;
                } else {
                    authorMap[item.author] = 1;
                }
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
                  keywords:keywords
              },
              statistics:{
                authors:authorArray,
                  keywords:keywordArray
              }
          });
          }else{
              res.render('map/maps', {
                  title: 'Maps',
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
                          
                          keywords:keywords
                      },
                      statistics:{
                        authors:authorArray,
                          keywords:keywordArray
                          
                      }
                  }
              });
           }
    };
    module.mapsGet__ = async function (req, res) {
        var items;
        if (res.locals.identity.isAdministrator) {
            items = await models.Map.findAll( {
                //include: [ { model: models.User, as: 'OwnerUser' }]
                include: [ {
                     model: models.User, as: 'OwnerUser',
                     attributes: ['userName','id','firstName','lastName','parent']
                }]
            ,order:[ 
                ['updatedAt','DESC']
                //['id', 'DESC']
            ]
         });
        } else {
            // items = await models.Map.findAll({
            //      where: { ownerUser: req.user.id },
            //      include: [ { model: models.User, as: 'OwnerUser' }]
            // ,order:[ 
            //     ['updatedAt','DESC']
            //     //['id', 'DESC']
            // ]
            // });
             items = await models.Map.findAll({ 
            //where: { ownerUser: req.user.id },
               include: [ { model: models.User, as: 'OwnerUser',
                    attributes: ['userName','id','firstName','lastName','parent']}
                        ,{ model: models.Permission, as: 'Permissions'
                            ,include: [
                                {
                                    model: models.User, as: 'assignedToUser',
                                    required: false,
                                    where: {
                                        id:  req.user.id
                                    }
                                }          ,
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
                    return true;
                }
                if(v.OwnerUser && (v.OwnerUser.parent == req.user.id)){
                    return true;
                }
                if(v.Permissions && v.Permissions.length){
                    var hasPermission= v.Permissions.some((p)=>{
                        if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                return (p.permissionName=='Edit'|| p.permissionName=='View' );
                        }else
                        {
                            return false;
                        }
                    });
                    return (hasPermission);
                }
                return false;
            });
            items=filteredItems;
        }
        res.render('map/maps', {
            title: 'Maps',
            items: items
        });
    };

    /**
     * GET /map/:id
     */
    module.mapGet = async function (req, res) {
        var item,err;
        var userHasViewPermission=false;
        var userHasEditPermission=false;
        var userIsOwnerOfMap=false;
        var grantViewPermissionToAllUsers=false;
        var usersWhoCanViewMap=[];
        var groupsWhoCanViewMap=[];
        var format;
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if(req.path.startsWith("/api/")){
            format='json';
        }
        if (false && req.params.id && req.params.id == '-1') {
            var newMap = await models.Map.create({
                name: 'Untitled',
                description: '',
                keywords:'',
                ownerUser: (req.user.id)
            });
            [err, item] = await util.call(models.Map.findOne({
                where: {
                    [Op.and]: {
                        id: { [Op.eq]: newMap.id },
                        ownerUser: { [Op.eq]:  req.user.id },
                    }
                },include: [ { model: models.User, as: 'OwnerUser' ,attributes: ['userName','id','firstName','lastName','parent']}] 
            }));
            if (!item) {
                req.flash('error', {
                    msg: 'Faild to create new map!'
                });
                return res.redirect('/');
               
            }

            /* Redirect to open new Map*/

            return res.redirect('/map/' + item.id);
        }else if (req.params.id && (req.params.id == '-1' || req.params.id === 'preview'|| req.params.id === 'temp')) {
            var layer;
            var preview=[];
            if(req.query.layers){
                var layerIds=req.query.layers.split(',');
                if(layerIds && layerIds.length){
                    for(var i=0;i< layerIds.length;i++){
                        layer=null;
                        [err, layer] = await util.call(models.DataLayer.findByPk(layerIds[i],{
                                           include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );
                        if(layer){
                            var layerJson= layer.toJSON();
                            layerJson.dataRelationships= await dataRelationshipController._getDataset_DataRelationships(layer.id,true);
                            preview.push(layerJson);
                        }
                    }
                }
            }
            var options;
            if(req.query.options){
                try{
                options= JSON.parse(req.query.options);
                }catch(ex){}
            }
            userHasEditPermission=true;
            userHasViewPermission=true;
            userIsOwnerOfMap=true;
            item={
                id:-1,
                
                preview:preview,
                options:options
            }
        }
         else if (req.params.id)
        {
            
            if (res.locals.identity.isAdministrator) {
                [err, item] = await util.call(models.Map.findByPk(req.params.id,{include: [ { model: models.User, as: 'OwnerUser' ,attributes: ['userName','id','firstName','lastName','parent']}]} ));
                if(item){
                    userHasEditPermission=true;
                    userHasViewPermission=true;
                    userIsOwnerOfMap=true;
                }
            }else{
                [err, item] = await util.call(models.Map.findOne({
                    where: {
                        [Op.and]: {
                           id: { [Op.eq]: req.params.id }
                           //,
                           // ownerUser: { [Op.eq]:  req.user.id },
                        }
                    },include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent'] }] 
                }));
                if(item){
                    if(item.ownerUser!==req.user.id){
                        if(item.OwnerUser && item.OwnerUser.parent===req.user.id){
                        }else{
                            item=null;
                        }
                    }
                }
                if(!item){
                   [err, item] = await util.call(models.Map.findOne({
                       where: { id: req.params.id },
                       include: [ 
                                 { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent'] }
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
                            ]
                    }));
                    if(item){// get permission
                        var permissions =item.Permissions;
                        if(permissions){
                            userHasViewPermission= permissions.some((p)=>{
                                if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                    return (p.permissionName=='Edit'|| p.permissionName=='View' );
                                }else return false;
                            });
                            userHasEditPermission= permissions.some((p)=>{
                                if((p.grantToType=='user' && p.assignedToUser) || (p.grantToType=='group' && p.assignedToGroup)){
                                    return (p.permissionName=='Edit' );
                                }else return false;
                            });
                        }
                    }
                }else{
                    userHasEditPermission=true;
                    userHasViewPermission=true;
                    userIsOwnerOfMap=true;
                }
            }
            if(item){// get AllUserPermission
                var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                var permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'Map',
                            contentId: item.id,
                            grantToType: 'group',
                            grantToId: allUsers.id
                        }
                    }); 
                if(permissions){
                    grantViewPermissionToAllUsers= permissions.some((p)=>{
                        return (p.permissionName=='Edit'|| p.permissionName=='View' );
                    });
                }
                //#region groupsWhoCanViewMap
                 permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'Map',
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
                                groupsWhoCanViewMap.push(
                                    {
                                        id:p.assignedToGroup.id,
                                        name:p.assignedToGroup.name,
                                        type:p.assignedToGroup.type,
                                        description:p.assignedToGroup.description,
                                        ownerUser:p.assignedToGroup.ownerUser
                                    }
                                )
                            }
                        }
                    }
                    //#endregion
                     //#region usersWhoCanViewMap
                 permissions =await models.Permission.findAll(
                    {
                        where:
                        {
                            contentType: 'Map',
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
                                usersWhoCanViewMap.push(
                                    {
                                        id:p.assignedToUser.id,
                                        userName:p.assignedToUser.userName
                                    }
                                )
                            }
                        }
                    }
                    //#endregion
            
            }
            if (!item) {
               
                if(format=='json'){
                    return res.json({
                        status:false,
                        message:'Map not found!'
                    })
                }else{
                    req.flash('error', {
                        msg: 'Map not found!'
                    });
                    return res.redirect('/');
              }
            }
        }else
        {
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Map not found!'
                })
            }else{
                req.flash('error', {
                    msg: 'Map not found!'
                });
                return res.redirect('/');
            }
        }

       // item.thumbnail=undefined;
        if(item.thumbnail){
            try{
                  const data = await sharp(item.thumbnail)
                          .png()
                          .toBuffer();
              item.thumbnail   = 'data:image/png;base64,' + data.toString('base64');
            }catch(ex){}
        }
        var mapTitle=''
        if(item.name){
            mapTitle='-'+item.name;
        }
        if(!userHasViewPermission){
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Map not found!'
                })
            }else{
                req.flash('error', {
                    msg: 'Map not found!'
                });
                return res.redirect('/');
            }
        }
        if(format=='json'){
            return res.json({
                status:true,
                title: 'Map'+mapTitle,
                map:item,
                userHasViewPermission:userHasViewPermission,
                userHasEditPermission:userHasEditPermission,
                userIsOwnerOfMap:userIsOwnerOfMap,
                grantViewPermissionToAllUsers:grantViewPermissionToAllUsers,
                usersWhoCanViewMap:usersWhoCanViewMap,
                groupsWhoCanViewMap:groupsWhoCanViewMap

            })
        }else{
        res.render('map/map', {
            title: 'Map'+mapTitle,
            map:item,
            userHasViewPermission:userHasViewPermission,
            userHasEditPermission:userHasEditPermission,
            userIsOwnerOfMap:userIsOwnerOfMap,
            grantViewPermissionToAllUsers:grantViewPermissionToAllUsers,
            usersWhoCanViewMap:usersWhoCanViewMap,
            groupsWhoCanViewMap:groupsWhoCanViewMap

        });
        }
    };
    /**
     * POST /map/:id
    */
    module.mapPost = async function (req, res) {
     
        var result={
            status:false
        };
        req.assert('name', 'Map name cannot be blank').notEmpty();
        
        req.sanitizeBody('name').trim();
        req.sanitizeBody('name').escape();
        req.sanitizeBody('description').trim();
        req.sanitizeBody('description').escape();
        req.sanitizeBody('keywords').trim();
        req.sanitizeBody('keywords').escape();
        req.sanitizeBody('ext_north').toFloat();
        req.sanitizeBody('ext_east').toFloat();
        req.sanitizeBody('ext_south').toFloat();
        req.sanitizeBody('ext_west').toFloat();

        req.sanitizeBody('updatedAt').toInt();
        req.body.grantViewPermissionToAllUsers = ('grantViewPermissionToAllUsers' in req.body) ? true : false;
        
        var mapId = req.params.id || -1;
        try {
            mapId = parseInt(mapId);
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
            result.message= errors;
            return res.json(result) ;
        }
        if(mapId!==-1){
            var testMap = await models.Map.findOne({
                where: {
                    id: mapId
                }
            });
            if(!testMap){
                mapId=-1;
            }
        }
        var owner = req.user;
        if (mapId == -1) {
            try {
                var newMap = await models.Map.create({
                    name: req.body.name,
                    description: req.body.description,
                    keywords: req.body.keywords,
                    'ext_north': req.body.ext_north,
                    'ext_east': req.body.ext_east,
                    'ext_south': req.body.ext_south,
                    'ext_west': req.body.ext_west,
                    'details':req.body.details,
                    ownerUser: (owner ? owner.id : 0)
                });
                var map= newMap;
                if(map ){
                    //clear all group permissions
                //     try{
                //         await models.Permission.destroy(
                //        {
                //             where: {
                //                  contentType: 'Map',
                //                  contentId: map.id,
                //                  permissionName: 'View',
                //                  grantToType: 'group'
                //                  //, grantToId: ?
                //                 }
                             
                //        });
                //    }catch(ex){}
                       if(req.body.groupsWhoCanViewMap && req.body.groupsWhoCanViewMap.length){
                           for(var i=0;i<req.body.groupsWhoCanViewMap.length;i++){
                               try{
                                   var map_grantViewViewToGroup = await models.Permission.create(
                                       {
                                           contentType: 'Map',
                                           contentId: map.id,
                                           permissionName: 'View',
                                           grantToType: 'group',
                                           grantToId: req.body.groupsWhoCanViewMap[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                    var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                    if(allUsers){
                        if(req.body.grantViewPermissionToAllUsers){
                            // try{
                            //     var tryDeletePrevPermissions = await models.Permission.destroy(
                            //         {
                            //             where: {
                            //                 contentType: 'Map',
                            //                 contentId: map.id,
                            //                 permissionName: 'View',
                            //                 grantToType: 'group',
                            //                 grantToId: allUsers.id
                            //                 }
                                        
                            //         });
                            // }catch(ex){}
                            var map_shareViewWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'Map',
                                    contentId: map.id,
                                    permissionName: 'View',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareViewWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'Map',
                                          contentId: map.id,
                                          permissionName: 'View',
                                          grantToType: 'group',
                                          grantToId: allUsers.id
                                         }
                                      
                                });
                               
                        }
                    }

                    //clear all user permissions
                    // try{
                    //      await models.Permission.destroy(
                    //     {
                    //          where: {
                    //               contentType: 'Map',
                    //               contentId: map.id,
                    //               permissionName: 'View',
                    //               grantToType: 'user'
                    //               //, grantToId: ?
                    //              }
                              
                    //     });
                    // }catch(ex){}
                        if(req.body.usersWhoCanViewMap && req.body.usersWhoCanViewMap.length){
                            for(var i=0;i<req.body.usersWhoCanViewMap.length;i++){
                                try{
                                    var map_grantViewViewToUser = await models.Permission.create(
                                        {
                                            contentType: 'Map',
                                            contentId: map.id,
                                            permissionName: 'View',
                                            grantToType: 'user',
                                            grantToId: req.body.usersWhoCanViewMap[i],
                                            insertedByUserId: req.user.id
                                        });
                                }catch(ex){}
                            }
                        }

                }
                result.status=true;
                result.id=newMap.id;
                result.message='New map saved';
                return res.json(result) ;
            } catch (ex) {
                result.status=false;
                if (ex && ex.errors) {
                    result.message= ex.errors;
                }
                return res.json(result) ;
            }
        }else{
            try {
                var map = await models.Map.findOne({
                    where: {
                        id: mapId
                    },
                    include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]
                });
                if (!map || !owner  ) {
                    result.status=false;
                    result.message= 'Map not found';
                    return res.json(result) ;
                }
                
                //todo: permission check
                var isOwner=false;
               if(map.ownerUser== req.user.id) {
                   isOwner=true;
               }else if (map.OwnerUser && map.OwnerUser.parent==req.user.id){
                   isOwner=true;
               }
              if(!isOwner && !res.locals.identity.isAdministrator  )
                {
                    var userHasEditPermission=false;
                    var err,item;
                    [err, item] = await util.call(models.Map.findOne({
                        where: {  id: mapId },
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
                        map=item;
                    }
                     
                    if(!userHasEditPermission){
                        result.status=false;
                        result.message= 'Access denied';
                        return res.json(result) ;
                    }
                }
               
                
                map.set('name', req.body.name);
                map.set('description', req.body.description);
                map.set('keywords', req.body.keywords);
                map.set('ext_north', req.body.ext_north);
                map.set('ext_east', req.body.ext_east);
                map.set('ext_south', req.body.ext_south);
                map.set('ext_west', req.body.ext_west);
                map.set('details',req.body.details);
               
                await map.save();
                if(map.ownerUser===req.user.id || res.locals.identity.isAdministrator ){
                    //clear all group permissions
                    try{
                        await models.Permission.destroy(
                       {
                            where: {
                                 contentType: 'Map',
                                 contentId: map.id,
                                 permissionName: 'View',
                                 grantToType: 'group'
                                 //, grantToId: ?
                                }
                             
                       });
                   }catch(ex){}
                       if(req.body.groupsWhoCanViewMap && req.body.groupsWhoCanViewMap.length){
                           for(var i=0;i<req.body.groupsWhoCanViewMap.length;i++){
                               try{
                                   var map_grantViewViewToGroup = await models.Permission.create(
                                       {
                                           contentType: 'Map',
                                           contentId: map.id,
                                           permissionName: 'View',
                                           grantToType: 'group',
                                           grantToId: req.body.groupsWhoCanViewMap[i],
                                           insertedByUserId: req.user.id
                                       });
                               }catch(ex){}
                           }
                       }
                    var [, allUsers] = await util.call(models.Group.findOne({ where: { name: 'users' } }));
                    if(allUsers){
                        if(req.body.grantViewPermissionToAllUsers){
                            try{
                                var tryDeletePrevPermissions = await models.Permission.destroy(
                                    {
                                        where: {
                                            contentType: 'Map',
                                            contentId: map.id,
                                            permissionName: 'View',
                                            grantToType: 'group',
                                            grantToId: allUsers.id
                                            }
                                        
                                    });
                            }catch(ex){}
                            var map_shareViewWithAllUsers = await models.Permission.create(
                                {
                                    contentType: 'Map',
                                    contentId: map.id,
                                    permissionName: 'View',
                                    grantToType: 'group',
                                    grantToId: allUsers.id,
                                    insertedByUserId: req.user.id
                                }); 
                        }else{
                            var map_shareViewWithAllUsers = await models.Permission.destroy(
                                {
                                     where: {
                                          contentType: 'Map',
                                          contentId: map.id,
                                          permissionName: 'View',
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
                                  contentType: 'Map',
                                  contentId: map.id,
                                  permissionName: 'View',
                                  grantToType: 'user'
                                  //, grantToId: ?
                                 }
                              
                        });
                    }catch(ex){}
                        if(req.body.usersWhoCanViewMap && req.body.usersWhoCanViewMap.length){
                            for(var i=0;i<req.body.usersWhoCanViewMap.length;i++){
                                try{
                                    var map_grantViewViewToUser = await models.Permission.create(
                                        {
                                            contentType: 'Map',
                                            contentId: map.id,
                                            permissionName: 'View',
                                            grantToType: 'user',
                                            grantToId: req.body.usersWhoCanViewMap[i],
                                            insertedByUserId: req.user.id
                                        });
                                }catch(ex){}
                            }
                        }

                }
                result.status=true;
                result.id= map.id;
                return res.json(result) ;
            } catch (ex) {
                result.status=false;
                if (ex && ex.errors) {
                    result.errors= ex.errors;
                    result.message= ex.message;
                }
                return res.json(result) ;
            }

            
        } 
       
    };
     /**
     * DELETE /map/:id/delete
     */
    module.mapDelete = async function (req, res, next) {
        var map;
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        if(req.path.startsWith("/api/")){
            format='json';
        }
        if (req.params.id && req.params.id != '-1') {
            try {
                // map = await models.Map.findOne({
                //     where: {
                //         id: req.params.id
                //     }
                // });

                 map = await models.Map.findOne({
                    where: {
                        id: req.params.id
                    },
                    include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]
                });

            } catch (ex) {
                var ee = 1;
            }
        }
        if (!map) {
            
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Map not found!'
                })
            }else{
                req.flash('error', {
                    msg: 'Map not found!'
                });
                return res.redirect('/');
            }
        }
        
        
        // if (map.ownerUser !== req.user.id) {
        //     req.flash('error', { msg: `Access denied.` });
        //     return res.redirect('/maps');
            
        // }
        
        var isOwner=false;
        if(map.ownerUser== req.user.id) {
            isOwner=true;
        }else if (map.OwnerUser && map.OwnerUser.parent==req.user.id){
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
                return res.redirect('/maps');
            }
        }

        try {
            await map.destroy();
        } catch (ex) {
            if(format=='json'){
                return res.json({
                    status:false,
                    message:'Failed to delete map!'
                })
            }else{
                req.flash('error', {
                    msg: 'Failed to delete map!'
                });
                return res.redirect('/maps');
            }
        }

        try{
        var tryDeletePermissions = await models.Permission.destroy(
            {
                 where: {
                      contentType: 'Map',
                      contentId:  req.params.id
                     }
            });
        }catch(ex){}
        if(format=='json'){
            return res.json({
                status:true,
                message:'Map has been permanently deleted.'
            })
        }else{    
            req.flash('info', {
                msg: `Map has been permanently deleted.`
            });
    
            res.redirect('/maps');
         }

    };
/**
     * GET /map/:id/thumbnail
     */
    module.thumbnailGet = async function (req, res, next) {
        var item,err;
        if (req.params.id && req.params.id != '-1') {
          [err, item] = await util.call(models.Map.findByPk(req.params.id) );
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
     * POST /map/:id/thumbnail
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
         var err,map;
         var mapId=req.params.id;
         [err, map] = await util.call(models.Map.findOne({
            where: {
                id: mapId
            },
            include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]
         }) );
         
         if (!map) {
           

             result.status=false;
             result.message= 'Map not found!';
            return res.json(result) ;
         }
         var isOwner=false;
               if(map.ownerUser== req.user.id) {
                   isOwner=true;
               }else if (map.OwnerUser && map.OwnerUser.parent==req.user.id){
                   isOwner=true;
               }
         if(!isOwner && !res.locals.identity.isAdministrator  )
         {
             var userHasEditPermission=false;
             var err,item;
             [err, item] = await util.call(models.Map.findOne({
                 where: {  id: mapId },
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
                 map=item;
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
           
            map.set('thumbnail', data);
                await map.save();
             
                result.status=true;
                result.message= undefined;
                return res.json(result) ;
         } catch (err) {
            result.status=false;
            result.message= 'Error in updating thumbnail image';
            return res.json(result) ;
         }
        
     };
    return module;
}