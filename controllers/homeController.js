const { Op } = require('sequelize');
var models = require('../models/index');
var util = require('./util');
var sharp= require('sharp');
var request = require('request');
module.exports = function () {
    var module = {};

    /**
 * GET /
 */
module.index = async function(req, res) {

  // getMap list
  var items;
  if (res.locals.identity.isAdministrator) {
      items = await models.Map.findAll( { limit:7,
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
  } else if ( req.user && req.user.id) {
      
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
  }else  {
      
    items = await models.Map.findAll({
   //where: { ownerUser: req.user.id },
      include: [ { model: models.User, as: 'OwnerUser',
           attributes: ['userName','id','firstName','lastName','parent']}
               ,{ model: models.Permission, as: 'Permissions'
                   ,include: [
                     
                       {
                           model: models.Group, as: 'assignedToGroup',
                           required: true,
                           where: {
                            name:  'users'
                           }
                           
                       }
                   ]
                   }
           ],
               
   order:[     ['updatedAt','DESC'] ]
   });
   var filteredItems = items.filter((v) => {
       if(v.Permissions && v.Permissions.length){
           var hasPermission= v.Permissions.some((p)=>{
               return (p.permissionName=='Edit'|| p.permissionName=='View' );
           });
           return (hasPermission);
       }
       return false;
   });
   items=filteredItems;
  }
  var maps=items;
   // get data list
   items=null;
   if (res.locals.identity.isAdministrator) {
     
    items = await models.DataLayer.findAll( {limit:7,
      include: [ {
         model: models.User, as: 'OwnerUser',
         attributes: ['userName','id','firstName','lastName','parent'] 
        }],
      order:[     ['updatedAt','DESC'] ]                        
              });

   } else if ( req.user && req.user.id) {
       
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

   }else  {
       
     items = await models.DataLayer.findAll({
    //where: { ownerUser: req.user.id },
       include: [ { model: models.User, as: 'OwnerUser',
            attributes: ['userName','id','firstName','lastName','parent']}
                ,{ model: models.Permission, as: 'Permissions'
                    ,include: [
                      
                        {
                            model: models.Group, as: 'assignedToGroup',
                            required: true,
                            where: {
                             name:  'users'
                            }
                            
                        }
                    ]
                    }
            ],
                
    order:[     ['updatedAt','DESC'] ]
    });
    var filteredItems = items.filter((v) => {
        if(v.Permissions && v.Permissions.length){
            var hasPermission= v.Permissions.some((p)=>{
                return (p.permissionName=='Edit'|| p.permissionName=='View' );
            });
            return (hasPermission);
        }
        return false;
    });
    items=filteredItems;
   }
 
   layers=items;

    res.render('home', {
        title: 'Home',
        maps:maps,
        layers:layers
  });
};
  
   /**
 * GET /
 */
module.help = async function(req, res) {
    
    var fs = require('fs');
    var content = fs.readFileSync( global.__basedir +'/public/help.htm').toString();
  
      res.render('help', {
          title: 'Help',
          content:content
    });
  };
  /**
     * GET /proxy
     */
    module.proxyGet =  function (req, res) {
  //     var targetBaseUrl = req.query.url;
  // var spl= req.url.split('url=');
  // var target= spl[1];
  // target = target.replace(targetBaseUrl +'&' ,targetBaseUrl+'?');
  var target = req.query.url;
  
  var first=true;
  for(var key in req.query){
      if(key !=='url'){
        if(first){
          target +='?'+ key +'='+ req.query[key];
        }else
          target +='&'+ key +'='+ req.query[key];
        first=false;
    }
  }
      // var test = {
      //   proxy: /^\/proxy\/(.+)$/,
      //   hosts: /^https?:\/\/((geotrigger|www)\.)?arcgis\.com\//
      // };
    
      // var matchProxy = url.match(test.proxy);
    
      // if (!matchProxy) {
      //   return notFound(res);
      // }
    
      var headers = req.headers;
      var method = req.method;
    
      
    
      // if (!headers['content-type']) {
      //   if (matchProxy[1].match(/geotrigger\.arcgis\.com\//)) {
      //     headers['content-type'] = 'application/json';
      //   } else {
      //     headers['content-type'] = 'application/x-www-form-urlencoded';
      //   }
      // }
    
      delete headers.host;
    
      // req.pipe(request({
      //   url: target,
      //   headers: headers,
      //   method: method
      // }).on('error', function(err) {
      //     console.log(err)
      //   })
      // ).pipe(res);
      req.pipe(request(target)
      .on('response', function(response) {
        if(response.statusCode != 200){
        //  console.log(response.statusCode) // 
          //console.log(response.headers['content-type']) // 'image/png'
        }
      })
      .on('error', function(err) {
            console.log(err)
          })
        ).pipe(res);
  }
  
  /**
       * POST /proxy
       */
      module.proxyPost =  function (req, res) {
    //     var targetBaseUrl = req.query.url;
    // var spl= req.url.split('url=');
    // var target= spl[1];
    // target = target.replace(targetBaseUrl +'&' ,targetBaseUrl+'?');
       
  var target = req.query.url;
      
  var first=true;
  for(var key in req.query){
      if(key !=='url'){
        if(first){
          target +='?'+ key +'='+ req.query[key];
        }else
          target +='&'+ key +'='+ req.query[key];
        first=false;
    }
  }
        var headers = req.headers;
        var method = req.method;
      
      
        delete headers.host;
      
        req.pipe(request(target)
        .on('response', function(response) {
          if(response.statusCode != 200){
            console.log(response.statusCode) // 
            //console.log(response.headers['content-type']) // 'image/png'
          }
        })
        .on('error', function(err) {
              console.log(err)
            })
          ).pipe(res);
    }
    
    return module;
}




