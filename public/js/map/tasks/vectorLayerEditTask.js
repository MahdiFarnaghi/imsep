function VectorLayerEditTask(app, mapContainer, layer, options) {
    this._name='VectorLayerEditTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.options = options || {};
    this.hasEditPermission= this.options.hasEditPermission;
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
    this.trackGPS=false;
    
    
}
VectorLayerEditTask.prototype.getName = function () {
    return this._name;
}
VectorLayerEditTask.prototype.init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var map = this.mapContainer.map;
    var mapContainer = this.mapContainer;
    if(app.controller){
        self.mapController=app.controller.controllers['Map'];
    }

    var vector = this.layer;//.getSource();
    var source = vector.getSource();
    var shapeType = '';
    var oidField = 'gid';
    var oid = -1;
    if (!source)
        return;

    shapeType = source.get('shapeType');
    var details = source.get('details');
    if (details) {
        oidField = details.oidField
    }
    var sourceFormat = source.getFormat();
    var formatGML= source.get('formatGML');
    self.interaction = undefined; //common draw interaction
    var dirty = {};
    self.dirty=dirty;

    var addCurrentGpsPositionToDrawing=function (skipDuplicate,tolerance) {
        if(!self.interaction){
            return;
        }
        
        var coords=app.geolocationTasks.getPosition();
        if(!coords){
            //app.controller.notify('LocationNotAvailable',{
            $.notify({
                message: "Location is not available"
            },{
                type:'danger',
                z_index:50000,
                delay:1000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
            return;
        }
        if(skipDuplicate){
            if(self._lastGpsCoords){
                var dist= Math.sqrt((self._lastGpsCoords[0] - coords[0])*(self._lastGpsCoords[0] - coords[0])+(self._lastGpsCoords[1] - coords[1])*(self._lastGpsCoords[1] - coords[1]) );
                tolerance=tolerance || 0.1;
                if(dist<=tolerance){
                    return;
                }
            }
        }
        if(self.interaction && self.interaction.type_=='Point'){
            self._lastGpsCoords=coords;
            var pointFeature= new ol.Feature();
            
            pointFeature.setGeometry( new ol.geom.Point(coords) )
            self.transactFeature('insert', pointFeature);
        }else if (self.interaction &&  self.interaction.addToDrawing_){
            self._lastGpsCoords=coords;
           // self.interaction.shouldHandle_=true;
            //self.interaction.handleUpEvent({coordinate:coords,stopPropagation:function(){}}) 
            try{
            if(!self.interaction.sketchFeature_){
                self.interaction.startDrawing_({coordinate:coords,stopPropagation:function(){}}) 
            }else{   
         
               // self.interaction.createOrUpdateSketchPoint_({coordinate:coords,stopPropagation:function(){}}) 
                self.interaction.addToDrawing_({coordinate:coords,stopPropagation:function(){}},true) 
                self.interaction.addToDrawing_({coordinate:coords,stopPropagation:function(){}},true) 
              //  self.interaction.updateSketchFeatures_();
            }
         }catch(ex){
             console.log(ex)
         }

        }
    }
  
    // map.on('mousedown', function(evt) {
    //     console.log(evt)
    //     self.tempEvt=evt;
    // });
    // map.on('pointerup', function(evt) {
    //     console.log(evt)
    // });
    self.on_change_position= function(evnetArgs) {
        if(app.geolocationTasks._tracking){
            if(self.trackGPS){
                addCurrentGpsPositionToDrawing(true,0.2);
            }
        }
    }
    
    app.registerEventhandler('change:position',self.on_change_position)
    
    var transactFeature = function (mode, f,options) {
        options=options ||{};
        if(sourceFormat instanceof ol.format.GeoJSON){
            var geoJsonFeature;
            var action = 'insert';
            var projectFrom = map.getView().getProjection().getCode();
            switch (mode) {
                case 'add':
                case 'insert':
                    action = 'insert';
                    geoJsonFeature = sourceFormat.writeFeatureObject(f, { featureProjection: projectFrom });
                    break;
                case 'update':
                    action = 'update';
                    geoJsonFeature = sourceFormat.writeFeatureObject(f, { featureProjection: projectFrom });
                    break;
                case 'delete':
                    action = 'delete';
                    geoJsonFeature = sourceFormat.writeFeatureObject(f, { featureProjection: projectFrom });
                    break;
            }
            // if(geoJsonFeature && geoJsonFeature.properties){
            //     oid=geoJsonFeature.properties[oidField];
            //     if(!oid)
            //         oid=-1;
            // }
            oid = f.getId();
            if (!oid){
                oid = -1;
            }
           // source.refresh();
           // source.clear();
           
            var url = source.getUrl() + '/' + oid;
            var request = {
                action: action,
                geoJSON: geoJsonFeature
            }
            if(options.onCommit){
                options.onCommit(request);
            } 
            $.ajax(url, {
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                timeout: 30000,
                cache: false,
                data: JSON.stringify(request),
                success: function (data) {
                    if (data) {
                        if(data.status){
                            if(options.onSuccess){
                                options.onSuccess(data);
                            }       
                            return;
                        }
                    }
                    
                            var msg='Error';
                            if(data && data.message){
                                msg= data.message;
                            }
                            if(options.onFailed){
                                options.onFailed(undefined, msg, undefined);
                            }
                            $.notify({
                                message: "Failed to apply changes, "+ msg
                            },{
                                type:'danger',
                                z_index:50000,
                                delay:5000,
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                }
                            });
                        
                },
                error: function (xhr, textStatus, errorThrown) {
                   var msg=errorThrown;
                    if(xhr.responseJSON){
                        if(xhr.responseJSON.error){
                            msg=xhr.responseJSON.error;
                            errorThrown= msg;
                        }
                    }

                    if(options.onFailed){
                        options.onFailed(xhr, textStatus, errorThrown);
                    }
                    $.notify({
                        message: "Failed to apply changes, "+ msg
                    },{
                        type:'danger',
                        z_index:50000,
                        delay:5000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                }
            }).done(function () {
                source.refresh();
               // source.clear();
            
            });
        }else if(sourceFormat instanceof ol.format.WFS){
            var node;
            
            switch (mode) {
                case 'insert':
                    node = sourceFormat.writeTransaction([f], null, null, formatGML);
                    break;
                case 'update':
                    node = sourceFormat.writeTransaction(null, [f], null, formatGML);
                    break;
                case 'delete':
                    node = sourceFormat.writeTransaction(null, null, [f], formatGML);
                    break;
            }
            var xs = new XMLSerializer();
            var payload = xs.serializeToString(node);
            //var url=details.url;// '/proxy/?url=' +details.url;
            if(options.onCommit){
                options.onCommit(request);
            } 
            var url='/proxy/?url=' + encodeURIComponent(details.url);
            $.ajax(url, {
            
                type: 'POST',
                dataType: 'xml',
                processData: false,
                contentType: 'text/xml',
                data: payload,


                success: function (data) {
                    if (data) {
                        if(data.status){
                            if(options.onSuccess){
                                options.onSuccess(data);
                            }       
                            return;
                        }
                    }
                    
                            var msg='Error';
                            if(data && data.message){
                                msg= data.message;
                            }
                            if(options.onFailed){
                                options.onFailed(undefined, msg, undefined);
                            }
                            $.notify({
                                message: "Failed to apply changes, "+ msg
                            },{
                                type:'danger',
                                z_index:50000,
                                delay:5000,
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                }
                            });
                },
                error: function (xhr, textStatus, errorThrown) {
                    var msg=errorThrown;
                    if(xhr.responseJSON){
                        if(xhr.responseJSON.error){
                            msg=xhr.responseJSON.error;
                            errorThrown= msg;
                        }
                    }

                    if(options.onFailed){
                        options.onFailed(xhr, textStatus, errorThrown);
                    }
                    $.notify({
                        message: "Failed to apply changes, "+ msg
                    },{
                        type:'danger',
                        z_index:50000,
                        delay:5000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                   // source.clear();
                   source.refresh();
                }
            }).done(function() {
                //source.clear();
                source.refresh();
            });

        }
    };
    self.transactFeature=transactFeature;
    var defaultSelectionStyle= new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#FF2828',
            width:2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,100,100,0.2)'
        }),
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#FF2828'
            })
        })
    })
    self.interactionSelect = new ol.interaction.Select({
        hitTolerance:5,
        layers: [vector],
        style: function(f,r){
            return [
                defaultSelectionStyle
                ,
                new ol.style.Style({
                    image: new ol.style.RegularShape({ radius: 4, points:4, fill: new ol.style.Fill({ color: '#f00' }) }),
                    geometry: new ol.geom.MultiPoint([f.getGeometry().getFirstCoordinate(),f.getGeometry().getLastCoordinate()])
                  })
                ]
                ;
            // if(!vector.get('renderer')){
            //     return defaultSelectionStyle;
            // }
            //  var styleFunction= vector.get('renderer').findStyleFunction();
            //  var s;
            //  if(styleFunction){
            //      s= styleFunction(f,r);
            //  }
            //  if(!s){
            //     return defaultSelectionStyle;
            //  }
            //  s= s.clone();
            //  if(s.getStroke()){
            //     if(s.getStroke().setColor)
            //         s.getStroke().setColor('red');
            //     if(s.getStroke().setWidth && s.getStroke().getWidth){
            //         s.getStroke().setWidth(s.getStroke().getWidth()+2);
            //     } 
            // }  
            // return s;

        }
        
    });
    self.interactionSnap = new ol.interaction.Snap({
        source: vector.getSource(),
    });


    this._toolbar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });
    this.mainCtrl = new ol.control.Toggle({
        html: '<i class="glyphicon glyphicon-edit"></i>',
        className:'myOlbutton24',
        title: "Edit toolbar",
        bar:this._toolbar,
        _statusTip:'<i  class="status_tip_glyph glyphicon glyphicon-edit"></i> Edit tools:',
        onToggle: function (toggle) {
            if(toggle){
                var controls= self._toolbar.getControls();
                var control_index= controls.length-1;
                var showControlStatus= function(){
                    if(control_index>=0){
                        var control=controls[control_index];
                        if(control._statusTip){
                            mapContainer.showTopStatus(control._statusTip,3000,control.element,function(){
                                control_index--;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus(this._statusTip,2000,undefined,function(){
                       showControlStatus();
                });
            }else{
                mapContainer.showTopStatus('');
            }
            if(toggle){
              //  self.selectCtrl.setActive(true);
               // self.selectCtrl.raiseOnToggle();
               if(mapContainer.switcher && mapContainer.switcher.collapse){
                mapContainer.switcher.collapse();
               }
                if(mapContainer._registeredToolbars){
                    for(var ic=0;ic<mapContainer._registeredToolbars.length;ic++){
                        var otherCtrl=mapContainer._registeredToolbars[ic];
                        if(otherCtrl!== self.mainCtrl && otherCtrl.setActive){
                            otherCtrl.setActive(false);
                        }
                    }
                }
            }
        }
    });
    if(!mapContainer._registeredToolbars){
        mapContainer._registeredToolbars=[];
    }
    mapContainer._registeredToolbars.push(this.mainCtrl);
   // this.mapContainer.leftToolbar.addControl(this._toolbar);
   //this.mapContainer.leftToolbar.addControl(this.mainCtrl);
   //this.mapContainer.rightToolbar.addControl(this.mainCtrl);
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
  
   
 //#region deleteFeature
    var deleteFeature= new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="delete_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Delete selected features",
        handleClick: function () {
            mapContainer.showTopStatus('');
            var features = self.interactionSelect.getFeatures();
            //if (!features.getLength()) info("Select an object first...");
            // else info(features.getLength()+" object(s) deleted.");
            if (features.getLength()) {
               self.deleteFeatures(features);
            }else{
                //app.controller.notify('FirstSelectFeature',{
                    $.notify({
                    message: "First, select a feature!"
                },{
                    type:'info',
                    z_index:50000,
                    delay:2000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
                self.selectCtrl.setActive(true);
                self.selectCtrl.raiseOnToggle();
                if(self.lastSelectForDeleteHandler){
                    ol.Observable.unByKey(self.lastSelectForDeleteHandler);
                    self.lastSelectForDeleteHandler=null;
                }
                self.lastSelectForDeleteHandler= self.interactionSelect.getFeatures().once('add', function (e) {
                        var feature=e.element;
                        self.deleteFeatures(self.interactionSelect.getFeatures());

                });
            }
        }
    });
    deleteFeature._statusTip='<i class="status_tip_icon delete_24_Icon"></i>  '+ deleteFeature.get('title');
    this.deleteFeature=deleteFeature;
    this._toolbar.addControl(deleteFeature);
//#endregion    


//#region transformshape
var transformShape = new ol.control.Toggle({
    // html: '<span style="display:block;line-height:28px;background-position:center center" class="editVertexIcon" >&nbsp;</span>',
    html: '<i class="	glyphicon glyphicon-move" ></i>',
     className:'myOlbutton24',
     title: 'Move selected feature',
     onToggle: function (toggle) {
         if(toggle){
             mapContainer.showTopStatus('<i class="status_tip_glyph glyphicon  glyphicon-move" ></i> Move selected feature to new location',3000);
         }else{
             mapContainer.showTopStatus('');
         }
         self.removeInteraction(self.interaction);
         // self.interactionSelect.getFeatures().clear();
         self.removeInteraction(self.interactionSelect);
         if (!toggle) {
             self.mapContainer.setCurrentTool(null);
             self.mapContainer.setCurrentEditAction(undefined);
             return;
         }



         mapContainer.setCurrentTool({
             name: 'edit_transform',
             cursor:function(map,e){
                 // var c='url("/css/images/SelectArrow_32_cursor.png")1 1,auto';
                 // var pixel = map.getEventPixel(e.originalEvent);
                 // var hit = map.hasFeatureAtPixel(pixel,{
                 //     layerFilter: function(layer){
                 //         if(layer===self.layer)
                 //             return true;
                 //         else
                 //             return false;
                 //     }
                 //     });
                 //     if(hit){
                 //         c='url("/css/images/SelectArrow_bold_pencil_32_cursor.png")1 1,auto'; 
                 //     }
                 //     return c;
                 return '';
               },
             onActivate: function (event) {

             },
             onDeactivate: function (event) {
                 self.removeInteraction(self.interaction);
                 self.removeInteraction(self.interactionSnap);
                 self.mapContainer.setCurrentEditAction('');
                 self.removeInteraction(self.interactionSelect);
                 if (event.newTool && event.newTool.name !== '') {

                 }
                 transformShape.setActive(false);
             }
         });
         map.addInteraction(self.interactionSelect);
         self.interaction = new ol.interaction.Transform({
             features: self.interactionSelect.getFeatures(),
             addCondition: ol.events.condition.shiftKeyOnly,
             // filter: function(f,l) { return f.getGeometry().getType()==='Polygon'; },
             // layers: [vector],
             hitTolerance: 2,
             translateFeature: false,//$("#translateFeature").prop('checked'),
             scale:false,// $("#scale").prop('checked'),
             rotate:false,// $("#rotate").prop('checked'),
             keepAspectRatio:true,// $("#keepAspectRatio").prop('checked') ? ol.events.condition.always : undefined,
             translate:true,// $("#translate").prop('checked'),
             stretch:false// $("#stretch").prop('checked')
         });
         map.addInteraction(self.interaction);
         self.mapContainer.setCurrentEditAction('transform');
         map.addInteraction(self.interactionSnap);
        // dirty = {};
         for (var i = 0, f; f = self.interactionSelect.getFeatures().item(i); i++) {
             var feature=f;
            // self.interaction.getFeatures().push(f);
             feature.on('change', function (e) {
                 dirty[e.target.getId()] = true;
             });
         }
         self.interactionSelect.getFeatures().on('add', function (e) {
            // self.interaction.getFeatures().push(e.target);
             e.element.on('change', function (e) {
                 dirty[e.target.getId()] = true;
             });
         });
         self.interactionSelect.getFeatures().on('remove', function (e) {
             //self.interaction.getFeatures().push(e.target);
             var f = e.element;
             if (dirty[f.getId()]) {
                 delete dirty[f.getId()];
                 var featureProperties = f.getProperties();
                 delete featureProperties.boundedBy;
                 var clone = new ol.Feature(featureProperties);
                 clone.setId(f.getId());
                 transactFeature('update', clone);
             }
         });

         self.importSelectionFromSelectTask();

     }
 });
 transformShape._statusTip='<i class="status_tip_glyph glyphicon  glyphicon-move" ></i> '+ transformShape.get('title');
 this.transformShape = transformShape;

 this._toolbar.addControl(transformShape);
//#endregion



//#region editShape
    self.deleteShapeVertexButton=new ol.control.TextButton({
        className:'myOlbutton24',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteVertexIcon" >&nbsp;</span>',
        _statusTip:'<i  class="status_tip_icon deleteVertexIcon"></i>  Delete selected vertex',

        title: "Delete selected vertex",
        handleClick: function() {
            mapContainer.showTopStatus(this._statusTip,3000);
            if (self.interaction && self.interaction.removePoint){
                 self.interaction.removePoint();
                 //self.deleteShapeVertexButton.setVisible(false);
                 self.ShapeVertexBar.setVisible(false);
            }
        }
    });
    var ShapeVertexBar= new ol.control.Bar({
        controls: [self.deleteShapeVertexButton]
        
    });
    self.ShapeVertexBar=ShapeVertexBar;
    var editShape = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="editVertexIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Edit feature\'s vertices',
        onToggle: function (toggle) {
            if(toggle){
                var controls= this.getSubBar().getControls();
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus('<i class="status_tip_icon editVertexIcon"></i> Edit feature\'s vertices',2000,undefined,function(){
                       showControlStatus();
                });
                
            }else{
                mapContainer.showTopStatus('');
            }
            self.removeInteraction(self.interaction);
            // self.interactionSelect.getFeatures().clear();
            self.removeInteraction(self.interactionSelect);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }



            mapContainer.setCurrentTool({
                name: 'edit_edit',
                cursor:function(map,e){
                    var c='url("/css/images/SelectArrow_32_cursor.png")1 1,auto';
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hit = map.hasFeatureAtPixel(pixel,{
                        layerFilter: function(layer){
                            if(layer===self.layer)
                                return true;
                            else
                                return false;
                        }
                        });
                        if(hit){
                            c='url("/css/images/SelectArrow_bold_pencil_32_cursor.png")1 1,auto'; 
                        }
                        return c;
                  },
                onActivate: function (event) {

                },
                onDeactivate: function (event) {
                    self.removeInteraction(self.interaction);
                    self.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    self.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    editShape.setActive(false);
                }
            });
            map.addInteraction(self.interactionSelect);
            self.interaction = new ol.interaction.Modify({
                features: self.interactionSelect.getFeatures()
                // ,deleteCondition: function(event) {
                //     return ol.events.condition.shiftKeyOnly(event) &&
                //         ol.events.condition.singleClick(event);
                //   }
                ,condition: function(event){
                    if(self.interaction["lastPointerEvent_"] && self.interaction["vertexFeature_"]){
                        //this.removePointPopup.setPosition(this.modify["lastPointerEvent_"].coordinate);
                       
                      // self.deleteShapeVertexButton.setVisible(true);
                      self.ShapeVertexBar.setVisible(true);
                    }
                    else
                    {    
                     //   this.removePointPopup.setPosition(undefined);
                       
                        //self.deleteShapeVertexButton.setVisible(false);
                        self.ShapeVertexBar.setVisible(false);
                    }
                    return true;
                }
            });
            map.addInteraction(self.interaction);
            self.interaction.on('modifystart',function(e){
               // console.log('modifystart');
            }) ;
            self.interaction.on('modifyend',function(e){
              //  console.log('modifyend');
            }) ;
            self.mapContainer.setCurrentEditAction('edit');
            map.addInteraction(self.interactionSnap);
           // dirty = {};
            for (var i = 0, f; f = self.interactionSelect.getFeatures().item(i); i++) {
                var feature=f;
                feature.on('change', function (e) {
                    dirty[e.target.getId()] = true;
                });
            }
            self.interactionSelect.getFeatures().on('add', function (e) {
                e.element.on('change', function (e) {
                    dirty[e.target.getId()] = true;
                });
            });
            self.interactionSelect.getFeatures().on('remove', function (e) {
                var f = e.element;
                if (dirty[f.getId()]) {
                    delete dirty[f.getId()];
                    var featureProperties = f.getProperties();
                    delete featureProperties.boundedBy;
                    var clone = new ol.Feature(featureProperties);
                    clone.setId(f.getId());
                    transactFeature('update', clone);
                }
            });

            self.importSelectionFromSelectTask();

        },
        bar:ShapeVertexBar
    });
    editShape._statusTip='<i class="status_tip_icon editVertexIcon"></i>  '+ editShape.get('title');
    this.editShape = editShape;

    this._toolbar.addControl(editShape);
//#endregion


//#region editAttribute
var editAttribute=new ol.control.Button({
    html: '<span style="display:block;line-height:28px;background-position:center center" class="attributesWindow_24_Icon" >&nbsp;</span>',
    className:'myOlbutton24',
    title: "Edit selected feature\'s attributes",
    handleClick: function () {
        mapContainer.showTopStatus('');
        var features = self.interactionSelect.getFeatures();
        
        if (features.getLength()) {
            var feature=features.item(0);
            self.editFeatureAttributes(feature);

        }else{
            //app.controller.notify('FirstSelectFeature',{
                $.notify({
                message: "First, select a feature!"
            },{
                type:'info',
                z_index:50000,
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
            self.selectCtrl.setActive(true);
            self.selectCtrl.raiseOnToggle();
            if(self.lastSelectForEditHandler){
                ol.Observable.unByKey(self.lastSelectForEditHandler);
                self.lastSelectForEditHandler=null;
            }
            self.lastSelectForEditHandler=  self.interactionSelect.getFeatures().once('add', function (e) {
                    var feature=e.element;
                    self.editFeatureAttributes(feature);

            });
        }
    }
    });
    editAttribute._statusTip='<i class="status_tip_icon attributesWindow_24_Icon"></i>  '+ editAttribute.get('title');
this.editAttribute=editAttribute;
this._toolbar.addControl(editAttribute);
//#endregion

//#region selectCtrl
var sbar = new ol.control.Bar();
  sbar.addControl(new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        className:'myOlbutton24',
        title: "Clear selection",
        _statusTip:'<i  class="status_tip_glyph fa fa-times"></i> Clear selection',

        handleClick: function () {
            mapContainer.showTopStatus(this._statusTip,3000);
            self.interactionSelect.getFeatures().clear();
        }
    }
));

 this.selectCtrl = new ol.control.Toggle({
        //html: '<i class="glyphicon glyphicon-hand-up"></i>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="selectArrow_Bold_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Select feature to edit",
        onToggle: function (toggle) {
            if(toggle){
                var controls= this.getSubBar().getControls();
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus('<i class="status_tip_icon selectArrow_Bold_24_Icon"></i> Click features to select',3000,undefined,function(){
                       showControlStatus();
                });
                
            }else{
                mapContainer.showTopStatus('');
            }
            self.removeInteraction(self.interaction);

            //self.interactionSelect.getFeatures().clear();
            self.removeInteraction(self.interactionSelect);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                return;
            }
            mapContainer.setCurrentTool({
                name: 'edit_select',
                
                cursor:function(map,e){
                    var c='url("/css/images/SelectArrow_32_cursor.png")1 1,auto';
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hit = map.hasFeatureAtPixel(pixel,{
                        layerFilter: function(layer){
                            if(layer===self.layer)
                                return true;
                            else
                                return false;
                        }
                        });
                        if(hit){
                            c='url("/css/images/SelectArrow_bold_32_cursor.png")1 1,auto'; 
                        }
                        return c;
                  },
                //cursor:'url("/css/images/SelectArrow_32.png")9 7,auto',
                onActivate: function (event) {
                    self.mapContainer.setCurrentEditAction('select');
                    map.addInteraction(self.interactionSelect);
                    self.importSelectionFromSelectTask();
                },
                onDeactivate: function (event) {
                    self.removeInteraction(self.interaction);
                    self.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    self.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== 'edit_select') {
                        self.selectCtrl.setActive(false);
                    }
                    // self.selectCtrl.setActive(false);
                }
            });


        },

        bar: sbar
       
    });
    this.selectCtrl._statusTip='<i class="status_tip_icon selectArrow_Bold_24_Icon"></i>  '+ this.selectCtrl.get('title');
    this._toolbar.addControl(this.selectCtrl);
