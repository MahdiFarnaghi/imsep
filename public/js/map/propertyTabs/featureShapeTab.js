function FeatureShapeTab(options) {
  var self=this;    
  options=options||{};  
  this.tabId='tabFeatureShape' +(options.id?options.id:'');
 
}
  FeatureShapeTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  FeatureShapeTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  FeatureShapeTab.prototype.applied=function(obj){
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
    if(!shapeType)
      return false;
    return shapeType!='Point';
  }
  FeatureShapeTab.prototype.create=function(obj,isActive){
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
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-code"></i> Shape</a> </li>').appendTo(this.parentDialog.tabPanelNav);
    
    this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
    
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="wkt">WKT:</label>';
var wktStr='';
var format = new ol.format.WKT();
wktStr = format.writeGeometry(geometry, {
  dataProjection: 'EPSG:4326',
  featureProjection: mapProjection
});
wktStr= this.formatWkT(wktStr);
      // var feature = format.readFeature(wkt, {
      //   dataProjection: 'EPSG:4326',
      //   featureProjection: 'EPSG:3857'
      // });

    htm+='    <textarea type="text" name="wkt" rows="10" id="wkt"  placeholder="" class="form-control" data-val="true" data-val-required="WKT text is required">'+ wktStr +'</textarea>'
    htm+='    <span class="field-validation-valid" data-valmsg-for="wkt" data-valmsg-replace="true"></span>';
    htm+='    <span id="wktParseError" class="field-validation-error"></span>';
    htm+='  </div>';
    

    
    htm+='</form></div>';
    
    
    var content=$(htm).appendTo( this.tab); 
    content.find('#wktParseError').hide();
    content.find('#wkt').on('input', function () {
      $(this).trigger('change');
    });
    content.find('#wkt').change(function(){
      var wktStr=$(this).val();
      content.find('#wktParseError').hide();
      if(wktStr){
        var format = new ol.format.WKT();
        try{
          var geom= format.readGeometry(wktStr, {
            dataProjection: 'EPSG:4326',
            featureProjection: mapProjection
          });
          if(geom){
            self.feature.setGeometry(geom);
          }
        }catch(ex){
         var a=1; 
         content.find('#wktParseError').text(ex.message);
         content.find('#wktParseError').show();
        }
      
        
      }
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
  FeatureShapeTab.prototype.formatWkT= function (text0) {
    if(!text0){
      return text0;
    }
    var String_space = function (len) {
      var t = [], i;
      for (i = 0; i < len; i++) {
          t.push(' ');
      }
      return t.join('');
    };
    var text = text0.replace(/\n/g, ' ').replace(/\r/g, ' ');
    var t = [];
    var tab = 0;
    var inString = false;
    for (var i = 0, len = text.length; i < len; i++) {
        var c = text.charAt(i);
        if (inString && c === inString) {
            // TODO: \\"
            if (text.charAt(i - 1) !== '\\') {
                inString = false;
            }
        } else if (!inString && (c === '"' || c === "'")) {
            inString = c;
        } else if (!inString && (c === ' ' || c === "\t")) {
            c = ' ';
        } else if (!inString && c === ',') {
            c += "\n" + String_space(tab * 2);
        } else if (!inString && (c === '(' || c === '[' || c === '{')) {
            tab++;
            c += "\n" + String_space(tab * 2);
        } else if (!inString && (c === ')' || c === ']' || c === '}')) {
            tab--;
            c = "\n" + String_space(tab * 2) + c;
        }
        t.push(c);
    }
    return t.join('');
};
 

  