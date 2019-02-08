
function DlgAddGeoJSON(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgAddGeoJSON'
      ,(options.title || 'Add GeoJSON')
      ,  mapContainer,obj,options);   

}
DlgAddGeoJSON.prototype = Object.create(DlgTaskBase.prototype);


DlgAddGeoJSON.prototype.createUI=function(){
  var self=this;
 
  var initLayerName='';
  var initGeojson='';
  if(this.options.initData){
    initLayerName= this.options.initData.layerName || '';
    initGeojson= this.options.initData.geojson || '';
  }

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  //htm+='  <p>';
  //htm+='Create new GeoJSON layer ';
  //htm+='  </p>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="layerName">Layer name</label>';

  htm+='    <input type="text" name="layerName" id="layerName" value="' +initLayerName+'" autofocus placeholder="Layer name" class="form-control" data-val="true" data-val-required="Layer name is required"  />'
  htm+='    <span class="field-validation-valid" data-valmsg-for="layerName" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  htm+='  <div class="form-group">';
  htm+='    <label class="" for="geojson">GeoJSON text:</label>';

  htm+='    <textarea type="text" name="geojson" rows="10" id="geojson"  placeholder="" class="form-control" data-val="true" data-val-required="GeoJSON text is required">'+ initGeojson +'</textarea>'
  htm+='    <span class="field-validation-valid" data-valmsg-for="geojson" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
  var $form = $(content.find('#'+self.id +'_form'));
  
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
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
   
      
      evt.data.layerName=content.find('#layerName').val();
      evt.data.geojson=content.find('#geojson').val();
      
  });

  this.changesApplied=false
}
