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
    
    
}
VectorLayerEditTask.prototype.getName = function () {
    return this._name;
}
VectorLayerEditTask.prototype.init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var map = this.mapContainer.map;
    var mapContainer = this.mapContainer;
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
            source.refresh();
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
                    if(options.onFailed){
                        options.onFailed(xhr, textStatus, errorThrown);
                    }
                    $.notify({
                        message: "Failed to apply changes, "+ errorThrown
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
               // source.refresh();
                source.clear();
            
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
                    if(options.onFailed){
                        options.onFailed(xhr, textStatus, errorThrown);
                    }
                    var a = 1;
                    $.notify({
                        message: "Failed to apply, "+ errorThrown
                    },{
                        type:'danger',
                        z_index:50000,
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    source.clear();
                  // source.refresh();
                }
            }).done(function() {
                source.clear();
               // source.refresh();
            });

        }
    };
    self.transactFeature=transactFeature;
    var defaultSelectionStyle=new ol.style.Style({
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
            return defaultSelectionStyle;
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
        onToggle: function (toggle) {
            if(toggle){
                self.selectCtrl.setActive(true);
                self.selectCtrl.raiseOnToggle();
            }
        }
        
    })
   // this.mapContainer.leftToolbar.addControl(this._toolbar);
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
    // Add selection tool:
    //  1- a toggle control with a select interaction
    //  2- an option bar to delete / get information on the selected feature
    var sbar = new ol.control.Bar();
    // self.interactionSelect.getFeatures().on('add',function(e){
    //     var n=self.interactionSelect.getFeatures().getLength();

    //         var ctrls = sbar.getControls();
    //         if(n>0){
    //             sbar.setVisible(true);
    //         }else
    //              sbar.setVisible(false);
    //         // for (var i=0, sb; (sb = ctrls[i]); i++)
    //         // {
    //         //     if(n>0){
    //         //         sb.setVisible(true);
    //         //     }else{
    //         //         sb.setVisible(false);
    //         //     }
    //         // }

    // });
    // self.interactionSelect.getFeatures().on('remove',function(e){
    //     var n=self.interactionSelect.getFeatures().getLength();
    //     var ctrls = sbar.getControls();
    //     if(n>0){
    //         sbar.setVisible(true);
    //     }else
    //         sbar.setVisible(false);

    //         // for (var i=0, sb; (sb = ctrls[i]); i++)
    //         // {
    //         //     if(n>0){
    //         //         sb.setVisible(true);
    //         //     }else{
    //         //         sb.setVisible(false);
    //         //     }
    //         // }
    // });
    var deleteFeature= new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="delete_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Delete",
        handleClick: function () {
            var features = self.interactionSelect.getFeatures();
            //if (!features.getLength()) info("Select an object first...");
            // else info(features.getLength()+" object(s) deleted.");
            if (features.getLength()) {
               self.deleteFeatures(features);
            }else{
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
                self.interactionSelect.getFeatures().once('add', function (e) {
                        var feature=e.element;
                        self.deleteFeatures(self.interactionSelect.getFeatures());

                });
            }
        }
    });
    this.deleteFeature=deleteFeature;
    this._toolbar.addControl(deleteFeature);
  //  sbar.addControl();
  var editAttribute=new ol.control.Button({
    html: '<span style="display:block;line-height:28px;background-position:center center" class="attributesWindow_24_Icon" >&nbsp;</span>',
    className:'myOlbutton24',
    title: "Edit attributes",
    handleClick: function () {
        var features = self.interactionSelect.getFeatures();
        
        if (features.getLength()) {
            var feature=features.item(0);
            self.editFeatureAttributes(feature);

        }else{
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
            self.interactionSelect.getFeatures().once('add', function (e) {
                    var feature=e.element;
                    self.editFeatureAttributes(feature);

            });
        }
    }
    });
