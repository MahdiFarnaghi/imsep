function StyleStrokeTab() {
  var self=this;    
  this.tabId='StyleStrokeTab';
  this.caption='Line';
 
}
StyleStrokeTab.prototype.init=function(parentDialog){
 this.parentDialog=parentDialog;
}
StyleStrokeTab.prototype.activate=function(){
 $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
}
StyleStrokeTab.prototype.applied=function(obj){
 
 return true;
}
StyleStrokeTab.prototype.create=function(obj,isActive){
 var self=this;
 var active='';
    if(isActive)
      active ='active';
 this.style=obj;
 this.org_style= this.style.clone();
 this.orig_stroke= this.style.getStroke();
 if(this.orig_stroke)
   this._stroke= this.orig_stroke.clone();
 if(!this._stroke)
   this._stroke=  StyleFactory.randomStyle().getStroke();

 var styleType= 'Stroke';
 
 
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-highlighter"></i> '+self.caption+'</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 
 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div>';
 htm+='    <div id="style_sampleContainer" class="panel-body">';
    
 htm+='    </div>';
 htm+='<form id="'+ self.tabId+'_form" class="modal-body form-horizontal">';  

 if(styleType=='Stroke'){

    
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="strokeColor">Color</label>';
    htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#style_line">?</a>'  ;
    htm+='    <div id="strokeColorPicker" class="input-group colorpicker-component">';
    htm+='      <input type="text" value="" id="strokeColor" class="form-control" />';
    htm+='      <span class="input-group-addon"><i></i></span>';
    htm+='    </div>';
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="width">Width</label>';
    htm+='    <input type="range" min="0" max="10" value="" name="width" id="width"  />'
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="col-sm-3_" for="lineCap">Line cap:</label>';
    htm+='    <select class="form-control " id="lineCap" >';
    htm+='      <option value="round">Rounded end</option>';
    htm+='      <option value="butt">Flat end</option>';
    htm+='      <option value="square">Square end</option>';
    htm+='    </select>';
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="col-sm-3_" for="lineJoin">Line join:</label>';
    htm+='    <select class="form-control " id="lineJoin" >';
    htm+='      <option value="round">Rounded corner</option>';
    htm+='      <option value="bevel">Beveled corner</option>';
    htm+='      <option value="miter">Sharp corner (Miter)</option>';
    htm+='    </select>';
    htm+='  </div>';
    // htm+='  <div class="form-group">';
    // htm+='    <label class="" for="miterLimit">Miter limit</label>';
    // htm+='    <input type="range" min="0" max="30" value="" name="miterLimit" id="miterLimit"  />'
    // htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="lineDash">Line dash</label>';
    htm+='    <input type="text" name="lineDash" id="lineDash" value="" placeholder="Line dash pattern" class="form-control" />'
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="lineDashOffset">Line dash offset</label>';
    htm+='    <input type="range" min="0" max="20" value="" name="lineDashOffset" id="lineDashOffset"  />'
    htm+='  </div>';

    
 }
 
 htm+='';
 htm+='';
 htm+='';
 htm+='';
   
 htm+='</form></div>';
 
 
 var content=$(htm).appendTo( this.tab); 
 content.find('input[type=range]').on('input', function () {
  $(this).trigger('change');
  $(this).attr('title',$(this).val());
});
 var drawSample=function(){
    self.org_style.setStroke(self._stroke);
    var sym=StyleFactory.renderStyleSample(self.org_style,{width:80,height:40,type:'Line'});
    content.find('#style_sampleContainer').html(sym);

    if(self.parentDialog){
      for(var i=0; i< self.parentDialog.propertyTabs.length;i++){
        var tab= self.parentDialog.propertyTabs[i];
        if(tab.tabId=='StyleFillTab'){
          tab.onStrokeChanged(self._stroke);
        } 
      }
    }
 };
 drawSample();

 if(styleType=='Stroke'){
   content.find('#strokeColorPicker').colorpicker({
       color:this._stroke.getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._stroke.setColor(v);
     drawSample();
   });
   
   content.find('#width').val(this._stroke.getWidth());
   content.find('#width').attr('title',this._stroke.getWidth());
      content.find('#width').change(function(v){
        self._stroke.setWidth($(this).val()*1);
        drawSample();
      });
  content.find('#miterLimit').val(this._stroke.getMiterLimit());
      content.find('#miterLimit').change(function(v){
        self._stroke.setMiterLimit($(this).val()*1);
        drawSample();
      });  
  content.find('#lineDashOffset').val(this._stroke.getLineDashOffset());
      content.find('#lineDashOffset').change(function(v){
        self._stroke.setLineDashOffset($(this).val()*1);
        drawSample();
      });
  content.find('#lineCap').val(this._stroke.getLineCap());
      content.find('#lineCap').change(function(v){
        self._stroke.setLineCap($(this).val());
        drawSample();
      });           
  content.find('#lineJoin').val(this._stroke.getLineJoin());
      content.find('#lineJoin').change(function(v){
        self._stroke.setLineJoin($(this).val());
        drawSample();
      });    
   var _linedash= this._stroke.getLineDash();
    if(_linedash && _linedash.length){
      _linedash= _linedash.join(',');
    }else{
    _linedash=undefined;               
    }

    content.find('#lineDash').on('input', function () {
      $(this).trigger('change');
    });
  content.find('#lineDash').val(_linedash);
      content.find('#lineDash').change(function(v){
        var dash=$(this).val();
        if(dash){
          dash= dash.split(',');
          for(var i=0;i< dash.length;i++){
            try{
              dash[i]=parseInt(dash[i]);
            }catch(ex){}
          }
        }
        self._stroke.setLineDash(dash);
        drawSample();
      });                 

 }
 

 var $form = $(content.find('#'+self.tabId +'_form'));
 
  
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
 });
 this.parentDialog.applyHandlers.push(function(evt){
   self.style.setStroke(self._stroke);
 });
}


