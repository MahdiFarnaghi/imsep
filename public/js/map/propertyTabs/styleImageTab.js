function StyleImageTab() {
  var self=this;    
  this.tabId='StyleImageTab';
  this.caption='Point';
 
}
StyleImageTab.prototype.init=function(parentDialog){
 this.parentDialog=parentDialog;
}
StyleImageTab.prototype.activate=function(){
 $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
}
StyleImageTab.prototype.applied=function(obj){
 
 return true;
}
StyleImageTab.prototype.create=function(obj,isActive){
 var self=this;
 var active='';
 if(isActive)
   active ='active';
 this.style=obj;
 this.org_style= this.style.clone();
 this.orig_image= this.org_style.getImage();
 if(this.orig_image)
   this._image= this.orig_image;//.clone();
 if(!this._image){
   this._image=  StyleFactory.randomStyle().getImage();
   this.org_style.setImage(this._image);
 }
 var styleType= '';
 
 if(this._image instanceof ol.style.Circle){
   styleType='Circle';
   this._origCircle=this._image;
 }
 else if(this._image instanceof ol.style.FontSymbol)
 {
   styleType='FontSymbol';      
   this._origFontSymbol=this._image;
 }
 else if(this._image instanceof ol.style.Icon)
 {
   styleType='Icon';
   this._origIcon=this._image;      
 }
 else if(this._image instanceof ol.style.RegularShape)
 {
   styleType='RegularShape';      
   this._origRegularShapee=this._image;
 }
 
 
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-map-marker-alt"></i> '+self.caption+'</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 
 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div>';
 htm+='    <div id="style_sampleContainer" class="panel-body">';
    
 htm+='    </div>';
 
 

 htm+='<form id="'+ self.tabId+'_form" class="modal-body form-horizontal">';  
 htm+='<div class="form-group">';
 htm+='  <label class="col-sm-3_" for="symbolType">Type:</label>';
 htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#style_point">?</a>'  ;
 htm+='    <select class="form-control " id="symbolType" >';
 htm+='                          <option value="Circle" '+((styleType=='Circle')?'selected="selected"':'')+' >Simple</option>';
 htm+='                          <option value="FontSymbol" '+((styleType=='FontSymbol')?'selected="selected"':'')+'>Advanced</option>';
 htm+='                          <option value="Icon" '+((styleType=='Icon')?'selected="selected"':'')+'>Image Marker</option>';
 htm+='    </select>';
 htm+=' </div>';

 
 htm+='    <div id="symbolTypeContent" class="panel-body">';
 
 htm+='    </div>';
 
 htm+='';
 htm+='';

 if(styleType=='Circle'){

 
 
 }
 
 htm+='';
 htm+='';
 htm+='';
 htm+='';
   
 htm+='</form></div>';
 
 
 var content=$(htm).appendTo( this.tab); 
 self.content=content;
 self.symbolTypeContent=content.find('#symbolTypeContent');
 content.find('#symbolType').change(function(){
   var selected= $(this).val();
   if(selected=='Circle'){
     if(!self._origCircle){
       self._origCircle=StyleFactory.randomStyle().getImage();
     }
     self._image=self._origCircle;
   }else if(selected=='FontSymbol'){
     if(!self._origFontSymbol){
       self._origFontSymbol= new ol.style.FontSymbol(
         {	form: '', //"hexagone", 
          gradient: false,
          glyph:'maki-circle',
          fontSize: 1,
          fontStyle: '',
          radius: 12, 
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          rotateWithView: false,
          color: '#0000ff',
          fill: new ol.style.Fill(
          {	color: 'white'
          }),
          stroke: new ol.style.Stroke(
          {	color: '#000000',
            width: 1
          })
        })
     }
     self._image=self._origFontSymbol;
   }else if(selected=='Icon'){
     if(!self._origIcon){
       self._origIcon= new ol.style.Icon(
         {	
          src:'/images/markers/blue.png',
          size: [24,38],
          anchorXUnits:'pixels',
          anchorYUnits:'pixels',
          anchor:[11,36],
          //offset:[7,7],
          rotation: 0,
          rotateWithView: false,
          //color: '#0000ff'
         //  ,
         //  fill: new ol.style.Fill(
         //  {	color: 'white'
         //  }),
         //  stroke: new ol.style.Stroke(
         //  {	color: '#000000',
         //    width: 1
         //  })
        })
     }
     self._image=self._origIcon;
   }
   self.populateSettingPanel();
});
self.populateSettingPanel();


 

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
   self.style.setImage(self._image);
 });
}
StyleImageTab.prototype.drawSample=function(){
 var self=this;
 if(self._image && self._image.load){
   //self._image.load();
   if(self._image.iconImage_ && self._image.iconImage_.size_){
     self._image.size_=self._image.iconImage_.size_;
   }
   if(self._image.iconImage_ && self._image.iconImage_.image_){
     self._image.iconImage_.image_.onload=function(){
       try{
         if(self._image.iconImage_.size_){
           self._image.size_=self._image.iconImage_.size_;
         }else if (self._image.iconImage_.image_){
           self._image.size_=[self._image.iconImage_.image_.width || 16,self._image.iconImage_.image_.height || 16];
         }
       }catch(ex){}
        self.drawSample();
     };
   }
   self._image.load();
 }
 self.org_style.setImage(self._image);
 // setTimeout(function() {
   var sym=StyleFactory.renderStyleSample(self.org_style,{width:80,height:40,type:'Point'});
   self.content.find('#style_sampleContainer').html(sym); 
 // }, 100);
}
StyleImageTab.prototype.populateSettingPanel=function(){
  if(!this._image){
    return;
  }
  if(this._image instanceof ol.style.Circle){
     this.populateCirclePanel();
 }
 else if(this._image instanceof ol.style.FontSymbol)
 {
     this.populateFontSymbolPanel();
 }else if(this._image instanceof ol.style.Icon)
 {
     this.populateIconPanel();
 }
 
}
StyleImageTab.prototype.populateCirclePanel=function(){
 var self=this;
 self.symbolTypeContent.html('');
 var htm='';
// htm+='  <div class="form-group">';
 // htm+='    <label class="" for="radius">Radius</label>';
 // htm+='    <input type="number" name="radius" id="radius" value="" placeholder="Radius" class="form-control" data-val="true" data-val-required="Radius is required" data-val-range_="Input a number  from 0 to 20" min="0" max="20" data-val-range-min="0" data-val-range-max="20" />'
 // htm+='    <span class="field-validation-valid" data-valmsg-for="radius" data-valmsg-replace="true"></span>';
 // htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="radius">Radius</label>';
 htm+='    <input type="range" min="0" max="30" value="" name="radius" id="radius"  />'
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="fillColor">Fill color</label>';
 //htm+='    <input type="color" value="" name="fillColor" id="fillColor"  />';
 htm+='    <div id="fillColorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="fillColor" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';
 
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="strokeColor">Border color</label>';
 //htm+='    <input type="color" value="" name="strokeColor" id="strokeColor"  />'
 htm+='    <div id="strokeColorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="strokeColor" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="strokeWidth">Border width</label>';
 htm+='    <input type="number" name="strokeWidth" id="strokeWidth" value="" placeholder="Border width" class="form-control" data-val="true" data-val-required="Border width is required" data-val-range="Input a number  from 0 to 20" min="0" max="20" data-val-range-min="0" data-val-range-max="20" />'
 htm+='    <span class="field-validation-valid" data-valmsg-for="strokeWidth" data-valmsg-replace="true"></span>';
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="opacity">Opacity</label>';
 htm+='    <input type="range" min="0" max="100" value="" name="opacity" id="opacity"  />'
 htm+='  </div>';
 self.symbolTypeContent.html(htm);


 self.symbolTypeContent.find('input[type=range]').on('input', function () {
   $(this).trigger('change');
   $(this).attr('title',$(this).val());
 });
 
self.drawSample();

 
   self.symbolTypeContent.find('#radius').val(this._image.getRadius());
   self.symbolTypeContent.find('#radius').attr('title',this._image.getRadius());
   self.symbolTypeContent.find('#radius').change( function(){
     self._image.setRadius($(this).val()*1);
     self.drawSample();
   });
  // var fc=this._image.get(Fill).getColor();
  // content.find('#fillColor').val(fc);
  // content.find('#strokeColor').val(this._image.getStroke().getColor());
  self.symbolTypeContent.find('#fillColorPicker').colorpicker({
       color:this._image.getFill().getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._image.getFill().setColor(v);
     self._image.setRadius(self._image.getRadius());// force to refresh
     self.drawSample();
   });
   self.symbolTypeContent.find('#strokeColorPicker').colorpicker({
     color:this._image.getStroke().getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._image.getStroke().setColor(v);
     self._image.setRadius(self._image.getRadius());// force to refresh
     self.drawSample();
   });
   
   self.symbolTypeContent.find('#strokeWidth').on('input', function () {
     $(this).trigger('change');
   });
   self.symbolTypeContent.find('#strokeWidth').val(this._image.getStroke().getWidth());
   self.symbolTypeContent.find('#strokeWidth').change( function(){
     self._image.getStroke().setWidth($(this).val()*1);
     self._image.setRadius(self._image.getRadius());// force to refresh
     self.drawSample();
   });
   self.symbolTypeContent.find('#opacity').val(this._image.getOpacity()*100);
   self.symbolTypeContent.find('#opacity').attr('title',this._image.getOpacity()*100);
   self.symbolTypeContent.find('#opacity').change(function(v){
     self._image.setOpacity($(this).val()/100.0);
     self._image.setRadius(self._image.getRadius());// force to refresh
     self.drawSample();
    
   });
 

}
StyleImageTab.prototype.populateFontSymbolPanel=function(){
 var self=this;
 self.symbolTypeContent.html('');
 var htm='';

 htm+='<div class="form-group">';
 htm+='    <label>Symbol</label>';
 htm+='    <div class="input-group" data-toggle="popover" data-placement="top" data-content="Type symbol name" >';
 
 htm+='        <input type="text" name="glyph" id="glyph" value="" placeholder="Symbol"  class="form-control" data-val="true" data-val-required="Symbol is required"  />'
 htm+='        <span class="input-group-addon" id="glyphAddon" ></span>';
 htm+='    </div>';
 htm+='    <span class="field-validation-valid" data-valmsg-for="glyph" data-valmsg-replace="true"></span>';
 htm+=' </div>';


 htm+='  <div class="form-group">';
 htm+='    <label class="" for="radius">Size</label>';
 htm+='    <input type="range" min="0" max="30" value="" name="radius" id="radius"  />'
 htm+='  </div>';
 
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="color">Color</label>';
 //htm+='    <input type="color" value="" name="fillColor" id="fillColor"  />';
 htm+='    <div id="colorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="color" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';

 
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="strokeColor">Border color</label>';
 //htm+='    <input type="color" value="" name="strokeColor" id="strokeColor"  />'
 htm+='    <div id="strokeColorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="strokeColor" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="strokeWidth">Border width</label>';
 htm+='    <input type="number" name="strokeWidth" id="strokeWidth" value="" placeholder="Border width" class="form-control" data-val="true" data-val-required="Border width is required" data-val-range="Input a number  from 0 to 20" min="0" max="20" data-val-range-min="0" data-val-range-max="20" />'
 htm+='    <span class="field-validation-valid" data-valmsg-for="strokeWidth" data-valmsg-replace="true"></span>';
 htm+='  </div>';

 htm+='<div class="form-group">';
 htm+='  <label class="col-sm-3_" for="symbolFrame">Frame:</label>';
 htm+='   <select class="form-control " id="symbolFrame" >';
 htm+='    <option value="none" selected="selected">None</option>';
 htm+='    <option value="circle">Circle</option>';
 htm+='    <option value="poi">POI</option>';
 htm+='    <option value="bubble">Bubble</option>';
 htm+='    <option value="marker">Marker</option>';
 htm+='    <option value="coma">Coma</option>';
 htm+='    <option value="shield">Shield</option>';
 htm+='    <option value="blazon">Blazon</option>';
 htm+='    <option value="bookmark">Bookmark</option>';
 htm+='    <option value="hexagon">Hexagon</option>';
 htm+='    <option value="diamond">Diamond</option>';
 htm+='    <option value="triangle">Triangle</option>';
 htm+='    <option value="sign">Sign</option>';
 htm+='    <option value="ban">Ban</option>';
 htm+='    <option value="lozenge">Lozenge</option>';
 htm+='    <option value="square">Square</option>';
 htm+='    </select>';
 htm+=' </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="fillColor">Frame fill color</label>';
 //htm+='    <input type="color" value="" name="fillColor" id="fillColor"  />';
 htm+='    <div id="fillColorPicker" class="input-group colorpicker-component">';
 htm+='      <input type="text" value="" id="fillColor" class="form-control" />';
 htm+='      <span class="input-group-addon"><i></i></span>';
 htm+='    </div>';
 htm+='  </div>';

 htm+='  <div class="form-group">';
 htm+='    <label class="" for="fontScale">Font scale</label>';
 htm+='    <input type="range" min="0" max="200" value="" name="fontScale" id="fontScale"  />'
 htm+='  </div>';

 htm+='  <div class="form-group">';
 htm+='    <label class="" for="opacity">Opacity</label>';
 htm+='    <input type="range" min="0" max="100" value="" name="opacity" id="opacity"  />'
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="rotation">Rotation</label>';
 htm+='    <input type="range" min="0" max="360" value="" name="rotation" id="rotation"  />'
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="offsetX">Offset X</label>';
 htm+='    <input type="range" name="offsetX" id="offsetX" value="" placeholder="Offset X" class="form-control" min="-20" max="20"  />'
 htm+='  </div>';
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="offsetY">Offset Y</label>';
 htm+='    <input type="range" name="offsetY" id="offsetY" value="" placeholder="Offset Y" class="form-control" min="-20" max="20"  />'
 htm+='  </div>';
 
 self.symbolTypeContent.html(htm);


 self.symbolTypeContent.find('input[type=range]').on('input', function () {
   $(this).trigger('change');
   $(this).attr('title',$(this).val());
 });
 
self.drawSample();
self.create_glyph_AutoSearch();

self.symbolTypeContent.find('[data-toggle="popover"]').popover();

self.symbolTypeContent.find('#glyph').val()
self.symbolTypeContent.find('#glyph').val(this._image.getGlyphName());
self.symbolTypeContent.find('#glyph').change( function(){
 self._image.glyph_ =self._image.getGlyph(($(this).val()));
 self._image.renderMarker_();
 self.drawSample();
 self.symbolTypeContent.find('#glyphAddon').html('<i style="font-size:1.5em;min-width:2em;" class="fa '+ $(this).val()+'" ></i>');
});
self.symbolTypeContent.find('#glyphAddon').html('<i style="font-size:1.5em;min-width:2em;" class="fa '+ self.symbolTypeContent.find('#glyph').val()+'" ></i>');
self.symbolTypeContent.find('#glyphAddon').click(function(){
 self.symbolTypeContent.find('#glyph').autocomplete("search");
});

self.symbolTypeContent.find('#symbolFrame').val(self._image.form_);
self.symbolTypeContent.find('#symbolFrame').change( function(){
  self._image.form_ =($(this).val());
  self._image.renderMarker_();
  self.drawSample();
});
   self.symbolTypeContent.find('#radius').val(this._image.getRadius());
   self.symbolTypeContent.find('#radius').attr('title',this._image.getRadius());
   self.symbolTypeContent.find('#radius').change( function(){
     var obj=StyleFactory.getFontSymbol(self._image);
     obj.radius=$(this).val()*1;
     self._origFontSymbol= self._image= StyleFactory.fontSymbol(obj);
     
     self.drawSample();
   });
   self.symbolTypeContent.find('#fontScale').val(this._image.fontSize_*100);
   self.symbolTypeContent.find('#fontScale').attr('title',this._image.fontSize_*100);
   self.symbolTypeContent.find('#fontScale').change( function(){
     self._image.fontSize_=(($(this).val()/100.0));
     self._image.renderMarker_();
     self.drawSample();
   });
  
  self.symbolTypeContent.find('#colorPicker').colorpicker({
     color:this._image.color_
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._image.color_=(v);
   
     self._image.renderMarker_();
     self.drawSample();
 });
  self.symbolTypeContent.find('#fillColorPicker').colorpicker({
       color:this._image.getFill().getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._image.getFill().setColor(v);
    // self._image.setRadius(self._image.getRadius());// force to refresh
    self._image.renderMarker_();
     self.drawSample();
   });
   self.symbolTypeContent.find('#strokeColorPicker').colorpicker({
     color:this._image.getStroke().getColor()
   }).on('changeColor', function(e){
     var v=e.color.toString();
     self._image.getStroke().setColor(v);
     //self._image.setRadius(self._image.getRadius());// force to refresh
     self._image.renderMarker_();
     self.drawSample();
   });
   
   self.symbolTypeContent.find('#strokeWidth').on('input', function () {
     $(this).trigger('change');
   });
   self.symbolTypeContent.find('#strokeWidth').val(this._image.getStroke().getWidth());
   self.symbolTypeContent.find('#strokeWidth').change( function(){
     self._image.getStroke().setWidth($(this).val()*1);
     //self._image.setRadius(self._image.getRadius());// force to refresh
     self._image.renderMarker_();
     self.drawSample();
   });
   self.symbolTypeContent.find('#opacity').val(this._image.getOpacity()*100);
   self.symbolTypeContent.find('#opacity').attr('title',this._image.getOpacity()*100);
   self.symbolTypeContent.find('#opacity').change(function(v){
     self._image.setOpacity($(this).val()/100.0);
     //self._image.setRadius(self._image.getRadius());// force to refresh
     self._image.renderMarker_();
     self.drawSample();
    
   });

   self.symbolTypeContent.find('#rotation').val(this._image.getRotation()*180/Math.PI);
   self.symbolTypeContent.find('#rotation').attr('title',this._image.getRotation()*180/Math.PI);
   self.symbolTypeContent.find('#rotation').change(function(v){
     self._image.setRotation($(this).val()*Math.PI/180.0);
     self._image.renderMarker_();
     self.drawSample();
    
   });
   self.symbolTypeContent.find('#offsetX').val(this._image.offset_[0]);
   self.symbolTypeContent.find('#offsetX').change( function(){
     self._image.offset_[0]=($(this).val()*1);
     //self._image.setRadius(self._image.getRadius());// force to refresh
     self._image.renderMarker_();
     self.drawSample();
   });
   self.symbolTypeContent.find('#offsetY').val(this._image.offset_[1]);
   self.symbolTypeContent.find('#offsetY').change( function(){
     self._image.offset_[1]=($(this).val()*1);
     //self._image.setRadius(self._image.getRadius());// force to refresh
     self._image.renderMarker_();
     self.drawSample();
   });
}

