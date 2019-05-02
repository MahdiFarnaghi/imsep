function MapContainer(app, options) {
  this.app = app;
  this.options = options || {};
  this.mapSettings = {};
  this.sorceFactory= new SourceFactory(app,{});
  this.leftToolbar=null;

  //this._currentEditAction=null;
  ol.Object.call(this, {
      'currentTool':null,
      currentEditAction:null
    });
}
ol.inherits(MapContainer, ol.Object);

MapContainer.prototype.getActiveLayer = function() {
  return this.switcher.getActiveLayer();
}
MapContainer.prototype.setActiveLayer = function(layer) {
  this.switcher.setActiveLayer(layer);
}
MapContainer.prototype.setCurrentEditAction = function(action) {
    this.set('currentEditAction', action);
}
MapContainer.prototype.getCurrentEditAction = function() {
    return this.get('currentEditAction');
}
MapContainer.prototype.setCurrentTool = function(tool) {
    var prevTool= this.get('currentTool');
    var prevDeactivateEventArg={
        cancel:false,
        newTool:tool
    }
    if(prevTool){
        if(prevTool.onDeactivate){
            prevTool.onDeactivate(prevDeactivateEventArg);
        }
    }
    if(prevDeactivateEventArg.cancel)
    {
        return;
    }
    this.set('currentTool', tool);
    if(tool && tool.onActivate){
        tool.onActivate({prevTool:prevTool});
    }
}
MapContainer.prototype.getCurrentTool = function() {
    return this.get('currentTool');
}
MapContainer.prototype.create = function() {
  var self = this;
  // Popup overlay
  var popup = new ol.Overlay.Popup({
      popupClass: "default shadow", //"tooltips", "warning" "black" "default", "tips", "shadow",
      closeBox: false,
      //onshow: function(){ console.log("You opened the box"); },
      //onclose: function(){ console.log("You close the box"); },
      positioning: 'auto',
      autoPan: true,
      autoPanAnimation: {
          duration: 250
      }
  });
  
  this.popup = popup;
  
  var map = this.map = new ol.Map({
      target: this.options.targetEl || 'map',
      layers: [
        //new ol.layer.Group({
        //    layers: [
                new ol.layer.Tile({
                title: "OSM",
                // baseLayer:true,
                source: new ol.source.OSM(),
                noSwitcherInfo: true,
                custom: {
                    baseLayer: true,
                    type: 'ol.layer.Tile',
                    source: 'ol.source.OSM'
                }
            })
        //],
        //    name: 'Base layers'
        //})
          
      ],
      overlays: [popup],

      //controls: ol.control.defaults().extend([
      //  new OlPanelControl({id:'testPanel',cssText:'left:30px;top:10%;height:80%;width:100px;background-color:yellow;' })
      //]),
      view: new ol.View({
          center: ol.proj.fromLonLat([(app.initMap_Lon|| 0), (app.initMap_Lat ||0)]),
         
          zoom: app.initMap_Zoom || 4
        //
          ,extent:ol.proj.get("EPSG:3857").getExtent()
          //,extent: ol.proj.transform([-180,-90,180,90],'EPSG:4326', 'EPSG:3857')
      })
  });

  var interactionSelectPointerMove = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove,
    filter:function(feature, layer){
        if(self.switcher.getActiveLayer()==layer)
            return true;
         else
           return false;   
    }
    // ,
    // style:function(feature,resolution){
    //  return   new ol.style.Style({
    //         stroke: new ol.style.Stroke({
    //             color: 'blue',
    //             width:3
    //         }),
    //         // fill: new ol.style.Fill({
    //         //     color: 'rgba(100,100,100,0.6)'
    //         // }),
    //         image: new ol.style.Circle({
    //             radius: 1,
    //             fill: new ol.style.Fill({
    //                 color: '#00ffff'
    //             }),
    //             stroke: new ol.style.Stroke({
    //                 color: 'blue',
    //                 width:3
    //             })
    //         })
    //     })
    // } 
});
map.addInteraction(interactionSelectPointerMove);

var dragAndDropInteraction = new ol.interaction.DragAndDrop({
    formatConstructors: [
      ol.format.GPX,
      ol.format.GeoJSON,
      ol.format.IGC,
      ol.format.KML,
      ol.format.TopoJSON
    ]
  });

  dragAndDropInteraction.on('addfeatures', function(event) {
    if(event.features && event.features.length){
        var layerName='';
        if(event.file && event.file.name){
            layerName=event.file.name;
        }
        if(app.identity && (app.identity.isAdministrator || app.identity.isPowerUser || app.identity.isDataManager|| app.identity.isDataAnalyst) ){
            var projection= event.projection || map.getView.getProjection();
            var format = new ol.format.GeoJSON({ featureProjection:projection,  dataProjection: 'EPSG:4326' });
            var geojson = format.writeFeatures(event.features);
            var dlg = new DlgAddGeoJSON(this, null, {
                title:'Add GeoJSON',
                initData:{
                    layerName:layerName,
                    geojson:geojson
                },
                onapply:function(dlg,data){
                    self.addGeoJSON_data(data);
                }   
              }).show();
        }
        
    }
  });
  map.addInteraction(dragAndDropInteraction);
  // var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'left' });
  //  map.addControl(sidebar);
  //  var sidebar = $('#sidebar').sidebar();

  // Add a layer switcher outside the map
  var switcher = new ol.control.LayerSwitcher(
      //{	target:$(".layerSwitcher").get(0), 
      {
          target: $("#layerSwitcher").get(0),
          // displayInLayerSwitcher: function (l) { return false; },
          reordering: true,
          show_progress: true,
          extent: true,
          trash: true
              //, oninfo: function (l) { alert(l.get("title")); }
              ,
          onClick: function(l) {
              //var layerPropertiesDlg = new ObjectPropertiesDlg(self, l, {});
              //layerPropertiesDlg.show();
              // alert(l.get("title"));
          },
          onDblClick: function(l) {
            var layerCustom= l.get('custom');
            if(layerCustom && layerCustom.format==='ol.format.OSMXML' ){
              //  l.getSource().clear();
            }
            self.zoomToLayer (l);
          }
      });
  // // Add a new button to the list 
  // switcher.on('drawlist', function(e){
  //   var layer = e.layer;
  //   $('<br /><div>').text('...')// addClass('layerInfo')
  //     .click(function(){
  //       alert(layer.get('title'));
  //     })
  //     .appendTo($('> .ol-layerswitcher-buttons', e.li));

  // });
  switcher.on('drawlist', function(e){
    var layer = e.layer;
    $('<div style="margin-left:1em;color:#336699;background-color:transparent;"><i class="fa fa-bars"></i></div>')// addClass('layerInfo')
      .click(function(){
          self.showLayerProperties(layer);
       
      })
      .appendTo($('> .ol-layerswitcher-buttons', e.li));

  });
  switcher.on('activeLayerChanged', function(e) {
      self.OnActiveLayerChanged();
  });

  switcher.on('beforeLayerRemoved', function(e) {
    e.cancel=true;
    var layerToRemove= e.layer;
    var msg = 'Remove layer (' + layerToRemove.get('title') +  ')?';
    
    confirmDialog.show(msg, function (confirm) {

        if (confirm) {
            map.removeLayer(layerToRemove);
            var layerTasks= layerToRemove.get('layerTasks');
            if(layerTasks && layerTasks.OnDeActivated){
                layerTasks.OnDeActivated();
            }
        }
    },
        {
            dialogSize: 'sm',
            alertType: 'danger'
        }
    );
  });

  this.switcher = switcher;
  map.addControl(switcher);

  this.mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    // comment the following two lines to have the mouse position
    // be placed within the map.
    //className: 'custom-mouse-position',
    className: '',
    target: document.getElementById('mousePosition'),
    //undefinedHTML: '&nbsp;'
    undefinedHTML: ''
    
  });
  map.addControl(this.mousePositionControl);

  // Main control bars
  this.leftToolbar = new ol.control.Bar();
  this.leftToolbar.setPosition('top-left');
  map.addControl(this.leftToolbar);
  this.topToolbar = new ol.control.Bar();
  this.topToolbar.setPosition('top');
  map.addControl(this.topToolbar);
  this.rightToolbar = new ol.control.Bar();
  this.rightToolbar.setPosition('right');
  map.addControl(this.rightToolbar);
  this.bottomToolbar = new ol.control.Bar();
  this.bottomToolbar.setPosition('bottom');
  map.addControl(this.bottomToolbar);
  
  // Add a simple push button to save features
  this.btnLayerProperties = new ol.control.Button({
      html: '<i class="fa fa-bars"></i>',
      className:'myOlbutton24',
      title: "Layer Properties",
      handleClick: function(e) {
          //var json= new ol.format.GeoJSON().writeFeatures(vector.getSource().getFeatures());
          //info(json);
          self.showLayerProperties(self.getActiveLayer());
         
      }
  });
  this.leftToolbar.addControl(this.btnLayerProperties);
  this.btnLayerProperties.setVisible(false);

  var identifyTool = new ol.control.Toggle({
    html: '<span style="display:block;line-height:28px;background-position:center center" class="identify_24_Icon" >&nbsp;</span>',
    className:'myOlbutton24',
    title: 'Identify features',
    onToggle: function (toggle) {
        if (!toggle) {
            self.setCurrentTool(null);
            return;
        }
        self.setCurrentTool({
            name: 'identify_tool',
            cursor:function(map,e){
                //c='url("/css/images/identify_24_cursor.png")1 1,auto';
                c='';
                var pixel = map.getEventPixel(e.originalEvent);
                var hit = map.hasFeatureAtPixel(pixel,{});
                    if(hit){
                       // c='url("/css/images/identify_24_cursor_hover.png")1 1,auto'; 
                       c='url("/css/images/identify_24_cursor.png")1 1,auto'; 
                    }
                    return c;
              },
            onActivate: function (event) {
                
            },
            onDeactivate: function (event) {
                identifyTool.setActive(false);  
                self.popup.hide();
            }
        });
       
    }
    //,
    // autoActivate: true,
    // active: true
});
this.topToolbar.addControl(identifyTool);
  this.measureTasks= new MeasureTasks(this.app,this,{});
  this.measureTasks.OnActivated();
 
  this.routeTasks= new RouteTasks(this.app,this,{});
  this.routeTasks.OnActivated();
  
  if (location.protocol === 'https:') {
    //this.geolocationTasks= new GeolocationTasks(this.app,this,{});
    //this.geolocationTasks.OnActivated();
   }
  


  // Set the search control 
	var search = new ol.control.SearchNominatim (
		{
            className:'search nominatim ',
            	//target: $(".options").get(0),
			polygon: true,// $("#polygon").prop("checked"),
			position: true	// Search, with priority to geo position
		});
	map.addControl (search);
    // Select feature when click on the reference index
    var sLayer= this.measureTasks.layer;
    search.on('select', function(e)
    {	// console.log(e);
        sLayer.getSource().clear();
        // Check if we get a geojson to describe the search
        if (e.search.geojson) {
            var format = new ol.format.GeoJSON();
            var f = format.readFeature(e.search.geojson, { dataProjection: "EPSG:4326", featureProjection: map.getView().getProjection() });
            sLayer.getSource().addFeature(f);
            var view = map.getView();
            var resolution = view.getResolutionForExtent(f.getGeometry().getExtent(), map.getSize());
            var zoom = view.getZoomForResolution(resolution);
            var center = ol.extent.getCenter(f.getGeometry().getExtent());
            // redraw before zoom
            setTimeout(function(){
                    view.animate({
                    center: center,
                    zoom: Math.min (zoom, 16)
                });
            }, 100);
        }
        else {
            map.getView().animate({
                center:e.coordinate,
                zoom: Math.max (map.getView().getZoom(),16)
            });
        }
    });

