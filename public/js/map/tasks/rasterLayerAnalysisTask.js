function RasterLayerAnalysisTask(app, mapContainer, layer, options) {
    this._name='RasterLayerAnalysisTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
}
RasterLayerAnalysisTask.prototype.getName = function () {
    return this._name;
}
RasterLayerAnalysisTask.prototype.init = function (dataObj) {

    if(!(app.identity.isAdministrator || app.identity.isDataAnalyst)){
        return;
    }
    this._initialized = true;


    var self = this;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
    var mapContainer = this.mapContainer;
    var layer = this.layer;//.getSource();
    var source = layer.getSource();
    var layerCustom= layer.get('custom');
    var numberOfBands=1;
    if(layerCustom.dataObj)
    {
        numberOfBands=layerCustom.dataObj.details.numberOfBands
      
    }
    var oidField = 'rid';
    var oid = -1;
    if (!source)
        return;
    var details = source.get('details');
    if (details) {
        oidField = details.oidField
    }
    
    
  
    this._toolbar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });
    this.mainCtrl = new ol.control.Toggle({
        html: '<i class="fa fa-tasks"></i>',
        className:'myOlbutton24',
        title: "Analysis toolbar",
        bar:this._toolbar
    });
   
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
  
   
  this._slope=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Slope',
        className:'myOlTextButton24',
        title: "Calculate slope of the raster layer",
        handleClick: function () {
            var details= LayerHelper.getDetails(self.layer);
            if(details.rasterType!=='SingleBand_Dem'){
                $.notify({
                    message: 'The selected layer is not a DEM.<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#DlgSlope">?</a>'
                },{
                    type:'info',
                    delay:5000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
                return;
            }

            var dlg = new DlgSlope(mapContainer, self.layer, {
                title:'Slope',
                onapply:function(dlg,data){
                    
                    var settings=encodeURIComponent(JSON.stringify({units:data.units}));
                   
                    
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=slope&srid='+mapProjectionCode+'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating raster slope...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                $.notify({
                                    message: "New data layer is generated"
                                },{
                                    type:'success',
                                    delay:2000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                mapContainer.addLayerById(data.id);
                            }
                            processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
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
        
              }).show();
        }
    });
    this._toolbar.addControl(this._slope);

    this._hillshade=new ol.control.TextButton({
        
        html:'Hillshade',
        className:'myOlTextButton24',
        title: "Generate hillshade from the raster layer",
        handleClick: function () {
            var details= LayerHelper.getDetails(self.layer);
            if(details.rasterType!=='SingleBand_Dem'){
                $.notify({
                    message: 'The selected layer is not a DEM.<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#DlgHillshade">?</a>'
                },{
                    type:'info',
                    delay:5000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
                return;
            }

            var dlg = new DlgHillshade(mapContainer, self.layer, {
                title:'Hillshade',
                onapply:function(dlg,data){
                    
                    var settings=encodeURIComponent(JSON.stringify({azimuth:data.azimuth,altitude:data.altitude}));
                   
                    
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=hillshade&srid='+mapProjectionCode+'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating raster hillshade...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                $.notify({
                                    message: "New data layer is generated"
                                },{
                                    type:'success',
                                    delay:2000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                mapContainer.addLayerById(data.id);
                            }
                            processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
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
        
              }).show();

        }
    });
    this._toolbar.addControl(this._hillshade);

    this._clip=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Clip',
        className:'myOlTextButton24',
        title: "Clip raster layer",
        handleClick: function () {
            var details= LayerHelper.getDetails(self.layer);
            

            var dlg = new DlgRasterClip(mapContainer, self.layer, {
                title:'Clip',
                onapply:function(dlg,data){
                    
                    var settings=encodeURIComponent(JSON.stringify(data));
                   
                    
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=clipRaster&srid='+mapProjectionCode+'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating raster slope...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                $.notify({
                                    message: "New data layer is generated"
                                },{
                                    type:'success',
                                    delay:2000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                mapContainer.addLayerById(data.id);
                            }
                            processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
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
        
              }).show();
        }
    });
    this._toolbar.addControl(this._clip);


    
    this._classify=new ol.control.TextButton({
        
        html:'Classify',
        className:'myOlTextButton24',
        title: "Classify raster data",
        handleClick: function () {
            var dlg = new DlgRasterClassify(mapContainer, self.layer, {
                title:'Classify',
                onapply:function(dlg,data){
                    if(!(data.band && data.reclass))
                    {
                        return;
                    }
                    var settings=encodeURIComponent(JSON.stringify(data));
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=reclass&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Reclassifying raster ...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                $.notify({
                                    message: "New data layer is generated"
                                },{
                                    type:'success',
                                    delay:2000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                mapContainer.addLayerById(data.id);
                            }
                            processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
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
                },
                onapply_test:function(dlg,data){
                    if(!(data.band && data.reclass))
                    {
                        return;
                    }
                    var settings=encodeURIComponent(JSON.stringify(data));
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=rasterBandHistogram&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Reclassifying raster ...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                $.notify({
                                    message: "New data layer is generated"
                                },{
                                    type:'success',
                                    delay:2000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                }); 
                                mapContainer.addLayerById(data.id);
                            }
                            processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
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
        
              }).show();
        }
    });
    this._toolbar.addControl(this._classify);

    this._floodArea=new ol.control.TextButton({
        
        html:'Flood area',
        className:'myOlTextButton24',
        title: "Point-based flood area",
        handleClick: function () {
            var details= LayerHelper.getDetails(self.layer);
            if(details.rasterType!=='SingleBand_Dem'){
                $.notify({
                    message: 'The selected layer is not a DEM.<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#DlgRasterPointBasedFloodArea">?</a>'
                },{
                    type:'info',
                    delay:5000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
                return;
            }
            var dlg = new DlgRasterPointBasedFloodArea(mapContainer, self.layer, {
                title:'Point-based flood area',
                onapply:function(dlg,data){
                    if(!(data.band && data.reclass))
                    {
                        return;
                    }

                    var outputWhere;
                    if(data.seedPointCoorinates){
                        outputWhere= 'ST_Intersects(geom,ST_GeomFromText(\'POINT(' + data.seedPointCoorinates[0] +' '+ data.seedPointCoorinates[1]+')\','+ data.mapProjectionCode+ '))';
                    }
                    var outputName=data.outputName;
                    var outputDescription=data.outputDescription;
                    var settings=encodeURIComponent(JSON.stringify(data));
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=reclass&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Calculating flood area ...'
                    },{
                        type:'info',
                        delay:0,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    $.ajax(url, {
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            
                            if (data && data.id) {
                                var settings=encodeURIComponent(JSON.stringify({
                                    outputWhere:outputWhere,
                                    outputName:outputName,
                                    outputDescription:outputDescription,
                                    val_field_alias:'Water level elevation'
                                }));
                                var tempRasterId= data.id;
                                var url = '/datalayer/' + data.id + '/analysis?request=rastertopolygon&srid='+mapProjectionCode+'&settings='+settings;
                                
                                $.ajax(url, {
                                    type: 'GET',
                                    dataType: 'json',
                                    success: function (data) {
                                        
                                        if (data && data.status && data.id) {
                                            $.notify({
                                                message: "New data layer is generated"
                                            },{
                                                type:'success',
                                                delay:2000,
                                                animate: {
                                                    enter: 'animated fadeInDown',
                                                    exit: 'animated fadeOutUp'
                                                }
                                            }); 
                                            mapContainer.addLayerById(data.id);

                                            var url = '/datalayer/' + tempRasterId + '/delete?_method=DELETE';
                                            $.ajax(url, {
                                                type: 'POST'
                                            }).done(function (response) {
                                                //  processNotify.close();
                                                console.log('temp raster\'s been deleted')
                                             });;
                                                


                                        }else{
                                            $.notify({
                                                message: ""+ data.errors+"<br/>Failed to complete task"
                                            },{
                                                type:'danger',
                                                delay:2000,
                                                animate: {
                                                    enter: 'animated fadeInDown',
                                                    exit: 'animated fadeOutUp'
                                                }
                                            }); 
                                        }
                                        processNotify.close();
                                    },
                                    error: function (xhr, textStatus, errorThrown) {
                                        
                                        $.notify({
                                            message: ""+ errorThrown+"<br/>Failed to complete task"
                                        },{
                                            type:'danger',
                                            delay:2000,
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
                           // processNotify.close();
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            
                            $.notify({
                                message: ""+ errorThrown+"<br/>Failed to complete task"
                            },{
                                type:'danger',
                                delay:2000,
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                }
                            }); 
                            processNotify.close();
                        }
                    }).done(function (response) {
                       //  processNotify.close();
                    });
                }
        
              }).show();
        }
    });
    this._toolbar.addControl(this._floodArea);

    this._rasterToPolygon=new ol.control.TextButton({
        
        html:'To Polygon',
        className:'myOlTextButton24',
        title: "Convert raster to polygon vector layer",
        handleClick: function () {
            var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=banddistinctvaluecount';
            var processNotify= $.notify({
                message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Counting distinc values... <a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#rasterToPolygon">?</a>'
            },{
                type:'info',
                delay:0,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
            $.ajax(url, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    var distinct_value_count= data.distinct_value_count;
                    if (distinct_value_count) {
                        distinct_value_count= parseInt(distinct_value_count);
                    }
                    processNotify.close();
                    if(distinct_value_count>2000){
                        
                        var msg = 'Too many distinct values ('+ distinct_value_count +').<br/> Try to reclass reaster to fewer values. <a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#rasterToPolygon">?</a>' ;
                        $.notify({
                            message:msg
                        },{
                            type:'danger',
                            delay:5000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        }); 
                        return;
                    }
                    if(distinct_value_count<100){
                        self.handle_rasterToPolygon();
                    }else{
                        var msg = 'Too many distinct values ('+ distinct_value_count +'). The process may take too much time. </br> Are you sure to continue? <a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#rasterToPolygon">?</a>' ;
                       
                        confirmDialog.show(msg, function (confirm) {

                            if (confirm) {
                                self.handle_rasterToPolygon();
                            }

                        },
                            {
                                dialogSize: 'm',
                                alertType: 'warning'
                            }
                        );
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    
                    $.notify({
                        message: ""+ errorThrown+"<br/>Failed to complete task"
                    },{
                        type:'danger',
                        delay:2000,
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
    });
    this._toolbar.addControl(this._rasterToPolygon);
    this.handle_rasterToPolygon= function () {
        var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=rastertopolygon&srid='+mapProjectionCode;
        var processNotify= $.notify({
            message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating raster polygons...'
        },{
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });
        $.ajax(url, {
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                
                if (data && data.id) {
                    $.notify({
                        message: "New data layer is generated"
                    },{
                        type:'success',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    }); 
                    mapContainer.addLayerById(data.id);
                }
                processNotify.close();
            },
            error: function (xhr, textStatus, errorThrown) {
                
                $.notify({
                    message: ""+ errorThrown+"<br/>Failed to complete task"
                },{
                    type:'danger',
                    delay:2000,
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
    };
}
RasterLayerAnalysisTask.prototype.OnActivated = function (dataObj) {

    if(!(app.identity.isAdministrator || app.identity.isDataAnalyst)){
        return;
    }
    this._activated = true;
   
        if (!this._initialized) {
            this.init();
        }
        this.mapContainer.map.addControl(this.mainCtrl);
   
}
RasterLayerAnalysisTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    
    if(!(app.identity.isAdministrator || app.identity.isDataAnalyst)){
        return;
    }
    this.mapContainer.map.removeControl(this.mainCtrl);
    this._activated = false;
}
