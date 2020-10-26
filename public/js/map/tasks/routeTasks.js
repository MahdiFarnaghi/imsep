function RouteTasks(app, mapContainer, options) {
    this.app = app;
    this.mapContainer = mapContainer;
    this.map = mapContainer.map;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
    this._subBar = null;
    this.interaction = undefined;
    this.layer = undefined;
    this.sourc = undefined;
    this.helpTooltipElement = undefined;
    this.helpTooltip = undefined;
    this.measureTooltipElement = undefined;
    this.measureTooltip = undefined;
    this.sketch = undefined;
    this.overlays = [];
    this.routeStopPoints=[];
    this.routeStopFeatures=[];
    this.segementFeature=null;
    this.task=null;

    this.tabId='tabRoute';
    this.tabLayersId='tabLayers';
    this._tabContent=null;
    this._tab=null;

    this.routeProfile= 'driving-car';
}
RouteTasks.prototype._init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var mapContainer = this.mapContainer;
    var map = this.map;
    self.source = new ol.source.Vector();
    self.layer = new ol.layer.Vector({
        source: self.source,
        custom: {
            type: 'tmp',
            keepOnTop:true,
            skipSaving:true,
            hiddenInToc: true
        },
        style:function(feature,resolution){ 
          if(feature.get('isRoute')){
            return  new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(237,50,72,0.85)',
                    width: 5
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ff0000'
                    })
                })
            });
          }else{
            return  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });
            }
        }
    });

    // move layer to top of map
    self.moveLayerToTop();
    map.getLayers().on('add', function (e) {
        if (e.element !== self.layer && e.element.get('custom')) {
          if(!e.element.get('custom').keepOnTop){  
                if (self._activated) {
                    self.moveLayerToTop();
                }
            }
        }

    })

    self.interaction = undefined;

    function addInteraction(type,task) {
        self.task=task;
        //var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
        self.interaction = new ol.interaction.Draw({
          //  source: self.source,
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        map.addInteraction(self.interaction);



        
        self.createHelpTooltip();
        self.removeMapEvents();
        self.setMapEvents();

        var listener;
        self.interaction.on('drawstart',
            function (evt) {
                // set sketch
                self.sketch = evt.feature;

            }, this);

        self.interaction.on('drawend',
            function (evt) {
                if(self.task=='route'){
                    if(evt.feature){
                        var geom= evt.feature.getGeometry();
                        var coords = ol.proj.toLonLat(geom.getCoordinates());
                        self.addStop(coords);
                        //self.routeStopPoints.push(coords);
                        //if(self.routeStopPoints.length>=2){
                        //    self.findRoute();
                       // }
                    }
                }
            }, this);
    }
    var activateInteraction = function (type,task) {
        self.routeStopPoints=[];
        map.removeInteraction(self.interaction);
        addInteraction(type,task);
        self.mapContainer.setCurrentEditAction('draw');
    }

    this._toolbar = new ol.control.Bar();
    this._subBar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });

    this.mapContainer.topToolbar.addControl(this._toolbar);

    var measureRoute = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_lengthIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center;" class="" ><i class="fa fa-route"></i></span>',
        className:'myOlbutton24 myOlbuttonVertical',
        title: 'Find Route',
        onToggle: function (toggle) {
            //console.log(toggle);
            map.removeInteraction(self.interaction);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.removeMapEvents();
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }
            mapContainer.setCurrentTool({
                isRouteTool: true,
                name: 'measure_Route',
                onActivate: function (event) {
                    if (event.prevTool) {

                    }
                    measureRoute.setActive(true);
                    // map.addInteraction(self.interaction);
                    self.activateTab();
                },
                onDeactivate: function (event) {
                    if (event.newTool) {
                        if (!event.newTool.isRouteTool) {
                            self.deActivate();
                        }
                    } else {
                        self.deActivate();
                    }
                    self.hideTab();
                    measureRoute.setActive(false);

                }
            });
            activateInteraction('Point','route');
        }
        //,
        // autoActivate: true,
        // active: true
        ,bar: this._subBar
    });
    this.measureRoute = measureRoute;
  // this._subBar.addControl(measureRoute);


    var clearCmd = new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="delete_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24 myOlbuttonVertical',
        title: 'Clear',
        handleClick: function () {
            self.clear();
            self.clearTab();
        }
    });

    this._subBar.addControl(clearCmd);

    

    this._toolbar.addControl(this.measureRoute);
}
RouteTasks.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this._init();
    }
    this.clear();
    this.clearTab();
    //  this.map.addControl(this._toolbar);
}
RouteTasks.prototype.OnDeActivated = function () {
    if (!this._activated)
        return;
    var map = this.map;

    this.deActivate();
    this._activated = false;
}

