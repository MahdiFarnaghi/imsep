
function DlgHillshade(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgHillshade'
      ,(options.title || 'Hillshade')
      ,  mapContainer,obj,options);   

}
DlgHillshade.prototype = Object.create(DlgTaskBase.prototype);


DlgHillshade.prototype.createUI=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  self.selBand= self.options.selBand || 1;

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <div class="form-group">';
  htm+='    <label id="azimuthLabel" class="" for="azimuth">Azimuth:</label>';
  htm+='    <input type="range" min="0" max="360" value="" name="azimuth" id="azimuth"  />'
  htm+='  </div>';
  htm+='  <div class="form-group">';
  htm+='    <label id="altitudeLabel" class="" for="altitude">Altitude:</label>';
  htm+='    <input type="range" min="0" max="90" value="" name="altitude" id="altitude"  />'
  htm+='  </div>';
 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
  content.find('input[type=range]').on('input', function () {
    $(this).trigger('change');
    $(this).attr('title',$(this).val());
  });
  
 

  
  content.find('#azimuth').trigger('change');
  content.find('#azimuth').change( function(){
      content.find('#azimuthLabel').text( 'Azimuth: '+$(this).val() +' Degrees');
    });
  content.find('#azimuth').val(315);
  content.find('#azimuth').attr('title',315);
  content.find('#azimuth').trigger('change');

   content.find('#altitude').change( function(){
        content.find('#altitudeLabel').text( 'Altitude: '+$(this).val() +' Degrees');
    });
   content.find('#altitude').val(45);
   content.find('#altitude').attr('title',45);
   content.find('#altitude').trigger('change');
     
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
   
      
      evt.data.azimuth=content.find('#azimuth').val();
      evt.data.altitude=content.find('#altitude').val();
      
  });

  this.changesApplied=false
}
