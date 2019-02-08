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
    htm+='    <div class="input-group">';
    
    htm+='        <input type="text" name="glyph" id="glyph" value="" placeholder="Symbol" class="form-control" data-val="true" data-val-required="Symbol is required"  />'
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
       
       var htm = '';
       htm += '<i style="font-size:1.5em;" class="fa '+ item.data.key+'" title="'+ item.value+'"></i>';
      
       htm += label + (item.data.description ? '<pre class="nostyle" style="display:inline;"><br/><small style="">' + description + '</small></pre>' : '');
   
       return $("<li></li>").append(htm).appendTo(ul);
      
   };

}

  