// Define a new legend
var legend = new ol.control.Legend({ 
    title: 'Legend',
    //marginBottom: 20 ,
    collapsed: false
  });
  map.addControl(legend);
  legend.on('select', function(e) {
    if (e.index >= 0) {

    }
    if(e.row && e.row.data && e.row.data.layer){

       var custom= e.row.data.layer.get('custom');
       var activeTab=1;
        if(custom && custom.displayInLegend){
            if(custom.type === 'ol.layer.Vector'){
                activeTab=1;
            }else if (custom.type === 'ol.layer.Image' && custom.source==='ol.source.GeoImage'){
                activeTab=3;
            }
        }

        self.showLayerProperties(e.row.data.layer,activeTab);
    }
  });
this.legend=legend;
 map.getLayerGroup().on('change', function() {self.refreshLegend()});
 map.on('moveend', function() {self.refreshLegend()});


 var scaleLineControl = new ol.control.CanvasScaleLine();
    map.addControl(scaleLineControl);
    this.scaleLineControl=scaleLineControl;

 


  var mapElement = map.getTarget();
  mapElement = typeof mapElement === "string" ? $("#" + mapElement) : $(mapElement);
  map.on('pointermove', function(e) {
      if (e.dragging) {
          popup.hide();
          return;
      }
      var ct=self.getCurrentTool();
      var tCursor='';
      if(ct){
          if(ct.cursor){
              if(typeof ct.cursor ==='function')
              {
                  tCursor= ct.cursor(map,e);
              }else{
                  tCursor= ct.cursor;
              }
          }
          if(tCursor){
            mapElement.css("cursor", tCursor);  
            return;
          }
      }
      var pixel = map.getEventPixel(e.originalEvent);
      var hit = map.hasFeatureAtPixel(pixel);
      //mapElement.css("cursor", hit ? 'pointer' : 'url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/9632/happy.png"),auto');
      mapElement.css("cursor", hit ? 'pointer' : tCursor);

  });
  map.on('singleclick', function(evt) {
    var ct=self.getCurrentTool();
    //if(!ct){
    //    return;
   // }
    if(ct && ct.name !=='identify_tool'){
        return;
    }
      var coordinate = evt.coordinate;
      var pixel = map.getPixelFromCoordinate(coordinate);
      popup.hide();
     
    //   if(self.getCurrentEditAction()=='draw' || self.getCurrentEditAction()=='edit')
    //   {
    //     return;
    //   }
      var featureAt = map.forEachFeatureAtPixel(pixel,
       function(feature, layer) {
          return {
              feature: feature,
              layer: layer
          };
      },{
          layerFilter: function(layer){
            if(layer.get('custom') && (layer.get('custom').type=='measure' || layer.get('custom').type=='temp' || layer.get('custom').hiddenInToc )) 
                return false;
            else
                return true;
          }
        });

      if (featureAt && featureAt.feature) {
        var fieldsDic={};
        var fields=null;
        var anyData=false;
        if(featureAt.layer){
            fields= LayerHelper.getFields(featureAt.layer);
            if(fields){
                fieldsDic={};
                for(var i=0;i< fields.length;i++){
                    var fld= fields[i];
                    var fldName=fld.name;
                    var title= fld.alias|| fldName;
                    fieldsDic[fldName]= title;
                  }
            }
            
        }
       
            
          var feature = featureAt.feature;
          var layer=featureAt.layer;
          var content = "";
          //content += "<img src='"+feature.get("img")+"'/>";
          content += '<table class="table table-striped table-condensed">';
          content += '<thead>';
          if(layer && layer.get('title')){
            content += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title')+'</th></tr>';    
          }else{
            content += '<tr><th>Field</th><th>Value</th></tr>';
          }
          content += '</thead>';
          content += '<tbody>';
          var properties = feature.getProperties();
          var geom = feature.getGeometry();
          
          if(fields){
            anyData=true;
            for(var i=0;i< fields.length;i++){
                var fld= fields[i];
                var fldName=fld.name;
                var title= fld.alias|| fldName;
                var visible=true;
                if(typeof fld.visible !=='undefined'){
                    visible= fld.visible;
                }
                if(typeof fld.hidden !=='undefined'){
                    visible= !fld.hidden;
                }
                if(visible){
                   
                    var key= fldName;
                    content += '<tr>';
                    content += '<td>';
                    content +=  fieldsDic[key] || title;
                    content += '</td>';
                    content += '<td>';
                    content += properties[key];
                    content += '</td>';
                    content += '</tr>';
                }
            }
          }else{
            for (var key in properties) {
                if (key !== 'geometry') {
                    anyData=true;
                    content += '<tr>';
                    content += '<td>';
                    content +=  fieldsDic[key] || key;
                    content += '</td>';
                    content += '<td>';
                    content += properties[key];
                    content += '</td>';
                    content += '</tr>';
                }
            }
          }
         if(false){ 
            if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
                var shapeArea = MapContainer.formatArea(geom);
                content += '<tr>';
                content += '<td><i class="text-info">';
                content += 'ShapeArea' ;
                content += '</i></td>';
                content += '<td>';
                content += shapeArea;
                content += '</td>';
                content += '</tr>';
                var shapeLength = MapContainer.formatLength(geom);
                content += '<tr>';
                content += '<td><i class="text-info">';
                content += 'ShapeLength' ;
                content += '</i></td>';
                content += '<td>';
                content += shapeLength;
                content += '</td>';
                content += '</tr>';
            } else if (geom instanceof ol.geom.LineString) {
                var shapeLength = MapContainer.formatLength(geom);
                content += '<tr>';
                content += '<td><i class="text-info">';
                content += 'ShapeLength' ;
                content += '</i></td>';
                content += '<td>';
                content += shapeLength;
                content += '</td>';
                content += '</tr>';
            }
          }
          content += '</tbody>';
          content += '</table>';

        
          var labelPoint = geom.getFirstCoordinate();
          if (geom.getCenter)
              labelPoint = geom.getCenter();
          else if (geom.getExtent) {
              labelPoint = ol.extent.getCenter(geom.getExtent());
          }
          //popup.show(labelPoint, content); 
          if(anyData){
            popup.show(coordinate, content);
            popup.getElement().parentNode.style.zIndex= 500 + map.getOverlays().getLength();
          }
      }
  });
}
MapContainer.formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 1000) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};