this.editAttribute=editAttribute;
this._toolbar.addControl(editAttribute);
 

  sbar.addControl(new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        className:'myOlbutton24',
        title: "Clear selection",
        handleClick: function () {
            self.interactionSelect.getFeatures().clear();
        }
    }
));

    this.selectCtrl = new ol.control.Toggle({
        //html: '<i class="glyphicon glyphicon-hand-up"></i>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="selectArrow_Bold_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Select",
        onToggle: function (toggle) {
            map.removeInteraction(self.interaction);

            //self.interactionSelect.getFeatures().clear();
            map.removeInteraction(self.interactionSelect);
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
                    map.removeInteraction(self.interaction);
                    map.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    map.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== 'edit_select') {
                        self.selectCtrl.setActive(false);
                    }
                    // self.selectCtrl.setActive(false);
                }
            });


        },

        bar: sbar
        //,
        //autoActivate: true,
        //active: true
    });

    this._toolbar.addControl(this.selectCtrl);


    var addPointXY=new ol.control.Button({
        html: '<i class="	glyphicon glyphicon-map-marker" >xy</i>',
        className:'myOlbutton32',
        title: "Add point feature by lon/lat",
        handleClick: function () {
            
                self.addPointByXY();
    
        }
        });
    this.addPointXY=addPointXY;
    if (!shapeType || shapeType == 'Point') {
        this._toolbar.addControl(addPointXY);
    }
     

    // Add editing tools
    var drawPoint = new ol.control.Toggle({
        html: '<i class="	glyphicon glyphicon-map-marker" ></i>',
        className:'myOlbutton24',
        title: 'Draw point',
        onToggle: function (toggle) {
            map.removeInteraction(self.interaction);
            self.interactionSelect.getFeatures().clear();
            map.removeInteraction(self.interactionSelect);
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
                    map.removeInteraction(self.interaction);
                    map.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    map.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    drawPoint.setActive(false);
                }
            });
            self.interaction = new ol.interaction.Draw({
                type: 'Point',
                source: vector.getSource(),
            });
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                transactFeature('insert', e.feature);
            });
            map.addInteraction(self.interactionSnap);
        }
    });
    this.drawPoint = drawPoint;
    if (!shapeType || shapeType == 'Point') {
        this._toolbar.addControl(drawPoint);
    }


    var drawLine = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="drawLineIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Draw line',
        onToggle: function (toggle) {
            //console.log(toggle);
            map.removeInteraction(self.interaction);
           // self.interactionSelect.getFeatures().clear();
            map.removeInteraction(self.interactionSelect);
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
                    map.removeInteraction(self.interaction);
                    map.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    map.removeInteraction(self.interactionSelect);
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
                   
                    return geometry;
                    }
            });
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                if(appendToFeature){
                    if(e.feature){

                        new ConfirmDialog().show('Append to last selected line?', function (confirm) {

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
    });
    this.drawLine = drawLine;
    if (!shapeType || shapeType == 'Line' || shapeType == 'Polyline' || shapeType == 'MultiLineString') {
        this._toolbar.addControl(drawLine);
    }

    var drawPolygon = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="drawPolygonIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Draw polygon',
        onToggle: function (toggle) {
            map.removeInteraction(self.interaction);
           // self.interactionSelect.getFeatures().clear();
            map.removeInteraction(self.interactionSelect);
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
                    map.removeInteraction(self.interaction);
                    map.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    map.removeInteraction(self.interactionSelect);
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
                    if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
                    else geometry = new ol.geom.Polygon(coordinates);
                   
                    return geometry;
                    }
            });
            self.mapContainer.setCurrentEditAction('draw');
            map.addInteraction(self.interaction);
            self.interaction.on('drawend', function (e) {
                if(appendToFeature){
                    if(e.feature){

                        new ConfirmDialog().show('Merge to last selected polyon?', function (confirm) {

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
        // ,
        // // Options bar ssociated with the control
        // bar: new ol.control.Bar({
        //     controls: [new ol.control.TextButton({
        //             html: 'undo', //'<i class="fa fa-mail-reply"></i>',
        //             title: "undo last point",
        //             handleClick: function() {
        //                 if (drawPolygon.getInteraction().nbpts > 1) drawPolygon.getInteraction().removeLastPoint();
        //             }
        //         }),
        //         new ol.control.TextButton({
        //             html: 'finish',
        //             title: "finish",
        //             handleClick: function() { // Prevent null objects on finishDrawing
        //                 if (drawPolygon.getInteraction().nbpts > 3) drawPolygon.getInteraction().finishDrawing();
        //             }
        //         })
        //     ]
        // })
    });
    this.drawPolygon = drawPolygon;
    if (!shapeType || shapeType == 'Polygon' || shapeType == 'MultiPolygon') {
        this._toolbar.addControl(drawPolygon);
    }

    var editShape = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="editVertexIcon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Edit shape',
        onToggle: function (toggle) {
            map.removeInteraction(self.interaction);
            // self.interactionSelect.getFeatures().clear();
            map.removeInteraction(self.interactionSelect);
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
                    map.removeInteraction(self.interaction);
                    map.removeInteraction(self.interactionSnap);
                    self.mapContainer.setCurrentEditAction('');
                    map.removeInteraction(self.interactionSelect);
                    if (event.newTool && event.newTool.name !== '') {

                    }
                    editShape.setActive(false);
                }
            });
            map.addInteraction(self.interactionSelect);
            self.interaction = new ol.interaction.Modify({
                features: self.interactionSelect.getFeatures()
            });
            map.addInteraction(self.interaction);
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

        }
    });
    this.editShape = editShape;

    this._toolbar.addControl(editShape);


}
VectorLayerEditTask.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this.init();
    }
    this.mapContainer.map.addControl(this.mainCtrl);
    if(this.selectCtrl)
        {
            // this.selectCtrl.setActive(true);
            // this.selectCtrl.raiseOnToggle();
        }
   
}
VectorLayerEditTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    var map = this.mapContainer.map;
    if (this.interaction)
        map.removeInteraction(this.interaction);
    this.interaction = null;
    this.mapContainer.setCurrentEditAction(undefined);
    if (this.interactionSelect) {
     //   this.interactionSelect.getFeatures().clear();
        map.removeInteraction(this.interactionSelect);
    }
    if(this.selectCtrl)
    {
        this.selectCtrl.setActive(false);
    }
    
    map.removeInteraction(this.interactionSnap);

    this.mapContainer.map.removeControl(this.mainCtrl);
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
    var defaultFieldToEdit=options.defaultFieldToEdit; 
    var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
        {
            layer:vector,
            feature:feature,
            defaultFieldToEdit:defaultFieldToEdit,
            transactFeature:self.transactFeature
        }
        , {
        title:'Add point feature',
        tabs:[
            new FeatureAttributesTab(),
            new FeaturePointTab()
          ],
          activeTabIndex:1,
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

VectorLayerEditTask.prototype.editFeatureAttributes = function (feature,options) {
    var self=this;
    var vector = this.layer;
    options=options||{};
    var defaultFieldToEdit=options.defaultFieldToEdit; 
    var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
        {
            layer:vector,
            feature:feature,
            defaultFieldToEdit:defaultFieldToEdit,
            transactFeature:self.transactFeature
        }
        , {
        title:'Edit attributes',
        tabs:[
            new FeatureAttributesTab(),
            new FeatureShapeTab(),
            new FeaturePointTab()
          ],
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