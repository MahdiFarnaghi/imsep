
function DlgRasterClip(mapContainer,obj,options) {
  options=options||{};
  options.closable=false;
    DlgTaskBase.call(this, 'DlgRasterClip'
        ,(options.title || 'Clip raster')
        ,  mapContainer,obj,options);   
  
  }
  DlgRasterClip.prototype = Object.create(DlgTaskBase.prototype);

 
  DlgRasterClip.prototype.createUI=function(){
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
    //this.dlg.setClosable(false);
    var self=this;
    var layer= this.obj;
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    
    var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
    htm +='  <div class="form-group">';
    htm +='    <label class="" for="">Raster data layer</label>';
    htm +='    <div>'+layerCustom.dataObj.name+'</div>' ;
    htm +=' </div>';

    htm+='    <div id="childContent" class="panel-body">';
    
    htm+='    </div>';

    htm += '</form>';
    htm+='  </div>';
    var content=$(htm).appendTo( this.mainPanel); 
    self.childContent=content.find('#childContent');
  
    self.populateChildPanel();
    self.setActions();

    var $form = $(content.find('#'+self.id +'_form'));
    $form.on('submit', function(event){
      // prevents refreshing page while pressing enter key in input box
      event.preventDefault();
    });
    this.beforeApplyHandlers.push(function(evt){
      var origIgone= $.validator.defaults.ignore;
      $.validator.setDefaults({ ignore:'' });
      $.validator.unobtrusive.parse($form);
      $.validator.setDefaults({ ignore:origIgone });

      $form.validate();

      var geomArray=[];
      var valid2=false;
      if(self.drawlayer){
          var features = self.drawlayer.getSource().getFeatures();
          for(var i=0;i< features.length;i++){
            geomArray.push( features[i].getGeometry());
          }
      }
      if(geomArray.length>0){
        valid2=true;

      }else{
        $.notify({
          message:  "No clipping area is defined."
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

      if(! ($form.valid() && valid2) ){
        evt.cancel= true;
        var errElm=$form.find('.input-validation-error').first();
        if(errElm){
          var offset=errElm.offset().top;
          //var tabOffset= tabHeader.offset().top;
          var tabOffset=0;
          //tabOffset=self.mainPanel.offset().top;
          tabOffset=$form.offset().top;
          self.mainPanel.find('.scrollable-content').animate({
                scrollTop: offset - tabOffset //-60//-160
              }, 1000);
      
        }
      }
    });

    this.applyHandlers.push(function(evt){

      var geomArray=[];
        if(self.drawlayer){
            var features = self.drawlayer.getSource().getFeatures();
            for(var i=0;i< features.length;i++){
              geomArray.push( features[i].getGeometry());
            }
        }
        if(geomArray.length>0 ){
         
          var feature;
          var clipAreajson;
          if(geomArray.length>0){
            if(geomArray.length>1){
            feature = new ol.Feature({
              geometry: new ol.geom.GeometryCollection(geomArray),
              name: 'Clip area'
              });
            }else{
              feature = new ol.Feature({
                geometry: geomArray[0],
                name: 'Clip area'
              });
            }
         
            var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:3857'});
            clipAreajson = format.writeFeatureObject(feature);
            
         }
          evt.data.clipArea=clipAreajson;
          evt.data.clipAreaSrid= 3857;
          
        }

    });

    this.changesApplied=false
  }
  DlgRasterClip.prototype.populateChildPanel=function(){
    var self=this;
    var layer= this.obj;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
  

    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    var htm='';
    this.childContent.html('');
    htm+='<div class="form-group">';
    htm+='  <div class="col-sm-12 ">';
    htm+='    <label> Draw clipping area:</label>';
    htm+='  </div>';
    htm+=' </div>';
    htm+='<div class="form-group">';
    htm+='  <div class="col-sm-1 ">'
    htm+='    <button  type="button"   title="Box" id="drawBox" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawRectangleIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
    htm+='  </div>';
    htm+='  <div class="col-sm-1 ">'
    htm+='    <button  type="button"   title="Circle" id="drawCircle" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawCircleIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
    htm+='  </div>';
    htm+='  <div class="col-sm-1 ">'
    htm+='    <button  type="button"   title="Polygon" id="drawPolygon" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawPolygonIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
    htm+='  </div>';
    htm+=' </div>';
  
    // htm+='  <div class="form-group">';
    // htm+='   <div class="col-sm-offset-1 col-sm-2 ">'
    // htm+='    <button id="clearShapes" type="button" class="btn btn-primary btn-danger btn-xs "><span class="glyphicon glyphicon-remove"></span>Clear shapes</button>';
    // htm+='   </div>';
    // htm+='  </div>';
  
  this.childContent.html(htm);

  
  }
  DlgRasterClip.prototype.setActions=function(){
  
    
    this.create_actions(this.childContent);
  }
  DlgRasterClip.prototype.create_actions=function(content){
    var self=this;
    var layer= this.obj;
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    
    //content.find('#drawPoint').click(function(){self.drawShape('point'); });
    content.find('#drawBox').click(function(){self.drawShape('box'); });
    content.find('#drawCircle').click(function(){self.drawShape('circle'); });
    content.find('#drawPolygon').click(function(){self.drawShape('polygon'); });
    //content.find('#drawLine').click(function(){self.drawShape('line'); });
  
    content.find('#clearShapes').click(function(){
      if(self.drawlayer){
        self.drawlayer.getSource().clear();
    
      }
      
     
    })
    
  }
  DlgRasterClip.prototype.moveLayerToTop = function () {
    var map = this.mapContainer.map;
    map.getLayers().remove(this.drawlayer);
    map.getLayers().push(this.drawlayer);
  }
  DlgRasterClip.prototype.closed=function(){
    var map = this.mapContainer.map;
     map.getLayers().remove(this.drawlayer);
     if(this.onLayerAddEventKey){
      ol.Observable.unByKey(this.onLayerAddEventKey);
     }
  }
  DlgRasterClip.prototype.createDrawLayer=function(){
    var mapContainer = this.mapContainer;
    var map = mapContainer.map;
    var self=this;
    if(!this.drawsource){
      this.drawsource = new ol.source.Vector();
    }
      this.drawlayer = new ol.layer.Vector({
          source: this.drawsource,
          custom: {
              type: 'drawing',
              keepOnTop:true,
              skipSaving:true,
              hiddenInToc: true
          }
          // ,
          // style: new ol.style.Style({
          //     fill: new ol.style.Fill({
          //         color: 'rgba(255, 255, 255, 0.2)'
          //     }),
          //     stroke: new ol.style.Stroke({
          //         color: '#ffcc33',
          //         width: 2
          //     }),
          //     image: new ol.style.Circle({
          //         radius: 7,
          //         fill: new ol.style.Fill({
          //             color: '#ffcc33'
          //         })
          //     })
          // })
      });
    self.onLayerAddEventKey=  map.getLayers().on('add', function (e) {
        if (e.element !== self.drawlayer && e.element.get('custom')) {
          if(!e.element.get('custom').keepOnTop){  
              
                    self.moveLayerToTop();
              
            }
        }
  
    });
  }
  DlgRasterClip.prototype.addShape=function(shape){
    if(!shape)
    {
      return;
    }
    var self=this;
    var mapContainer = this.mapContainer;
    var map = mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:3857'});
    if(!this.drawlayer){
     this.createDrawLayer();
    }
    var features= format.readFeatures(shape, {
      featureProjection: mapProjectionCode
    });
  
  this.drawlayer.getSource().addFeatures(features);
  this.drawlayer.changed();
  this.moveLayerToTop();
  }
  DlgRasterClip.prototype.drawShape=function(shapeType){
    var self=this;
  
    var mapContainer = this.mapContainer;
    var map = mapContainer.map;
   
    if(!self.drawlayer){
     self.createDrawLayer();
    }
    
    self.drawlayer.getSource().clear();

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
            map.removeInteraction(self.interaction);
            self.moveLayerToTop();
            
            self.dlg.open();
            self.setActions();
  
          });
  
      }
      
          map.removeInteraction(self.interaction);
          addInteraction(shapeType);
  
          self.dlg.getModal().modal('hide');
          self.dlg.getModal().hide();
  
  }