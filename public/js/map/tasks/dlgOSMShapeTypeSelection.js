
function DlgOSMShapeTypeSelection(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgOSMShapeTypeSelection'
      ,(options.title || 'Select shape type')
      ,  mapContainer,obj,options);   

}
DlgOSMShapeTypeSelection.prototype = Object.create(DlgTaskBase.prototype);


DlgOSMShapeTypeSelection.prototype.createUI=function(){
  var self=this;
  var info= this.obj;
  

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <p>';
  //htm+='Clip  features of ('+ layer.get('title') +') with layer:';
  htm+='  </p>';
  htm+='<div class="form-group">';
  htm+='  <div class="radio col-sm-12 ">';
  htm+='    <label><input id="osmShapeType" name="osmShapeType" value="Point" checked="checked" type="radio"> Points ('+ info['Point'].count + ')';
 // htm+='    <span class="help-block">Number of tags:'+ info['Point'].tags.length+' </span>';
  var tags= info['Point'].tags;
  if(tags.length){
    htm+='    <span style="max-width: 100%;text-overflow: ellipsis;overflow: hidden;" class="help-block">Tags:';
    for(var i=0 ; i<10 && i < tags.length;i++ ){
      if(i==0){
        htm+= tags[i].name;
      }else{
        htm+= ', '+tags[i].name;
      }
    }
    if(tags.length >10){
      htm+= ', ... ';
    }
    htm+='    </span>';
  }
  htm+='  </label></div>';
  htm+=' </div>';

  htm+='<div class="form-group">';
  htm+='  <div class="radio col-sm-12 ">';
  htm+='    <label><input id="osmShapeType" name="osmShapeType" value="MultiLineString"  type="radio"> Lines ('+ info['MultiLineString'].count + ')';
 // htm+='    <span  class="help-block">Number of tags:'+ info['MultiLineString'].tags.length+' </span>';
  var tags= info['MultiLineString'].tags;
  if(tags.length){
    htm+='    <span style="max-width: 100%;text-overflow: ellipsis;overflow: hidden;" class="help-block">Tags:';
    for(var i=0 ; i<10 && i < tags.length;i++ ){
      if(i==0){
        htm+= tags[i].name;
      }else{
        htm+= ', '+tags[i].name;
      }
    }
    if(tags.length >10){
      htm+= ', ... ';
    }
    htm+='    </span>';
  }
  htm+='  </label></div>';
  htm+=' </div>';

  htm+='<div class="form-group">';
  htm+='  <div class="radio col-sm-12 ">';
  htm+='    <label><input id="osmShapeType" name="osmShapeType" value="MultiPolygon"  type="radio"> Polygons ('+ info['MultiPolygon'].count + ')';
 // htm+='    <span  class="help-block">Number of tags:'+ info['MultiPolygon'].tags.length+' </span>';
  var tags= info['MultiPolygon'].tags;
  if(tags.length){
    htm+='    <span style="max-width: 100%;text-overflow: ellipsis;overflow: hidden;" class="help-block">Tags:';
    for(var i=0 ; i<10 && i < tags.length;i++ ){
      if(i==0){
        htm+= tags[i].name;
      }else{
        htm+= ', '+tags[i].name;
      }
    }
    if(tags.length >10){
      htm+= ', ... ';
    }
    htm+='    </span>';
  }
  htm+='  </label></div>';
  htm+=' </div>';


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
   
    var osmShapeType = content.find("input[name='osmShapeType']:checked").val();
      evt.data.shapeType=osmShapeType;
      evt.data.info= self.obj;
      
  });

  this.changesApplied=false
}