//#endregion

//#region addPointXY
    var addPointXY=new ol.control.Button({
        html: '<i class="	glyphicon glyphicon-map-marker" >xy</i>',
        className:'myOlbutton24',
        title: "Add point feature by lon/lat",
        handleClick: function () {
                mapContainer.showTopStatus('');
                self.addPointByXY();
    
        }
        });
        
        addPointXY._statusTip='<i class="status_tip_glyph glyphicon glyphicon-map-marker" ></i> '+ addPointXY.get('title');
        this.addPointXY=addPointXY;

    if (!shapeType || shapeType == 'Point') {
        this._toolbar.addControl(addPointXY);
    }
//#endregion     

//#region drawings    
    var drawPoint_addGPS=new ol.control.Button({
        className:'myOlbutton24',
        html: '<i style="font-size: 1.14em;" class=" glyphicon glyphicon-record"></i><i class="fa fa-plus draw_addFromGPS" ></i>',
        title: "Add GPS point",
        handleClick: function() { // Prevent null objects on finishDrawing

            mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-plus  " ></i> Add GPS point',3000);
            addCurrentGpsPositionToDrawing(false);
        }
    });
    drawPoint_addGPS._statusTip='<i class="status_tip_glyph fa fa-plus  " ></i> '+ drawPoint_addGPS.get('title');
    
    var drawPoint_TrackGPS=new ol.control.Toggle({
        className:'myOlbutton24',
        html: '<i style="" class=" glyphicon glyphicon-record"></i><i class="fa fa-lock draw_trackGPS" ></i>',
        title: "Track GPS points",
        onToggle: function (toggle) {
            if(toggle){
                mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-lock  " ></i> Track GPS points',3000);
           }else{
            mapContainer.showTopStatus('');
           }
            if (!toggle) {
                self.trackGPS=false;
                return;
            }
            self.trackGPS=true;
            addCurrentGpsPositionToDrawing(false);
        },
        active: self.trackGPS
    });
    drawPoint_TrackGPS._statusTip='<i class="status_tip_glyph fa fa-lock  " ></i> '+ drawPoint_TrackGPS.get('title');
    var drawPointGPS_bar=undefined;
    if(app.geolocationTasks){
        drawPointGPS_bar=  new ol.control.Bar({
            controls: [
                drawPoint_addGPS,
                drawPoint_TrackGPS
            ]
        })
    }
    var drawPoint = new ol.control.Toggle({
        html: '<i class="	glyphicon glyphicon-map-marker" ></i>',
        className:'myOlbutton24',
        title: 'Draw point',
        onToggle: function (toggle) {
            if(toggle){
                var controls=  this.getSubBar()? (this.getSubBar().getControls()):[];
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus('<i  class="status_tip_glyph glyphicon glyphicon-map-marker"></i>  Draw point',2000,undefined,function(){
                       showControlStatus();
                });
            }else{
                mapContainer.showTopStatus('');
            }
            self.removeInteraction(self.interaction);
            self.interactionSelect.getFeatures().clear();
            self.removeInteraction(self.interactionSelect);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }

            mapContainer.setCurrentTool({
                name: 'edit_draw_point',
                cursor:function(map,e){
                    var c='url("/css/images/SelectArrow_Plus_32_cursor.png")1 1,auto';
                    return c;
                  },
                onActivate: function (event) {

                },
                onDeactivate: function (event) {
                    self.removeInteraction(self.interaction);
                    self.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    self.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    drawPoint.setActive(false);
                }
            });
            self.interaction = new ol.interaction.Draw({
                type: 'Point',
                source: vector.getSource(),
            });
            // var addToDrawing_ =  $.proxy(   self.interaction.addToDrawing_,self.interaction);
            // self.interaction.addToDrawing_= function(event, isGPS){
            //     if(self.trackGPS && !isGPS){
            //                  return false;
            //     }
            //     addToDrawing_(event);
            // }
            // var modifyDrawing_= $.proxy(   self.interaction.modifyDrawing_,self.interaction);
            // self.interaction.modifyDrawing_= function(event, isGPS){
            //     if(self.trackGPS && !isGPS){
            //                  return false;
            //     }
            //     modifyDrawing_(event);
            // }
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                transactFeature('insert', e.feature);
            });
            map.addInteraction(self.interactionSnap);
        }
        ,bar: drawPointGPS_bar
    });
    drawPoint._statusTip='<i class="status_tip_glyph glyphicon glyphicon-map-marker" ></i> '+ drawPoint.get('title');
    this.drawPoint = drawPoint;
    if (!shapeType || shapeType == 'Point') {
        this._toolbar.addControl(drawPoint);
    }

    var drawLine_addGPS=new ol.control.Button({
        className:'myOlbutton24',
        html: '<i style="font-size: 1.14em;" class=" glyphicon glyphicon-record"></i><i class="fa fa-plus draw_addFromGPS" ></i>',
        title: "Add vertex from GPS",
        handleClick: function() { // Prevent null objects on finishDrawing
            mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-plus  " ></i> Add vertex from GPS',3000);
            addCurrentGpsPositionToDrawing(false);
        }
    });
    drawLine_addGPS._statusTip='<i class="status_tip_glyph fa fa-plus  " ></i> '+ drawLine_addGPS.get('title');
    var drawLine_TrackGPS=new ol.control.Toggle({
        className:'myOlbutton24',
        html: '<i style="" class=" glyphicon glyphicon-record"></i><i class="fa fa-lock draw_trackGPS" ></i>',
        title: "Track GPS to add vertex",
        onToggle: function (toggle) {
            if(toggle){
                mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-lock  " ></i> Track GPS to add vertex',3000);
           }else{
            mapContainer.showTopStatus('');
           }
            if (!toggle) {
                self.trackGPS=false;
                return;
            }
            self.trackGPS=true;
            addCurrentGpsPositionToDrawing(false);
        },
        active: self.trackGPS
    });
    drawLine_TrackGPS._statusTip='<i class="status_tip_glyph fa fa-lock  " ></i> '+ drawLine_TrackGPS.get('title');
    var drawLineGPS_bar=undefined;
    var drawPolygon_subBarControls=[new ol.control.Button({
        className:'myOlbutton24',
           // html: 'Undo', //'<i class="fa fa-mail-reply"></i>',
           html: '<span style="display:block;line-height:28px;background-position:center center" class="undo24Icon" >&nbsp;</span>',
            title: "Undo last point",
            _statusTip:'<i  class="status_tip_icon undo24Icon"></i> Undo last point' ,
            handleClick: function() {
                mapContainer.showTopStatus('');
                if (self.interaction.nbpts > 1){

                 //self.interaction.removeLastPoint();
                 var removeLastPoint=function(){
                        if (!this.sketchFeature_) {
                            return;
                        }
                        var geometry =  (this.sketchFeature_.getGeometry());
                        var coordinates;
                        /** @type {LineString} */
                        var sketchLineGeom;
                        if (this.mode_ === 'LineString') {
                            coordinates = (this.sketchCoords_);
                            //coordinates.splice(-2, 1);
                            coordinates.splice(-1, 1);
                            this.geometryFunction_(coordinates, geometry);
                            if (coordinates.length >= 2) {
                                this.finishCoordinate_ = coordinates[coordinates.length - 2].slice();
                            }
                        } else if (this.mode_ === 'Polygon') {
                            coordinates = (this.sketchCoords_)[0];
                            coordinates.splice(-2, 1);
                            sketchLineGeom =  (this.sketchLine_.getGeometry());
                            sketchLineGeom.setCoordinates(coordinates);
                            this.geometryFunction_(this.sketchCoords_, geometry);
                        }
                    
                        if (coordinates.length === 0) {
                            this.finishCoordinate_ = null;
                        }
                    
                        this.updateSketchFeatures_();

                      };
                      removeLastPoint=  $.proxy( removeLastPoint,self.interaction);

                      removeLastPoint();
                

                }
            }
        }),
        new ol.control.Button({
            className:'myOlbutton24',
            //html: 'Finish',
            html: '<span style="display:block;line-height:28px;background-position:center" class="stop24Icon" >&nbsp;</span>',
            title: "Finish",
            _statusTip:'<i  class="status_tip_icon stop24Icon"></i> Finish',
            handleClick: function() { // Prevent null objects on finishDrawing
                mapContainer.showTopStatus('');
                if (self.interaction.nbpts > 2) self.interaction.finishDrawing();
                else{
                    self.interaction.finishDrawing();
                }
            }
        })
        
    ];
    if(app.geolocationTasks){
        drawPolygon_subBarControls.push(new ol.control.TextButton({
            className:'myOlTextButton_Space',
            html: '      '
        }));
        drawPolygon_subBarControls.push(drawLine_addGPS);
        drawPolygon_subBarControls.push(drawLine_TrackGPS);
    
    }
    var drawLine = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="drawLineIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Draw line',
        onToggle: function (toggle) {
            if(toggle){
                var controls= this.getSubBar().getControls();
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus('<i  class="status_tip_icon drawLineIcon"></i>  Draw polygon',2000,undefined,function(){
                       showControlStatus();
                });
            }else{
                mapContainer.showTopStatus('');
            }
            //console.log(toggle);
            self.removeInteraction(self.interaction);
           // self.interactionSelect.getFeatures().clear();
            self.removeInteraction(self.interactionSelect);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }

            mapContainer.setCurrentTool({
                name: 'edit_draw_line',
                cursor:function(map,e){
                    var c='url("/css/images/SelectArrow_Plus_32_cursor.png")1 1,auto';
                    return c;
                  },
                onActivate: function (event) {

                },
                onDeactivate: function (event) {
                    self.removeInteraction(self.interaction);
                    self.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    self.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    drawLine.setActive(false);
                }
            });
            var appendToExisting=false;
            var appendToFeature=null;
            if(self.interactionSelect.getFeatures().getLength()==1){
                appendToFeature=self.interactionSelect.getFeatures().item(0);
            }
            self.interaction = new ol.interaction.Draw({
                type: 'LineString',
                source: vector.getSource(),
                geometryFunction: function(coordinates, geometry) {
                    if (geometry) geometry.setCoordinates(coordinates);
                    else geometry = new ol.geom.LineString(coordinates);
                    this.nbpts = geometry.getCoordinates().length;
                    return geometry;
                    }
                //     ,
                // condition:function(e){
                //     if(self.trackGPS){
                //         self.interaction.shouldHandle_=false;
                //         return false;
                //     }
                //     return true;
                // }    
            });
           
            var addToDrawing_ =  $.proxy(   self.interaction.addToDrawing_,self.interaction);
            self.interaction.addToDrawing_= function(event, isGPS){
                if(self.trackGPS && !isGPS){
                             return false;
                }
                addToDrawing_(event);
            }
            var modifyDrawing_= $.proxy(   self.interaction.modifyDrawing_,self.interaction);
            self.interaction.modifyDrawing_= function(event, isGPS){
                if(self.trackGPS && !isGPS){
                             return false;
                }
                modifyDrawing_(event);
            }
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                if(appendToFeature){
                    if(e.feature){

                        new ConfirmDialog().show('Append to the last selected line?', function (confirm) {

                            if (confirm) {
                                var geom= e.feature.getGeometry();
                                var coords= geom.getCoordinates();
        
                                var c_geom=appendToFeature.getGeometry();
                                var c_type=c_geom.getType();
                                var c_coords=c_geom.getCoordinates();
                                if(c_type=='MultiLineString'){
                                    c_coords.push(coords);
                                    c_geom.setCoordinates(c_coords);
                                }else{
                                    c_coords=[c_coords,coords];    
                                    c_geom =  new ol.geom.MultiLineString(c_coords);
                                    appendToFeature.setGeometry(c_geom);
                                }
                                //c_coords=c_coords.concat(coords);
                                
                              //  appendToFeature.setGeometry(c_geom);
                                 transactFeature('update', appendToFeature);
                            }else{
                                transactFeature('insert', e.feature);
                            }
                    
                        }, { dialogSize: 'sm', alertType: 'info' }
                        );

                        
                    }
                }else{
                    transactFeature('insert', e.feature);
                }
            });
            map.addInteraction(self.interactionSnap);
        }
        // ,
        // interaction: new ol.interaction.Draw({
        //     type: 'LineString',
        //     source: vector.getSource(),
        //     // Count inserted points
        //     geometryFunction: function(coordinates, geometry) {
        //         if (geometry) geometry.setCoordinates(coordinates);
        //         else geometry = new ol.geom.LineString(coordinates);
        //         this.nbpts = geometry.getCoordinates().length;
        //         return geometry;
        //     }
        // })
        // ,
        // // Options bar associated with the control
        // bar: new ol.control.Bar({
        //     controls: [new ol.control.TextButton({
        //             html: 'undo',
        //             title: "Delete last point",
        //             handleClick: function() {
        //                 if (drawLine.getInteraction().nbpts > 1) drawLine.getInteraction().removeLastPoint();
        //             }
        //         }),
        //         new ol.control.TextButton({
        //             html: 'Finish',
        //             title: "finish",
        //             handleClick: function() { // Prevent null objects on finishDrawing
        //                 if (drawLine.getInteraction().nbpts > 2) drawLine.getInteraction().finishDrawing();
        //             }
        //         })
        //     ]
        // })
        ,bar: new ol.control.Bar({
            controls: drawPolygon_subBarControls
        })
    });
    drawLine._statusTip='<i class="status_tip_icon drawLineIcon"></i>  '+ drawLine.get('title');
    this.drawLine = drawLine;
    if (!shapeType || shapeType == 'Line' || shapeType == 'Polyline' || shapeType == 'MultiLineString') {
        this._toolbar.addControl(drawLine);
    }
    var drawPolygon_addGPS=new ol.control.Button({
        className:'myOlbutton24',
        html: '<i style="font-size: 1.14em;" class=" glyphicon glyphicon-record"></i><i class="fa fa-plus draw_addFromGPS" ></i>',
        title: "Add vertex from GPS",
        handleClick: function() { // Prevent null objects on finishDrawing
            mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-plus  " ></i> Add vertex from GPS',3000);
            addCurrentGpsPositionToDrawing(false);
        }
    });
    drawPolygon_addGPS._statusTip='<i class="status_tip_glyph fa fa-plus  " ></i>  '+ drawPolygon_addGPS.get('title');
    var drawPolygon_TrackGPS=new ol.control.Toggle({
        className:'myOlbutton24',
        html: '<i style="" class=" glyphicon glyphicon-record"></i><i class="fa fa-lock draw_trackGPS" ></i>',
        title: "Track GPS to add vertex",
        onToggle: function (toggle) {
           if(toggle){
                mapContainer.showTopStatus('<i class="status_tip_glyph fa fa-lock  " ></i> Track GPS to add vertex',3000);
           }else{
            mapContainer.showTopStatus('');
           }
            if (!toggle) {
                self.trackGPS=false;
                return;
            }
            self.trackGPS=true;
            addCurrentGpsPositionToDrawing(false);
        },
        active: self.trackGPS
    });
    drawPolygon_TrackGPS._statusTip='<i class="status_tip_glyph fa fa-lock  " ></i> '+ drawPolygon_TrackGPS.get('title');
    var drawPolygon_subBarControls= [new ol.control.Button({
            className:'myOlbutton24',
                //html: 'Undo', //'<i class="fa fa-mail-reply"></i>',
                html: '<span style="display:block;line-height:28px;background-position:center center" class="undo24Icon" >&nbsp;</span>',
                title: "Undo last point",
                handleClick: function() {
                    mapContainer.showTopStatus('');
                    if (self.interaction.nbpts > 1) self.interaction.removeLastPoint();
                },
                _statusTip:'<i  class="status_tip_icon undo24Icon"></i> Undo last point'  
            }),
            new ol.control.Button({
                className:'myOlbutton24',
                //html: 'Finish',
                html: '<span style="display:block;line-height:28px;background-position:center" class="stop24Icon" >&nbsp;</span>',
                title: "Finish",
                handleClick: function() { // Prevent null objects on finishDrawing
                    mapContainer.showTopStatus('');
                    if (self.interaction.nbpts > 3) self.interaction.finishDrawing();
                    else{
                        self.interaction.abortDrawing_();
                    }
                },
                _statusTip:'<i  class="status_tip_icon stop24Icon"></i> Finish'  
            })];
          
        
    if(app.geolocationTasks){
        drawPolygon_subBarControls.push(new ol.control.TextButton({
            className:'myOlTextButton_Space',
            html: '      '
        }));
        drawPolygon_subBarControls.push(drawPolygon_addGPS);
        drawPolygon_subBarControls.push(drawPolygon_TrackGPS);
    }
    var drawPolygon = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="drawPolygonIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Draw polygon',
        onToggle: function (toggle) {
            if(toggle){
                var controls= this.getSubBar().getControls();
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus('<i  class="status_tip_icon drawPolygonIcon"></i>  Draw polygon',2000,undefined,function(){
                       showControlStatus();
                });
               // mapContainer.showTopStatus('<i style="" class=" glyphicon glyphicon-record"></i><i class="fa fa-lock draw_trackGPS" ></i>  Track gps')
            }else{
                mapContainer.showTopStatus('');
            }
            self.removeInteraction(self.interaction);
           // self.interactionSelect.getFeatures().clear();
            self.removeInteraction(self.interactionSelect);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }

            mapContainer.setCurrentTool({
                name: 'edit_draw_polygon',
                cursor:function(map,e){
                    var c='url("/css/images/SelectArrow_Plus_32_cursor.png")1 1,auto';
                    return c;
                  },
                onActivate: function (event) {

                },
                onDeactivate: function (event) {
                    self.removeInteraction(self.interaction);
                    self.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    self.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    drawPolygon.setActive(false);
                }
            });
            var appendToExisting=false;
            var appendToFeature=null;
            if(self.interactionSelect.getFeatures().getLength()==1){
                appendToFeature=self.interactionSelect.getFeatures().item(0);
            }
            self.interaction = new ol.interaction.Draw({
                type: 'Polygon',
                source: vector.getSource(),
                geometryFunction: function(coordinates, geometry) {
                    this.nbpts = coordinates[0].length;
                    if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
                    else geometry = new ol.geom.Polygon(coordinates);
                   
                    return geometry;
                    }
            });
            var addToDrawing_ =  $.proxy(   self.interaction.addToDrawing_,self.interaction);
            self.interaction.addToDrawing_= function(event, isGPS){
                if(self.trackGPS && !isGPS){
                             return false;
                }
                addToDrawing_(event);
            }
            var modifyDrawing_= $.proxy(   self.interaction.modifyDrawing_,self.interaction);
            self.interaction.modifyDrawing_= function(event, isGPS){
                if(self.trackGPS && !isGPS){
                             return false;
                }
                modifyDrawing_(event);
               // console.log(event);
            }
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                if(appendToFeature){
                    if(e.feature){

                        new ConfirmDialog().show('Merge to the last selected polygon?', function (confirm) {

                            if (confirm) {
                                var geom= e.feature.getGeometry();
                                var coords= geom.getCoordinates();
        
                                var c_geom=appendToFeature.getGeometry();
                                var c_type=c_geom.getType();
                                var c_coords=c_geom.getCoordinates();
                                if(coords && coords.length){
                                    if(c_type=='MultiPolygon'){
                                        c_coords.push(coords);
                                        c_geom.setCoordinates(c_coords);
                                    }else if(c_type=='Polygon'){
                                        c_coords.push(coords[0]);
                                        c_geom.setCoordinates(c_coords);
                                    }else{
                                        c_coords=[c_coords,coords[0]];    
                                        c_geom =  new ol.geom.Polygon(c_coords);
                                        appendToFeature.setGeometry(c_geom);
                                    }
                                    transactFeature('update', appendToFeature);
                                }
                            }else{
                                transactFeature('insert', e.feature);
                            }
                    
                        }, { dialogSize: 'sm', alertType: 'info' }
                        );

                        
                    }
                }else{
                    transactFeature('insert', e.feature);
                }
            });
            map.addInteraction(self.interactionSnap);
        }
        // ,
        // interaction: new ol.interaction.Draw({
        //     type: 'Polygon',
        //     source: vector.getSource(),
        //     // Count inserted points
        //     geometryFunction: function(coordinates, geometry) {
        //         this.nbpts = coordinates[0].length;
        //         if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
        //         else geometry = new ol.geom.Polygon(coordinates);
        //         return geometry;
        //     }
        // })
        ,
        // Options bar ssociated with the control
        bar: new ol.control.Bar({
            controls: drawPolygon_subBarControls
        })
    });
    drawPolygon._statusTip='<i  class="status_tip_icon drawPolygonIcon"></i>  '+ drawPolygon.get('title');
    this.drawPolygon = drawPolygon;
    if (!shapeType || shapeType == 'Polygon' || shapeType == 'MultiPolygon') {
        this._toolbar.addControl(drawPolygon);
    }
