﻿const { Op } = require('sequelize');
var nodemailer = require('nodemailer');
var util = require('./util');
var models = require('../models/index');
const pg = require('pg');
const {
    Pool
} = require('pg');
const { filter } = require('compression');
module.exports = function (connectionSettings,adb_connectionSettings) {
    var module = {};
    var _pools;
    try{
        _pools = {
            'default': new Pool(connectionSettings)
        }
        _pools['adb']= new Pool(adb_connectionSettings)
        
    }catch(ex){}
    
    var getPool= function(key) {
        //todo: generate pools for each unique connection
        var pool=_pools[key];
        if(!pool){
            pool= _pools['default'];    
        }
        return pool;
    }
    module.getPgClient =async function( connection) {
        if (!connection)
            connection = 'default';
        var _pool = getPool(connection);

        if (_pool) {
            //  try {
            var client = await _pool.connect();
            return client;
            //  } catch (e) {
            //      var er = e;
            //  }
        }

        return undefined;
    }
    module.queryPgClient =async function(client,options) {
     

        if (client) {
            //  try {
            var result = await client.query(options);
            return result;
            //  } catch (e) {
            //      var er = e;
            //  }
        }

        return undefined;
    }
    module.query =async function(options, connection) {
        if (!connection)
            connection = 'default';
        var _pool = getPool(connection);

        if (_pool) {
            //  try {
            var result = await _pool.query(options);
            return result;
            //  } catch (e) {
            //      var er = e;
            //  }
        }

        return undefined;
    }

    /**
     * GET /gtm/tasks
     */
    module.tasksGet = async function (req, res) {
        var items;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        var queryTemplate = ` SELECT * 
            FROM   event_detection_task 
            ; `;
        try {
            var qResult = await module.query(queryTemplate);
            items = qResult.rows;
        } catch (ex) {
            //throw ex;
            req.flash('error', {
                msg: ex.message
            });
        }

        res.render('gtm/tasks', {
            title: 'Tasks',
            items: items||[]
        });
    };
    /**
     * GET /gtm/taskslist
     */
    module.taskslistGet = async function (req, res) {
        var items;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        var queryTemplate = ` SELECT * 
            FROM   event_detection_task  WHERE active = true
            ; `;
        try {
            var qResult = await module.query(queryTemplate);
            items = qResult.rows;
        } catch (ex) {
            //throw ex;

        }

        return res.json(items);
    };
    
    

    /**
     * GET /gtm/task/:id
     */
    module.taskGet = async function (req, res) {
        var userIsPowerUser=(res.locals.identity.isAdministrator);
        var canEdit=userIsPowerUser;
        var error,access;
        if(!canEdit){
            [error, access] = await util.call(req.user.checkAccessAsync(models,{
                users: 'superadmin,admin', //or 👇
                role: 'administrators', //or 👇
                permissionName: 'Edit', contentType: 'GTM_Tasks'
            }));
            canEdit=access;
        }

        var pageTitle='Task';
        var viewPath='gtm/task' ;
        var parentPagePath='/gtm/tasks/' ;
        var readOnly= req.path.toLowerCase().endsWith('/view');
        var item,err;
        var task_id=req.params.id;
        try{
            task_id = parseInt(task_id);
        }catch(ex){}
        if (task_id && !isNaN(task_id) && task_id>-1 ) {
          
            try {
                //var qResult = await module.query(` SELECT *  FROM   event_detection_task WHERE task_id =${task_id} ; `);
                var qResult = await module.query({
                    text:` SELECT *  FROM   event_detection_task WHERE task_id =$1 ; `,
                    values:[task_id]
                });
                item = qResult.rows[0];
            } catch (ex) {
                //throw ex;
                err= ex;
            }

           
            if (!item) {
                req.flash('error', {
                    msg: 'Not found!'
                });
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            }
        }
       
        res.render(viewPath+ (readOnly?'_ro':'') , {
            title: pageTitle,
            item: item || {
                id: -1,task_id:-1,
                active:true
            },
            readOnly:readOnly,
            canEdit:canEdit
        });
       
    };

    /**
     * POST /gtm/task/:id
     */
    module.taskPost = async function (req, res) {
        const maxTasks=3;
        var pageTitle='Task';
        var viewPath='gtm/task' ;
        var pagePath='/gtm/task/' ;
        var parentPagePath='/gtm/tasks/' ;
        
        req.assert('task_name','Name is required').notEmpty();
        req.sanitizeBody('task_name').escape();
        req.sanitizeBody('desc').escape();
        req.sanitizeBody('lang_code').escape();
      

        req.sanitizeBody('min_x').toFloat();req.sanitizeBody('min_y').toFloat();req.sanitizeBody('max_x').toFloat();req.sanitizeBody('max_y').toFloat();
        
        req.sanitizeBody('updatedAt').toInt();
        req.sanitizeBody('interval_min').toInt();
        req.sanitizeBody('look_back_hrs').toInt();
        req.body.active = ('active' in req.body) ? true : false;

        var itemId = req.params.id || -1;
        try {
            itemId = parseInt(itemId);
        } catch (ex) { }
        
        var errors = req.validationErrors();
        
        if (req.body.updatedAt) {
            try {
                req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
            } catch (ex) {
            }
        }

      


        var model={
            task_id: itemId,
            task_name: req.body.task_name,
            desc: req.body.desc,
            interval_min: req.body.interval_min,
            look_back_hrs:req.body.look_back_hrs,
            min_x:req.body.min_x,min_y:req.body.min_y,max_x:req.body.max_x,max_y:req.body.max_y,
            active:req.body.active,
            lang_code:req.body.lang_code
        }
        if (errors) {
            
            req.flash('error', errors);
            res.render(viewPath, {
                title: pageTitle,
                item: model
            });
            return;
        }
      
       
        if (itemId == -1) {
            try {
                delete model.task_id;
                var columns=[];
                var valueClause = [];
                var values=[];
                for(var key in model){
                    columns.push('"'+key+'"');
                    values.push(model[key]);
                    valueClause.push('$'+ values.length);
                }
                var isDuplicated;
                try {
                   

                    var qResult = await module.query({
                        text:` SELECT *  FROM   event_detection_task WHERE task_name = $1 ; `,
                        values:[model.task_name]
                        });
                    isDuplicated = qResult.rows.length;
                    if(isDuplicated){
                        req.flash('error', {
                            msg: 'Task name already exists!'
                        });
                        
                        model.task_id=itemId;
                        res.render(viewPath, {
                            title: pageTitle,
                            item: model
                        });
                        return;
                    }
                    

                } catch (ex) {
                    
                }

                var insertQuery = {
                    text: `INSERT INTO public.event_detection_task(
                         ${columns.join(',')}
                        )
                        VALUES (` + valueClause.join(', ') + `) RETURNING task_id ;`,
                    values: values,
                }
                var newItem,createdId;
                var client= await module.getPgClient();
                try {
                    await client.query('BEGIN');
                    var result = await module.queryPgClient(client,insertQuery);
                    if (result) {
                        
                    }
                    if(result.rows && result.rows.length){
                        createdId= result.rows[0]['task_id'];
                    }

                    var qResult = await module.queryPgClient(client,{
                        text:` SELECT count(*) n  FROM   event_detection_task WHERE active = true ; `,
                        values:[]
                        });
                    if(qResult.rows && qResult.rows[0]['n']> maxTasks){
                        throw new Error('Maximum active task count reached');

                    }else{
                        await client.query('COMMIT');
                    }

                } catch (ex) {
                    await client.query('ROLLBACK')
                    throw ex;
                }finally {
                    client.release()
                }

                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                    msg: 'New task saved successfully'
                    
                });
                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(newUser);
                    //} else {
                    //}
                } catch (ex) { }
                
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            } catch (ex) {
                if (ex && ex.errors) {
                    req.flash('error', {
                        msg: 'Failed to save'
                        
                    });
                } else
                    req.flash('error', {
                        msg: 'Error: '+ ex.message
                       
                    });
                    
                    model.task_id=itemId;
                    res.render(viewPath, {
                        title: pageTitle,
                        item: model
                    });
                return;
            }
        } else {
            try {
                var item;
                //item = await models.Bird.findOne({where: {id: itemId}});
                try {
                    //var qResult = await module.query(` SELECT *  FROM   event_detection_task WHERE task_id = ${itemId} ; `);
                    var qResult = await module.query({
                        text:` SELECT *  FROM   event_detection_task WHERE task_id = $1 ; `,
                        values:[itemId]
                    });
                    item = qResult.rows[0];
                } catch (ex) {
                    //throw ex;
                   // err= ex;
                }
    

                if (!item) {
                    req.flash('error', {
                       msg: 'Item not found!'
                    });
                    await util.saveSession(req);
                    return res.redirect(pagePath + itemId);
                }
               
                var isDuplicated;
                var client= await module.getPgClient();
                try {
                    
              
                    var qResult = await module.query({
                        text:` SELECT *  FROM   event_detection_task WHERE task_id <> $1 ANd task_name = $2 ; `,
                        values:[itemId,model.task_name]});
                    isDuplicated = qResult.rows.length;
                    if(isDuplicated){
                        req.flash('error', {
                            msg: 'Task name already exists!'
                        });
                        
                        model.task_id=itemId;
                        res.render(viewPath, {
                            title: pageTitle,
                            item: model
                        });
                        return;
                    }
                    
                } catch (ex) {
                    
                }

                if (req.body.updatedAt && item.updatedAt &&  item.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                       msg: 'Information has been edited by another user. Please refresh the page and try again.'
                    });
                   
                    res.render(viewPath , {
                        title: pageTitle,
                        item: model
                    });
                        return;
                }
               
                var columns=[];
                var valueClause = [];
                var values=[];
                for(var key in model){
                    if(key=='task_id'){
                        continue;
                    }
                    
                    values.push(model[key]);
                    valueClause.push('"' + key + '"=($' + values.length + ')');
                }
               var  updateQuery = {
                    text: `UPDATE  public.event_detection_task SET
                             ${valueClause.join(',')}
                            WHERE  task_id= ${itemId} ;`,
                    values: values,
                }

                try {
                    await client.query('BEGIN');
                    var result = await module.queryPgClient(client ,updateQuery);
                    if (result) {
                       // n += result.rowCount;
                    }
                    var qResult = await module.queryPgClient(client,{
                        text:` SELECT count(*) n  FROM   event_detection_task WHERE active = true ; `,
                        values:[]
                        });
                    if(qResult.rows && qResult.rows[0]['n']> maxTasks){
                        throw new Error('Maximum active task count reached');

                    }else{
                        await client.query('COMMIT');
                    }

                } catch (ex) {
                    await client.query('ROLLBACK')
                    throw ex;
                }finally {
                    client.release()
                }

    

               
                req.flash('notify', {
                    type:'success',
                    msg: 'Changes successfully saved!',
                   
                    notify:true,
                    delay:3000
                });
                
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            } catch (err) {
                    var detail='';
                    if(err.original && err.original.detail){
                        detail =err.original.detail;
                    }
                    req.flash('error', {
                         msg: 'Error in updating  infos! '+ err.message
                        
                    });
                

                    res.render(viewPath , {
                        title: pageTitle,
                        item: model
                    });
                return;
            }

        }
    };

    
    /**
     * DELETE /gtm/task/:id/delete
     */
    module.deleteTaskDelete = async function (req, res, next) {
        var pagePath='/gtm/task/';
        var parentPagePath='/gtm/tasks/';

        var item;
        var itemId;
     
        if (req.params.id && req.params.id != '-1') {
            itemId= req.params.id;
            try {
                //var qResult = await module.query(` SELECT *  FROM   event_detection_task WHERE task_id = ${itemId} ; `);
                var qResult = await module.query({
                    text:` SELECT *  FROM   event_detection_task WHERE task_id = $1 ; `,
                    values:[itemId]});
                item = qResult.rows[0];
            } catch (ex) {
                //throw ex;
               // err= ex;
            }

            if (!item) {
                req.flash('error', {
                  msg: 'Item not found or can not be deleted!'
                });
                await util.saveSession(req);
                return res.redirect(pagePath + itemId);
            }
        }
        
      
        try {
            var deleteQuery = {
                text: `DELETE FROM public.event_detection_task   WHERE  task_id= $1;`, 
                values: [itemId],
            }
             var result = await module.query(deleteQuery);
                if (result) {
                    status=true;  
                }
            
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete item!'
              
            });
            await util.saveSession(req);
            return res.redirect(pagePath + itemId);
        }
       
        req.flash('info', {
            msg: `Item has been permanently deleted.`
        });
        await util.saveSession(req);
        res.redirect(parentPagePath);
       
        

    };
    
    /**
     * GET /gtm/geojson
     */
    module.geojsonGet = async function (req, res, next) {
       
        var item,err;
        var bbox= req.query.bbox;
        var task_id=req.query.task_id;
        var settings= req.query.settings;
        
        var format='geojson';
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
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
        if (task_id) {
             var srid=4326;
             var filter= settings.filter || {};
            
           
             //var whereExpressions=`WHERE task_id = ${task_id}`;
             var whereExpressions='';
             var Expressions=[]
             var values=[]
             if(filter.topicWords && filter.topicWords.length){
                 var exprs=[];
                 for(var i=0;i< filter.topicWords.length;i++){
                    //exprs.push(`topic_words LIKE '%${filter.topicWords[i]}%'`);
                    
                    values.push(`%${filter.topicWords[i]}%`);
                    exprs.push(`topic_words LIKE $`+ (values.length));
                 }
                 var exprs_= exprs.join(' AND ');
                 Expressions.push('(' + exprs_+')');
             }
            if(filter.date_time_min){
                values.push(filter.date_time_min);
                //Expressions.push(`(date_time_max >= '${filter.date_time_min}' OR (date_time_max IS NULL ))`);// include event that began before before filter but not ended yet
                Expressions.push(`(date_time_max >= $${values.length} OR (date_time_max IS NULL ))`);// include event that began before before filter but not ended yet

            }
            if(filter.date_time_max){
                values.push(filter.date_time_max);
                //Expressions.push(`(date_time_min <= '${filter.date_time_max}')`);
                Expressions.push(`(date_time_min <= $${values.length})`);
            }
             if(bbox){
               
             }
             try{
                 var rows;
                 if(Expressions.length){
                    whereExpressions= ' WHERE '+ Expressions.join(' AND ');
                 }
                try {
                    //var qResult = await module.query(` SELECT *  FROM   cluster  ${whereExpressions} ; `);
                    var qResult = await module.query({text:` SELECT *  FROM   cluster   ${whereExpressions} ; `,values:values});
                    rows = qResult.rows;
                } catch (ex) {
                    //throw ex;
                   // err= ex;
                }
                    
                if (format=='xlsx' || format=='csv'){
                    

                }else{
                    var result={type:'FeatureCollection',features:[]}; 
                    for(var n=0,r=0;rows && r <rows.length;r++,n++)
                    {
                        var row= rows[r];
                        if(n>100){
                            n=0;
                            await util.setImmediatePromise();
                        }
                        var ymin=row['latitude_min'],ymax=row['latitude_max'],xmin=row['longitude_min'],xmax=row['longitude_max'];
                        ymin=parseFloat(ymin);ymax=parseFloat(ymax);xmin=parseFloat(xmin);xmax=parseFloat(xmax);
                        var feature={type:'Feature',id:row['id'],properties:{
                            'task_id': row['task_id'],
                            'task_name':row['task_name'],
                            'topic':row['topic'],
                            'topic_words':row['topic_words'],
                            'date_time_min':row['date_time_min'],
                            'date_time_max':row['date_time_max']
                        },geometry: {
                            'type': 'Polygon',
                            'coordinates': [[[xmin,ymin],[xmax,ymin],[xmax,ymax],[xmin,ymax],[xmin,ymin]]]
                        },};
                        result.features.push(feature);
                    }

                    //return res.json(result);
                    res.header("Content-Type",'application/json');
                    res.send(JSON.stringify(result, null, 4));
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
     * GET /gtm/clusterPoints/:cluster_id
     */
    module.clusterPointsGet = async function (req, res, next) {
       
        var item,err;
       
        var cluster_id=req.params.cluster_id;
       
        try{
            cluster_id= parseInt(cluster_id);
        }catch(ex){}

        
        
        var format='geojson';
        if(req.query && 'format' in req.query){
            format=req.query.format;
        }
        
        if (cluster_id &&  cluster_id>0 && !isNaN(cluster_id) ) {
             var srid=4326;
            
             
             try{
                 var rows;
               
                try {
                    var qResult = await module.query({text:`SELECT id, cluster_id, longitude, latitude, text, date_time
                    --, user_id, tweet_id
                    FROM public.cluster_point
                    where cluster_id=$1; `,
                    values:[cluster_id]});
                    rows = qResult.rows;
                } catch (ex) {
                    //throw ex;
                   // err= ex;
                }
                    
                if (format=='xlsx' || format=='csv'){
                    

                }else{
                    var result={type:'FeatureCollection',features:[]}; 
                    for(var n=0,r=0;rows && r <rows.length;r++,n++)
                    {
                        var row= rows[r];
                        if(n>100){
                            n=0;
                            await util.setImmediatePromise();
                        }
                        var x=row['longitude'],y=row['latitude'];
                        x=parseFloat(x);y=parseFloat(y);
                        var feature={type:'Feature',id:row['id'],properties:{
                            'cluster_id': row['cluster_id'],
                            'text':row['text'],
                            'date_time':row['date_time']
                        },geometry: {
                            'type': 'Point',
                            'coordinates': [x,y]
                        },};
                        result.features.push(feature);
                    }

                    //return res.json(result);
                    res.header("Content-Type",'application/json');
                    res.send(JSON.stringify(result, null, 4));
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
     * GET /gtm/topicwords
     */
    module.topicwordsGet = async function (req, res) {
        var items;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        var queryTemplate = ` SELECT topic_words
        FROM public.cluster order by id desc limit 1000;
            ; `;
        try {
            var qResult = await module.query(queryTemplate);
            items = qResult.rows;
        } catch (ex) {
            //throw ex;

        }
        var keywordMap={};
        if(items && items.length){
            for(var i=0;i<items.length;i++){
                var topic_words= items[i]['topic_words'] || '';
                var keywords_= topic_words.split(/[ ,.،]+/);
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
        }
        var keywordArray = [];
        keywordArray = Object.keys(keywordMap).map(function (key) {
          return {
            text: key,
            total: keywordMap[key]
          };
        });
        keywordArray.sort(function (a, b) {
          return b.total - a.total;
        });
        return res.json(keywordArray);
    };

    /**
     * GET /gtm/events
     */
    module.eventsGet = async function (req, res) {
        var items;
        var isAdmin =(res.locals.identity.isAdministrator);
        var userId=req.user.id;
        //var items = await models.User.findAll({ where: { parent: req.user.id } });
        var queryTemplate;
        var values=[];
        if(isAdmin){
            queryTemplate = `SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
            FROM "GtmEvents"  
            INNER JOIN "Users"   
                ON ("GtmEvents"."ownerUser"  = "Users".id)
            ; `;
        }else{
            values.push(userId);
            queryTemplate = ` SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
            FROM "GtmEvents"  
            INNER JOIN "Users"   
                ON ("GtmEvents"."ownerUser"  = "Users".id)
             WHERE "GtmEvents"."ownerUser" =$1
            ; `;
            
        }
        
        try {
            var qResult = await module.query({text:queryTemplate,values:values},'adb');
            items = qResult.rows;
        } catch (ex) {
            //throw ex;
            console.log(ex);

        }

        res.render('gtm/events', {
            title: 'Events',
            items: items ||[]
        });
    };
      /**
     * GET /gtm/eventslist
     */
    module.eventslistGet = async function (req, res) {
        var items;
        var isAdmin =(res.locals.identity.isAdministrator);
       
        var userId=req.user.id;
        var queryTemplate;
        var values=[];
        if(isAdmin){
            queryTemplate = `SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
            FROM "GtmEvents"  
            INNER JOIN "Users"   
                ON ("GtmEvents"."ownerUser"  = "Users".id)
            ; `;
        }else{
            values.push(userId);
            queryTemplate = ` SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
            FROM "GtmEvents"  
            INNER JOIN "Users"   
                ON ("GtmEvents"."ownerUser"  = "Users".id)
             WHERE "GtmEvents"."ownerUser" =$1
            ; `;
            
        }
        
        try {
            var qResult = await module.query({text:queryTemplate,values:values},'adb');
            items = qResult.rows;
        } catch (ex) {
            //throw ex;
            console.log(ex);

        }

        return res.json(items);
    };
    
     /**
     * GET /gtm/event/:id
     */
    module.eventGet = async function (req, res) {
        var pageTitle='Event';
        var viewPath='gtm/event' ;
        var parentPagePath='/gtm/events/' ;
        var readOnly= req.path.toLowerCase().endsWith('/view');
        var canEdit=true;
        var item,err;
        if (req.params.id && req.params.id != '-1') {
          
            try {
                var qResult = await module.query({text:` SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
                FROM "GtmEvents"  
                INNER JOIN "Users"   
                    ON ("GtmEvents"."ownerUser"  = "Users".id)
                 WHERE "GtmEvents"."id" = $1 ; `,
                 values:[req.params.id]}
                 ,'adb');
                item = qResult.rows[0];
            } catch (ex) {
                //throw ex;
                err= ex;
            }

           
            if (!item) {
                req.flash('error', {
                    msg: 'Not found!'
                });
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            }
        }else{

           item={
                id: -1,
                userName:req.user.userName,
                name:req.query.name || '',
                latitude_min:req.query.latitude_min || undefined,
                latitude_max:req.query.latitude_max || undefined,
                longitude_min:req.query.longitude_min || undefined,
                longitude_max:req.query.longitude_max || undefined,
                topicwords:req.query.topicwords ||'',


                active:true
            } 
        }
       
        res.render(viewPath+ (readOnly?'_ro':'') , {
            title: pageTitle,
            item: item || {
                id: -1,
                userName:req.user.userName,
                active:true
            },
            readOnly:readOnly
            //,canEdit:canEdit
        });
       
    };
     /**
     * POST /gtm/event/:id
     */
    module.eventPost = async function (req, res) {
        const maxEvents=3;
        var pageTitle='Event';
        var viewPath='gtm/event' ;
        var pagePath='/gtm/event/' ;
        var parentPagePath='/gtm/events/' ;
        var isAdmin =(res.locals.identity.isAdministrator);
        var userId=req.user.id;
        req.assert('name','Name is required').notEmpty();
        req.sanitizeBody('name').escape();
        req.sanitizeBody('topicwords').escape();
        
      

        req.sanitizeBody('latitude_min').toFloat();req.sanitizeBody('latitude_max').toFloat();req.sanitizeBody('longitude_min').toFloat();req.sanitizeBody('longitude_max').toFloat();
        
        req.sanitizeBody('updatedAt').toInt();
  
        req.body.active = ('active' in req.body) ? true : false;

        var itemId = req.params.id || -1;
        try {
            itemId = parseInt(itemId);
        } catch (ex) { }
        
        var errors = req.validationErrors();
        
        if (req.body.updatedAt) {
            try {
                req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
            } catch (ex) {
            }
        }

      


        var model={
            id: itemId,
            name: req.body.name,
            topicwords: req.body.topicwords,
            latitude_min:req.body.latitude_min,latitude_max:req.body.latitude_max,longitude_min:req.body.longitude_min,longitude_max:req.body.longitude_max,
            active:req.body.active
        }
        if (errors) {
            
            req.flash('error', errors);
            res.render(viewPath, {
                title: pageTitle,
                item: model
            });
            return;
        }
        
       
        if (itemId == -1) {
            try {
                delete model.id;
                model.ownerUser= req.user.id;
                model.createdAt= new Date();
                model.updatedAt= new Date();
                var columns=[];
                var valueClause = [];
                var values=[];
                for(var key in model){
                    columns.push('"'+key+'"');
                    values.push(model[key]);
                    valueClause.push('$'+ values.length);
                }
                var isDuplicated;
                try {
                    var qResult = await module.query({
                        text:` SELECT *  FROM   "GtmEvents" WHERE name = $1 AND "ownerUser" = $2 ; `,
                        values:[model.name,model.ownerUser]},'adb');
                    isDuplicated = qResult.rows.length;
                    if(isDuplicated){
                        req.flash('error', {
                            msg: 'Name already exists!'
                        });
                        
                        model.id=itemId;
                        res.render(viewPath, {
                            title: pageTitle,
                            item: model
                        });
                        return;
                    }
                    
                } catch (ex) {
                    
                }

                var insertQuery = {
                    text: `INSERT INTO public."GtmEvents"(
                         ${columns.join(',')}
                        )
                        VALUES (` + valueClause.join(', ') + `) RETURNING id ;`,
                    values: values,
                }
                var newItem,createdId;
                var client= await module.getPgClient('adb');
                try {
                    await client.query('BEGIN');
                    var result = await module.queryPgClient(client,insertQuery);
                    if (result) {
                        
                    }
                    if(result.rows && result.rows.length){
                        createdId= result.rows[0]['id'];
                    }
                    var qResult = await module.queryPgClient(client,{
                        text:` SELECT count(*) n  FROM   public."GtmEvents" WHERE active = true AND "ownerUser" = $1 ; `,
                        values:[model.ownerUser]
                        });
                    if(qResult.rows && qResult.rows[0]['n']> maxEvents){
                        throw new Error('Maximum active event count reached');

                    }else{
                        await client.query('COMMIT');
                    }
                } catch (ex) {
                    await client.query('ROLLBACK')
                    throw ex;
                }finally {
                    client.release()
                }

                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                    msg: 'New event saved successfully'
                    
                });
                try {
                    //if (req.body.isAdministrator) {
                    //    administrators.addUser(newUser);
                    //} else {
                    //}
                } catch (ex) { }
                
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            } catch (ex) {
                if (ex && ex.errors) {
                    req.flash('error', {
                        msg: 'Failed to save'
                        
                    });
                } else
                    req.flash('error', {
                        msg: 'Error: '+ ex.message
                       
                    });
                    
                    model.id=itemId;
                    res.render(viewPath, {
                        title: pageTitle,
                        item: model
                    });
                return;
            }
        } else {
            try {
                var item;
                //item = await models.Bird.findOne({where: {id: itemId}});
                try {
                    var qResult;
                    if(isAdmin){
                         qResult = await module.query({text:` SELECT *  FROM   "GtmEvents" WHERE id = $1 ; `,values:[itemId]},'adb');
                    }else{
                         qResult = await module.query({text:` SELECT *  FROM   "GtmEvents" WHERE id = $1 AND ownerUser = $2 ; `,values:[itemId,userId]},'adb');
                    }
                    if(qResult && qResult.rows && qResult.rows.length){
                        item = qResult.rows[0];
                    }
                } catch (ex) {
                    //throw ex;
                   // err= ex;
                }
    

                if (!item) {
                    req.flash('error', {
                       msg: 'Item not found!'
                    });
                    await util.saveSession(req);
                    return res.redirect(pagePath + itemId);
                }
               var ownerUser= item.ownerUser;
                var isDuplicated;
                try {
                    var qResult = await module.query({
                        text:` SELECT *  FROM   "GtmEvents" WHERE id <> $1 ANd name = $2 AND "ownerUser" = $3 ; `,
                        values:[itemId,model.name,ownerUser]},'adb');
                    isDuplicated = qResult.rows.length;
                    if(isDuplicated){
                        req.flash('error', {
                            msg: 'Name already exists!'
                        });
                        
                        model.id=itemId;
                        res.render(viewPath, {
                            title: pageTitle,
                            item: model
                        });
                        return;
                    }
                    
                } catch (ex) {
                    
                }

                if (req.body.updatedAt && item.updatedAt &&  item.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                       msg: 'Information has been edited by another user. Please refresh the page and try again.'
                    });
                   
                    res.render(viewPath , {
                        title: pageTitle,
                        item: model
                    });
                        return;
                }
               model.updatedAt= new Date();
                var columns=[];
                var valueClause = [];
                var values=[];
                for(var key in model){
                    if(key=='id'){
                        continue;
                    }
                    
                    values.push(model[key]);
                    valueClause.push('"' + key + '"=($' + values.length + ')');
                }
               var  updateQuery = {
                    text: `UPDATE  public."GtmEvents" SET
                             ${valueClause.join(',')}
                            WHERE  id= ${itemId} ;`,
                    values: values,
                }
                var client= await module.getPgClient('adb');
                try {
                    var result = await module.queryPgClient(client,updateQuery);
                    if (result) {
                       // n += result.rowCount;
                    }
                    var qResult = await module.queryPgClient(client,{
                        text:` SELECT count(*) n  FROM   public."GtmEvents" WHERE active = true AND "ownerUser" = $1 ; `,
                        values:[ownerUser]
                        });
                    if(qResult.rows && qResult.rows[0]['n']> maxEvents){
                        throw new Error('Maximum active event count reached');

                    }else{
                        await client.query('COMMIT');
                    }
                } catch (ex) {
                    await client.query('ROLLBACK')
                    throw ex;
                }finally {
                    client.release()
                }

    

               
                req.flash('notify', {
                    type:'success',
                    msg: 'Changes successfully saved!',
                   
                    notify:true,
                    delay:3000
                });
                
                await util.saveSession(req);
                return res.redirect(parentPagePath);
            } catch (err) {
                    var detail='';
                    if(err.original && err.original.detail){
                        detail =err.original.detail;
                    }
                    req.flash('error', {
                         msg: 'Error in updating  infos! '+ err.message
                        
                    });
                

                    res.render(viewPath , {
                        title: pageTitle,
                        item: model
                    });
                return;
            }

        }
    };
 /**
     * DELETE /gtm/event/:id/delete
     */
    module.deleteEventDelete = async function (req, res, next) {
        var pagePath='/gtm/event/';
        var parentPagePath='/gtm/events/';
        var isAdmin =(res.locals.identity.isAdministrator);
        var userId=req.user.id;
        var item;
        var itemId;
     
        if (req.params.id && req.params.id != '-1') {
            itemId= req.params.id;
            try {
                var qResult;
                if(isAdmin){
                     qResult = await module.query({text:` SELECT *  FROM   "GtmEvents" WHERE id = $1 ; `,values:[itemId]},'adb');
                }else{
                     qResult = await module.query({text:` SELECT *  FROM   "GtmEvents" WHERE id = $1 AND ownerUser = $2 ; `,values:[itemId,userId]},'adb');
                }
                if(qResult && qResult.rows && qResult.rows.length){
                    item = qResult.rows[0];
                }
                
            } catch (ex) {
                //throw ex;
               // err= ex;
            }

            if (!item) {
                req.flash('error', {
                  msg: 'Item not found or can not be deleted!'
                });
                await util.saveSession(req);
                return res.redirect(pagePath + itemId);
            }
        }
        
      
        try {
            var deleteQuery = {
                text: `DELETE FROM "GtmEvents"   WHERE  id= $1;`, 
                values: [itemId],
            }
             var result = await module.query(deleteQuery,'adb');
                if (result) {
                    status=true;  
                }
            
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete item!'
              
            });
            await util.saveSession(req);
            return res.redirect(pagePath + itemId);
        }
       
        req.flash('info', {
            msg: `Item has been permanently deleted.`
        });
        await util.saveSession(req);
        res.redirect(parentPagePath);
       
        

    };
    module.checkAndProcessEvents= async function(){
        
        
        var currentTime= new Date();
        var lastCheck= this._checkAndProcessEvents_lastCheck;
        if(!lastCheck){
            lastCheck= new Date(currentTime);
           // lastCheck.setHours(lastCheck.getHours()-4*24);// search last hour events
           lastCheck.setHours(lastCheck.getHours()-1);// search last hour events
        }
        //this._checkAndProcessEvents_lastCheck= currentTime;
        lastCheck= lastCheck.toISOString();
        var items;   
        try {
            var qResult = await module.query({text: ` SELECT "GtmEvents".*, "Users"."userName","Users"."email","Users"."firstName","Users"."lastName"
            FROM "GtmEvents"  
            INNER JOIN "Users"   
                ON ("GtmEvents"."ownerUser"  = "Users".id)
            WHERE "GtmEvents"."active" = true AND NOT "email" IS NULL
            ; `,values:[]},'adb');
            items = qResult.rows;
        } catch (ex) {
            //throw ex;
        }
        if(!(items && items.length)){
            return;
        }
        for(var i=0;i< items.length;i++){
            var item= items[i];
            var eventId=item['id'];
            var mapId= item['mapId'];
            var email=item['email'];
            var event_name=item['name'];
            var userName=item['userName'];
            var firstName= item['firstName'];
            var lastName=item['lastName'];



            var minx= item['longitude_min'];
            var maxx= item['longitude_max']
            var miny= item['latitude_min'];
            var maxy= item['latitude_max']
            var topicwords_=item['topicwords']||'';
            var topicwords=topicwords_.split(/[ ,.،]+/);
             if(topicwords.length <3){
                 continue;
             }
            var values=[maxx,minx,maxy,miny,lastCheck];
            var topicwords_exprs=[];
            for(var t=0;t< topicwords.length;t++){
               values.push(`%${topicwords[t]}%`);
               topicwords_exprs.push(`topic_words LIKE $`+ (values.length));
            }
            var topicwords_expr= topicwords_exprs.join(' AND ');
         

            var whereExpressions=` NOT ( longitude_min > $1
                OR longitude_max < $2
                OR latitude_min > $3
                OR latitude_max < $4
                ) 
                AND date_time_max > $5
                AND (${topicwords_expr})
                `;

               var rows=undefined;
               try {
                   //var qResult = await module.query(` SELECT *  FROM   cluster  ${whereExpressions} ; `);
                   var qResult = await module.query({text:` SELECT *  FROM   cluster  WHERE  ${whereExpressions} ; `,values:values});
                   rows = qResult.rows;
               } catch (ex) {
                   //throw ex;
                  // err= ex;
               }
               if(!(rows && rows.length)){
                continue;
               }
               var transporter = nodemailer.createTransport({
                    service: process.env.EMAIL_SENDER_SERVICE,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_SENDER_USERNAME,
                        pass: process.env.EMAIL_SENDER_PASSWORD
                    },
                    tls: {
                        rejectUnauthorized: false//https://github.com/nodemailer/nodemailer/issues/406
                    }
                 });
                var message=`${rows.length} new clustered area${rows.length>1?'s':''} ${rows.length>1?'are':'is'} detected since ${lastCheck}.`;
                if(mapId) {
                    message+= '\n\n View map at '+process.env.APP_HOST + '/map/' + mapId + '\n\n';    
                }else{
                   
                    var options={
                        mapbbox:[minx,miny,maxx,maxy],
                        layerType:'GTM',
                        

                        name:event_name,
                        filter:{
                            topicWords:topicwords,
                            date_time_min:lastCheck
                        }
                    }
                    message+= '\n\n View map at '+process.env.APP_HOST + '/map/preview?options=' + encodeURIComponent(JSON.stringify(options)) + '\n\n';    
                }
                message+= '\n\n To view/edit notification details visit '+process.env.APP_HOST + '/gtm/event/' + eventId + '\n\n';
                var mailOptions = {
                    to: email,
                    //from: process.env.SUPPORT_EMAIL,
                    from:process.env.EMAIL_SENDER_USERNAME,
                    subject: '⚠ New area detected - ' + process.env.SITE_NAME,
                    text:message
                };
           
                try {
                    await transporter.sendMail(mailOptions);
                    
                } catch (ex) {
                    console.log(ex);
                }
        }

    }
    return module;
}