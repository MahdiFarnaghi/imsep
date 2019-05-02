
function DlgPrint(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgPrint'
      ,(options.title || 'Print')
      ,  mapContainer,obj,options);   

      var settings= this.obj ||{};
  var templates= settings.templates;
  var activeTemplate= templates[0];
  for(var i=0;i<templates.length;i++){
    if(templates[i].name==settings.activeTemplate){
      activeTemplate=templates[i];
      break;
    }
  }
  this.templates=templates;
  this.activeTemplate=activeTemplate;
}
DlgPrint.prototype = Object.create(DlgTaskBase.prototype);


DlgPrint.prototype.createUI=function(){
  var self=this;

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="template">Select print template</label>';
  htm+='    <select class="form-control " id="template" >';
  for( var i=0;i<this.templates.length;i++){
    var tpl= this.templates[i];
    htm+='    <option value="'+tpl.name+'" '+((tpl== this.activeTemplate)?'selected="selected"':'')+' >' +tpl.name+'</option>';
  }
  htm+='    </select>';
  htm+='  </div>';

 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  content.find('#template').change(function(){

  })

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
   
    var templateName= content.find('#template').val();
    var activeTemplate=self.activeTemplate;
    for( var i=0;i<self.templates.length;i++){
      var tpl= self.templates[i];
      if(tpl.name==templateName){
        activeTemplate=tpl;
        break;
      }
    }
      evt.data.settings={
        template:activeTemplate
      }
      
  });

  this.changesApplied=false
}