MapContainer.formatArea = function (polygon) {
    var area = ol.sphere.getArea(polygon);
    var output;
    if (area > 1000000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};
MapContainer.prototype.showLayerProperties=function(layer,activeTabIndex){
    var self=this;
    var layerPropertiesDlg = new ObjectPropertiesDlg(self, layer, {
        tabs:[
            new LayerGeneralTab(),
            new LayerStyleTab(),
            new LayerLabelTab(),
            new RasterDisplayTab(),
            new LayerSourceTab(),
          ],
          activeTabIndex:activeTabIndex,
          helpLink:'/help#layerProperties'
    });
    layerPropertiesDlg.show();
}
MapContainer.prototype.OnActiveLayerChanged=function(){
    var activeLayer = this.getActiveLayer();
    if(this._lastActiveLayer != activeLayer){
        var allLayers=this.getAllLayersList();
        for(var i=0 ;i< allLayers.length;i++){
            var layer= allLayers[i];
            var layerTasks= layer.get('layerTasks');
            if(layerTasks && layerTasks.OnDeActivated){
                layerTasks.OnDeActivated();
            }
        }
        this._lastActiveLayer= activeLayer;
        if(activeLayer){
            var layerTasks= activeLayer.get('layerTasks');
            if(layerTasks && layerTasks.OnActivated){
                layerTasks.OnActivated();
            }
        }
        this.updateUI();
        var custom;
        if(activeLayer){
          custom= activeLayer.get('custom');
        }
        if(custom && custom.dataObj && custom.source_schema_updatedAt){
            var infoUrl='/datalayer/' + custom.dataObj.id+'/info';
            $.ajax(infoUrl, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        if( typeof data.status !=='undefined'){
                            if(!data.status){
                                // layer does not exist
                                var source=activeLayer.getSource();
                                if(source){
                                    source.set('loading_details','Source does not exist');
                                    source.set('loading_status','failed');
                                }
                                return;
                            }
                        }
                        if(data.updatedAt !== custom.source_schema_updatedAt){
                            // source is changed
                            custom.source_schema_out_of_date=true;
                            var source=activeLayer.getSource();
                            if(source){
                              //  source.set('loading_details','Source definition is out of date.');
                               // source.set('loading_status','out_of_date');
                            }
                            try{
                                custom.dataObj= data;
                                LayerHelper.setDetails(activeLayer,JSON.parse(data.details));
                                custom.source_schema_updatedAt=data.updatedAt;
                                source.set('loading_details','Source definition is updated.');
                                source.set('loading_status','out_of_date');
                                custom.source_schema_out_of_date=false;
                            }catch(ex){
                                source.set('loading_details','Source definition is out of date.');
                                source.set('loading_status','out_of_date');
                            }
                        }else{
                            var source=activeLayer.getSource();
                            if(source.get('loading_status')=='out_of_date'){
                                source.set('loading_status','');
                            }
                        }
                    
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                
                }
                }).done(function (response) {
                
                });
            }


    }
}
MapContainer.prototype.zoomToLayer = function(layer) {
    var self=this;
    if(!layer){
        return;
    }
    var layerCustom= layer.get('custom');
    if(layerCustom && layerCustom.dataObj && 
        (layerCustom.format=='ol.format.OSMXML'))  {
    
            if(layerCustom.dataObj.options && layerCustom.dataObj.options.info && layerCustom.dataObj.options.info.epsg4326Extent ){
                var epsg4326Extent= layerCustom.dataObj.options.info.epsg4326Extent;
                this.setGeoExtent(epsg4326Extent[0],epsg4326Extent[1],epsg4326Extent[2],epsg4326Extent[3]);
                return;
            }

    }
    if(layerCustom && layerCustom.dataObj && 
        (layerCustom.format=='ol.format.GeoJSON' || layerCustom.source === 'ol.source.GeoImage'))  {
        var source= layer.getSource();
        var extent;

        if(source.getExtent){
        extent=source.getExtent();
        }
        if(extent && extent[0]!==Infinity){
            try{
                this.map.getView().fit(extent, {size:this.map.getSize()});
                return;
            }catch(ex){

            }
        }
        if(source.requestExtent){
            source.requestExtent(function(extent){
                if(extent && extent[0]!==Infinity){
                    try{
                        self.map.getView().fit(extent, {size:self.map.getSize()});
                        return;
                    }catch(ex){
        
                    }
                }
            })
        }
    }
    var details= LayerHelper.getDetails(layer);
    if(details){
        this.setGeoExtent(details.ext_west,details.ext_south,details.ext_east,details.ext_north);
    }

},