StyleImageTab.prototype.create_glyph_AutoSearch=function(){
var self=this;     

var cache = [];
var glyphs = ol.style.FontSymbol.prototype.defs.glyphs;
for (var i in glyphs)
{	
   //if(glyphs[i].font !=='Font Awesome 5 Free'){
 cache.push({
       name:glyphs[i].name,
       search:glyphs[i].search,
       key:i
     })
 //}
}


var thisAutoComplete= self.symbolTypeContent.find('#glyph').autocomplete({
   minLength: 0,
   appendTo:self.symbolTypeContent,
   source: function (request, response) {
       var term = request.term;
       var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
       var text = $( this ).text();
       //if (term in cache) {
      if (cache) {
              //var data = cache[term];
           var data = cache;
           var mappedData=$.map(data, function (item) {
               if ( item.name && ( !request.term || matcher.test(item.name) || matcher.test(item.key) || matcher.test(item.search) ) ){
                   return {
                       label: item.key,
                       value: item.key,
                       data:item
                   };
             }
           })
           response(mappedData);
           return;
       }
       
   },
   select: function (event, ui) {
      
       $(this).val(ui.item.label);
      
       // me.doSearch($(me._container).find('.L-mySearch-searchinput').val());
       //thisAutoComplete.autocomplete('option','change').call(thisAutoComplete);
       //self.symbolTypeContent.find('#glyph').data("ui-autocomplete")._trigger("change")
       $(this).trigger("change");
       return false;
   },
   focus: function (event, ui) {
       //commentes 2016/05/03
     //  $(this).val(ui.item.label);
       return false;
   },
   open: function() {
       $("ul.ui-menu").width($(this).innerWidth());
   }
})
.focus(function (event, ui) {

    //$(this).trigger('keydown.autocomplete');
    $(this).autocomplete("search");
   // showResults(ui.item);
})
  
.data("ui-autocomplete")._renderItem = function (ul, item) {
    var label = item.data.name;
    var description = item.data.search || '';
    var term = this.term;
  

    if (term) {
       // label = String(label).replace( new RegExp(term, "gi"),
       //      "<strong class='ui-state-highlight'>$&</strong>");
       // description = String(description).replace( new RegExp(term, "gi"),
       //     "<strong class='ui-state-highlight'>$&</strong>");
    }
    
    var htm = '<div class="autocomplete-custom-item ">';
    htm += '<i style="font-size:1.5em;" class="  fa '+ item.data.key+'" title="'+ item.value+'"></i>';
   
    htm += label + (item.data.description ? '<pre class="nostyle" style="display:inline;"><br/><small style="">' + description + '</small></pre>' : '');
    htm += '</div>'; 
    return $("<li></li>").append(htm).appendTo(ul);
   
};

}


