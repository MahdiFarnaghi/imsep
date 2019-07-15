

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
        htm+='                          <option value="custom" '+((display.colorMap=='custom')?'selected="selected"':'')+'>Custom</option>';
        htm+='    </select>';
        htm+='  </div>';

        htm+='<div id="customColorMap" class="form-group">';
        
        htm+=' <table id="tblColors" class=" table order-list col-sm-12">';
        htm+='  <thead>';
        htm+='  <tr><td>Value</td><td>Color</td><td>Caption</td></tr>';
        htm+='  </thead>';
        htm+='  <tbody>';
        var customColorMap=display.customColorMap ||[];
        var counter=0;
        if(customColorMap.length==0){
          htm+='  <tr>';
          var colorStr= StyleFactory.randomColor(null,1);
          var cols = "";

          cols += '<td><input type="text" class="form-control range-rasterValue nospinner" value=""  name="rasterValue' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="rasterValue'+counter+'" data-valmsg-replace="true"></span></td>';
          cols += '<td>';
          cols +='    <div id="fillColorPicker' + counter + '" class="input-group colorpicker-component">';
          cols +='      <input type="text" value="'+colorStr+'" id="fillColor' + counter + '" class="colorpicker-item form-control" />';
          cols +='      <span class="input-group-addon"><i class="raster-color" ></i></span>';
          cols +='    </div>';
          cols += '</td>';
          cols += '<td><input type="text" class="form-control range-rasterCaption nospinner" value=""  name="rasterCaption' + counter + '" ></td>';
          htm+=cols;
          htm+='  </tr>';
          counter++;
        }else{
          for(var i=0;i<customColorMap.length;i++){
              var item= customColorMap[i];
              
              var color='rgba('+item.r + ','+item.g+','+item.b+','+ (item.a/255).toFixed(2)+')';
              htm+='  <tr>';
              var cols = "";

              
              cols += '<td><input type="text" class="form-control range-rasterValue nospinner" value="'+item.value+'"  name="rasterValue' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="rasterValue'+counter+'" data-valmsg-replace="true"></span></td>';
              cols += '<td>';
              cols +='    <div id="fillColorPicker' + counter + '" class="input-group colorpicker-component">';
              cols +='      <input type="text" value="'+color+'" id="fillColor' + counter + '" class=" colorpicker-item form-control" />';
              cols +='      <span class="input-group-addon"><i class="raster-color" ></i></span>';
              cols +='    </div>';
              cols += '</td>';
              cols += '<td><input type="text" class="form-control range-rasterCaption nospinner" value="'+(item.caption||'')+'"  name="rasterCaption' + counter + '" ></td>';

            //  if(i>0){
                cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
            //  }
              htm+=cols;
              htm+='  </tr>';
              counter++;
          }
        }
        htm+='  </tbody>';
        htm+='  <tfoot>';
        htm+='         <tr>';
        htm+='   <td colspan="4" style="text-align: left;"><input type="button" class="btn btn-lg btn-block " id="addRange" value="Add Range" /></td>';
        htm+='  </tr>';
        htm+='  </tfoot>';
        htm+='  </table>';
        htm+='</div>';



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
      if(self.display.colorMap==='custom'){
        content.find('#customColorMap').show();
      }else{
        content.find('#customColorMap').hide();
      }
    });
    if(self.display.colorMap==='custom'){
      content.find('#customColorMap').show();
    }else{
      content.find('#customColorMap').hide();
    }


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

    content.find()
    content.find("#addRange").on("click", function () {
      var newRow = $("<tr>");
      var colorStr= StyleFactory.randomColor(null,1);
      var cols = "";

      cols += '<td><input type="text" class="form-control range-rasterValue nospinner" value=""  name="rasterValue' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="rasterValue'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td>';
      cols +='    <div id="fillColorPicker' + counter + '" class="input-group colorpicker-component">';
      cols +='      <input type="text" value="'+colorStr+'" id="fillColor' + counter + '" class="colorpicker-item form-control" />';
      cols +='      <span class="input-group-addon"><i class="raster-color" ></i></span>';
      cols +='    </div>';
      cols += '</td>';
      cols += '<td><input type="text" class="form-control range-rasterCaption nospinner" value=""  name="rasterCaption' + counter + '" ></td>';
      cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      newRow.append(cols);
      content.find("#tblColors").append(newRow);
      content.find("#tblColors .colorpicker-component").colorpicker();
      counter++;
  });
  content.find("#tblColors").on("click", ".ibtnDel", function (event) {
    $(this).closest("tr").remove();       
    counter -= 1
  });
  

content.find("#tblColors .colorpicker-component").colorpicker();



   var $form = $(content.find('#'+self.tabId+'_form'));
    
     
    this.parentDialog.beforeApplyHandlers.push(function(evt){
         
          var orIgnore= $.validator.defaults.ignore;
          $.validator.setDefaults({ ignore: ":hidden" });
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
      var customColorMap=[];
      content.find('#tblColors > tbody  > tr').each(function() {
        var rasterValue=$(this).find('.range-rasterValue').val();
        var rasterCaption=$(this).find('.range-rasterCaption').val();
        var color= $(this).find('.colorpicker-component').data('colorpicker').color;
       
        if(color){
          var rgb = color.toRGB()
          customColorMap.push({
            caption:rasterCaption,
            value:rasterValue,
            r:rgb.r,
            g:rgb.g,
            b:rgb.b,
            a:rgb.a*255
          })
        }else{
          customColorMap.push({
            caption:rasterCaption,
            value:rasterValue,
            r:0,
            g:0,
            b:0,
            a:0
          })
        }
         

      });
      customColorMap.sort(function(a,b){
        var aV=a.value+'';
        var bV=b.value+'';
        try{
          if(!isNaN(aV) && !isNaN(bV)){
            return parseFloat(bV)- parseFloat(aV);
          }else{
            if(bV.indexOf('%')>=0 && aV.indexOf('%')>=0){
              bV= bV.replace('%','');
              aV=aV.replace('%','');
              return parseFloat(bV)- parseFloat(aV);
            }else{
              return bV>aV;
            }
          }
        }
        catch(ex){
          return 0;
        }
      });
      if(self.display.colorMap=='custom'){
        self.display.customColorMap=customColorMap;
      }
      LayerHelper.setRasterDisplay(self.layer,self.display);
      var geoImageSource = self.parentDialog.mapContainer.sorceFactory.createGeoImageSource(layerCustom.dataObj,self.parentDialog.mapContainer);
      self.layer.set('source',geoImageSource );
      LayerHelper.setDisplayInLegend(self.layer,content.find('#displayInLegend').prop("checked"));
    });
   
  }
 

  