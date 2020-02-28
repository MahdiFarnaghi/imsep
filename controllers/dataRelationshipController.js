const  Sequelize  = require('sequelize');
const { Op } = require('sequelize');

var util = require('./util');
//var datasetController=require('./datasetController')();

//const nativeUtil = require('util');

var models = require('../models/index');
//const format = require('string-format');

module.exports = function (postgresWorkspace) {
    var module = {};
      /**
     * GET /dataRelationships
     */
    module.allDataRelationshipsGet = async function (req, res) {
        var items = await module._getFilteredDataRelationships();
        return res.json(items);
    };
    module._getFilteredDataRelationships = async function (where) {
        var items;
        items = await models.DataRelationship.findAll({
            where:where
            // order:[ 
            //        ['name']
            //     ]   
            } );
           
        return items;
    };
    module._getDataset_Details = async function (datasetId) {
        var err,item;
        [err, item] = await util.call(models.DataLayer.findByPk(datasetId));
        if(!item){
            return null;
        }
        var details= item.details;
        
        try{
          details= JSON.parse( item.details);
          
        }catch(ex){}
        
        if(!details){
            details={}
        }

        return details;

    };
    module._getDataset_DataRelationships = async function (datasetId,toJSon) {
        var items = await module._getFilteredDataRelationships({
            [Op.or]:[
                {
                    originDatasetId:datasetId
                },
                {
                    destinationDatasetId:datasetId
                }
            ]
        });
        if(items && items.length){
            for(var r=0;r<items.length;r++){
                if(toJSon && items[r].toJSON){
                    items[r]= items[r].toJSON();
                }
                var originDatasetDetails= await module._getDataset_Details(items[r].originDatasetId);
                items[r].originDatasetDetails=originDatasetDetails;
                
                if(originDatasetDetails){
                  //  items[r].origFields=originDatasetDetails.fields;
                  //  items[r].origDefaultField=originDatasetDetails.defaultField;

                }else{
                    items[r].originDatasetId=null;   
                }
                var destinationDatasetDetails= await module._getDataset_Details(items[r].destinationDatasetId);
                items[r].destinationDatasetDetails=destinationDatasetDetails;
                if(destinationDatasetDetails){
                 //   items[r].destFields=destinationDatasetDetails.fields;
                  //  items[r].destDefaultField=destinationDatasetDetails.defaultField;
                }else{
                    items[r].destinationDatasetId=null;
                }
                
                if(items[r].originDatasetId==datasetId){
                    items[r]._isOrigin=true;
                }
                if(items[r].destinationDatasetId==datasetId){
                    items[r]._isDestination=true;
                }
            }
        }
        return items;
    };
     /**
     * GET /datarelationship/relations
     */
    module.relations = async function (req, res) {
        var items = await module._getFilteredDataRelationships();
        
        res.render('datarelationship/relations', {
            title: 'Relations',
            items: items
        });
    };
     /**
     * GET /datarelationship/:id
     */
    module.get = async function (req, res) {
        var item,err;
        
        if (req.params.id && req.params.id != '-1') {
                [err, item] = await util.call(models.DataRelationship.findOne({
                where: {
                  
                    id: req.params.id
                }
                })
                );
                if (!item) {
                    req.flash('error', {
                        msg: 'Relationship not found!'
                    });
                    return res.redirect('/datarelationship/relations');
                }
       }
       
        res.render('datarelationship/relation', {
            title: 'Relation',
            item: item || {
                id: -1
            }
            
        });
    };

    
     /**
     * POST /datarelationship/:id
     */
    module.post = async function (req, res) {
        var pageTitle='Relation';
        var viewPath='datarelationship/relation' ;
        var pagePath='/datarelationship/' ;
        var parentPagePath='/datarelationship/relations/' ;
        req.assert('name', 'Group name cannot be blank').notEmpty();
        req.sanitizeBody('name').escape();
        req.assert('originDatasetId', 'OriginDatasetId cannot be blank').notEmpty();
        req.sanitizeBody('originDatasetId').escape();
        req.assert('destinationDatasetId', 'DestinationDatasetId cannot be blank').notEmpty();
        req.sanitizeBody('destinationDatasetId').escape();
        req.sanitizeBody('backwardLabel').escape();
        req.sanitizeBody('forwardLabel').escape();
        req.sanitizeBody('originPrimaryKey').escape();
        req.sanitizeBody('originForeignKey').escape();
        req.sanitizeBody('destinationPrimaryKey').escape();
        req.sanitizeBody('destinationForeignKey').escape();


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
            description: req.body.description,
            name: req.body.name,
            originDatasetId: req.body.originDatasetId,
            backwardLabel: req.body.backwardLabel,
            destinationDatasetId: req.body.destinationDatasetId,
            forwardLabel: req.body.forwardLabel,
            cardinality: req.body.cardinality,
            relationDatasetId: req.body.relationDatasetId? req.body.relationDatasetId:null,
            originPrimaryKey: req.body.originPrimaryKey,
            originForeignKey: req.body.originForeignKey,
            destinationPrimaryKey: req.body.destinationPrimaryKey,
            destinationForeignKey: req.body.destinationForeignKey
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
                var newItem = await models.DataRelationship.create(model);
               
                req.flash('notify', {
                    type:'success',
                    notify:true,
                    delay:3000,
                    msg:'Changes saved successfully'
                    //msg: (req.i18n_texts['ChangesSuccessfully'])
                });
                try {
                    
                } catch (ex) { }
               
                return res.redirect(parentPagePath);
            } catch (ex) {
                if (ex && ex.errors) {
                    req.flash('error', {
                        msg: 'Already exists!'
                       //msg: (req.i18n_texts['AlreadyExists'] )
                    });
                } else
                    req.flash('error', {
                       msg: 'Unknow error!'
                      // msg: (req.i18n_texts['UnknowError'] )
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
                item = await models.DataRelationship.findOne({where: {id: itemId}});
                

                if (!item) {
                    req.flash('error', {
                        msg: 'Item not found!'
                       // msg: (req.i18n_texts['NotFound'] )
                    });

                    return res.redirect(pagePath + itemId);
                }
               
                if (req.body.updatedAt && item.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                    req.flash('error', {
                       msg: 'Information has been edited by another user. Please refresh the page and try again.'
                    });
                   
                    res.render(viewPath , {
                        title: pageTitle,
                        item: model
                    });
                        return;
                }
               
                for(key in model){
                    item.set(key,model[key]);
                }
               
                await item.save();

                req.flash('notify', {
                    type:'success',
                    msg:'Changes saved successfully',
                    //msg: (req.i18n_texts['ChangesSuccessfully']),
                    notify:true,
                    delay:3000
                });
                return res.redirect(parentPagePath);
            } catch (err) {
               
                var detail='';
                if(err.original && err.original.detail){
                    detail =err.original.detail;
                }
                req.flash('error', {
                     msg: 'Error in updating  infos!'
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
     * DELETE /datarelationship/:id/delete
     */
    module.delete = async function (req, res, next) {
        var pagePath='/datarelationship/';
        var parentPagePath='/datarelationship/relations/';

        var item;
        var itemId;
     
        if (req.params.id && req.params.id != '-1') {
            itemId= req.params.id;
            item = await models.DataRelationship.findOne({where: {id: itemId}});

            if (!item) {
                req.flash('error', {
                    msg: 'Item not found or can not be deleted!'
                    //msg: (req.i18n_texts['NotFound'] )
                });

                return res.redirect(pagePath + itemId);
            }
        }
        
        
        try {
            await item.destroy();
        } catch (ex) {
            req.flash('error', {
                msg: 'Failed to delete item!'
           
            });
            return res.redirect(pagePath + itemId);
        }

        req.flash('info', {
            msg: `Item has been permanently deleted.`
           
        });

        res.redirect(parentPagePath);

    };
    return module;
}