MapContainer.prototype.zoomToFeature = function(feature) {
    var self=this;
    if(!feature){
        return;
    }
    var geom;
    if(feature.getGeometry){
        geom= feature.getGeometry();
    }
    if(!geom){
        return;
    }

    var extent = geom.getExtent();
    try{
        if(extent){
            if(extent[0]==extent[2] && extent[1]==extent[3]){
                var size=this.map.getSize();
                this.map.getView().fit(extent,{size:size,maxZoom:16});
            }else{
        
                this.map.getView().fit(extent,{size:this.map.getSize()});
            }
        }
    }catch(ex0){
        
    }
    
},
MapContainer.prototype.setGeoExtent = function(west,south,east,north) {
    if(typeof west =='undefined')
        return;
    if(typeof south =='undefined')
        return;
    if(typeof east =='undefined')
        return;
    if(typeof north =='undefined')
        return;
    if(isNaN (west))
        return;
    if(isNaN (south))
        return;
    if(isNaN (east))
        return;
    if(isNaN (north))
        return;                
    var map = this.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    var extent = [west,south,east,north];
    extent = ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", mapProjectionCode));
    map.getView().fit(extent,{size:map.getSize()});
},
MapContainer.prototype.updateUI = function() {
      var activeLayer = this.getActiveLayer();
      if (activeLayer)
          this.btnLayerProperties.setVisible(true);
      else
          this.btnLayerProperties.setVisible(false);
},
MapContainer.prototype.loadFromJson = function(mapJsonStr) {
    
      var mapJson = JSON.parse(mapJsonStr);
      this.load(mapJson);
}
MapContainer.prototype.load = function(mapSettings) {
  this.mapSettings = mapSettings;
  this.setActiveLayer(null);
  if (mapSettings.details) {
      try {
        if (typeof mapSettings.details === 'string' || mapSettings.details instanceof String){
            mapSettings.details = JSON.parse(mapSettings.details);
        }
      } catch (ex) {}
  }
  this.mapSettings = mapSettings;

  var map = this.map;
  var view = map.getView();
  var mapProjectionCode = view.getProjection().getCode();


  if (mapSettings.details && mapSettings.details.navState) {
      view.setCenter(mapSettings.details.navState.center);
      view.setZoom(mapSettings.details.navState.zoom);
      view.setRotation(mapSettings.details.navState.rotation);
  } else if (typeof mapSettings.ext_north != 'undefined' && mapSettings.ext_north !== null) {
      var extent = [mapSettings.ext_west, mapSettings.ext_south, mapSettings.ext_east, mapSettings.ext_north];



      extent = ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", mapProjectionCode));
      map.getView().fit(extent, {size:map.getSize()});
  }
  var details = mapSettings.details;
  if (details && details.layers && details.layers.length) {
      map.getLayers().clear();
      for (var i = 0; i < details.layers.length; i++) {
          var layerInfo = details.layers[i];
          this.addLayer(layerInfo);
          
      }
  }
  if (mapSettings.preview) {
      var zoomLayer;
      for (var i = 0; i < mapSettings.preview.length; i++) {
          zoomLayer=this.addData(mapSettings.preview[i]);
      }
      this.zoomToLayer(zoomLayer);
      this.legend.setVisible(false);
  }

  // var vectorSource = new ol.source.Vector({
  //   format: new ol.format.GeoJSON({
  //     dataProjection:'EPSG:3857'
  //   }),

  //   url: '/datalayer/1/geojson'
  // });

  // // a vector layer to render the source
  // var vectorLayer = new ol.layer.Vector({
  //   title:'test layer1',
  //   source: vectorSource
  // });

  // map.addLayer(vectorLayer);
  if(details && details.ui){
      this.legend.setVisible(details.ui.legend);
  }
}
MapContainer.prototype.addLayer = function(layerInfo,parentLayer) {
    var newLayer = this.createLayer(layerInfo);
    if(newLayer){
        if(!parentLayer){
             parentLayer = this.getActiveLayer();
        }
        if (parentLayer && parentLayer instanceof ol.layer.Group){
            parentLayer.getLayers().push(newLayer);
        }else{
            this.map.addLayer(newLayer);
        }
        if(newLayer && layerInfo.layerGroup && layerInfo.layers ){
            for (var i = 0; i < layerInfo.layers.length; i++) {
                var childlayerInfo = layerInfo.layers[i];
                var newChildLayer= this.addLayer(childlayerInfo,newLayer);
                
            }
        }
    }
    return newLayer;
}
MapContainer.prototype.createLayer = function(layerInfo) {
    var newLayer = null;
  if (!layerInfo)
      return newLayer;

  if(layerInfo.layerGroup){
    newLayer=new ol.layer.Group({
        layers: [],
        name: layerInfo['name'],
        title: layerInfo.title,
        opacity: layerInfo.opacity
    });
    if(typeof layerInfo.visible !=='undefined'){
        newLayer.set('visible',layerInfo.visible?true:false);
    }
    return newLayer;
  }

   var defaultVectorStyle=  StyleFactory.randomStyle();
 
  if (layerInfo.custom && layerInfo.custom.type === 'ol.layer.Tile') {
    if (layerInfo.custom.source === 'ol.source.WMS') {
        var dataObj = layerInfo.custom.dataObj;
        var wmsSource = this.sorceFactory.createWMSSource(dataObj);
        if (wmsSource) {
            newLayer = new ol.layer.Tile({
                title: layerInfo.title,
                //  baseLayer:layerInfo.custom.baseLayer,
                source: wmsSource,

                opacity: layerInfo.opacity,
                noSwitcherInfo: true,
                custom: {
                    baseLayer: layerInfo.custom.baseLayer,
                    type: 'ol.layer.Tile',
                    source: 'ol.source.WMS',
                    dataObj: dataObj,
                    displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:false
                }
            });
            var layerTasks= new LayerTasks(this.app,this,newLayer,{});
            newLayer.set('layerTasks', layerTasks);  
          
        }
    } else if (layerInfo.custom.source === 'ol.source.OSM') {
        newLayer = new ol.layer.Tile({
            title: layerInfo.title,
            //  baseLayer:layerInfo.custom.baseLayer,
            source: this.sorceFactory.createBaseTileSource({type:'OSM'}),

            opacity: layerInfo.opacity,
            noSwitcherInfo: true,
            custom: {
                baseLayer: layerInfo.custom.baseLayer,
                type: 'ol.layer.Tile',
                source: 'ol.source.OSM',
                dataObj: layerInfo.custom.dataObj,
                displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:false
            }
        });
        var layerTasks= new LayerTasks(this.app,this,newLayer,{});
        newLayer.set('layerTasks', layerTasks);  
    } else if (layerInfo.custom.source === 'ol.source.BingMaps') {
        newLayer = new ol.layer.Tile({
            //  baseLayer:layerInfo.custom.baseLayer,
            title: layerInfo.title,
            source:this.sorceFactory.createBaseTileSource({type:'BingMaps',key:layerInfo.custom.key ,imagerySet:layerInfo.custom.imagerySet}),
            noSwitcherInfo: true,

            opacity: layerInfo.opacity,
            custom: {
                baseLayer: layerInfo.custom.baseLayer,
                type: 'ol.layer.Tile',
                source: 'ol.source.BingMaps',
                key: layerInfo.custom.key,
                imagerySet: layerInfo.custom.imagerySet,
                dataObj: layerInfo.custom.dataObj,
                displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:false
            }
        });
        var layerTasks= new LayerTasks(this.app,this,newLayer,{});
        newLayer.set('layerTasks', layerTasks);  
    }else if (layerInfo.custom.source === 'ol.source.XYZ') {
        newLayer = new ol.layer.Tile({
            //  baseLayer:layerInfo.custom.baseLayer,
            title: layerInfo.title,
            source:this.sorceFactory.createBaseTileSource({type:'XYZ',params:layerInfo.custom.params }),
            noSwitcherInfo: true,

            opacity: layerInfo.opacity,
            custom: {
                baseLayer: layerInfo.custom.baseLayer,
                type: 'ol.layer.Tile',
                source: 'ol.source.XYZ',
                params: layerInfo.custom.params,
                dataObj: layerInfo.custom.dataObj,
                displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:false
            }
        });
        var layerTasks= new LayerTasks(this.app,this,newLayer,{});
        newLayer.set('layerTasks', layerTasks);  
    }
  } else if (layerInfo.custom && layerInfo.custom.type === 'ol.layer.Vector') {
      if (layerInfo.custom.dataObj && layerInfo.custom.source === 'ol.source.Vector') {
          if (layerInfo.custom.format === 'ol.format.GeoJSON') {
              var dataObj = layerInfo.custom.dataObj;
               try {
                    if (typeof dataObj.details === 'string' || dataObj.details instanceof String){
                        dataObj.details = JSON.parse(dataObj.details);
                    }
                } catch (ex) {}
              var renderer=undefined;
              if(dataObj.details && dataObj.details.renderer){
                  renderer= RendererFactory.createFromJson(dataObj.details.renderer);
              }
              if(!renderer){
                  renderer= RendererFactory.createSimpleRenderer();
              }
              if(dataObj.details){
                dataObj.details.renderer=renderer.toJson();
              }
              var featureLabeler=undefined;
              if(dataObj.details && dataObj.details.featureLabeler){
                 featureLabeler= new FeatureLabeler(dataObj.details.featureLabeler);
              }

              var vectorSource = this.sorceFactory.createGeoJsonVectorSource(dataObj,this);
              if (vectorSource) {

                  newLayer = new ol.layer.Vector({
                      title: layerInfo.title,
                      source: vectorSource,
                      //style:renderer.findStyleFunction(newLayer),
                      featureLabeler:featureLabeler,
                      renderer:renderer,  
                      opacity: layerInfo.opacity,
                      custom: {
                          type: 'ol.layer.Vector',
                          source: 'ol.source.Vector',
                          format: 'ol.format.GeoJSON',
                          shapeType:dataObj.details.shapeType,
                          source_schema_updatedAt:layerInfo.custom.source_schema_updatedAt,
                          dataObj: dataObj,
                          displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:true
                      }
                  });
                  newLayer.setStyle(renderer.findStyleFunction(newLayer));

                var layerTasks= new LayerTasks(this.app,this,newLayer,{});
                newLayer.set('layerTasks', layerTasks);  


              }
          }else if (layerInfo.custom.format === 'ol.format.WFS') {
            var dataObj = layerInfo.custom.dataObj;
            try {
                if (typeof dataObj.details === 'string' || dataObj.details instanceof String){
                    dataObj.details = JSON.parse(dataObj.details);
                }
            } catch (ex) {}
          
              var renderer=undefined;
              if(dataObj.details && dataObj.details.renderer){
                  renderer= RendererFactory.createFromJson(dataObj.details.renderer);
              }
              if(!renderer){
                  renderer= RendererFactory.createSimpleRenderer();
              }
              if(dataObj.details){
                dataObj.details.renderer=renderer.toJson();
              }
              var featureLabeler=undefined;
              if(dataObj.details && dataObj.details.featureLabeler){
                 featureLabeler= new FeatureLabeler(dataObj.details.featureLabeler);
              }
            var vectorSource = this.sorceFactory.createWFSSource(dataObj,this);
            if (vectorSource) {

                newLayer = new ol.layer.Vector({
                    title: layerInfo.title,
                    source: vectorSource,
                    //style:renderer.findStyleFunction(newLayer),
                    featureLabeler:featureLabeler,
                    renderer:renderer,  
                    opacity: layerInfo.opacity,
                    custom: {
                        type: 'ol.layer.Vector',
                        source: 'ol.source.Vector',
                        format: 'ol.format.WFS',
                        shapeType:dataObj.details.shapeType,
                        dataObj: dataObj,
                        displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:true
                    }
                });
                newLayer.setStyle(renderer.findStyleFunction(newLayer));

                var layerTasks= new LayerTasks(this.app,this,newLayer,{});
                newLayer.set('layerTasks', layerTasks);   


            }
        }else if (layerInfo.custom.format === 'ol.format.OSMXML') {
            var dataObj = layerInfo.custom.dataObj;
            try {
                if (typeof dataObj.details === 'string' || dataObj.details instanceof String){
                    dataObj.details = JSON.parse(dataObj.details);
                }
            } catch (ex) {}
          
              var renderer=undefined;
              if(dataObj.details && dataObj.details.renderer){
                  renderer= RendererFactory.createFromJson(dataObj.details.renderer);
              }
              if(!renderer){
                  renderer= RendererFactory.createSimpleRenderer();
              }
              if(dataObj.details){
                dataObj.details.renderer=renderer.toJson();
              }
              var featureLabeler=undefined;
              if(dataObj.details && dataObj.details.featureLabeler){
                 featureLabeler= new FeatureLabeler(dataObj.details.featureLabeler);
              }
            var vectorSource = this.sorceFactory.createOsmVectorSource(dataObj,this);
            if (vectorSource) {

                newLayer = new ol.layer.Vector({
                    title: layerInfo.title,
                    source: vectorSource,
                    //style:renderer.findStyleFunction(newLayer),
                    featureLabeler:featureLabeler,
                    renderer:renderer,  
                    opacity: layerInfo.opacity,
                    custom: {
                        type: 'ol.layer.Vector',
                        source: 'ol.source.Vector',
                        format: 'ol.format.OSMXML',
                        shapeType:dataObj.details.shapeType,
                        dataObj: dataObj,
                        displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:true
                    }
                });
                newLayer.setStyle(renderer.findStyleFunction(newLayer));

                var layerTasks= new LayerTasks(this.app,this,newLayer,{});
                newLayer.set('layerTasks', layerTasks);   


            }
        }
      }
  }else if (layerInfo.custom && layerInfo.custom.type === 'ol.layer.Image') {
    if (layerInfo.custom.dataObj && layerInfo.custom.source === 'ol.source.GeoImage') {
            var dataObj = layerInfo.custom.dataObj;
             try {
                  if (typeof dataObj.details === 'string' || dataObj.details instanceof String){
                      dataObj.details = JSON.parse(dataObj.details);
                  }
              } catch (ex) {}
            var geoImageSource = this.sorceFactory.createGeoImageSource(dataObj,this);
            if (geoImageSource) {

                newLayer = new ol.layer.Image({
                    title: layerInfo.title,
                    source: geoImageSource,
                  
                    opacity: layerInfo.opacity,
                    custom: {
                        type: 'ol.layer.Image',
                        source: 'ol.source.GeoImage',
                        dataObj: dataObj,
                        source_schema_updatedAt:layerInfo.custom.source_schema_updatedAt,
                        displayInLegend:(typeof layerInfo.custom.displayInLegend!=='undefined')?layerInfo.custom.displayInLegend:false
                    }
                });
              var layerTasks= new LayerTasks(this.app,this,newLayer,{});
              newLayer.set('layerTasks', layerTasks);  


            }
       
    }
}


  if (newLayer)
  {
        if(typeof layerInfo.visible !=='undefined'){
            newLayer.set('visible',layerInfo.visible?true:false);
        }
        //this.map.addLayer(newLayer);
   }
 return newLayer;
}

