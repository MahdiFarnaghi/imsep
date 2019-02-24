function VectorLayerSelectTask(app, mapContainer, layer, options) {
    this._name='VectorLayerSelectTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
}
VectorLayerSelectTask.prototype.getName = function () {
    return this._name;
}
VectorLayerSelectTask.prototype.init = function (dataObj) {
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
    var custom= this.layer.get('custom');
    var sourceFormat = source.getFormat();
    var formatGML= source.get('formatGML');
    
    var defaultSelectionStyle=new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'blue',
            width:2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0,100,100,0.2)'
        }),
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#00ffff'
            }),
            stroke: new ol.style.Stroke({
                color: 'blue',
                width:2
            })
        })
    })
    self.interactionSelect = new ol.interaction.Select({
        hitTolerance:5,
        multi:true,
        layers: [vector],
        
        style: function(f,r){
            return defaultSelectionStyle;
          

        }
        
    });
    self.interactionSelectByBox = new ol.interaction.DragBox({
        condition: ol.events.condition.platformModifierKeyOnly,
        style: function(f,r){
            return defaultSelectionStyle;
        }
    });
    self.interactionSelectByBox.on('boxend', function(e) {
        // features that intersect the box are added to the collection of
        var selectedFeatures=self.interactionSelect.getFeatures();
        var extent = self.interactionSelectByBox.getGeometry().getExtent();
        
        source.forEachFeatureIntersectingExtent(extent, function(feature) {
          selectedFeatures.push(feature);
          self.interactionSelect.dispatchEvent({
            type: 'select',
            selected: [feature],
            deselected: []
         }); 
        
        });
        
        
      });
      
      // clear selection when drawing a new box and when clicking on the map
      self.interactionSelectByBox.on('boxstart', function(e) {
       // self.interactionSelect.getFeatures().clear();
        
      })

    map.addInteraction(self.interactionSelect);
    self.interactionSelect.setActive(false);
    map.addInteraction(self.interactionSelectByBox);
    self.interactionSelectByBox.setActive(false);

    vector.on('change:visible',function(e){
        if(!vector.get('visible')){
            self.interactionSelect.getFeatures().clear();
        }
    });
    this._toolbar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });
    this.mainCtrl = new ol.control.Toggle({
        html: '<i class="fa fa-mouse-pointer"></i>',
        className:'myOlbutton24',
        title: "Select toolbar",
        bar:this._toolbar
    })
   
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
    var sbar = new ol.control.Bar();
   
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
        html: '<span style="display:block;line-height:28px;background-position:center center" class="selectArrow_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "Select",
        onToggle: function (toggle) {
            //map.removeInteraction(self.interactionSelect);
            self.interactionSelect.setActive(false);
            self.interactionSelectByBox.setActive(false);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                return;
            }
            mapContainer.setCurrentTool({
                name: 'select_select',
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
                            c='url("/css/images/SelectArrow_hover_32_cursor.png")1 1,auto'; 
                        }
                        return c;
                  },
                onActivate: function (event) {
                    map.removeInteraction(self.interactionSelect);
                    map.addInteraction(self.interactionSelect);
                    self.interactionSelect.setActive(true);
                    map.removeInteraction(self.interactionSelectByBox);
                    map.addInteraction(self.interactionSelectByBox);
                    self.interactionSelectByBox.setActive(true);
                },
                onDeactivate: function (event) {
                    self.mapContainer.setCurrentEditAction('');
                    //map.removeInteraction(self.interactionSelect);
                    self.interactionSelect.setActive(false);
                    self.interactionSelectByBox.setActive(false);
                    if (event.newTool && event.newTool.name !== 'select_select') {
                        self.selectCtrl.setActive(false);
                    }
                    // self.selectCtrl.setActive(false);
                }
            });


        }
        //,bar: sbar
        //,
        //autoActivate: true,
        //active: true
    });

    this._toolbar.addControl(this.selectCtrl);

    var search=new ol.control.Button({
        html: '<span style="display:block;line-height:28px;background-position:center center;" class="" ><i class="glyphicon glyphicon-search"></i></span>',
        className:'myOlbutton24',
        title: "Search",
        handleClick: function () {
            var title;
            if(self.layer.get && self.layer.get('title')){
                title='Search: '+ self.layer.get('title') ;
              }else{
                title='Search';
              }
            var dlg = new DlgVectorSearch(mapContainer, self.layer, {
                title:title,
                onapply:function(dlg,data,dialogAction){
                    if(dialogAction=='ok'){
                         var details= LayerHelper.getDetails(self.layer);
                         details.filter= data.filter;
                        // source.clear();

                        var url = '/datalayer/' + custom.dataObj.id + '/geojson';
                        var settings=encodeURIComponent(JSON.stringify({filter:data.filter,onlyIds:true}));
                        var loadUrl=url +'?settings='+settings;
           
                        var processNotify= $.notify({
                            message: '<i class="wait-icon-with-padding">Selecting ...</i><br />'
                        },{
                            type:'info',
                            delay:0,
                            z_index:50000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        });


                        $.ajax(loadUrl, {
                            type: 'GET',
                            dataType: 'json',
                            success: function (data) {
                                if (data) {
                                   if(typeof data.status !=='undefined' && data.message){
                                        $.notify({
                                            message:  data.message
                                        },{
                                            type:'danger',
                                            delay:5000,
                                            z_index:50000,
                                            animate: {
                                                enter: 'animated fadeInDown',
                                                exit: 'animated fadeOutUp'
                                            }
                                        });  
                                   }else{
                                        select_SearchResults(data);
                                   } 
                                    
                                }
                                processNotify.close();
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                $.notify({
                                    message: ""+ errorThrown+"<br/>Failed to complete task"
                                },{
                                    type:'danger',
                                    delay:3000,
                                    z_index:50000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                processNotify.close();
                            }
                        }).done(function (response) {
                             processNotify.close();
                        });


                    }else{
                        var url = '/datalayer/' + custom.dataObj.id + '/geojson';
                        var settings=encodeURIComponent(JSON.stringify({filter:data.filter,validate:true}));
                        var loadUrl=url +'?settings='+settings;
           
                        var processNotify= $.notify({
                            message: '<i class="wait-icon-with-padding">Validating ...</i><br />'
                        },{
                            type:'info',
                            delay:0,
                            z_index:50000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        });


                        $.ajax(loadUrl, {
                            type: 'GET',
                            dataType: 'json',
                            success: function (data) {
                                if (data) {
                                   if(data.status){
                                        $.notify({
                                            message:  data.rowCount + " row(s) will be selected."
                                        },{
                                            type:'success',
                                            delay:3000,
                                            z_index:50000,
                                            animate: {
                                                enter: 'animated fadeInDown',
                                                exit: 'animated fadeOutUp'
                                            }
                                        }); 
                                   }else{
                                        $.notify({
                                            message:  data.message
                                        },{
                                            type:'danger',
                                            delay:5000,
                                            z_index:50000,
                                            animate: {
                                                enter: 'animated fadeInDown',
                                                exit: 'animated fadeOutUp'
                                            }
                                        }); 
                                   } 
                                    
                                }
                                processNotify.close();
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                $.notify({
                                    message: ""+ errorThrown+"<br/>Failed to complete task"
                                },{
                                    type:'danger',
                                    delay:3000,
                                    z_index:50000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                processNotify.close();
                            }
                        }).done(function (response) {
                             processNotify.close();
                        });

                    }
                }
        
              }).show();
        }
        });
    this.search=search;
    if(custom.format === 'ol.format.GeoJSON'){
        this._toolbar.addControl(search);
    }
    function select_SearchResults(data){
        var ids={};
        if(data && data.length){
            for(var i=0;i<data.length;i++){
                ids[data[i].id]=data[i].id;
            }
        }
        self.interactionSelect.getFeatures().clear();
        var features=[];
        if(data.length>0){
            var allfeatures= source.getFeatures();
            for(var i=0;i<allfeatures.length;i++){
                var feature= allfeatures[i];
                if( ids[feature.getId()]){
                    self.interactionSelect.getFeatures().push(feature);
                    features.push(feature);
                }
              }
        }
        self.interactionSelect.dispatchEvent({
            type: 'select',
            selected: features,
            deselected: []
         }); 
    }
    var tableView=new ol.control.Button({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="tableWindow_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "View rows",
        handleClick: function () {
            var title;

           
            var source= self.layer.getSource();
            
            var features= source.getFeatures();
            var layerSelectTask= LayerHelper.getVectorLayerSelectTask(self.layer);
            var selectedFeatures;
            var numberOfRecords=features.length;
            var forceShowOnlySelection=false;
            if(numberOfRecords> app.MAx_TABLE_VIEW_RECORDS){
                forceShowOnlySelection=true;
            } 
            if(layerSelectTask){
                selectedFeatures=layerSelectTask.interactionSelect.getFeatures();
                if(selectedFeatures.getLength()>0){
                    numberOfRecords=selectedFeatures.getLength();
                }
             }

             if(numberOfRecords> app.MAx_TABLE_VIEW_RECORDS){
                BootstrapDialog.alert({
                    title: 'WARNING',
                    message: 'Too many records ('+numberOfRecords+') to show!<br/> Please select maximum ' + app.MAx_TABLE_VIEW_RECORDS +' number of records and try again.',
                    type: BootstrapDialog.TYPE_WARNING, // <-- Default value is BootstrapDialog.TYPE_PRIMARY
                    closable: true, // <-- Default value is false
                    draggable: true // <-- Default value is false
                    
                    // ,callback: function(result) {
                    //     // result will be true if button was click, while it will be false if users close the dialog directly.
                    //     alert('Result is: ' + result);
                    // }
                });
                return;
             }   
            if(self.layer.get && self.layer.get('title')){
                title='Rows: '+ self.layer.get('title') ;
              }else{
                title='Rows';
              }
            var dlg = new DlgVectorTableView(mapContainer, self.layer, {
                forceShowOnlySelection:forceShowOnlySelection,
                title:title,
                onapply:function(dlg,data){
                    
                   
                }
        
              }).show();
        }
        });
    this.tableView=tableView;
    this._toolbar.addControl(tableView);
  
    var duplicateLayer=new ol.control.Button({
        html: '<span style="display:block;line-height:28px;background-position:center center;" class="" ><i class="glyphicon glyphicon-duplicate"></i></span>',
     
        className:'myOlbutton24',
        title: "Duplicate as a new vector data layer",
        handleClick: function () {
           mapContainer.duplicateLayer(self.layer,{
               newName:undefined,
               exportSelectionIfAny:true,
               srid:undefined
           });
        }
        });
    this.duplicateLayer=duplicateLayer;
    this._toolbar.addControl(duplicateLayer);
}
VectorLayerSelectTask.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this.init();
    }
    this.mapContainer.map.addControl(this.mainCtrl);
    if(this.selectCtrl)
        {
            var ct=this.mapContainer.getCurrentTool();
            if(ct && ct.name==='select_select'){
               this.selectCtrl.setActive(true);
                this.selectCtrl.raiseOnToggle();
                this.mainCtrl.setActive(true);
            }
        }
}
VectorLayerSelectTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    var map = this.mapContainer.map;
    this.mapContainer.setCurrentEditAction(undefined);
    if (this.interactionSelect) {
        //map.removeInteraction(this.interactionSelect);
        this.interactionSelect.setActive(false);
    }
    if(this.selectCtrl)
    {
        this.selectCtrl.setActive(false);
    }
    
    this.mapContainer.map.removeControl(this.mainCtrl);
    this._activated = false;
}
