$(document).ready(function() {
   

  });
  
$(function () {
  
    pageTask.init();
    
  
  });
var pageTask={
    
    init:function(){
        var self=this;
        this.tasksSource = new ol.source.Vector();
        this.tasksLayer = new ol.layer.Vector({
            source: this.tasksSource,
            custom: {
                type: 'drawing',
                keepOnTop:true,
                skipSaving:true,
                hiddenInToc: true
            },
            style:new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#FF0000',
                    width:1,
                    lineDash: [2, 2],
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0,255,0,0.2)'
                })
            })
        });
        this.drawsource = new ol.source.Vector();
        this.drawlayer = new ol.layer.Vector({
                source: this.drawsource,
                custom: {
                    type: 'drawing',
                    keepOnTop:true,
                    skipSaving:true,
                    hiddenInToc: true
                }
            });
        var map = this.map = new ol.Map({
            target:  'extMap',
            layers: [
                      new ol.layer.Tile({
                      title: "OSM",
                      source: new ol.source.OSM()
                      
                  }),
                  this.tasksLayer,
                  this.drawlayer
            ],
            controls: ol.control.defaults({attribution: false}),
            view: new ol.View({
               // center: ol.proj.fromLonLat([(app.initMap_Lon|| 0), (app.initMap_Lat ||0)])
                //center: ol.proj.fromLonLat([53,32])
                //,zoom:1
               // ,zoom: app.initMap_Zoom || 4
               // extent:ol.proj.get("EPSG:3857").getExtent(),
                extent: ol.extent.applyTransform([-180,-90,180,90], ol.proj.getTransform("EPSG:4326","EPSG:3857")),
                center: ol.proj.fromLonLat([0,0]),
                zoom: 0
            })
          });
          map.on('moveend', function(evt) {
      
            // var map = evt.map;
            // var view = map.getView();
            // var mapProjectionCode = view.getProjection().getCode();
            // var extent = map.getView().calculateExtent(map.getSize());
            // extent = ol.extent.applyTransform(extent, ol.proj.getTransform(mapProjectionCode, "EPSG:4326"));
            // self.mapExtent={
            //   minx: extent[0],
            //   miny: extent[1],
            //   maxx: extent[2],
            //   maxy: extent[3]
            // }
            // if(self.mapExtent.minx>180){
            //   self.mapExtent.minx= (self.mapExtent.minx%360)-360;
            //   self.mapExtent.maxx= self.mapExtent.minx+ (extent[3]-extent[0])
            // }
           
           // 
          });

          this.drawShape('box');
          
          this.fillUI();
          $('#min_x,#min_y,#max_x,#max_y').on('keyup paste',function(){
              self.fillUI();
          });

            
            $.ajax( {    url: '/gtm/taskslist', dataType: 'json', success: function (data) {
            if(data){
                for(var i=0;i<data.length;i++){
                    if( window.location && window.location.pathname && window.location.pathname.endsWith('/'+ data[i]['task_id'])){
                        continue;
                    }
                    self.addExtentToMap(
                        self.tasksLayer,
                        parseFloat(data[i]['min_x']),
                        parseFloat(data[i]['min_y']),
                        parseFloat(data[i]['max_x']),
                        parseFloat(data[i]['max_y']),
                    
                        false,
                        false
                    );
                }
                
            }
           }});



    },
    fillUI:function(){
        this.addExtentToMap(
            this.drawlayer,
            parseFloat($('#min_x').val()),
            parseFloat($('#min_y').val()),
            parseFloat($('#max_x').val()),
            parseFloat($('#max_y').val()),
            true,
            true
          );
    },
    addExtentToMap : function(layer,west,south,east,north,zoomToShape,clear) {
        if(clear){
            layer.getSource().clear();
        }
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
        var geom= ol.geom.Polygon.fromExtent(extent);
        var feature= new ol.Feature({geometry: geom});
        this.addShape(layer,feature,zoomToShape,clear);
    },
    addShape:function(layer,feature,zoomToShape,clear){
        var source= layer.getSource();
        if(clear){
            source.clear();
        }
        if(feature){
            source.addFeatures([feature]);
            if(zoomToShape){
                try{
                    var extent= feature.getGeometry().getExtent();
                    var w= extent[2]- extent[0];
                    var h= extent[3]-extent[1];
                    extent[0]= extent[0]- w/4;
                    extent[2]= extent[2]+ w/4;
                    extent[1]= extent[1]- h/4;
                    extent[3]= extent[3]+ h/4;
                    this.map.getView().fit(extent,{duration:1000,size:this.map.getSize()});
                    
                }catch(ex){
                
                }
            }
        }
        
    },
    drawShape:function(shapeType){
        var self=this;
        var map = this.map;
        var view = map.getView();
        var mapProjectionCode = view.getProjection().getCode();
        self.interaction = undefined;
      
        function addInteraction(shapeType) {
              var type='Point';
              var geometryFunction=undefined;
              if(shapeType=='line'){
                type='LineString';
              }else if (shapeType=='polygon'){
                type='Polygon';
              }else if (shapeType=='circle'){
                type='Circle';
                geometryFunction = ol.interaction.Draw.createRegularPolygon();
              }else if (shapeType=='box'){
                type='Circle';
                geometryFunction = ol.interaction.Draw.createBox();
              }
              
              self.interaction = new ol.interaction.Draw({
                  source: self.drawsource,
                  type: type,
                  geometryFunction:geometryFunction
              });
              map.addInteraction(self.interaction);
              self.interaction.on('drawend', function (e) {
               // map.removeInteraction(self.interaction);
               // self.moveLayerToTop();
               //console.log(e);
               setTimeout(function(){
                var extent = ol.extent.applyTransform(e.feature.getGeometry().getExtent(), ol.proj.getTransform(mapProjectionCode,"EPSG:4326"));
                var ext_west=Math.round((extent[0] + Number.EPSILON) * 1000) / 1000 ;
                var ext_south=Math.round((extent[1] + Number.EPSILON) * 1000) / 1000 ;
                var ext_east=Math.round((extent[2] + Number.EPSILON) * 1000) / 1000 ;       
                var ext_north=Math.round((extent[3] + Number.EPSILON) * 1000) / 1000 ;
                $('#min_x').val(ext_west);
                $('#min_y').val(ext_south);
                $('#max_x').val(ext_east);
                $('#max_y').val(ext_north);
                self.addShape(self.drawlayer, e.feature,true,true);

                $form=$('#task_form');
                var origIgone= $.validator.defaults.ignore;
                $.validator.setDefaults({ ignore:'' });
                $.validator.unobtrusive.parse($form);
                $.validator.setDefaults({ ignore:origIgone });
            
                $form.validate();
                $form.valid();
               
               },0)
               
                
               
      
              });
      
          }
          
              map.removeInteraction(self.interaction);
              addInteraction(shapeType);
      
             
      
      }
   

};