MapContainer.prototype.addData = function(dataObj) {
    if (!dataObj)
        return;
    var newLayer=undefined;
    if (dataObj.dataType && dataObj.dataType === 'vector' && dataObj.details) {
        var layerInfo={
            title:dataObj.name,
            custom: {
                type: 'ol.layer.Vector',
                source: 'ol.source.Vector',
                format: 'ol.format.GeoJSON',
                source_schema_updatedAt :dataObj.updatedAt,
                dataObj: dataObj,
                displayInLegend:true
            }
        }
        newLayer= this.addLayer(layerInfo); 
    }else if (dataObj.dataType && dataObj.dataType === 'raster' && dataObj.details) {
        var layerInfo={
            title:dataObj.name,
            custom: {
                type: 'ol.layer.Image',
                source: 'ol.source.GeoImage',
                source_schema_updatedAt :dataObj.updatedAt,
                
                dataObj: dataObj,
                displayInLegend:true
            }
        }
        newLayer= this.addLayer(layerInfo); 
    } else if (dataObj.dataType && dataObj.dataType === 'baseLayer') {

        var layerInfo={
            title:dataObj.name,
            custom: {
                type: 'ol.layer.Tile',
                source: 'ol.source.'+dataObj.type,
                params:dataObj.params,
                dataObj: {
                    details:dataObj.details
                },
                displayInLegend:false
            }
        };
        if (dataObj.type == 'BingMaps') {
            layerInfo.custom.baseLayer= dataObj.baseLayer;
            layerInfo.custom.key= dataObj.key;
            layerInfo.custom.imagerySet= dataObj.imagerySet;
        }
        newLayer= this.addLayer(layerInfo); 
      
       
        
    }
    if(newLayer){
        this.setActiveLayer(newLayer);
    }
    return newLayer;
},

MapContainer.prototype.addLayerById = function(id) {
   var self=this;
    if(!id){
        return;
    }
   
    var infoUrl='/datalayer/' + id+'/info';
    $.ajax(infoUrl, {
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            if (data) {
                self.addData(data);
            }
        },
        error: function (xhr, textStatus, errorThrown) {
           
        }
    }).done(function (response) {
       
    });
},

MapContainer.prototype.getCurrentGeoExtent = function() {

      
      var extent = this.getCurrentGeoExtentArray();
      
      return {
          minx: extent[0],
          miny: extent[1],
          maxx: extent[2],
          maxy: extent[3]
      };
}
MapContainer.prototype.getCurrentGeoExtentArray = function() {

    var map = this.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    var extent = map.getView().calculateExtent(map.getSize());
    extent = ol.extent.applyTransform(extent, ol.proj.getTransform(mapProjectionCode, "EPSG:4326"));
    return extent;
}
MapContainer.prototype.getAllLayersList = function() {
    function getLayers(layerCollection,pushToArray) {
        if (layerCollection) {
            for (var i = 0; i < layerCollection.get('length'); i++) {
                var layer = layerCollection.item(i);
                pushToArray.push(layer);
                if (layer.getLayers) {
                    getLayers(layer.getLayers(),pushToArray);
                }
            }
        } 
    }
    var layers=[];
    getLayers(this.map.getLayers(),layers);
    return layers
  }
MapContainer.prototype.getMapDetailsJsonStr = function() {
  var details = {};

  var map = this.map;
  var view = map.getView();
  var center = view.getCenter();
  details.mapProjectionCode = view.getProjection().getCode();


  var extent = map.getView().calculateExtent(map.getSize());
  details.geoExtent = ol.extent.applyTransform(extent, ol.proj.getTransform(details.mapProjectionCode, "EPSG:4326"));
  details.navState = {
      zoom: view.getZoom(),
      center: view.getCenter(),
      rotation: view.getRotation()
  }
  details.ui={
    legend:this.legend.getVisible()
  }

  function getLayersInfo(layerCollection) {
      if (layerCollection) {
          var infos = [];
          for (var i = 0; i < layerCollection.get('length'); i++) {
              var layer = layerCollection.item(i);
              if(layer.get('custom')){
                  var custom= layer.get('custom');
                  
                  if(layer.get('custom').skipSaving)
                        continue;
                   
              }
              var info = {
                  name: layer.get('name'),
                  title: layer.get('title'),
                  visible: layer.get('visible'),
                  opacity: layer.get('opacity'),
                  custom: layer.get('custom')
              }
              if (layer.getLayers) {
                  info.layerGroup=true;
                  var childLayersInfo = getLayersInfo(layer.getLayers());
                  if (childLayersInfo)
                      info.layers = childLayersInfo;
              }
              infos.push(info);
          }
          return infos;
      } else
          return null;
  }
  var layers = getLayersInfo(map.getLayers());
  details.layers = layers;
  return JSON.stringify(details);
}
MapContainer.prototype.exportPngBase64Str = function(callback,outWidth) {
    var getResizedCanvas= function (canvas,newWidth,newHeight) {
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = newWidth;
        tmpCanvas.height = newHeight;
    
        var ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,newWidth,newHeight);
    
        return tmpCanvas;
    }
  var map = this.map;

  //map.once('rendercomplete', function(event) {
  map.once('postcompose', function(event) {
      var canvas = event.context.canvas;
      if(typeof outWidth !=='undefined'){

        var outHeight=  (outWidth/canvas.width)*canvas.height;
        try{
            canvas=getResizedCanvas(canvas,outWidth,outHeight);
            }catch(ex){}
     }
      if (navigator.msSaveBlob) {
          //navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
          var dataURL = canvas.toDataURL();
          if (callback) {
              callback(dataURL.split(',')[1])
          }
      } else {
          var dataURL = canvas.toDataURL();
          if (callback) {
              callback(dataURL.split(',')[1])
          }
          //canvas.toBlob(function(blob) {
          //  saveAs(blob, 'map.png');
          //});
      }
  });
  map.renderSync();
  // map.render();
}
MapContainer.prototype.exportPngBlob = function(callback,outWidth) {
   
    var getResizedCanvas= function (canvas,newWidth,newHeight) {
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = newWidth;
        tmpCanvas.height = newHeight;
    
        var ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,newWidth,newHeight);
    
        return tmpCanvas;
    }

  var map = this.map;

  //map.once('rendercomplete', function(event) {
  map.once('postcompose', function(event) {
      var canvas = event.context.canvas;
      if(typeof outWidth !=='undefined'){

          var outHeight=  (outWidth/canvas.width)*canvas.height;
          try{
          canvas=getResizedCanvas(canvas,outWidth,outHeight);
          }catch(ex){}
      }
      if (navigator.msSaveBlob) {
          //navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
          var blob = canvas.msToBlob();
          if (callback) {
              callback(blob)
          }
      } else {
          canvas.toBlob(function(blob) {
              if (callback) {
                  callback(blob);
              }
          });
      }
  });
  map.renderSync();
  // map.render();
}
MapContainer.prototype.addTestWms=function(){
var layerInfo={
    title:'test Wms',
    custom:{
        type : 'ol.layer.Tile',
        source:'ol.source.WMS',
        dataObj:{
            details:{
                url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
                params: {'LAYERS': 'nexrad-n0r-wmst'}
            }
        }
    }
};

// var layerInfo={
//     title:'industrial',
//     custom:{
//         type : 'ol.layer.Tile',
//         source:'ol.source.WMS',
//         dataObj:{
//             details:{
//                 url: 'http://localhost:6080/arcgis/services/LightMap_ISIPO3/MapServer/WMSServer',
//                 params: {'LAYERS': '6,7'}
//             }
//         }
//     }
// };
this.addLayer(layerInfo);
}

MapContainer.prototype.addTestWFS=function(){
    var layerInfo={
        title:'test wfs',
        custom:{
            type : 'ol.layer.Vector',
            source:'ol.source.Vector',
            format:'ol.format.WFS',
            dataObj:{
                details:{
                    url: 'http://localhost:6080/arcgis/services/LightMap_ISIPO3/MapServer/WFSServer',
                    params: {'typename': 'LightMap_ISIPO3:قطعه'}
                }
            }
        }
    };
    
    var layerInfo={
        title:'remote wfs',
        custom:{
            type : 'ol.layer.Vector',
            source:'ol.source.Vector',
            format:'ol.format.WFS',
            dataObj:{
                details:{
                    //url: 'https://gsx.geolytix.net/geoserver/geolytix_wfs/ows',
                    //params: {'typename': 'wfs_geom'}
                    url:'https://ahocevar.com/geoserver/wfs',
                    params: {'typename': 'osm:water_areas'}

                }
            }
        }
    };

    var layerInfo={
        title:'WFS_ISIPO3:parcel',
        custom:{
            type : 'ol.layer.Vector',
            source:'ol.source.Vector',
            format:'ol.format.WFS',
            dataObj:{
                details:{
                    url: 'http://localhost:6080/arcgis/services/wfs/GeoDataServer/WFSServer',
                    params: {'typename': 'esri:parcel'}
                }
            }
        }
    };

    this.addLayer(layerInfo);
    }