StyleImageTab.prototype.populateIconPanel=function(){
var self=this;
self.symbolTypeContent.html('');
var htm='';

// htm+='<div class="form-group">';
// htm+='    <label>Image Url</label>';
// htm+='    <input style="direction:ltr" type="text" name="src" id="src" value="" placeholder="Image Url"  class="form-control" data-val="true" data-val-required="Image Url is required"  />'
// htm+='    <span class="field-validation-valid" data-valmsg-for="src" data-valmsg-replace="true"></span>';
// htm+=' </div>';

htm+='<div class="form-group">';
htm+='    <label>Image Url</label>';
htm+='    <div class="input-group" >';
htm+='    <span class="input-group-addon">';
htm+='    <div class="dropdown input-group-addon_ ">';
htm+='      <button style="padding: 5px 15px;" class="btn btn-default dropdown-toggle" type="button" id="imageMarker_src_dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">';
htm+='        <span class="glyphicon glyphicon-chevron-down"></span>';
htm+='     </button>';
htm+='     <ul style=" max-height: 200px; overflow-y: auto;" id="imageMarker_src_menu" class="dropdown-menu">'

htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="39" src="/images/markers/bblue.png" style="max-width:32px" />B blue</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="39" src="/images/markers/bgreen.png" style="max-width:32px" />B green</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="39" src="/images/markers/bred.png" style="max-width:32px" />B red</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="36" src="/images/markers/blue.png" style="max-width:32px" />Blue</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/blue_circle.png" style="max-width:32px" />blue_circle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/blue_orifice.png" style="max-width:32px" />blue_orifice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/blue_std.png" style="max-width:32px" />blue_std</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="9" data-y="30" src="/images/markers/red.png"  style="max-width:32px" />Red</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/red_circle.png" style="max-width:32px" />red_circle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/red_orifice.png" style="max-width:32px" />red_orifice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/red_std.png" style="max-width:32px" />red_std</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="9" data-y="32" src="/images/markers/green.png"  style="max-width:32px" />Green</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/green_circle.png" style="max-width:32px" />green_circle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/green_orifice.png" style="max-width:32px" />green_orifice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/green_std.png" style="max-width:32px" />green_std</li>';


htm+='      <li style="cursor:pointer;"> <img data-x="9" data-y="32" src="/images/markers/orange.png"  style="max-width:32px" />Orange</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/yellow_circle.png" style="max-width:32px" />yellow_circle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/yellow_orifice.png" style="max-width:32px" />yellow_orifice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/yellow_std.png" style="max-width:32px" />yellow_std</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="9" data-y="32" src="/images/markers/gray.png"  style="max-width:32px" />Gray</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/white_circle.png" style="max-width:32px" />white_circle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/white_orifice.png" style="max-width:32px" />white_orifice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="12" data-y="34" src="/images/markers/white_std.png" style="max-width:32px" />white_std</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/drop.png"  style="max-width:32px" />Drop</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/drops.png"  style="max-width:32px" />Drops</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/cloud.png"  style="max-width:32px" />Cloud</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/water.png"  style="max-width:32px" />Water</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/wave.png"  style="max-width:32px" />Wave</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/weather1.png"  style="max-width:32px" />Weather1</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/weather2.png"  style="max-width:32px" />Weather2</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/weather3.png"  style="max-width:32px" />Weather3</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/weather4.png"  style="max-width:32px" />Weather4</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="14" data-y="13" src="/images/markers/weather5.png"  style="max-width:32px" />Weather5</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/wetland.png"  style="max-width:32px" />Wetland</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/wetland1.png"  style="max-width:32px" />Wetland1</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/storm.png"  style="max-width:32px" />Storm</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/rain.png"  style="max-width:32px" />Rain</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/rain1.png"  style="max-width:32px" />Rain1</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="13" data-y="13" src="/images/markers/fire.png"  style="max-width:32px" />Fire</li>';


htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_black.png"  style="max-width:32px" />Black flag</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_blue.png"  style="max-width:32px" />Blue flag</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_green.png"  style="max-width:32px" />Green flag</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_orange.png"  style="max-width:32px" />Orange flag</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_purple.png"  style="max-width:32px" />Purple flag</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="4" data-y="28" src="/images/markers/flag_red.png"  style="max-width:32px" />Red flag</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_bicycle.png"  style="max-width:32px" />blue_bicycle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_car.png"  style="max-width:32px" />blue_car</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_coffe.png"  style="max-width:32px" />blue_coffe</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_food.png"  style="max-width:32px" />blue_food</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_gas.png"  style="max-width:32px" />blue_gas</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_home.png"  style="max-width:32px" />blue_home</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_house.png"  style="max-width:32px" />blue_house</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_plane.png"  style="max-width:32px" />blue_plane</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="41" src="/images/markers/blue_train.png"  style="max-width:32px" />blue_train</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_black.png"  style="max-width:32px" />star_pin_black</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_blue.png"  style="max-width:32px" />star_pin_blue</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_green.png"  style="max-width:32px" />star_pin_green</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_orange.png"  style="max-width:32px" />star_pin_orange</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_purple.png"  style="max-width:32px" />star_pin_purple</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/star_pin_red.png"  style="max-width:32px" />star_pin_red</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="40" src="/images/markers/tweet.png"  style="max-width:32px" />tweet</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_hearth.png"  style="max-width:32px" />round_hearth</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_ice.png"  style="max-width:32px" />round_ice</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_key.png"  style="max-width:32px" />round_key</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_radioactive.png"  style="max-width:32px" />round_radioactive</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_sheet.png"  style="max-width:32px" />round_sheet</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/round_star.png"  style="max-width:32px" />round_star</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="16" data-y="34" src="/images/markers/twitter.png"  style="max-width:32px" />twitter</li>';

htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/accommodation.png"  style="max-width:32px" />accommodation</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/atv.png"  style="max-width:32px" />atv</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/castle.png"  style="max-width:32px" />castle</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/church.png"  style="max-width:32px" />church</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/communication.png"  style="max-width:32px" />communication</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/condominium.png"  style="max-width:32px" />condominium</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/culture.png"  style="max-width:32px" />culture</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/direction_down.png"  style="max-width:32px" />direction_down</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/direction_up.png"  style="max-width:32px" />direction_up</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/direction_upthenleft.png"  style="max-width:32px" />direction_upthenleft</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/direction_upthenright.png"  style="max-width:32px" />direction_upthenright</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/disability.png"  style="max-width:32px" />disability</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/elevator_up.png"  style="max-width:32px" />elevator_up</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/festival.png"  style="max-width:32px" />festival</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/finish.png"  style="max-width:32px" />finish</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/fourbyfour.png"  style="max-width:32px" />fourbyfour</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/food.png"  style="max-width:32px" />food</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/Health care.png"  style="max-width:32px" />Health care</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/highschool.png"  style="max-width:32px" />highschool</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/hospital-building.png"  style="max-width:32px" />hospital-building</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/karting.png"  style="max-width:32px" />karting</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/List.png"  style="max-width:32px" />List</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/loc.png"  style="max-width:32px" />loc</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/motorbike.png"  style="max-width:32px" />motorbike</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/movierental.png"  style="max-width:32px" />movierental</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/postal.png"  style="max-width:32px" />postal</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/Public institutions.png"  style="max-width:32px" />Public institutions</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/school.png"  style="max-width:32px" />school</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/service.png"  style="max-width:32px" />service</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/snowmobiling.png"  style="max-width:32px" />snowmobiling</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/Shopping.png"  style="max-width:32px" />Shopping</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/Shopping1.png"  style="max-width:32px" />Shopping1</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/sports.png"  style="max-width:32px" />sports</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/sportscar.png"  style="max-width:32px" />sportscar</li>';
htm+='      <li style="cursor:pointer;"> <img data-x="15" data-y="35" src="/images/markers/training.png"  style="max-width:32px" />training</li>';






htm+='      </ul>';
htm+='     </div>';
htm+='     </span>';
htm+='    <input style="direction:ltr" type="text" name="src" id="src" value="" placeholder="Image Url"  class="form-control" data-val="true" data-val-required="Image Url is required"  />'



htm+='    </div>';
htm+='    <span class="field-validation-valid" data-valmsg-for="src" data-valmsg-replace="true"></span>';

htm+=' </div>';



// htm+='  <div class="form-group">';
// htm+='    <label class="" style=" float: right; margin-right: .5em;" for="scale">Scale</label>';
// htm+='    <input type="range" min="0" max="300" value="" name="scale" id="scale"  />'
// htm+='  </div>';

htm+='  <div class="form-group">';
htm+='    <label class="" style=" float: right; margin-right: .5em;" for="opacity">Opacity</label>';
htm+='    <input type="range" min="0" max="100" value="" name="opacity" id="opacity"  />'
htm+='  </div>';
// htm+='  <div class="form-group">';
// htm+='    <label class="" style=" float: right; margin-right: .5em;" for="rotation">دوران</label>';
// htm+='    <input type="range" min="0" max="360" value="" name="rotation" id="rotation"  />'
// htm+='  </div>';
// htm+='  <div class="form-group">';
// htm+='    <label class="" style=" float: right; margin-right: .5em;" for="offsetX">جابجایی در جهت x</label>';
// htm+='    <input type="range" name="offsetX" id="offsetX" value="" placeholder="Offset X" class="form-control" min="-20" max="20"  />'
// htm+='  </div>';

// htm+='  <div class="form-group">';
// htm+='    <label class="" style=" float: right; margin-right: .5em;" for="offsetY">جابجایی  در جهت y</label>';
// htm+='    <input type="range" name="offsetY" id="offsetY" value="" placeholder="Offset Y" class="form-control" min="-20" max="20"  />'
// htm+='  </div>';

htm+='  <div class="form-group">';
htm+='    <label class="" style=" float: right; margin-right: .5em;" for="anchorX">Anchor X</label>';
htm+='    <input type="range" name="anchorX" id="anchorX" value="" placeholder="Anchor X" class="form-control" min="-100" max="100"  />'
htm+='  </div>';
htm+='  <div class="form-group">';
htm+='    <label class="" style=" float: right; margin-right: .5em;" for="anchorY">Anchor Y</label>';
htm+='    <input type="range" name="anchorY" id="anchorY" value="" placeholder="Anchor Y" class="form-control" min="-100" max="100"  />'
htm+='  </div>';
self.symbolTypeContent.html(htm);


self.symbolTypeContent.find('input[type=range]').on('input', function () {
 $(this).trigger('change');
 $(this).attr('title',$(this).val());
});

self.drawSample();


self.symbolTypeContent.find('#src').val(self._image.getSrc());
self.symbolTypeContent.find('#src').change( function(){
//self._image.setSrc($(this).val());
 var json= StyleFactory.styleToJson(self.org_style);
 json.icon.src=$(this).val();
 self.org_style= StyleFactory.jsonToStyle(json);
 self._image= self.org_style.getImage();
//self._image.renderMarker_();
self.drawSample();
});
self.symbolTypeContent.find('#imageMarker_src_menu li').unbind('click').click(function(){
var img = $(this).find('img');
var x= img.data('x');
var y= img.data('y');
self.symbolTypeContent.find('#src').val(img.attr('src')).trigger('change');
if(typeof x !='undefined'){
self.symbolTypeContent.find('#anchorX').val(x).trigger('change');
}
if(typeof y !='undefined'){
self.symbolTypeContent.find('#anchorY').val(y).trigger('change');
}
});
 self.symbolTypeContent.find('#scale').val(this._image.getScale()*100);
 self.symbolTypeContent.find('#scale').attr('title',this._image.getScale()*100);
 self.symbolTypeContent.find('#scale').change( function(){
   self._image.setScale(($(this).val()/100.0));
  // self._image.renderMarker_();
   self.drawSample();
 });


 

 self.symbolTypeContent.find('#opacity').val(this._image.getOpacity()*100);
 self.symbolTypeContent.find('#opacity').attr('title',this._image.getOpacity()*100);
 self.symbolTypeContent.find('#opacity').change(function(v){
   self._image.setOpacity($(this).val()/100.0);
   //self._image.setRadius(self._image.getRadius());// force to refresh
  // self._image.renderMarker_();
   self.drawSample();
  
 });

 self.symbolTypeContent.find('#rotation').val(this._image.getRotation()*180/Math.PI);
 self.symbolTypeContent.find('#rotation').attr('title',this._image.getRotation()*180/Math.PI);
 self.symbolTypeContent.find('#rotation').change(function(v){
   self._image.setRotation($(this).val()*Math.PI/180.0);
 //  self._image.renderMarker_();
   self.drawSample();
  
 });
 self.symbolTypeContent.find('#offsetX').val(this._image.offset_[0]);
 self.symbolTypeContent.find('#offsetX').change( function(){
   self._image.offset_[0]=($(this).val()*1);
   //self._image.setRadius(self._image.getRadius());// force to refresh
  // self._image.renderMarker_();
   self.drawSample();
 });
 self.symbolTypeContent.find('#offsetY').val(this._image.offset_[1]);
 self.symbolTypeContent.find('#offsetY').change( function(){
   self._image.offset_[1]=($(this).val()*1);
   //self._image.setRadius(self._image.getRadius());// force to refresh
  // self._image.renderMarker_();
   self.drawSample();
 });
 self.symbolTypeContent.find('#anchorX').val(this._image.anchor_[0]);
 self.symbolTypeContent.find('#anchorX').change( function(){
   self._image.anchor_[0]=($(this).val());
   //self._image.setRadius(self._image.getRadius());// force to refresh
  // self._image.renderMarker_();
   self.drawSample();
 });
 self.symbolTypeContent.find('#anchorY').val(this._image.anchor_[1]);
 self.symbolTypeContent.find('#anchorY').change( function(){
   self._image.anchor_[1]=($(this).val());
   //self._image.setRadius(self._image.getRadius());// force to refresh
  // self._image.renderMarker_();
   self.drawSample();
 });
}