//#endregion drawings

//#region cmdSyncCache 
    var cmdSyncCache=new ol.control.Button({
        //html: '<i class="	fa fa-sync" ></i>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="refresh24Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Sync changes to server",
        handleClick: function () {
           
                mapContainer.showTopStatus('');
                self.syncCache({dataObj:dataObj});
    
        }
        });
        cmdSyncCache._statusTip='<i class="status_tip_icon refresh24Icon"></i>  '+ cmdSyncCache.get('title');
    this.cmdSyncCache=cmdSyncCache;
   
 //this._toolbar.addControl(cmdSyncCache);
 //#endregion
   
     

}
VectorLayerEditTask.prototype.removeInteraction = function (interaction) {
    if(!interaction){
        return;
    }
    if(interaction instanceof ol.interaction.Draw){
        if (interaction.nbpts > 2) interaction.finishDrawing();
    }
    if(this.mapContainer){
        var map = this.mapContainer.map;
        map.removeInteraction(interaction);
    } 
    

}
VectorLayerEditTask.prototype.OnActivated = function (dataObj) {
    var self=this;
    this._activated = true;
    if (!this._initialized) {
        this.init(dataObj);
    }
    this.mapContainer.map.addControl(this.mainCtrl);
    if(this.selectCtrl)
        {
            // this.selectCtrl.setActive(true);
            // this.selectCtrl.raiseOnToggle();
        }
    
      app.unRegisterEventhandler('change:position',self.on_change_position)
      app.registerEventhandler('change:position',self.on_change_position)
    
}
VectorLayerEditTask.prototype.OnDeActivated = function (dataObj) {
    var self=this;
    if (!this._activated)
        return;
    var map = this.mapContainer.map;
    if (this.interaction)
        self.removeInteraction(this.interaction);
    this.interaction = null;
    this.mapContainer.setCurrentEditAction(undefined);
    if (this.interactionSelect) {
     //   this.interactionSelect.getFeatures().clear();
        self.removeInteraction(this.interactionSelect);
    }
    if(this.selectCtrl)
    {
        this.selectCtrl.setActive(false);
    }
    
    self.removeInteraction(this.interactionSnap);

    this.mapContainer.map.removeControl(this.mainCtrl);
    
        app.unRegisterEventhandler('change:position',self.on_change_position)
    
    this._activated = false;
}
VectorLayerEditTask.prototype.importSelectionFromSelectTask = function () {
    var layerSelectTask= LayerHelper.getVectorLayerSelectTask(this.layer);
    if(layerSelectTask){
        if(layerSelectTask.interactionSelect.getFeatures().getLength())
        {
            if(this.interactionSelect.getFeatures().getLength()==0)
            {
                
                for (var i = 0, f; f = layerSelectTask.interactionSelect.getFeatures().item(i); i++) {
                    var feature=f;
                    this.interactionSelect.getFeatures().push(feature);
                    this.interactionSelect.dispatchEvent({
                       type: 'select',
                       selected: [feature],
                       deselected: []
                    });  
                } 
                
                layerSelectTask.interactionSelect.getFeatures().clear();
               
            }

        }
    }
}
VectorLayerEditTask.prototype.addPointByXY = function (options) {
    var self=this;
    var vector = this.layer;
    options=options||{};
    var feature = new ol.Feature();
    if(typeof options.lat !=='undefined' && typeof options.lon !=='undefined' ){
        var map = self.mapContainer.map;
        var view = map.getView();
        var mapProjection = view.getProjection();
        var lat=options.lat;
        var lon=options.lon;
        try{
            lat= parseFloat(lat);
            lon= parseFloat(lon);
            var newPoint= new ol.geom.Point([lon,lat]);
            newPoint.transform('EPSG:4326',mapProjection);
            feature.setGeometry(newPoint);
        }catch(ex){

        }
    }else if (options.coordinates){
        var newPoint= new ol.geom.Point(options.coordinates);
        feature.setGeometry(newPoint);
    }
   
    var autosaveId='autosave';
    if(this.layer){
      autosaveId+= '_'+ this.layer.get('title');
    }
    if(feature){
      if(feature.getId){
        var fid=feature.getId()
        if(!fid && feature.get('_cacheInfo')){
           fid=feature.get('_cacheInfo').uid;
        }
        if(!fid){
          fid=-1;
        }
        autosaveId+= '_'+fid;
      }
     } 

    var defaultFieldToEdit=options.defaultFieldToEdit; 

    if(options.showInPage && app.controller && app.controller.controllers['ObjectProperties'] ){
        var  ShowObjectPropertiesPage=function(initData){
            var activeTabIndex=0;
            var tabs=[
                new FeatureAttributesTab({id:'add_pointXY'}),
                
              ]
              if(!options.attributesOnly){
                tabs.push(new FeaturePointTab({id:'add_pointXY'}));
                activeTabIndex=1;
              }
            app.controller.controllers['ObjectProperties'].editObject(self.mapContainer, 
                {
                    layer:vector,
                    feature:feature,
                    defaultFieldToEdit:defaultFieldToEdit,
                    transactFeature:self.transactFeature
                    ,autosaveId:autosaveId,
                    initData:initData
                }
                , {
                title:'Add point feature',
                closeWithBackButton:(app.isMobile()?false:true),
                tabs:tabs,
                activeTabIndex:activeTabIndex,
                onapply:function(dlg){
                    //
                    var f= feature;
                    delete self.dirty[f.getId()];
                    var featureProperties = f.getProperties();
                    delete featureProperties.boundedBy;
                    var clone = new ol.Feature(featureProperties);
                    clone.setId(f.getId());
                    self.transactFeature('add', clone,options);
                },
                helpLink:'/help#editing_attributes'
    
            });
        };

        if(app && app.controller && app.controller.storageService){
            app.controller.storageService.get(autosaveId).then(function(data){
               if(data){
                console.log('autosaved data loaded');
                new ConfirmDialog().show('Do you want to load last autosaved information?', function (confirm) {

                    if (confirm) {
                        ShowObjectPropertiesPage(data);
                    }else{
                        ShowObjectPropertiesPage(null);
                    }
            
                    }, { title:'Load autosaved data?',dialogSize: 'sm', alertType: 'info' }
                );
               }else{
                ShowObjectPropertiesPage(null);
               }
            }).catch(function(error){
              console.log('failed to load autosaved data');
              ShowObjectPropertiesPage(null);
            });
         }else{
            ShowObjectPropertiesPage(null);
         }
        
    }else{
        var activeTabIndex=0;
        var tabs=[
            new FeatureAttributesTab({id:'add_pointXY_dlg'}),
            
          ]
          if(!options.attributesOnly){
            tabs.push(new FeaturePointTab({id:'add_pointXY_dlg'}));
            activeTabIndex=1;
          }
        var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
            {
                layer:vector,
                feature:feature,
                defaultFieldToEdit:defaultFieldToEdit,
                transactFeature:self.transactFeature
            }
            , {
            title:'Add point feature',
            closeWithBackButton:(app.isMobile()?false:true),
            tabs:tabs,
            activeTabIndex:activeTabIndex,
            onapply:function(dlg){
                //
                var f= feature;
                delete self.dirty[f.getId()];
                var featureProperties = f.getProperties();
                delete featureProperties.boundedBy;
                var clone = new ol.Feature(featureProperties);
                clone.setId(f.getId());
                self.transactFeature('add', clone,options);
            },
            helpLink:'/help#editing_attributes'
    
          }).show();

    }

   
}
VectorLayerEditTask.prototype.syncCache = function (options) {
    var self=this;
    var vector = this.layer;
    var source = vector.getSource();

    var url = source.getUrl();
    app.controller.storageService.getVector(url,false).then(function(result){
        if(result ){
            var data=result.data;
            var ismodified =(result.ismodified=='true');
            
            if(!ismodified){
               // alert('There is no edit to upload' );
               new ConfirmDialog().show('There is no edit to upload!<br/>Do you want to reload data?', function (confirm) {

                if (confirm) {
                    //source.clear();
                    source.refresh();
                }
        
                }, { title:'Reload?',dialogSize: 'sm', alertType: 'info' }
            );
             return;
             }
            

             var features= data.features || [];
             var dirtyFeatures=[];
             for(var i=0;i< features.length;i++){
                var feature = features[i];
                if(feature.properties && feature.properties._cacheInfo ){
                    dirtyFeatures.push(feature);
                }
             }
             var origData=data;
             waitingDialog.show('Applying changes to database', { progressType: ''});
             var syncUrl = source.getUrl() + '/sync';
                $.ajax(syncUrl, {
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    timeout: 30000,
                    cache: false,
                    data: JSON.stringify({geojsons:dirtyFeatures}),
                    beforeSend: function (xhr) {
                        if(app.api_token){   
                            xhr.setRequestHeader('Authorization', 'Bearer '+app.api_token);
                        }
                    },
                    success: function (data) {
                        waitingDialog.hide();
                        if (data) {
                            if(data.status){
                                origData.features=features;
                                app.controller.storageService.cacheVector(null,url,origData,options.dataObj,{
                                     ismodified:false,
                                     insert_count:result.insert_count,
                                     update_count:result.update_count,
                                     delete_count:result.delete_count
                                }).then(function(){
                                    //app.controller.notify('DatasetUpdated',{
                                        $.notify({
                                        message: "Dataset updated successfully"
                                    },{
                                        type:'info',
                                        z_index:50000,
                                        delay:2000,
                                        animate: {
                                            enter: 'animated fadeInDown',
                                            exit: 'animated fadeOutUp'
                                        }
                                    });
                                     //source.clear();
                                     source.refresh();
                                });

                                return;
                            }
                        }
                
                        var msg='Error';
                        if(data && data.message){
                            msg= data.message;
                        }
                        
                        //app.controller.notify('FailedToApply',{
                            $.notify({
                            message: "Failed to apply changes, "+ msg
                        },{
                            type:'danger',
                            z_index:50000,
                            delay:5000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        });
                            
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        waitingDialog.hide();
                        var msg=errorThrown;
                        if(xhr.responseJSON){
                            if(xhr.responseJSON.error){
                                msg=xhr.responseJSON.error;
                                errorThrown= msg;
                            }
                        }

                       
                        //app.controller.notify('FailedToApply',{
                            $.notify({
                            message: "Failed to apply changes, "+ msg
                        },{
                            type:'danger',
                            z_index:50000,
                            delay:5000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        });
                    }
                }).done(function () {
                    waitingDialog.hide();
                  //  source.clear();
                
                });

           }
        });
}
VectorLayerEditTask.prototype.editFeatureAttributes = function (feature,options) {
    var self=this;
    var vector = this.layer;
    options=options||{};
    var fields= LayerHelper.getFields( this.layer);
    var tabs=[
        new FeatureAttributesTab({id:'editFeature'}),
        //,new FeatureShapeTab(),
        //new FeaturePointTab()
      ]
     if(fields && fields.length >100 && app.isMobile()){

     }else{
         tabs.push(new FeatureShapeTab({id:'editFeature'}));
         tabs.push(new FeaturePointTab({id:'editFeature'}));
     }

     
     
     var autosaveId='autosave';
     if(this.layer){
       autosaveId+= '_'+ this.layer.get('title');
     }
     if(feature){
       if(feature.getId){
         var fid=feature.getId()
         if(!fid && feature.get('_cacheInfo')){
            fid=feature.get('_cacheInfo').uid;
         }
         if(!fid){
           fid=-1;
         }
         autosaveId+= '_'+fid;
       }
      } 


    var defaultFieldToEdit=options.defaultFieldToEdit; 
    if( !options.displayInModal &&  app.controller && app.controller.controllers['ObjectProperties'] ){

       var  ShowObjectPropertiesPage=function(initData){
         app.controller.controllers['ObjectProperties'].editObject(self.mapContainer, 
            {
                layer:vector,
                feature:feature,
                defaultFieldToEdit:defaultFieldToEdit,
                transactFeature:self.transactFeature
                ,autosaveId:autosaveId,
                initData:initData
            }
            , {
            title:'Edit attributes',
            closeWithBackButton:(app.isMobile()?false:true),
            tabs:tabs,
            onapply:function(dlg){
                //
                var f= feature;
                delete self.dirty[f.getId()];
                var featureProperties = f.getProperties();
                delete featureProperties.boundedBy;
                var clone = new ol.Feature(featureProperties);
                clone.setId(f.getId());
                self.transactFeature('update', clone,options);
            },
            helpLink:'/help#editing_attributes'
    
          });
        };

        if(app && app.controller && app.controller.storageService){
            app.controller.storageService.get(autosaveId).then(function(data){
               if(data){
                console.log('autosaved data loaded');
                new ConfirmDialog().show('Do you want to load last autosaved information?', function (confirm) {

                    if (confirm) {
                        ShowObjectPropertiesPage(data);
                    }else{
                        ShowObjectPropertiesPage(null);
                    }
            
                    }, { title:'Load autosaved data',dialogSize: 'sm', alertType: 'info' }
                );
                
               }else{
                ShowObjectPropertiesPage(null);
               }
            }).catch(function(error){
              console.log('failed to load autosaved data');
              ShowObjectPropertiesPage(null);
            });
         }else{
            ShowObjectPropertiesPage(null);
         }

    }else{
        var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
            {
                layer:vector,
                feature:feature,
                defaultFieldToEdit:defaultFieldToEdit,
                transactFeature:self.transactFeature
            }
            , {
            title:'Edit attributes',
            closeWithBackButton:(app.isMobile()?false:true),
            tabs:tabs,
            onapply:function(dlg){
                //
                var f= feature;
                delete self.dirty[f.getId()];
                var featureProperties = f.getProperties();
                delete featureProperties.boundedBy;
                var clone = new ol.Feature(featureProperties);
                clone.setId(f.getId());
                self.transactFeature('update', clone,options);
            },
            helpLink:'/help#editing_attributes'
    
          }).show();
    }
    
    
}

VectorLayerEditTask.prototype.deleteSingleFeature = function (feature,options) {
    var self=this;
    var vector = this.layer;
    options=options||{};
    var msg= options.msg;
    if(!msg){
          msg = "Delete selected feature?";
    }

    confirmDialog.show(msg, function (confirm) {

        if (confirm) {
           
                self.transactFeature('delete', feature,options);
            self.interactionSelect.getFeatures().clear();
        }

    },
        {
            dialogSize: 'sm',
            alertType: 'danger'
        }
    );
}
VectorLayerEditTask.prototype.deleteFeatures = function (features,options) {
    var self=this;
    var vector = this.layer;
    options=options||{};
    var msg= options.msg;
    if(!msg){
          msg = "Delete selected feature?";
        if (features.getLength() > 1)
            msg = "Delete selected feature(s)?";
    }

    confirmDialog.show(msg, function (confirm) {

        if (confirm) {
            for (var i = 0, f; f = features.item(i); i++) {
                //  vector.getSource().removeFeature(f);
                self.transactFeature('delete', f,options);
            }
            self.interactionSelect.getFeatures().clear();
        }

    },
        {
            dialogSize: 'sm',
            alertType: 'danger'
        }
    );
}