MapContainer.prototype.addNewWMS=function(){
    var self=this;  
    var layerInfo={
            title:'',
            custom:{
                type : 'ol.layer.Tile',
                source:'ol.source.WMS',
                dataObj:{
                    details:{
                        url: '',
                        params: {'LAYERS': ''}
                    }
                }
            }
        };
        
      var newLayer= this.createLayer(layerInfo);

      var layerPropertiesDlg = new ObjectPropertiesDlg(self, newLayer, {
        isNew:true,
        title:'Add new WMS layer',
        tabs:[
            new LayerGeneralTab(),
            new LayerStyleTab(),
            new LayerLabelTab(),
            new RasterDisplayTab(),
            new LayerSourceTab(),
          ],
          activeTabIndex:4,
        onapply:function(dlg){
            self.map.addLayer(newLayer);
        },
        helpLink:'/help#newWMSLayer'

      }).show();
      
        
}
MapContainer.prototype.addNewWFS=function(){
    var self=this;  
    var layerInfo={
            title:'',
            custom:{
                type : 'ol.layer.Vector',
                source:'ol.source.Vector',
                format:'ol.format.WFS',
                shapeType:'',
                dataObj:{
                    details:{
                        shapeType:'',
                        url: '',
                        params: {'typename': ''}
                    }
                }
            }
        };
        
      var newLayer= this.createLayer(layerInfo);

      var layerPropertiesDlg = new ObjectPropertiesDlg(self, newLayer, {
        isNew:true,
        title:'Add new WFS layer',
        tabs:[
            new LayerGeneralTab(),
            new LayerStyleTab(),
            new LayerLabelTab(),
            new LayerSourceTab(),
            
          ],
          activeTabIndex:3,
        onapply:function(dlg){
            self.map.addLayer(newLayer);
        }
        ,
        helpLink:'/help#newWFSLayer'

      }).show();
      
        
}
MapContainer.prototype.addNewOSMXML_withOptions=function(options,features){
    var self=this;  
    options= options||{};
    var shapeType= options.shapeType || 'Point';
    var fields=[];
    if(options.info && options.info[shapeType] && options.info[shapeType].tags ){
        var cInfo=options.info[shapeType];
        if(!cInfo.selectedTags){
            for(var i=0;i< cInfo.tags.length && i<20;i++){
                var tag= cInfo.tags[i];
                if(tag.name){
                    fields.push({
                        name:tag.name,alias:tag.name,
                        type:'varchar',
                        length: tag.length || 8
                    });
                }
            }
        }else if(cInfo.selectedTags.length){
            for(var j=0;j<cInfo.selectedTags.length;j++){
                var selTag= cInfo.selectedTags[j];

                for(var i=0;i< cInfo.tags.length ;i++){
                    var tag= cInfo.tags[i];
                    if(tag.name && tag.name===selTag){
                        fields.push({
                            name:tag.name,alias:tag.name,
                            type:'varchar',
                            length: tag.length || 8
                        });
                        break;
                    }
                }
            }
        }
       
    }
    var layerInfo={
            title:'',
            custom:{
                type : 'ol.layer.Vector',
                source:'ol.source.Vector',
                format:'ol.format.OSMXML',
                shapeType:shapeType,
                dataObj:{
                    options:options,
                    details:{
                        shapeType:shapeType,
                        fields:fields
                       
                    }
                }
            }
        };
        
      var newLayer= this.createLayer(layerInfo);

      var layerPropertiesDlg = new ObjectPropertiesDlg(self, newLayer, {
        isNew:true,
        title:'Add new OSM Vector layer',
        tabs:[
            new LayerGeneralTab(),
            new LayerStyleTab(),
            new LayerLabelTab()
            //,
           // new LayerSourceTab(),
            
          ],
          activeTabIndex:0,
        onapply:function(dlg){
            newLayer.getSource().set('initFeatures',features);
            self.map.addLayer(newLayer);
        },
        
        helpLink:'/help#newOSMLayer'

      }).show();
      
        
}
MapContainer.prototype.addNewOSMXML=function(){
    var self=this;
      var dlg_ = new DlgOSMFilter(this, {filterArray:app.osmFilterArray}, {
          title:'Filter OSM data',
          onapply:function(dlg,data){
                var filterArray= data.filterArray;
                app.osmFilterArray=filterArray;
                var filterExpression='';
                for(var i=0;filterArray && i<filterArray.length;i++){
                    var filter= filterArray[i];
                    if(!filter.tag){
                        filterExpression+='["'+filter.key+'"]';
                    }else{
                       if(!filter.operator || filter.operator==='eq') {
                        filterExpression+='["'+filter.key+'"="'+filter.tag+'"]';
                       }
                    }
                }
                if(filterExpression){
                    dlg_.close();
                    self.addNewOSMXML_filter(filterExpression);
                }else{
                    var msg='No filter is defined. Are you sure you want to continue?';
                    var confirmDlg= new ConfirmDialog();
                    confirmDlg.show(msg, function (confirm) {

                        if (confirm) {
                           // setTimeout(function() {
                                dlg_.close();
                                self.addNewOSMXML_filter(filterExpression);    
                           // }, 1000);
                            
                        }else{
                          
                        }
                    },
                        {
                            dialogSize: 'm',
                            alertType: 'danger'
                        }
                    );
                }
          }   
        }).show();
  
             
  }
MapContainer.prototype.addNewOSMXML_filter=function(filterExpression){
    if(!filterExpression)
    {
        filterExpression='';
    }
    var self=this;
    var map = this.map;
    var view = map.getView();
    var epsg4326Extent= this.getCurrentGeoExtentArray();
    var bbox='('+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
    epsg4326Extent[3] + ',' + epsg4326Extent[2]+')' ;
  
   

    var query_count = '[out:json];(node'+ filterExpression+ bbox +';';
    query_count += 'way'+ filterExpression+ bbox +';';
    query_count += 'rel'+ filterExpression+ bbox +';';
    query_count+=');(._; >;);out count;';
    
      // var bbox=''+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
    // epsg4326Extent[3] + ',' + epsg4326Extent[2]+'' ;
    // var query_count = '[out:json][bbox:'+ bbox+'];'
    // query_count += '(node'+ filterExpression +';';
    // query_count += 'way'+ filterExpression +';';
    // query_count += 'rel'+ filterExpression +';';
    // //query_count+=');out count;';
    // query_count+=');(._; >;);out count;';
    
    //   var formdata = new FormData();
    //   formdata.append("file", blob,'geojson.json');
    //   formdata.append('layerInfo',JSON.stringify(layerInfo));

      var processNotify= $.notify({
        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Retrieving data from OSM services...'
        },{
          z_index:50000,
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });

      $.ajax({
        url:  app.overpassApiServer,
        //url: '/datalayer/toShapefile',
        type: "POST",
        data:  query_count,
        processData: false,
        dataType: 'json',
        timeout: app.OSM_REQUEST_TIMEOUT,
        contentType: 'application/json; charset=utf-8'
        }).done(function(data){
          if (data && data.elements && data.elements.length ) {
           var tags=data.elements[0].tags;
           var accept=true;
            var do_Download=function(){
                processNotify.close();
                self.addNewOSMXML_downloadData(filterExpression,epsg4326Extent);
            }
           if(tags.total){
                var total= parseInt(tags.total);
                if(total<= app.OSM_FEATURE_COUNT_LIMIT1){
                    do_Download();
                }
                else if(total> app.OSM_FEATURE_COUNT_LIMIT1 && total < app.OSM_FEATURE_COUNT_LIMIT2){
                    var msg='There are too many features ('+ total+') to be downloaded.</br><span class="text-info"> Please try for a smaller map extent or define more restricted filter or confrim to continue</span><br/><b class="text-info">Continue?</b>';
                    confirmDialog.show(msg, function (confirm) {

                        if (confirm) {
                           do_Download();
                        }
                    },
                        {
                            dialogSize: 'm',
                            alertType: 'danger'
                        }
                    );
                }else{
                    accept=false;
                    $.notify({
                        message: 'There are too many features ('+ total+') to be downloaded.</br><b><span class="text-info"> Please try for a smaller map extent or define more restricted filter!</span></b>'
                    },{
                      z_index:50000,
                        type:'danger',
                        delay:10000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    }); 

                    
                }
           }
           if(accept ){
            

           }
            
        }else{
            $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 
        }
          processNotify.close();
                
              
        }).fail(function( jqXHR, textStatus, errorThrown) {
            if(textStatus=="timeout"){
                $.notify({
                    message: 'Requet Timeout</br><b><span class="text-info"> Please try for a smaller map extent or define more restricted filter!</span></b>'
                },{
                  z_index:50000,
                    type:'danger',
                    delay:10000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                }); 
            }else{
              $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
                },{
                z_index:50000,
                    type:'danger',
                    delay:2000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                }); 
            }    
            processNotify.close();
        });

      
        
}
MapContainer.prototype.addNewOSMXML_downloadData=function(filterExpression,epsg4326Extent){
  
    var self=this;
    var map = this.map;
    var view = map.getView();
    if(!filterExpression)
    {
        filterExpression='';
    }
    // var query = '(node'+filterExpression+'(' +
    // epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
    // epsg4326Extent[3] + ',' + epsg4326Extent[2] +
    // ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out body;';

     var bbox='('+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
     epsg4326Extent[3] + ',' + epsg4326Extent[2]+')' ;
    

    var query = '(node'+ filterExpression+ bbox +';';
    query += 'way'+ filterExpression+ bbox +';';
    query += 'rel'+ filterExpression+ bbox +';';
    query+=');(._; >;);out body;';

    // var bbox=''+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
    // epsg4326Extent[3] + ',' + epsg4326Extent[2]+'' ;
    
    // var query = '[out:xml][bbox:'+ bbox+'];'
    // query += '(node'+ filterExpression +';';
    // query += 'way'+ filterExpression +';';
    // query += 'rel'+ filterExpression +';';
    // //query+=');out;>;out body;';
    // query+=');(._; >;);out body;';

    //   var formdata = new FormData();
    //   formdata.append("file", blob,'geojson.json');
    //   formdata.append('layerInfo',JSON.stringify(layerInfo));

      var processNotify= $.notify({
        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Downloading OSM Data...'
        },{
          z_index:50000,
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });

      $.ajax({
        url: app.overpassApiServer,
        //url: '/datalayer/toShapefile',
        type: "POST",
        data:  query,
        processData: false,
        dataType: 'xml',
        contentType: 'text/xml',
        }).done(function(data,textStatus, jqXHR){
          if (data ) {
            var formatOSMXML = new ol.format.OSMXML();
            var features = formatOSMXML.readFeatures(data, {
                featureProjection: view.getProjection()
              });
              var info={
                    filterExpression:filterExpression,
                  epsg4326Extent:epsg4326Extent,
                  'Point':{count:0,tags:{},fields:[]},
                  'MultiLineString':{count:0,tags:{},fields:[]},
                  'MultiPolygon':{count:0,tags:{},fields:[]}
              }
           
             if( features && features.length){
                for(var i=0;i< features.length;i++){
                    var feature= features[i];
                    var shapeType=undefined;
                    var geometry=feature.getGeometry();
                    if(geometry){
                        var type= geometry.getType();
                        if(type=='Point')
                            shapeType='Point';
                        else if ( type=='LineString' || type=='MultiLineString' )
                            shapeType= 'MultiLineString';
                        else if ( type=='Polygon' || type=='MultiPolygon' )
                            shapeType= 'MultiPolygon';   
                        if(shapeType){
                            info[shapeType].count+=1;
                            var properties = feature.getProperties();
                            for (var key in properties) {
                                if (properties.hasOwnProperty(key) && key!=='geometry') {
                                    if(typeof info[shapeType].tags[key]==='undefined'){
                                        info[shapeType].tags[key]={count:0,length:8};
                                    }
                                    info[shapeType].tags[key].count+=1;
                                    info[shapeType].tags[key].length= Math.max(info[shapeType].tags[key].length, ((properties[key] +'').length));
                                }
                            }
                        }
                    }
                    
                    
                }
             }
             for (var shapeType in info) {
                var tagsArray=[];
                var tags= info[shapeType].tags;   
                for (var key in tags) {
                    if (tags.hasOwnProperty(key))
                    {
                        var tag= tags[key];
                        tag.name=key;
                        tagsArray.push(tag); 
                    }
                 }
                 tagsArray.sort(function(a, b){
                     var r= b.count - a.count;
                     if(r==0){
                        var x = a.name.toLowerCase();
                        var y = b.name.toLowerCase();
                        if (x < y) {return -1;}
                        if (x > y) {return 1;}
                     }
                     return r;
                    });
                    info[shapeType].tags= tagsArray;
             }
           
            self.addNewOSMXML_SelectShapeType(info,features);

             var a=1;
        }else{
            $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 
        }
          processNotify.close();
                
              
        }).fail(function( jqXHR, textStatus, errorThrown) {
              $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 

            processNotify.close();
        });

      
        
}

