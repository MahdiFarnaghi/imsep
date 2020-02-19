function VectorLayerAnalysisTask(app, mapContainer, layer, options) {
    this._name='VectorLayerAnalysisTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.options = options || {};
    this.hasEditPermission= this.options.hasEditPermission;
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
}
VectorLayerAnalysisTask.prototype.getName = function () {
    return this._name;
}
VectorLayerAnalysisTask.prototype.init = function (dataObj) {

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
    var shapeType = '';
    var oidField = 'gid';
    if (!source)
        return;

    shapeType = source.get('shapeType');
    var details = source.get('details');
    if (details) {
        oidField = details.oidField
    }
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
        bar:this._toolbar,
        onToggle: function (toggle) {
            if(toggle){
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
   
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
  
   
  this._buffer=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Buffer',
        className:'myOlTextButton24',
        title: "Make buffer area around features",
        handleClick: function () {

            var dlg = new DlgBuffer(mapContainer, self.layer, {
                title:'Buffer',
                onapply:function(dlg,data){
                    
                    var settings=encodeURIComponent(JSON.stringify({distance:data.distance}));
                   
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=buffer&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating buffers...'
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
    this._toolbar.addControl(this._buffer);

    this._identity=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Overlay',
        className:'myOlTextButton24',
        title: "Overlaying on another layer",
        handleClick: function () {

            var dlg = new DlgIdentity(mapContainer, self.layer, {
                title:'Overlay',
                onapply:function(dlg,data){
                  //  return;
                    var settings=encodeURIComponent(JSON.stringify({otherLayer:data.otherLayer}));
                   
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=identity&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating overlay...'
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
                            
                            if(typeof data.status !=='undefined' && !data.status && (data.message || data.errors)){
                                $.notify({
                                    message:  data.message || data.errors
                                },{
                                    type:'danger',
                                    delay:5000,
                                    z_index:50000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                });  
                                return;
                           } 

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
    this._toolbar.addControl(this._identity);

    this._intersection=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Intersect',
        className:'myOlTextButton24',
        title: "Generate intersection with another layer",
        handleClick: function () {

            var dlg = new DlgIntersection(mapContainer, self.layer, {
                title:'Intersect',
                onapply:function(dlg,data){
                  //  return;
                    var settings=encodeURIComponent(JSON.stringify({otherLayer:data.otherLayer}));
                   
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=intersection&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating Intersection...'
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
                            
                            if(typeof data.status !=='undefined' && !data.status && (data.message || data.errors)){
                                $.notify({
                                    message:  data.message || data.errors
                                },{
                                    type:'danger',
                                    delay:5000,
                                    z_index:50000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                });  
                                return;
                           } 

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
    this._toolbar.addControl(this._intersection);

    this._clip=new ol.control.TextButton({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
       // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
        html:'Clip',
        className:'myOlTextButton24',
        title: "Clip by another layer",
        handleClick: function () {

            var dlg = new DlgClip(mapContainer, self.layer, {
                title:'Clip',
                onapply:function(dlg,data){
                  //  return;
                    var settings=encodeURIComponent(JSON.stringify({otherLayer:data.otherLayer,clipOutside:data.clipOutside}));
                   
                    var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=clipVector&srid='+mapProjectionCode +'&settings='+settings;
                    var processNotify= $.notify({
                        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating clipped features...'
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
                            
                            if(typeof data.status !=='undefined' && !data.status && (data.message || data.errors)){
                                $.notify({
                                    message:  data.message || data.errors
                                },{
                                    type:'danger',
                                    delay:5000,
                                    z_index:50000,
                                    animate: {
                                        enter: 'animated fadeInDown',
                                        exit: 'animated fadeOutUp'
                                    }
                                });  
                                return;
                           } 

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

     
  this._dissolve=new ol.control.TextButton({
    // html: '<span style="display:block;line-height:28px;background-position:center center;color:#F44336;" class="" ><i class="fa fa-times"></i></span>',
    html:'Dissolve',
    className:'myOlTextButton24',
    title: "Dissolve features and calculate statistics",
    handleClick: function () {

        var dlg = new DlgDissolve(mapContainer, self.layer, {
            title:'Dissolve',
            onapply:function(dlg,data){
                
                var settings=encodeURIComponent(JSON.stringify({dissolve:data.dissolve}));
               
                var url = '/datalayer/' + layerCustom.dataObj.id + '/analysis?request=dissolve&srid='+mapProjectionCode +'&settings='+settings;
                var processNotify= $.notify({
                    message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Generating dissolved features...'
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
this._toolbar.addControl(this._dissolve);
}
VectorLayerAnalysisTask.prototype.OnActivated = function (dataObj) {

    if(!(app.identity.isAdministrator || app.identity.isDataAnalyst)){
        return;
    }
    this._activated = true;
   
        if (!this._initialized) {
            this.init();
        }
        this.mapContainer.map.addControl(this.mainCtrl);
   
}
VectorLayerAnalysisTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    
    if(!(app.identity.isAdministrator || app.identity.isDataAnalyst)){
        return;
    }
    this.mapContainer.map.removeControl(this.mainCtrl);
    this._activated = false;
}
