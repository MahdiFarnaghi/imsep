$(document).ready(function() {
   

  });
  
$(function () {
  
    pageTask.init();
    
  
  });
var pageTask={
    
    init:function(){
        var self=this;
      
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
          $('#longitude_min,#latitude_min,#longitude_max,#latitude_max').on('keyup paste',function(){
              self.fillUI();
          })

    },
    fillUI:function(){
        this.addExtentToMap(
            parseFloat($('#longitude_min').val()),
            parseFloat($('#latitude_min').val()),
            parseFloat($('#longitude_max').val()),
            parseFloat($('#latitude_max').val())
          );
    },
    addExtentToMap : function(west,south,east,north) {
        this.drawsource.clear();
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
        this.addShape(feature);
    },
    addShape:function(feature){
        this.drawsource.clear();
        if(feature){
            this.drawsource.addFeatures([feature]);
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
                $('#longitude_min').val(ext_west);
                $('#latitude_min').val(ext_south);
                $('#longitude_max').val(ext_east);
                $('#latitude_max').val(ext_north);
                self.addShape(e.feature);
               },0)
               
                
               
      
              });
      
          }
          
              map.removeInteraction(self.interaction);
              addInteraction(shapeType);
      
             
      
      }
   

};