MapContainer.prototype.addNewOSMXML_SelectShapeType=function(info,features){
    var self=this; 
    var dlg = new DlgOSMShapeTypeSelection(this, info, {
        title:'Select shape type',
        onapply:function(dlg,data){
            //self.addNewOSMXML_withOptions({shapeType:data.shapeType,info: data.info},features) ;
            self.addNewOSMXML_SelectTags({shapeType:data.shapeType,info: data.info},features) ;
           
        }

      }).show();
}

MapContainer.prototype.addNewOSMXML_SelectTags=function(options,features){
    var self=this; 
    options= options||{};
    var shapeType= options.shapeType || 'Point';
    var selecteTags=[];
    if(options.info && options.info[shapeType] && options.info[shapeType].tags ){
        var selectedInfo=options.info[shapeType];
        var tags= options.info[shapeType].tags;

        var dlg = new DlgOSMTagSelection(this, tags, {
            title:'Select Tags',
            onapply:function(dlg,data){
                if(data.selectedTags){
                    selectedInfo.selectedTags=data.selectedTags;
                }
                self.addNewOSMXML_withOptions(options,features) ;
               
            }
    
          }).show();   
    }
    
}

MapContainer.prototype.addGeoJSON=function(){
  var self=this;
    var dlg = new DlgAddGeoJSON(this, null, {
        title:'Add GeoJSON',
        onapply:function(dlg,data){
            self.addGeoJSON_data(data);
        }   
      }).show();

           
}
MapContainer.prototype.addGeoJSON_data=function(data){
    var self=this;
    
             var geojson=data.geojson; 
             var layerName= data.layerName;
             var featureProjection= data.featureProjection || 'EPSG:4326';
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
             if(!features){
              $.notify({
                  message: "Failed to parse GeoJSON text"
              },{
                z_index:30000,
                  type:'danger',
                  delay:2000,
                  animate: {
                      enter: 'animated fadeInDown',
                      exit: 'animated fadeOutUp'
                  }
              }); 
              return;
             }
             var info={
              'Point':{shapeType:'Point',count:0,tags:{},fields:[]},
              'MultiLineString':{shapeType:'MultiLineString',count:0,tags:{},fields:[]},
              'MultiPolygon':{shapeType:'MultiPolygon',count:0,tags:{},fields:[]}
              }
          
              if( features && features.length){
                  for(var i=0;i< features.length;i++){
                      var feature= features[i];
                      var shapeType=undefined;
                      var geometry=feature.getGeometry();
                      if(geometry){
                          var type= geometry.getType();
                          if(type=='Point')
                              shapeType='Point';
                          else if ( type=='LineString' || type=='MultiLineString' )
                              shapeType= 'MultiLineString';
                          else if ( type=='Polygon' || type=='MultiPolygon' )
                              shapeType= 'MultiPolygon';   
                          if(shapeType){
                              info[shapeType].count+=1;
                              
                              var properties = feature.getProperties();
                              for (var key in properties) {
                                  var keyValue=properties[key];
                                  if(!(typeof keyValue === 'object') || keyValue == null){
                                      if (properties.hasOwnProperty(key) && key!=='geometry') {
                                          if(typeof info[shapeType].tags[key]==='undefined'){
                                              info[shapeType].tags[key]={count:0,length:8};
                                          }
                                          info[shapeType].tags[key].count+=1;
                                          info[shapeType].tags[key].length= Math.max(info[shapeType].tags[key].length, ((properties[key] +'').length));
                                      }
                                  }
                              }
                          }
                      }
                      
                      
                  }
              }
              var selectedInfo= info['Point'];
              for (var shapeType in info) {
                  var tagsArray=[];
                  var tags= info[shapeType].tags;   
                  if(info[shapeType].count > selectedInfo.count ){
                      selectedInfo=info[shapeType];
                  }
                  for (var key in tags) {
                      if (tags.hasOwnProperty(key))
                      {
                          var tag= tags[key];
                          tag.name=key;
                          tagsArray.push(tag); 
                      }
                  }
                      info[shapeType].tags= tagsArray;
              }
              var filteredFeatures=[];
              var selectedType=selectedInfo['shapeType'];
              for(var i=0;i< features.length;i++){
                  var feature= features[i];
                  var geometry=feature.getGeometry();
                  if(geometry){
                      var type= geometry.getType();
                      if(type=='Point')
                          type='Point';
                      else if ( type=='LineString' || type=='MultiLineString' )
                          type= 'MultiLineString';
                      else if ( type=='Polygon' || type=='MultiPolygon' )
                          type= 'MultiPolygon';  
                      
                      if(selectedType==type){
                          filteredFeatures.push(feature); 
                      }
                  }
              }
  
              self.addGeoJSON_createDataLayer(layerName,selectedInfo,filteredFeatures,featureProjection);
  
     
  }
