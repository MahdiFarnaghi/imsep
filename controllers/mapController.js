const { Op } = require('sequelize');
var models = require('../models/index');
var util = require('./util');
var sharp= require('sharp');

module.exports = function () {
    var module = {};

    /**
     * GET /maps
     */
    module.mapsGet = async function (req, res) {
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
                        [err, layer] = await util.call(models.DataLayer.findById(layerIds[i],{
                                           include: [ { model: models.User, as: 'OwnerUser',attributes: ['userName','id','firstName','lastName','parent']}]}) );
                        if(layer)
                            preview.push(layer);
                    }
                }
            }
            userHasEditPermission=true;
            userHasViewPermission=true;
            userIsOwnerOfMap=true;
            item={
                id:-1,
                
                preview:preview
            }
        }
         else if (req.params.id)
        {
            
            if (res.locals.identity.isAdministrator) {
                [err, item] = await util.call(models.Map.findById(req.params.id,{include: [ { model: models.User, as: 'OwnerUser' ,attributes: ['userName','id','firstName','lastName','parent']}]} ));
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
                req.flash('error', {
                    msg: 'Map not found!'
                });
                return res.redirect('/');
            }
        }else
        {
            req.flash('error', {
                msg: 'Map not found!'
            });
            return res.redirect('/');
        }

        item.thumbnail=undefined;
        var mapTitle=''
        if(item.name){
            mapTitle='-'+item.name;
        }
        if(!userHasViewPermission){
            req.flash('error', {
                msg: 'Map not found!'
            });
            return res.redirect('/');
        }
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
            req.flash('error', {
                msg: 'Map not found!'
            });
            return res.redirect('/');
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
            req.flash('error', { msg: `Access denied.` });
            return res.redirect('/maps');
        }

        try {
            await map.destroy();
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete map!'
            });
            return res.redirect('/maps');
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
        req.flash('info', {
            msg: `Map has been permanently deleted.`
        });

        res.redirect('/maps');

    };
/**
     * GET /map/:id/thumbnail
     */
    module.thumbnailGet = async function (req, res, next) {
        var item,err;
        if (req.params.id && req.params.id != '-1') {
          [err, item] = await util.call(models.Map.findById(req.params.id) );
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