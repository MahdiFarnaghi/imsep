function FeaturePointTab() {
     var self=this;    
     this.tabId='tabFeaturePoint';
    
  }
  FeaturePointTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  FeaturePointTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  FeaturePointTab.prototype.applied=function(obj){
    var self=this;
    this.feature= obj.feature;
    
    this.layer=obj.layer;
    this.transactFeature= obj.transactFeature;
    var fields;
    var shapeType=''
    if(this.layer && this.feature){
      var layerCustom=  this.layer.get('custom');
      if(layerCustom && layerCustom.dataObj  ){
        shapeType= layerCustom.shapeType;
      }
    }
    
    return shapeType=='Point';
  }
  FeaturePointTab.prototype.create=function(obj,isActive){
    var self=this;
    var mapContainer= this.parentDialog.mapContainer;
    var map = mapContainer.map;
    var view = map.getView();
    var mapProjection = view.getProjection();
    this.feature= obj.feature;
    if(this.feature && this.feature.clone){
     this.origFeature= this.feature.clone(); 
    }
    var geometry= this.feature.getGeometry();
    this.layer=obj.layer;
    
    var active='';
    if(isActive)
      active ='active';
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-code"></i> Coordinates</a> </li>').appendTo(this.parentDialog.tabPanelNav);
    
    this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
   
    var latitude='';
    var longitude='';
    if(geometry){
      try{
      var newPoint=geometry.clone();
      newPoint.transform(mapProjection,'EPSG:4326');
      longitude= newPoint.getCoordinates()[0];
      latitude= newPoint.getCoordinates()[1];
      }catch(ex){}
    }
    

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="longitude">Longitude:</label>';
    htm+='    <input type="number" name="longitude" id="longitude" value="'+longitude+'" placeholder="Longitude in decimal degrees" class="form-control" data-val="true" data-val-required="Longitude is required"  />'
    htm+='    <span class="field-validation-valid" data-valmsg-for="longitude" data-valmsg-replace="true"></span>';
    htm+='  </div>';
   
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="latitude">Latitude:</label>';
    htm+='    <input type="number" name="latitude" id="latitude" value="'+latitude+'" placeholder="Latitude in decimal degrees" class="form-control" data-val="true" data-val-required="Latitude is required"  />'
    htm+='    <span class="field-validation-valid" data-valmsg-for="latitude" data-valmsg-replace="true"></span>';
    htm+='  </div>';

  
// var format = new ol.format.WKT();
// wktStr = format.writeGeometry(geometry, {
//   dataProjection: 'EPSG:4326',
//   featureProjection: mapProjection
// });
// wktStr= this.formatWkT(wktStr);
  
    

    
    htm+='</form></div>';
    
    
    
    var content=$(htm).appendTo( this.tab); 

    var updateShape= function(){
      try{
        var lat=content.find('#latitude').val();
        var lon=content.find('#longitude').val();
        lat= parseFloat(lat);
        lon= parseFloat(lon);
        var newPoint= new ol.geom.Point([lon,lat]);
        newPoint.transform('EPSG:4326',mapProjection);
        self.feature.setGeometry(newPoint);
        }catch(ex){
          
        }
    };

    content.find('#latitude').on('input', function () {
      $(this).trigger('change');
    });
    content.find('#latitude').change(function(){
      updateShape();
    }); 
    content.find('#longitude').on('input', function () {
      $(this).trigger('change');
    });
    content.find('#longitude').change(function(){
      updateShape();
    }); 

    var $form = $(content.find('#'+self.tabId+'_form'));
    
     $form.find('input,textarea,select').change(function(){
        $(this).addClass('attribute-value-changed');
     });
    this.parentDialog.beforeApplyHandlers.push(function(evt){
          //self.layer.set('title',content.find('#name').val());
          //$.validator.setDefaults({ ignore:':hidden' });

          var orIgnore= $.validator.defaults.ignore;
          $.validator.setDefaults({ ignore:'' });
          $.validator.unobtrusive.parse($form);
          $.validator.setDefaults({ ignore:orIgnore });

          $form.validate();
          if(! $form.valid()){
            evt.cancel= true;
            tabHeader.find('a').addClass('text-danger');
            self.activate();
           
            var errElm=$form.find('.input-validation-error').first();
            if(errElm){
              var offset=errElm.offset().top;
              var tabOffset= tabHeader.offset().top;
              self.tab.animate({
                    scrollTop: offset - tabOffset -60//-160
                  }, 1000);
          
            }
          }else{
            tabHeader.find('a').removeClass('text-danger');
          }
    });

    this.parentDialog.cancelHandlers.push(function(evt){
     // self.layer.setOpacity(origOpacity);
     if(self.origFeature && self.feature){
      self.feature.setGeometry(self.origFeature.getGeometry());
     }
    });
    this.parentDialog.applyHandlers.push(function(evt){
      var wkt= content.find('#wkt').val();  

     // self.feature.setProperties(properties);
    });
  }

 

  