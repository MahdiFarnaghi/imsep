
function DlgIdentity(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgIdentity'
      ,(options.title || 'Overlay')
      ,  mapContainer,obj,options);   

}
DlgIdentity.prototype = Object.create(DlgTaskBase.prototype);


DlgIdentity.prototype.createUI=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var layers= this.mapContainer.getAllLayersList();
  var layerList=[];
    
  for(var i= layers.length-1 ;i>=0;i--){
      var lyr= layers[i];
      
      var custom= lyr.get('custom');
      if(!custom){
          continue;
      }
      if(layer==lyr){
        continue;
      }
      if(custom.type === 'ol.layer.Vector'){

        if(custom.format === 'ol.format.GeoJSON' && custom.dataObj && custom.dataObj.details ){
          layerList.push({
            title:lyr.get('title'),
            value:custom.dataObj.id
          })
        }
      }
  }

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <p>';
  htm+='Overlay  features of ('+ layer.get('title') +') on layer:';
  htm+='  </p>';
  htm+='<div class="form-group">';
  //htm+='    <div class="col-sm-12 ">';
  htm+='<select class="form-control  " id="otherLayer" name="otherLayer" data-val="true" data-val-required="Select intersecting layer">';
  for(var i=0;i<layerList.length;i++){
    var lyr= layerList[i];
      htm+='    <option value="' +lyr.value+ '" >'+ lyr.title+ '</option>';    
  }
  htm+='    </select>';
  //htm+='    </div>';
  htm+='    <span class="field-validation-valid" data-valmsg-for="otherLayer" data-valmsg-replace="true"></span>';
  
  htm+=' </div>';

 

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
   
      
      evt.data.otherLayer=content.find('#otherLayer').val();
      
  });

  this.changesApplied=false
}
