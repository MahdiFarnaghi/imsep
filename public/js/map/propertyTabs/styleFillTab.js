function StyleFillTab() {
  var self=this;    
  this.tabId='StyleFillTab';
  this.caption='Polygon';
 
}
StyleFillTab.prototype.init=function(parentDialog){
 this.parentDialog=parentDialog;
}
StyleFillTab.prototype.activate=function(){
 $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
}
StyleFillTab.prototype.applied=function(obj){
 
 return true;
}
StyleFillTab.prototype.onStrokeChanged=function(stroke){
  if(this.org_style){
    this.org_style.setStroke(stroke);
  }
  if(this._drawSample){
    this._drawSample();
  }
}
StyleFillTab.prototype.create=function(obj,isActive){
 var self=this;
 var active='';
    if(isActive)
      active ='active';
 this.style=obj;
 this.org_style= this.style.clone();
 this.orig_fill= this.style.getFill();
 if(this.orig_fill)
   this._fill= this.orig_fill.clone();
 if(!this._fill)
   this._fill=  StyleFactory.randomStyle().getFill();

 var styleType= 'Fill';
 
 
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-fill"></i> '+self.caption+'</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 
 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div>';
 htm+='    <div id="style_sampleContainer" class="panel-body">';
    
 htm+='    </div>';
 
 htm+='<form id="'+ self.tabId+'_form" class="modal-body form-horizontal">';  

 if(styleType=='Fill'){

 
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="fillColor">Fill color</label>';
 htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#style_polygon">?</a>'  ;
 //htm+='    <input type="color" value="" name="fillColor" id="fillColor"  />';
 htm+='    <div id="fillColorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="fillColor" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';
 }
 
 htm+='';
 htm+='';
 htm+='';
 htm+='';
   
 htm+='</form></div>';
 
 
 var content=$(htm).appendTo( this.tab); 
 var drawSample=function(){
  self.org_style.setFill(self._fill);
  var sym=StyleFactory.renderStyleSample(self.org_style,{width:80,height:40,type:'Polygon'});
  content.find('#style_sampleContainer').html(sym);
};
drawSample();
self._drawSample= drawSample;


 if(styleType=='Fill'){
   content.find('#fillColorPicker').colorpicker({
       color:this._fill.getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._fill.setColor(v);
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
   self.style.setFill(self._fill);
 });
}


