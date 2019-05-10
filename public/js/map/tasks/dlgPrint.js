
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
  this.resolution=activeTemplate.resolution || 150;
 
}
DlgPrint.prototype = Object.create(DlgTaskBase.prototype);


DlgPrint.prototype.createUI=function(){
  var self=this;
 var thumbnail='';
 var thumbnail_alt='';
 
 var resolutions=PrintData.resolutions;

 if(self.activeTemplate){
  thumbnail=self.activeTemplate.thumbnail;
  thumbnail_alt=self.activeTemplate.name;
  resolution= self.activeTemplate.resolution;
}
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="template">Select print template to generate PDF file</label>';
  htm+='    <select class="form-control " id="template" >';
  for( var i=0;i<this.templates.length;i++){
    var tpl= this.templates[i];
    htm+='    <option value="'+tpl.name+'" '+((tpl== this.activeTemplate)?'selected="selected"':'')+' >' +tpl.name+'</option>';
  }
  htm+='    </select>';
  htm+='  </div>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="template">Resolution</label>';
  htm+='    <select class="form-control " id="resolution" >';
  for( var key in resolutions){
    var res=resolutions[key];
      htm+='    <option value="'+res+'" '+((res== this.resolution)?'selected="selected"':'')+' >' +key+'</option>';
  }
  htm+='    </select>';
  htm+='  </div>';

  htm+='  <div class="form-group">';
  htm+='    <img id="printThumbnail" style="object-fit: contain; height: 200px; object-position: center; box-shadow: #a4a4ad 10px 10px 10px;" src="'+thumbnail+'" class="img-thumbnail center-block" title="'+thumbnail_alt+'"  height=""></img>';
  htm+='  </div>';
 
  htm+='<div class="form-group">';
  htm+='  <label class="col-sm-offset-1_ col-sm-12 checkbox">';
  htm+='   <input type="checkbox" id="downloadPDF" name="downloadPDF"  value="" /> Download PDF file';
  htm+='</label>';
  htm+='</div>';

  htm += '</form>';
  htm+='  </div>';
  
  var content=$(htm).appendTo( this.mainPanel); 
  content.find('#template').change(function(){
    showThumbnail($(this).val());
  });
  
  var showThumbnail=function(template){
    var selTemplate=undefined;
    for( var i=0;i<self.templates.length;i++){
      var tpl= self.templates[i];
      if(tpl.name==template){
        selTemplate=tpl;
        break;
      }
    }
    if(selTemplate && selTemplate.thumbnail){
      content.find('#printThumbnail').attr('src',selTemplate.thumbnail);
      content.find('#printThumbnail').attr('title',selTemplate.name);
    }else{
      content.find('#printThumbnail').attr('src','');
      content.find('#printThumbnail').attr('title','');
    }

    content.find('#resolution').val(selTemplate.resolution);
  };
 
  
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
    var downloadPDF =content.find('#downloadPDF').prop("checked");
    activeTemplate.resolution= parseInt(content.find('#resolution').val());
      evt.data.settings={
        template:activeTemplate,
        downloadPDF:downloadPDF
      }
      
  });

  this.changesApplied=false
}