MapContainer.prototype.addGeoJSON_createDataLayer=function(layerName,info,features,featureProjection){
    var self=this;  
    var featureProjection= featureProjection||'EPSG:4326';
    var shapeType= info.shapeType || 'Point';
    var fields=[];
    if( info.tags ){
        for(var i=0;i< info.tags.length;i++){
            var tag= info.tags[i];
            if(tag.name){
                fields.push({
                    name:tag.name,alias:tag.name,
                    type:'varchar',
                    length: tag.length || 8
                });
            }
            
        }
    }
  
        var out_srid=4326;

        var fileName=  layerName ;
        //var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
        var format = new ol.format.GeoJSON({ featureProjection:featureProjection,  dataProjection: 'EPSG:' + out_srid});
        var json = format.writeFeatures(features);
        var blob = new Blob([json], {type: "text/json;charset=utf-8"});
      
        var layerInfo= {
            shapeType:shapeType,
            fields:fields
        };
        
        layerInfo.fileName=fileName;
        layerInfo.spatialReference = {
          name: 'EPSG:' + out_srid,
          srid: out_srid
        };
  
        var formdata = new FormData();
        formdata.append("file", blob,'geojson.json');
        formdata.append('layerInfo',JSON.stringify(layerInfo));
  
        var processNotify= $.notify({
          message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> importing features to new data layer...'
          },{
            z_index:50000,
              type:'info',
              delay:0,
              animate: {
                  enter: 'animated fadeInDown',
                  exit: 'animated fadeOutUp'
              }
          });
  
        $.ajax({
          url: '/datalayer/createfromgeojson',
          //url: '/datalayer/toShapefile',
          type: "POST",
          data: formdata,
          processData: false,
          contentType: false,
          }).done(function(data){
            if (data && data.id) {
              $.notify({
                  message: "New data layer is generated"
              },{
                z_index:50000,
                  type:'success',
                  delay:2000,
                  animate: {
                      enter: 'animated fadeInDown',
                      exit: 'animated fadeOutUp'
                  }
              }); 
              var infoUrl='/datalayer/' + data.id+'/info';
              $.ajax(infoUrl, {
                  type: 'GET',
                  dataType: 'json',
                  success: function (data) {
                      if (data) {
                          self.addData(data);
                      }
                  }
              });
          }
            processNotify.close();
                  
                
          }).fail(function( jqXHR, textStatus, errorThrown) {
                $.notify({
                  message: ""+ errorThrown+"<br/>Failed to complete task"
              },{
                z_index:50000,
                  type:'danger',
                  delay:2000,
                  animate: {
                      enter: 'animated fadeInDown',
                      exit: 'animated fadeOutUp'
                  }
              }); 
  
              processNotify.close();
          });
        
}
MapContainer.prototype.refreshLegend=function(delay){
    var self=this;
    if(typeof delay=='undefined'){
        delay=100;
    }
    if(this._last_refreshLegend_call){
        clearTimeout(this._last_refreshLegend_call);
    }
    this._last_refreshLegend_call= setTimeout(function() {
        self.refreshLegend_immediate();
    }, delay);   
    
}
MapContainer.prototype.refreshLegend_immediate=function(){

    var legend=this.legend;
    legend._rows=[];
    legend.refresh();
    var layers= this.getAllLayersList();

    
    for(var i= layers.length-1 ;i>=0;i--){
        var layer= layers[i];
        if(!layer.getVisible()){
            continue;
        }
        var custom= layer.get('custom');
        if(!custom){
            continue;
        }
        if(custom.displayInLegend){
            if(custom.type === 'ol.layer.Vector'){
                this.refreshLegend_addVectorLayer(layer);
            }else if (custom.type === 'ol.layer.Image' && custom.source==='ol.source.GeoImage'){
                this.refreshLegend_addRasterLayer(layer);  
            }
        }
    }
  
}
MapContainer.prototype.refreshLegend_addVectorLayer=function(layer){
    var legend=this.legend;
    var shapeType= LayerHelper.getShapeType( layer);
    var renderer= LayerHelper.getRenderer( layer);
    if(!renderer){
        return;
    }
    
    var defaultStyle=renderer.getDefaultStyle();
    if(shapeType=='MultiPolygon'){
        shapeType='Polygon';
    }
    if(shapeType=='MultiLineString'){
        shapeType='LineString';
    }
    var style= StyleFactory.cloneStyle(defaultStyle);
    legend.addRow({ 
      title: layer.get('title'), 
      typeGeom: shapeType,
      style: style,
      data:{
        layer:layer,
        style:style
          }
      });
    if(renderer.name=='uniqueValueRenderer'){
        var items=renderer.getUniqueValueInfos();
        var i=0;
        legend.addRow({ 
            title: renderer.field, 
            style: undefined,
            leftOffset:10,
            data:{
                layer:layer
            }
            });
        for(var key in items){
          var item= items[key];
          var style= StyleFactory.cloneStyle(item['style']);
          legend.addRow({ 
            title: item['value'], 
            typeGeom: shapeType,
            style: style,
            leftOffset:10,
            data:{
                layer:layer,
                style:item['style']
            }
            });

          i++;
        }

    }else if(renderer.name=='rangeValueRenderer'){
        var items=renderer.getRangeValueInfos();
        
        legend.addRow({ 
            title: renderer.field, 
            style: undefined,
            leftOffset:10,
            data:{
                layer:layer
            }
            });
        for(var i=0;i<items.length;i++){
          var item= items[i];
          var fromValue= item['minValue'] || '';
          var toValue= item['maxValue'] || '';
          var caption=fromValue +' - '+toValue
if(i==0 && !fromValue){
    caption= '< '+toValue;
}
if(i==items.length-1 && !toValue){
    caption='>= ' +fromValue;
}
        var style= StyleFactory.cloneStyle(item['style']);

          legend.addRow({ 
            title: caption, 
            typeGeom: shapeType,
            style:style ,
            leftOffset:10,
            data:{
                layer:layer,
                style:item['style']
            }
            });

        
        }

    }

}
MapContainer.prototype.refreshLegend_addRasterLayer=function(layer){
    var legend=this.legend;
    var id= LayerHelper.getDatasetId(layer);
    if(!id){
        return;
    }  
    var details= LayerHelper.getDetails(layer);
    var display=details.display;
    var showColorMap=false;
    var customColorMap=undefined;
    if(display && display.displayType=='colorMap' && display.colorMap=='custom' && display.customColorMap && display.customColorMap.length){
        showColorMap=true;
        customColorMap= display.customColorMap;
    }

    legend.addRow({ 
    title: layer.get('title'), 
    imgSrc:'/datalayer/' + id + '/thumbnail',
    data:{
        layer:layer,
        imgSrc:'/datalayer/' + id + '/thumbnail'
        }
    });

    if(!showColorMap){
        return;
    }

    if(customColorMap){
        for(var i=0;i<customColorMap.length;i++){
            var item= customColorMap[i];
            var caption= item.caption;
            if(typeof caption==='undefined' || caption===''){
                caption= item.value;
            }
            var color='rgba('+item.r + ','+item.g+','+item.b+','+ (item.a/255).toFixed(2)+')';
            var fill = new ol.style.Fill({color: color});
            var stroke = new ol.style.Stroke({ color: color,width: 1});
            var style = new ol.style.Style({fill: fill,stroke: stroke});
            legend.addRow({ 
                            title: caption, 
                            typeGeom: 'Polygon',
                            style: style,
                            leftOffset:10,
                            data:{
                                layer:layer,
                                style:style
                            }
                            });
        }
    }

//     if(renderer.name=='uniqueValueRenderer'){
//         var items=renderer.getUniqueValueInfos();
//         var i=0;
//         legend.addRow({ 
//             title: renderer.field, 
//             style: undefined,
//             leftOffset:10,
//             data:{
//                 layer:layer
//             }
//             });
//         for(var key in items){
//           var item= items[key];
//           var style= StyleFactory.cloneStyle(item['style']);
//           legend.addRow({ 
//             title: item['value'], 
//             typeGeom: shapeType,
//             style: style,
//             leftOffset:10,
//             data:{
//                 layer:layer,
//                 style:item['style']
//             }
//             });

//           i++;
//         }

//     }else if(renderer.name=='rangeValueRenderer'){
//         var items=renderer.getRangeValueInfos();
        
//         legend.addRow({ 
//             title: renderer.field, 
//             style: undefined,
//             leftOffset:10,
//             data:{
//                 layer:layer
//             }
//             });
//         for(var i=0;i<items.length;i++){
//           var item= items[i];
//           var fromValue= item['minValue'] || '';
//           var toValue= item['maxValue'] || '';
//           var caption=fromValue +' - '+toValue
// if(i==0 && !fromValue){
//     caption= '< '+toValue;
// }
// if(i==items.length-1 && !toValue){
//     caption='>= ' +fromValue;
// }
//         var style= StyleFactory.cloneStyle(item['style']);

//           legend.addRow({ 
//             title: caption, 
//             typeGeom: shapeType,
//             style:style ,
//             leftOffset:10,
//             data:{
//                 layer:layer,
//                 style:item['style']
//             }
//             });

        
//         }

//     }

}
MapContainer.prototype.duplicateLayer=function(layer,options){
    if(!layer){
        return;
    }
    options= options|| {};
    var self=this;
    var map = this.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    var details= LayerHelper.getDetails(layer);
    var source_srid;
    if(details.spatialReference && details.spatialReference.srid){
        source_srid=details.spatialReference.srid;
    }
    var out_srid= options.srid || source_srid || 3857;
    var source= layer.getSource();
    
    var features = source.getFeatures();
    
    var layerSelectTask= LayerHelper.getVectorLayerSelectTask(layer);
    var selectedFeatures;
    if(options.exportSelectionIfAny && layerSelectTask ){
       selectedFeatures=layerSelectTask.interactionSelect.getFeatures();
        if(selectedFeatures.getLength())
        {
             
                features= selectedFeatures.getArray();
        }
    }
    
      var fileName=  layer.get('title')|| details.shapefileName || details.tableName ;
      //var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
      var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:' + out_srid});
      var json = format.writeFeatures(features);
      var blob = new Blob([json], {type: "text/json;charset=utf-8"});
    
      var layerInfo= JSON.parse(JSON.stringify(details));
      delete layerInfo.filter;
      delete layerInfo.datasetName;
      delete layerInfo.params;
      delete layerInfo.url;
      layerInfo.fileName=options.newName || (fileName +'-Copy');
      layerInfo.spatialReference = {
        name: 'EPSG:' + out_srid,
        srid: out_srid
      };

      var formdata = new FormData();
      formdata.append("file", blob,'geojson.json');
      formdata.append('layerInfo',JSON.stringify(layerInfo));

      var processNotify= $.notify({
        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Copying features to new data layer...'
        },{
          z_index:50000,
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });

      $.ajax({
        url: '/datalayer/createfromgeojson',
        //url: '/datalayer/toShapefile',
        type: "POST",
        data: formdata,
        processData: false,
        contentType: false,
        }).done(function(data){
          if (data && data.id) {
            $.notify({
                message: "New data layer is generated"
            },{
              z_index:50000,
                type:'success',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 
            var infoUrl='/datalayer/' + data.id+'/info';
            $.ajax(infoUrl, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        self.addData(data);
                    }
                }
            });
        }
          processNotify.close();
                
              
        }).fail(function( jqXHR, textStatus, errorThrown) {
            var msg=errorThrown;
            if(jqXHR.responseJSON){
                if(jqXHR.responseJSON.error){
                   msg=jqXHR.responseJSON.error; 
                }
            }
              $.notify({
                message: ""+ msg+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 

            processNotify.close();
        });

}
MapContainer.prototype.downloadDataFromWCS=function(){
    var self=this;
    var dlg = new DlgWCS(this, null, {
        title:'Download from WCS',
        onapply:function(dlg,data){
            
        }   
      }).show();
}
