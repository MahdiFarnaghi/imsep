
function DlgSlope(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgSlope'
      ,(options.title || 'Slope')
      ,  mapContainer,obj,options);   

}
DlgSlope.prototype = Object.create(DlgTaskBase.prototype);


DlgSlope.prototype.createUI=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  self.selBand= self.options.selBand || 1;

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="unites">Units:</label>';
  htm+='    <select class="form-control "   name="units" id="units">';
  htm+='      <option value="DEGREES" selected="selected">Degrees</option>';
  htm+='      <option value="RADIANS" >Radians</option>';
  htm+='      <option value="PERCENT" >Percent</option>';
  htm+='    </select>';
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
   
      
      evt.data.units=content.find('#units').val();
      
  });

  this.changesApplied=false
}