RouteTasks.prototype.clear = function () {
    
    if (this.layer && this.layer.getSource) {
        this.layer.getSource().clear();
    }
    for (var i = 0; i < this.overlays.length; i++) {
        this.map.removeOverlay(this.overlays[i]);
    }
    this.segementFeature=null;
    this.measureTooltip = null;
    this.overlays = [];
    this.routeStopPoints=[];
}
RouteTasks.prototype.deActivate = function () {

    var map = this.map;
    if (this.interaction)
        map.removeInteraction(this.interaction);
    this.removeMapEvents();
    if (this.helpTooltip) {
        this.map.removeOverlay(this.helpTooltip);
    }
    if (this.measureTooltip) {
        this.map.removeOverlay(this.measureTooltip);
    }
    if (!this._activated)
        return;
    this._activated = false;

    this.measureRoute.setActive(false);
   
    this.interaction = null;
    this.mapContainer.setCurrentEditAction(undefined);

    // this.map.removeControl(this._toolbar);
    this._activated = false;
}
RouteTasks.prototype.moveLayerToTop = function () {
    this.map.getLayers().remove(this.layer);
    this.map.getLayers().push(this.layer);
}
RouteTasks.prototype.findRoute0 = function () {
    var self=this;
    if(this.routeStopPoints.length<2)
    {
        return;
    }
    var coordinateList=[];
    for(var i=0;i<this.routeStopPoints.length;i++){
        coordinateList.push(
            this.routeStopPoints[i].join(',')
        );
    }
    var coordinates= coordinateList.join('|');
    
    var api_key = app.routeServiceTokens[Math.floor(Math.random()*app.routeServiceTokens.length)];
    var url='https://api.openrouteservice.org/directions?api_key='+api_key ;
    url+= '&coordinates='+encodeURIComponent(coordinates);
    url+= '&profile='+ self.routeProfile;
    
    url+= '&format=geojson';

    
            $.ajax(url, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        var geojson=data;
                        var featureProjection='EPSG:3857';
                        var format = new ol.format.GeoJSON({ featureProjection:featureProjection,  dataProjection:'EPSG:4326'        });
                        var features;
                        try{
                         features= format.readFeatures(geojson);
                        }catch(ex){
                            try{
                             var geojsonObj=JSON.parse(geojson);
                             features= format.readFeatures(geojsonObj);
                            }catch(ex2){
             
                            }
                        }
                        if(features){
                            for(var j=0;j<features.length;j++){
                                features[j].set('isRoute',true) ;
                                self.createRouteTooltip(features[j]);
                                self.showRouteResult(features[j]);
                            }
                            self.source.addFeatures(features);
                        }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    var msg= errorThrown || textStatus;
                    if(xhr.responseJSON){
                        if(xhr.responseJSON.error && xhr.responseJSON.error.message){
                            msg= xhr.responseJSON.error.message;
                        }
                    }
                    var a = 1;
                    $.notify({
                        message: "Failed to find route, "+ msg
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
               
                  // source.refresh();
                }
            }).done(function() {
               
               // source.refresh();
            });
}
// V2
RouteTasks.prototype.findRoute = function () {
    var self=this;
    if(this.routeStopPoints.length<2)
    {
        return;
    }
    var coordinateList=[];
    for(var i=0;i<this.routeStopPoints.length;i++){
        coordinateList.push(
            this.routeStopPoints[i].join(',')
        );
    }
    var coordinates= coordinateList.join('|');
    
    var api_key = app.routeServiceTokens[Math.floor(Math.random()*app.routeServiceTokens.length)];
    var url='https://api.openrouteservice.org/v2/directions/'+self.routeProfile +'/geojson';
    
    
    
var data={coordinates :this.routeStopPoints};
    
            $.ajax(url, {
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                data:JSON.stringify(data),
                headers: {
                    'Authorization': api_key
                },
                // beforeSend: function (xhr) {
                //     if(api_key){   
                //         xhr.setRequestHeader('Authorization', api_key);
                //        // xhr.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
                //       //  xhr.setRequestHeader('Content-Type', 'application/json');
                //        }
                // },

                success: function (data) {
                    if (data) {
                        var geojson=data;
                        var featureProjection='EPSG:3857';
                        var format = new ol.format.GeoJSON({ featureProjection:featureProjection,  dataProjection:'EPSG:4326'        });
                        var features;
                        try{
                         features= format.readFeatures(geojson);
                        }catch(ex){
                            try{
                             var geojsonObj=JSON.parse(geojson);
                             features= format.readFeatures(geojsonObj);
                            }catch(ex2){
             
                            }
                        }
                        if(features){
                            for(var j=0;j<features.length;j++){
                                features[j].set('isRoute',true) ;
                                self.createRouteTooltip(features[j]);
                                self.showRouteResult(features[j]);
                            }
                            self.source.addFeatures(features);
                        }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    var msg= errorThrown || textStatus;
                    if(xhr.responseJSON){
                        if(xhr.responseJSON.error && xhr.responseJSON.error.message){
                            msg= xhr.responseJSON.error.message;
                        }
                    }
                    var a = 1;
                    $.notify({
                        message: "Failed to find route, "+ msg
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
               
                  // source.refresh();
                }
            }).done(function() {
               
               // source.refresh();
            });
}
RouteTasks.prototype.createRouteTooltip = function (feature) {
    var self=this;
    if(!feature){
        return;
    }
    var geom= feature.getGeometry();
    if(!geom)
        return;
    var element = document.createElement('div');
    element.className = 'tooltip tooltip-measure';
    var routeTooltip = new ol.Overlay({
        element: element,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    this.overlays.push(routeTooltip);
    this.map.addOverlay(routeTooltip);
    routeTooltip.getElement().parentNode.style.zIndex = this.map.getOverlays().getLength();
     var htm='';
     var summary= feature.get('summary');
     if(summary && summary.length){
        var result= summary[summary.length-1];
        var distanceStr=this.formatDistance(result.distance);
        htm+=' <i style="margin-right:0.2em;" class="'+self.getProfileIcon(self.routeProfile)+'"></i>';
        //htm+='Disatace:'+ distanceStr;
        htm+= distanceStr;
        var  durationStr=this.formatDuration(result.duration);
        //htm+='<br/>Duration:'+ durationStr;
        htm+=' <span style="margin-right:0.2em;" class="route-duration-label fa fa-clock-o"></span>'+ durationStr;
       
        // htm='<div class="route-total-info">';
        // htm+=' <i class="'+self.getProfileIcon(self.routeProfile)+'"></i>';
        // htm+=' <div class="route-total-distance">';
        // htm+='  <span class="route-distance-label">Disatance:</span>';
        // htm+='  <span class="route-distance-value">'+distanceStr+'</span>';
        // htm+=' </div>';
        // htm+='  <div class="route-total-duration">';
        // htm+='  <span class="route-duration-label fa fa-clock-o"></span>';
        // htm+='  <span class="route-duration-value">'+durationStr+'</span>';
        // htm+=' </div>';
        // htm+='</div>';
     }
    //formatLength
    element.innerHTML=htm;
    var coords=geom.getCoordinates();
    if(coords && coords.length){
        routeTooltip.setPosition(coords[coords.length-1]);
    }

}
RouteTasks.prototype.pointerMoveHandler = function (evt) {
    if (evt.dragging) {
        return;
    }
    if (!this.helpTooltip)
        return;
    var helpMsg = 'Click to start drawing';
    if(this.task==='route'){
        if(this.routeStopPoints.length==0){
            helpMsg = 'Origin';

        }else{
            helpMsg = 'Destination';
        }
    }else{
        if (this.sketch) {
            var geom = (this.sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                helpMsg = 'Click to continue drawing the polygon';
            } else if (geom instanceof ol.geom.LineString) {
                helpMsg = 'Click to continue drawing the line';
            }
        }
    }
    this.helpTooltipElement.innerHTML = helpMsg;
    this.helpTooltip.setPosition(evt.coordinate);
    this.helpTooltipElement.classList.remove('hidden');
};
RouteTasks.prototype.mouseoutHandler = function () {
    if (this.helpTooltipElement) {
        this.helpTooltipElement.classList.add('hidden');
    }
}

RouteTasks.prototype.formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};


RouteTasks.prototype.createHelpTooltip = function () {
    if (this.helpTooltipElement) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    this.helpTooltipElement = document.createElement('div');
    this.helpTooltipElement.className = 'tooltip hidden';
    if (this.helpTooltip) {
        this.map.removeOverlay(this.helpTooltip);
    }

    this.helpTooltip = new ol.Overlay({
        element: this.helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });

    //this.overlays.push(this.helpTooltip);
    this.map.addOverlay(this.helpTooltip);
    this.helpTooltip.getElement().parentNode.style.zIndex = 10000 + this.map.getOverlays().getLength();
}



RouteTasks.prototype.setMapEvents = function () {

    this._pointermove = this.map.on('pointermove', this.pointerMoveHandler.bind(this));
    this.map.getViewport().addEventListener('mouseout', this.mouseoutHandler.bind(this));
}
RouteTasks.prototype.removeMapEvents = function () {
    if (this._pointermove)
        ol.Observable.unByKey(this._pointermove);

    this.map.getViewport().removeEventListener('mouseout', this.mouseoutHandler);
}

RouteTasks.prototype.activateTab=function(){
    if(!this._tab){
        this._tab=$('.nav-tabs a[href="#' + this.tabId + '"]');//'show');
    }
    if(!this._tabContent){
        this.crateTabContent();
    }
    this._tab.parent('li').show();
    this._tab.tab('show');
  }
  
RouteTasks.prototype.clearTab = function () {
    this.clearStops();
    this.clearResults()
    
}
RouteTasks.prototype.clearResults = function () {
   
    if(this._resultsPanel){
        this._resultsPanel.html('')
    }
}
RouteTasks.prototype.clearStops = function () {
    if(this._stopsPanel){
        this._stopsPanel.html('')
    }
    this.getRouteStopPoints();
    this.drawStopPoints();
    
    
}
RouteTasks.prototype.hideTab=function(){
    if(!this._tab){
        this._tab=$('.nav-tabs a[href="#' + this.tabId + '"]');//'show');
    }

    this._tab.parent('li').hide();
  
    $('.nav-tabs a[href="#' + this.tabLayersId + '"]').tab('show');
  }
  RouteTasks.prototype.crateTabContent=function(){
    var self=this;
    if(!this._tab){
        return;
    }
    var tabPanel=$('#'+self.tabId);
    this.tabPanel=tabPanel;
    var htm='<div><form style="    padding-top: 0px;" id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
      
    var longitude;
    var latitude;
    htm+='<div id="'+self.tabId+'_profile"  class="route-profile-selection">';
    htm+='<i class="route-profile fa fa-lg fa-car active" data-profile="driving-car" title="Car"></i>'; 
    htm+='<i class="route-profile fa fa-lg fa-bus" data-profile="driving-hgv" title="Bus"></i>'; 
    htm+='<i class="route-profile fa fa-lg fa-bicycle" data-profile="cycling-regular" title="Bicycle"></i>'; 
    htm+='<i class="route-profile fa fa-lg fa-male" data-profile="foot-walking" title="Walking"></i>'; 
    htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#Route">?</a>';
    htm+='</div>'; 
    htm+='<div class="" id="'+self.tabId+'_stops" >';
    htm+='</div>'; 
    htm+='<div class="" id="'+self.tabId+'_results" >';
    htm+='</div>'; 

  
   htm+='</form></div>';

    var content=$(htm).appendTo( this.tabPanel); 
    this._tabContent= content;
    this._profilePanel= content.find('#'+self.tabId+'_profile');
    this._stopsPanel= content.find('#'+self.tabId+'_stops');
    this._resultsPanel= content.find('#'+self.tabId+'_results');
    this._profilePanel.find('.route-profile').click(function(){
        self.routeProfile= $(this).data('profile');
        self._profilePanel.find('.route-profile').removeClass('active');
        $(this).addClass('active');
        self.performTask();
    });

    var updateShape= function(){
      try{
      //   var lat=content.find('#latitude').val();
      //   var lon=content.find('#longitude').val();
      //   lat= parseFloat(lat);
      //   lon= parseFloat(lon);
      //   var newPoint= new ol.geom.Point([lon,lat]);
      //   newPoint.transform('EPSG:4326',mapProjection);
      //   self.feature.setGeometry(newPoint);
        }catch(ex){
          
        }
    };
 
    var $form = $(content.find('#'+self.tabId+'_form'));
    this._tabForm= $form;
     $form.find('input,textarea,select').change(function(){
        $(this).addClass('attribute-value-changed');
     });
}
RouteTasks.prototype.drawStopPoints=function(){
    var self=this;
    var view = this.map.getView();
    var mapProjection = view.getProjection();
    try{
        for(var i=0;i<self.routeStopFeatures.length;i++)
        {
            self.source.removeFeature(self.routeStopFeatures[i]);
        }
    }catch(ex){}
    this.routeStopFeatures=[];
    for(var i=0;i<self.routeStopPoints.length;i++)
    {
        var newPoint= new ol.geom.Point(self.routeStopPoints[i]);
        newPoint.transform('EPSG:4326',mapProjection);
        var feature = new ol.Feature();
        feature.setId(i+1);
        feature.setGeometry(newPoint);
        self.source.addFeature(feature);
        this.routeStopFeatures.push(feature)  ;
    }
   
    
  }
  RouteTasks.prototype.addStop=function(coords){
    var self=this;
    var view= this.map.getView();
    self.routeStopPoints.push(coords);
    var htm='';
    //var index= self.routeStopPoints.length;
    if(!this._stopId){
        this._stopId=1;
    }else
    {
        this._stopId++;
    }
    var lon=coords[0];
    var lat=coords[1];
    try{
        lon=lon.toFixed(4);
    }catch(ex){}
    try{
        lat=lat.toFixed(4);
    }catch(ex){}
    var strValue= lon +','+lat;
    htm+='<div class="form-group route-stop_item" style="    margin-bottom: 5px;">';
    
    htm+='    <div class="input-group" >';
    htm+='        <span class="input-group-addon route-stop-move-handler" >';
    htm+='        <span style="cursor:pointer" class="glyphicon glyphicon-move"></span>';
    //htm+='          <button type="button" class="route-stop-move-handler-icon btn btn-xs btn-info	"  title="Drag to reorder"  style="" ><span class="glyphicon glyphicon-move"></span> </button>';
    htm+='        </span>';
    htm+='        <span class="input-group-addon" >';
    htm+='          <button type="button" class="route-stop-pick btn btn-xs btn-info	"  title="Pick from map"  style="" ><span class="glyphicon glyphicon-map-marker"></span> </button>';
    htm+='        </span>';
    htm+='        <input type="text" name="stop_' + this._stopId+'" id="stop_' + this._stopId+'" value="' +strValue+ '" placeholder=""  class="route-stop-input form-control" data-val="false" data-val-required=""  />'
    htm+='        <span class="input-group-addon" >';
    htm+='          <button type="button"  class="route-stop-delete btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
    htm+='        </span>';
    htm+='    </div>';
    htm+='    <span class="field-validation-valid" data-valmsg-for="stop_' + this._stopId+'" data-valmsg-replace="true"></span>';
    htm+=' </div>';
    var itemContent=$(htm).appendTo( this._stopsPanel); 
    itemContent.find('.route-stop-input').on('input', function () {
        $(this).trigger('change');
      });
      itemContent.find('.route-stop-input').on('focus', function () {
        var stringVal=$(this).val();
        var vals= stringVal.split(',');
        try{
            lat= parseFloat(vals[1]);
            lon= parseFloat(vals[0]);
            if(!(isNaN(lat) || isNaN(lon))){
                
                var coords = ol.proj.transform([lon,lat], 'EPSG:4326',view.getProjection());   
                var p= new ol.geom.Point(coords);
                self.zoomToGeom(p);
            }
        }catch(ex){
        }
      });  
      itemContent.find('.route-stop-input').change(function(){
        self.performTask();
      }); 
    itemContent.find(".route-stop-delete").on("click", function (event) {
        $(this).closest(".form-group").remove();       
        self.performTask();
      });
      itemContent.find(".route-stop-pick").on("click", function (event) {
        var inputEl=$(this).closest(".form-group").find(".route-stop-input");
        self.pickStopFromMap(function(coords){
            var lon=coords[0];
            var lat=coords[1];
            try{
                lon=lon.toFixed(4);
            }catch(ex){}
            try{
                lat=lat.toFixed(4);
            }catch(ex){}
            var strValue= lon +','+lat;
            inputEl.val(strValue);
            self.performTask();
        })
        
      });

      ////https://github.com/farhadi/html5sortable
    //   $(this._stopsPanel).sortable({
    //     items:'.route-stop_item',
    //     handle:'.route-stop-move-handler',
    //     forcePlaceholderSize: true 
    //   });
    //   $(this._stopsPanel).sortable().bind('sortupdate', function(e, ui) {
    //     //ui.item contains the current dragged element.
    //     //Triggered when the user stopped sorting and the DOM position has changed.
    //     self.performTask();
    // });

    //https://github.com/SortableJS/Sortable
    var sortable =new Sortable(this._stopsPanel[0], {
        draggable:'.route-stop_item',
        handle: '.route-stop-move-handler', // handle's class
        animation: 150,
        direction:'vertical',
        onUpdate: function (evt) {
            self.performTask();
        },
    });

      self.performTask();
  }
  RouteTasks.prototype.getRouteStopPoints=function(){
    var self=this;
 
  self.routeStopPoints=[];
  if(!this._stopsPanel){
      return;
  }
  this._stopsPanel.find('.route-stop-input').each(function() {
      var stringVal=$(this).val();
      var vals= stringVal.split(',');
      try{
          lat= parseFloat(vals[1]);
          lon= parseFloat(vals[0]);
          if(!(isNaN(lat) || isNaN(lon))){
              self.routeStopPoints.push([lon,lat]);
              var prevStopIndex=$(this).data('stop-index');
              $(this).data('stop-index', self.routeStopPoints.length-1);
              $(this).removeClass('updating-record-faild');
          }else{
              $(this).addClass('updating-record-faild');    
          }
         
      }catch(ex){
          $(this).addClass('updating-record-faild');
      }
     
      
    });    
  
}
  RouteTasks.prototype.performTask=function(){
      var self=this;
      self.clear();
      self.clearResults();
    self.getRouteStopPoints();   
    self.drawStopPoints();
    if(self.routeStopPoints.length>=2){
        self.findRoute();
    }
  }
  
  RouteTasks.prototype.pickStopFromMap=function(callback){
    var self=this;
    var isActive= this.interaction.getActive();
    this.interaction.setActive(false);
    this.interaction.removeLastPoint();
    var map = this.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
  

    $.notify({
      message:"Click on map to define stop point coordinates."
  },{
      type:'info',
      delay:2000,
      animate: {
          enter: 'animated fadeInDown',
          exit: 'animated fadeOutUp'
      }
  }); 

    var interactionPointer = new ol.interaction.Pointer({
      handleDownEvent: function(e){
        
        map.removeInteraction(interactionPointer);
        interactionPointer.setActive(false);
        var lonlat = ol.proj.transform(e.coordinate, view.getProjection(), 'EPSG:4326');
                        
       var coords = ol.proj.transform(lonlat, 'EPSG:4326',view.getProjection());         
        if(callback){
        callback(lonlat);
        }
        setTimeout(function() {
            self.interaction.setActive(isActive);
        }, 2000);
        
      }
  });

  map.removeInteraction(interactionPointer);
  map.addInteraction(interactionPointer);
  interactionPointer.setActive(true);


  }
  RouteTasks.prototype.formatDistance=function(distance){
    if (distance > 1000) {
        return  (Math.round(distance / 1000 * 100) / 100) + ' ' + 'km';
    } else {
        return  (Math.round(distance * 100) / 100) + ' ' + 'm';
    }
  }
  RouteTasks.prototype.formatDuration=function(duration) {
    try{
        
        var d = Number(duration);
        if(d<60){
            return '< 1 min';
        }
        var h = Math.floor(d / 3600);
        //var m = Math.floor(d % 3600 / 60);
        var m = Math.round(d % 3600 / 60);
        //var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + (h == 1 ? " h" : " h") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " min" : " min") : "";
        //var sDisplay = s > 0 ? s + (s == 1 ? " s" : " s") : "";
       
        if(h>0){
              return hDisplay +','+ mDisplay;
        }else{
            return  mDisplay;//+',' + sDisplay; 
        }
    }catch(ex){
        return '';
    }
}
RouteTasks.prototype.getProfileIcon = function(code) {
    var c = "";
    switch (code) {
    case 'driving-car':
            c= "fa fa-lg fa-car";
        break;
    case 'driving-hgv':
        c= "fa fa-lg fa-bus";
        break;
    case 'cycling-regular':
        c= "fa fa-lg fa-bicycle";
        break;            
    case 'foot-walking':
        c= "fa fa-lg fa-male";
        break;        
    }
    return c;
}
  RouteTasks.prototype.showRouteResult=function(feature){
    var self=this;
    var self=this;
    var view = this.map.getView();
    var mapProjection = view.getProjection();
    if(!feature){
        return;
    }
    var geom= feature.getGeometry();
    if(!geom)
        return;
    
    
        var coordinates= geom.getCoordinates();
     var distanceStr='';
     var  durationStr='';
     var summary= feature.get('summary');

        var way_points= feature.get('way_points');
     var segments= feature.get('segments')   ;

     if(summary && summary.length){
        var result= summary[summary.length-1];
        distanceStr= self.formatDistance(result.distance);
        durationStr= self.formatDuration(result.duration);
     }
     htm+='<i class="route-profile fa fa-lg fa-car active" data-profile="driving-car" title="Car"></i>'; 
     htm+='<i class="route-profile fa fa-lg fa-bus" data-profile="driving-hgv" title="Bus"></i>'; 
     htm+='<i class="route-profile fa fa-lg fa-bicycle" data-profile="cycling-regular" title="Bicycle"></i>'; 
     htm+='<i class="route-profile fa fa-lg fa-male" data-profile="foot-walking" title="Walking"></i>'; 
     
     var htm='';
     htm='<div class="route-total-info">';
     htm+=' <i class="'+self.getProfileIcon(self.routeProfile)+'"></i>';
     htm+=' <div class="route-total-distance">';
     htm+='  <span class="route-distance-label">Disatance:</span>';
     htm+='  <span class="route-distance-value">'+distanceStr+'</span>';
     htm+=' </div>';
     htm+='  <div class="route-total-duration">';
     htm+='  <span class="route-duration-label fa fa-clock-o"></span>';
     htm+='  <span class="route-duration-value">'+durationStr+'</span>';
     htm+=' </div>';
     htm+='</div>';
     
     var total_info=$(htm).appendTo( this._resultsPanel);
     total_info.data('path_line',geom);
     total_info.click(function(){
        self.clearPathSegment();
        self.zoomToGeom($(this).data('path_line'))
     });

     var getIcon = function(code) {
        var arrow = "fa fa-arrow-up ";
        var enterRoundabout = "";
        var exitRoundabout = "";
        var uTurn = "";
        var finish = "";
        switch (code) {
        case 0:
            arrow += "fa-rotate-270";
            break;
        case 1:
            arrow += "fa-rotate-90";
            break;
        case 2:
            arrow += "fa-rotate-225";
            break;
        case 3:
            arrow += "fa-rotate-135";
            break;
        case 4:
        case 12:
            arrow += "fa-rotate-315";
            break;
        case 5:
        case 13:
            arrow += "fa-rotate-45";
            break;
        case 6:
            break;
        case 7:
            break;
        case 8:
            break;
        case 9:
            break;
        case 10:
            break
        }
        return arrow
    }
     htm='';
     for(var i=0;segments && i<segments.length;i++){
         var seg= segments[i];
         var seg_distance='';
         var seg_duration='';
         if(typeof seg.distance !=='undefined'){
             seg_distance= self.formatDistance(seg.distance);
         }
         if(typeof seg.duration !=='undefined'){
            seg_duration= self.formatDistance(seg.duration);
         }
         var steps= seg.steps;
         for(var j=0;steps && j<steps.length;j++){
             var step= steps[j];
             var step_name= step['name'];
             var step_instruction= step['instruction'];
             var step_distance='';
             var step_duration='';
             if(typeof step.distance !=='undefined'){
                 step_distance= self.formatDistance(step.distance);
             }
             if(typeof step.duration !=='undefined'){
                step_duration= self.formatDistance(step.duration);
             }
             var way_points=step.way_points;
             htm=''
             htm='<div class="route-step-info">';
             htm+=' <div class="route-step-name">';
             htm+=step_name;
             htm+=' </div>';
             htm+=' <div class="route-step-instruction">';
             htm+=' <i class="'+getIcon(step.type)+'"></i>';
             htm+=step_instruction;
             htm+=' </div>';
             htm+=' <div class="route-step-distance">';
           
             htm+='  <span class="route-step-distance-label"> </span>';
             htm+='  <span class="route-step-distance-value">'+step_distance+'</span>';
             htm+=' </div>';
             htm+='  <div class="route-step-duration">';
             htm+='  <span class="route-step-duration-label fa fa-clock-o"></span>';
             htm+='  <span class="route-step-duration-value">'+step_duration+'</span>';
             htm+=' </div>';
             htm+='</div>';

             var seg_line=undefined;
             if(way_points && way_points.length && coordinates && coordinates.length ){
                var seg_coords=[];

                for(var w=0;w<way_points.length-1;w++){
                    var fw=way_points[w];
                    var tw=way_points[w+1]
                    for(var c=fw;c<=tw && c< coordinates.length;c++){
                        seg_coords.push(coordinates[c]);
                    }
                    
                }
                seg_line= new ol.geom.LineString(seg_coords);
                //seg_line.transform('EPSG:4326',mapProjection);
             }

             var step_info=$(htm).appendTo( this._resultsPanel);
             
             step_info.data('seg_line',seg_line);
             step_info.click(function(){
                 self.drawPathSegment($(this).data('seg_line'));
                 self.zoomToGeom($(this).data('seg_line'));
             });
             step_info.dblclick(function(){
                //self.zoomToGeom($(this).data('seg_line'));
            })
         }

         
     }
}
RouteTasks.prototype.clearPathSegment=function(seg_line){

    if(this.segementFeature){
        try{
            this.source.removeFeature(this.segementFeature);
        }catch(ex){}
    }
    this.segementFeature=null;
}
RouteTasks.prototype.drawPathSegment=function(seg_line){
    var self=this;
    var view = this.map.getView();
    var mapProjection = view.getProjection();
    if(!seg_line){
        return;
    }
   if(!this.segementFeature){
    this.segementFeature= new ol.Feature();
    this.segementFeature.setGeometry(seg_line);
    this.segementFeature.set('is_segment',true)
    self.source.addFeature(this.segementFeature);
   } else{
       this.segementFeature.setGeometry(seg_line);
   }
  }
  RouteTasks.prototype.zoomToGeom=function(geom){
    if(!geom){
        return;
    }
    var map=this.map;   
    var view = map.getView();
    var resolution = view.getResolutionForExtent(geom.getExtent(), map.getSize());
    var zoom = Math.floor(view.getZoomForResolution(resolution));
    var center = ol.extent.getCenter(geom.getExtent());
    // redraw before zoom
    setTimeout(function(){
            view.animate({
            center: center,
            zoom: Math.min (zoom, 21)
        });
    }, 100);
  }