

function LayerGeneralTab() {
     var self=this;    
     this.tabId=LayerGeneralTab.TabId;
    
  }
  LayerGeneralTab.TabId='tabGeneral';
  LayerGeneralTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  LayerGeneralTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  LayerGeneralTab.prototype.applied=function(obj){
    
    return true;
  }
  LayerGeneralTab.prototype.create=function(obj,isActive){
    var self=this;
    this.layer=obj;
    var layerCustom= obj.get('custom');
    var active='';
    if(isActive)
      active ='active';
    
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-cog"></i> General</a>  </li>').appendTo(this.parentDialog.tabPanelNav);
    
    this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='';
    htm+='<div>';  
    htm+='<form id="'+self.tabId+'_form" class="modal-body form-horizontal">';
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="name1">Name</label>';
    htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_general">?</a>'  ;
    htm+='    <input type="text" name="name1" id="name1" value="" placeholder="Name" class="form-control" data-val="true" data-val-required="Layer name is required" />'
    htm+='    <span class="field-validation-valid" data-valmsg-for="name1" data-valmsg-replace="true"></span>';
    htm+='  </div>';
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="opacity">Opacity</label>';
    htm+='    <input type="range" min="0" max="100" value="" name="opacity" id="opacity"  />'
    htm+='  </div>';
    
    htm+='';
    htm+='';
    htm+='';
    htm+='';
    
    htm+='</form></div>';
    
    var origOpacity=this.layer.getOpacity();
    var content=$(htm).appendTo( this.tab); 
    content.find('#name1').val(this.layer.get('title'));
    content.find('input[type=range]').on('input', function () {
      $(this).trigger('change');
      
    });
    content.find('#opacity').val(origOpacity*100);
    content.find('#opacity').attr('title',origOpacity*100 +'%');
    content.find('#opacity').change(function(v){
      self.layer.setOpacity($(this).val()/100.0);
      $(this).attr('title',$(this).val()+'%');
    });
  

    var $form = $(content.find('#'+self.tabId+'_form'));
    $form.on('submit', function(event){
      // prevents refreshing page while pressing enter key in input box
      event.preventDefault();
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
      self.layer.setOpacity(origOpacity);
    });
    this.parentDialog.applyHandlers.push(function(evt){
      self.layer.set('title',content.find('#name1').val());
      self.layer.setOpacity(content.find('#opacity').val()/100.0);
    });
  }

 
  