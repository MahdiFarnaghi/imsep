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
                color:'rgba(255,0,0,0.5)',
                width:1,
                lineDash: [2, 2],
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0,255,0,0.05)'
            })
          })
      });
      this.eventsSource = new ol.source.Vector();
      this.eventsLayer = new ol.layer.Vector({
          source: this.eventsSource,
          custom: {
              type: 'drawing',
              keepOnTop:true,
              skipSaving:true,
              hiddenInToc: true
          },
          style:new ol.style.Style({
              stroke: new ol.style.Stroke({
                  color: '#7fbddc',
                  width:1,
                  lineDash: [2, 2],
              }),
              fill: new ol.style.Fill({
                  color:'#ebfbffc7'//rgba(0,255,0,0.2)'
              })
          })
      });
      var map = this.map = new ol.Map({
          target:  'extMap',
          layers: [
                    new ol.layer.Tile({
                    title: "OSM",
                    source: new ol.source.OSM()
                    
                }),
                this.tasksLayer,this.eventsLayer
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
        
       
        
        this.fillUI();
       

          
  $.ajax( {    url: '/gtm/taskslist', dataType: 'json', success: function (data) {
    if(data){
        for(var i=0;i<data.length;i++){
          
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
$.ajax( {    url: '/gtm/eventslist', dataType: 'json', success: function (data) {
    if(data){
        for(var i=0;i<data.length;i++){
            //  if( window.location && window.location.pathname && window.location.pathname.endsWith('/'+ data[i]['id'])){
            //      continue;
            //  }
            self.addExtentToMap(
                self.eventsLayer,
                parseFloat(data[i]['longitude_min']),
                parseFloat(data[i]['latitude_min']),
                parseFloat(data[i]['longitude_max']),
                parseFloat(data[i]['latitude_max']),
            
                false,
                false
            );
        }
        
    }
   }});


  },
  fillUI:function(){
     
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
      
  }
 

};
