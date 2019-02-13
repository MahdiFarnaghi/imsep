
function DlgBuffer(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgBuffer'
      ,(options.title || 'Buffer')
      ,  mapContainer,obj,options);   

}
DlgBuffer.prototype = Object.create(DlgTaskBase.prototype);


DlgBuffer.prototype.createUI=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  self.selBand= self.options.selBand || 1;

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <p>';
  htm+='Create buffers around the features of ('+ layer.get('title') +'):';
  htm+='  </p>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="distance">Buffer distance</label>';

  htm+='    <input type="number" name="distance" id="distance" value="" placeholder="Buffer distance" class="form-control" data-val="true" data-val-required="Buffer distance is required"  />'
  htm+='    <span class="field-validation-valid" data-valmsg-for="distance" data-valmsg-replace="true"></span>';
  htm+='  </div>';

 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
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
   
      
      evt.data.distance=content.find('#distance').val();
      
  });

  this.changesApplied=false
}
