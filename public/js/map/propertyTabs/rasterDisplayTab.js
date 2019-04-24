

function RasterDisplayTab() {
     var self=this;  
     this.tabId='tabRasterDisplay';  
      
  }
  RasterDisplayTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  RasterDisplayTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  RasterDisplayTab.prototype.applied=function(obj){
  
   if(obj && obj.get('custom') && obj.get('custom').source=='ol.source.GeoImage'){
      var layerCustom= obj.get('custom');
      if(layerCustom.dataObj && layerCustom.dataObj.details.numberOfBands==1)
       {
        return true;        
      }
   }
  
    return false;
  }
  RasterDisplayTab.prototype.create=function(obj,isActive){
    var self=this;
    this.layer=obj;
    var mapContainer= this.parentDialog.mapContainer;
    var layerCustom= obj.get('custom');
    var active='';
    if(isActive)
      active ='active';
    var sourceType='';    
    
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-paint-brush"></i> Display</a> </li>').appendTo(this.parentDialog.tabPanelNav);
   this.tab=$('<div class="tab-pane '+ active +'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
    
    htm+='';
    htm+='';
    htm+='';
    htm+='';
   
   
    if(layerCustom.dataObj && layerCustom.source=='ol.source.GeoImage')  {
      sourceType='GeoImage';
      var details= LayerHelper.getDetails(self.layer);
      if(details.display){
        self.display=JSON.parse(JSON.stringify(details.display));
      }
      if(!self.display){
        self.display={
          displayType:'colorMap',// vs 'RGB
          band:1,
          colorMap:'grayscale',
          reclass:false
        }
      }
      var display= self.display;
      var displayBand= display.band || 1;
      var band= details.bands[displayBand-1];
      var rasterMinimum= band.minimum;
      var rasterMaximum= band.maximum;

      var minimum=rasterMinimum;
      var maximum=rasterMaximum;
      if(typeof display.minimum !=='undefined')
        minimum=display.minimum;
       else
        display.minimum =minimum;
      if(typeof display.maximum !=='undefined')
        maximum=display.maximum;
       else 
        display.maximum=maximum;
     
       

      
        htm+='<div class="form-group">';
        htm+='<div class="form-group">';
        htm+='  <label class="col-sm-offset-1_ col-sm-12 checkbox">';
        htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_rasterDisplay">?</a>'  ;
        htm+='   <input type="checkbox" id="displayInLegend" name="displayInLegend" ' +((LayerHelper.getDisplayInLegend(this.layer))? 'checked="checked"':'')  +' value="" /> Show in legend';
        htm+='</label>';
        htm+='</div>';
        htm+='  <label class="col-sm-3" for="colorMapType">Color map:</label>';
        //htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_rasterDisplay">?</a>'  ;
        htm+='    <select class="form-control " id="colorMapType"  >';
        htm+='                          <option value="grayscale" '+((display.colorMap=='grayscale')?'selected="selected"':'')+' >Grayscale</option>';
        htm+='                          <option value="pseudocolor" '+((display.colorMap=='pseudocolor')?'selected="selected"':'')+'>Pseudocolor</option>';
        htm+='                          <option value="fire" '+((display.colorMap=='fire')?'selected="selected"':'')+'>Fire</option>';
        htm+='                          <option value="bluered" '+((display.colorMap=='bluered')?'selected="selected"':'')+'>Bluered</option>';
        htm+='    </select>';
        htm+='  </div>';

        htm+='  <div class="form-group">';
        htm+='    <label class="" for="minimum">Minimum</label>';
        htm+='    <input type="number" min="' + rasterMinimum+ '" max="'+ rasterMaximum+'" value="' + minimum+'" name="minimum" id="minimum"  />'
        htm+='  </div>';
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="minimum">Maximum</label>';
        htm+='    <input type="number" min="' + rasterMinimum+ '" max="'+ rasterMaximum+'" value="' + maximum+'" name="maximum" id="maximum"  />'
        htm+='  </div>';
       
      }
     
    
    
    htm+='</form></div>';
    
    var content=$(htm).appendTo( this.tab); 
  
    content.find('#colorMapType').change(function(){
      self.display.colorMap=  $(this).val();
    });
    content.find('#minimum').change(function(){
      self.display.minimum=  $(this).val();
      if(typeof self.display.maximum !='undefined'){
        if(self.display.minimum > self.display.maximum){
          content.find('#maximum').val(self.display.minimum);      
        }
      }

    });
    content.find('#maximum').change(function(){
      self.display.maximum=  $(this).val();
      if(typeof self.display.minimum !='undefined'){
        if(self.display.maximum < self.display.minimum){
          content.find('#minimum').val(self.display.maximum);      
        }
      }
    });
   
   var $form = $(content.find('#'+self.tabId+'_form'));
    
     
    this.parentDialog.beforeApplyHandlers.push(function(evt){
         
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
      
    });
    this.parentDialog.applyHandlers.push(function(evt){
      LayerHelper.setRasterDisplay(self.layer,self.display);
      var geoImageSource = self.parentDialog.mapContainer.sorceFactory.createGeoImageSource(layerCustom.dataObj,self.parentDialog.mapContainer);
      self.layer.set('source',geoImageSource );
      LayerHelper.setDisplayInLegend(self.layer,content.find('#displayInLegend').prop("checked"));
    });
   
  }
 

  