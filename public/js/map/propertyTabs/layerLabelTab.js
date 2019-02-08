

function LayerLabelTab() {
     var self=this;    
     this.tabId='LayerLabelTab';
     
  }
  LayerLabelTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  LayerLabelTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  LayerLabelTab.prototype.applied=function(obj){
    if(obj && obj.get('custom') && obj.get('custom').type=='ol.layer.Vector')
      return true;
    else
      return false;
  }
  LayerLabelTab.prototype.create=function(obj,isActive){
    this.layer=obj;
    var self=this;
    var active='';
    if(isActive)
      active ='active';
    var mapContainer= this.parentDialog.mapContainer;
    var labeler_orig= LayerHelper.getFeatureLabeler( this.layer);
    var labeler;
    var simpleRenderer,uniqueValueRenderer,rangeValueRenderer;
    var  sourceType='';
    var layerCustom=  this.layer.get('custom');
    if(layerCustom && layerCustom.dataObj && layerCustom.format=='ol.format.GeoJSON')  {
        sourceType='GeoJSON';
    }
    if(layerCustom && layerCustom.dataObj && layerCustom.format=='ol.format.WFS'){
      sourceType='WFS';
    }
    var shapeType= LayerHelper.getShapeType( this.layer);
    if(labeler_orig && labeler_orig.clone)
      {
        labeler= labeler_orig.clone();
      }else
      {
        labeler= labeler_orig;
      }
    if(!labeler){
      labeler= new FeatureLabeler();
      labeler.disabled=true;
      if(shapeType==='MultiLineString'){
        labeler.placement= 'line';
      }
    }
    var layerCustom=  this.layer.get('custom');
    var fields= layerCustom.dataObj.details.fields;
    if(!fields){
      fields=[];
    }
    

    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i style="    font-size: 0.7em; color: #9e92dc;" class="glyphicon glyphicon-text-size"></i> Label</a> </li>').appendTo(this.parentDialog.tabPanelNav);
    
    this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+ self.tabId+'_form" class="modal-body form-horizontal">'; 

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-offset-1_ col-sm-12 checkbox">';
    htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_label">?</a>'  ;
    htm+='   <input type="checkbox" id="enabelLabeling" name="enabelLabeling" ' +((labeler.disabled)? '':'checked="checked"')  +' value="" /> Label features';
    htm+='</label>';
    htm+='</div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="fieldName">Field name</label>';
    htm+='    <select class="form-control " id="fieldName" >';
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      if(fld.type !=='bytea'){
        var fldName=fld.name;
        var fldCaption= fld.alias|| fldName;
        var selected= (fld.name=== labeler.fieldName);
        htm+=' <option value="'+ fldName+ '" '+((selected)?'selected="selected"':'')+' >' + fldCaption+ '</option>';
      }
    }
    htm+='    </select>';
    htm+=' </div>';

    /*
    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="textType">Text type</label>';
    htm+='    <select class="form-control " id="textType" >';
    htm+='                          <option value="hide" '+((labeler.type=='hide')?'selected="selected"':'')+' >Hide</option>';
    htm+='                          <option value="normal" '+((labeler.type=='normal')?'selected="selected"':'')+' >Normal</option>';
    htm+='                          <option value="shorten" '+((labeler.type=='shorten')?'selected="selected"':'')+' >Shorten</option>';
    htm+='                          <option value="wrap" '+((labeler.type=='wrap')?'selected="selected"':'')+' >Wrap</option>';
    htm+='    </select>';
    htm+=' </div>';
    */
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="color">Color</label>';
    htm+='    <div id="colorPicker" class="input-group colorpicker-component">';
    htm+='      <input type="text" value="" id="color" class="form-control" />';
    htm+='      <span class="input-group-addon"><i></i></span>';
    htm+='    </div>';
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="size">Size</label>';
    htm+='    <input type="range" min="0" max="60" value="" name="size" id="size"  />'
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="outline">Outline Color</label>';
    htm+='    <div id="outlinePicker" class="input-group colorpicker-component">';
    htm+='      <input type="text" value="" id="outline" class="form-control" />';
    htm+='      <span class="input-group-addon"><i></i></span>';
    htm+='    </div>';
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="outlineWidth">Outline width</label>';
    htm+='    <input type="number" name="outlineWidth" id="outlineWidth" value="'+labeler.outlineWidth+'" placeholder="Border width" class="form-control" data-val="true" data-val-required="Outline width is required" data-val-range="Input a number  from 0 to 20" min="0" max="20" data-val-range-min="0" data-val-range-max="20" />'
    htm+='    <span class="field-validation-valid" data-valmsg-for="outlineWidth" data-valmsg-replace="true"></span>';
    htm+='  </div>';
    /*
    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="align">Align</label>';
    htm+='    <select class="form-control " id="align" >';
    htm+='                          <option value="center" '+((labeler.align=='center')?'selected="selected"':'')+' >Center</option>';
    htm+='                          <option value="end" '+((labeler.align=='end')?'selected="selected"':'')+' >End</option>';
    htm+='                          <option value="left" '+((labeler.align=='left')?'selected="selected"':'')+' >Left</option>';
    htm+='                          <option value="right" '+((labeler.align=='right')?'selected="selected"':'')+' >Right</option>';
    htm+='                          <option value="start" '+((labeler.align=='start')?'selected="selected"':'')+' >Start</option>';
    htm+='    </select>';
    htm+=' </div>';
    
    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="baseline">Baseline</label>';
    htm+='    <select class="form-control " id="baseline" >';
    htm+='                          <option value="alphabetic" '+((labeler.baseline=='alphabetic')?'selected="selected"':'')+' >Alphabetic</option>';
    htm+='                          <option value="bottom" '+((labeler.baseline=='bottom')?'selected="selected"':'')+' >Bottom</option>';
    htm+='                          <option value="hanging" '+((labeler.baseline=='hanging')?'selected="selected"':'')+' >Hanging</option>';
    htm+='                          <option value="ideographic" '+((labeler.baseline=='ideographic')?'selected="selected"':'')+' >Ideographic</option>';
    htm+='                          <option value="middle" '+((labeler.baseline=='middle')?'selected="selected"':'')+' >Middle</option>';
    htm+='                          <option value="top" '+((labeler.baseline=='top')?'selected="selected"':'')+' >Top</option>';
    htm+='    </select>';
    htm+=' </div>';
*/
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="rotation">Rotation</label>';
    htm+='    <input type="range" min="0" max="360" value="" name="rotation" id="rotation"  />'
    htm+='  </div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="font">Font</label>';
    htm+='    <select class="form-control " id="font" >';
    htm+='                          <option value="Arial" '+((labeler.font=='Arial')?'selected="selected"':'')+' >Arial</option>';
    htm+='                          <option value="Tahoma" '+((labeler.font=='Tahoma')?'selected="selected"':'')+' >Tahoma</option>';
    htm+='                          <option value="serif" '+((labeler.font=='serif')?'selected="selected"':'')+' >Serif</option>';
    
    htm+='                          <option value="\'Courier New\'" '+((labeler.baseline=='\'Courier New\'')?'selected="selected"':'')+' >Courier New</option>';
    htm+='                          <option value="\'Open Sans\'" '+((labeler.baseline=='\'Open Sans\'')?'selected="selected"':'')+' >Open Sans</option>';
    htm+='                          <option value="Verdana" '+((labeler.baseline=='Verdana')?'selected="selected"':'')+' >Verdana</option>';
    htm+='    </select>';
    htm+=' </div>';
/*
    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="weight">Weight</label>';
    htm+='    <select class="form-control " id="weight" >';
    htm+='                          <option value="normal" '+((labeler.weight=='normal')?'selected="selected"':'')+' >Normal</option>';
    htm+='                          <option value="bold" '+((labeler.weight=='bold')?'selected="selected"':'')+' >Bold</option>';
    htm+='    </select>';
    htm+=' </div>';
*/
    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="placement">Placement</label>';
    htm+='    <select class="form-control " id="placement" >';
    htm+='                          <option value="point" '+((labeler.placement=='point')?'selected="selected"':'')+' >Point</option>';
    htm+='                          <option value="line" '+((labeler.placement=='line')?'selected="selected"':'')+' >Line</option>';
    htm+='    </select>';
    htm+=' </div>';

    // htm+='  <div class="form-group">';
    // htm+='    <label class="" for="maxangle">Max angle</label>';
    // htm+='    <input type="range" min="0" max="360" value="" name="maxangle" id="maxangle"  />'
    // htm+='  </div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3_" for="overflow">Allow overflow</label>';
    htm+='    <select class="form-control " id="overflow" >';
    htm+='                          <option value="true" '+((labeler.overflow)?'selected="selected"':'')+' >Yes</option>';
    htm+='                          <option value="false" '+((labeler.overflow)?'':'selected="selected"')+' >No</option>';
    htm+='    </select>';
    htm+=' </div>';

   

    htm+='  <div class="form-group">';
    htm+='    <label class="" for="offsetX">Offset X</label>';
    htm+='    <input type="range" name="offsetX" id="offsetX" value="" placeholder="Offset X" class="form-control" min="-20" max="20"  />'
    htm+='  </div>';
    htm+='  <div class="form-group">';
    htm+='    <label class="" for="offsetY">Offset Y</label>';
    htm+='    <input type="range" name="offsetY" id="offsetY" value="" placeholder="Offset Y" class="form-control" min="-20" max="20"  />'
    htm+='  </div>';

    htm+='</form></div>';
    
    var content=$(htm).appendTo( this.tab); 
    
    function refreshLayer(){
       LayerHelper.setFeatureLabeler(self.layer,labeler);
       self.layer.changed();
    };
    content.find('input[type=range]').on('input', function () {
      $(this).trigger('change');
      $(this).attr('title',$(this).val());
    });
    content.find('#enabelLabeling').prop("checked",labeler.disabled?false:true);
    content.find('#enabelLabeling').change(function(){
      var selected= $(this).prop("checked");
      labeler.disabled= (selected?false:true);
      refreshLayer();
    })

    content.find('#fieldName').val(labeler.fieldName);
    content.find('#fieldName').change(function(){
      var selected= $(this).val();
      labeler.fieldName=selected;
      refreshLayer();
    })
    
    content.find('#textType').val(labeler.type);
    content.find('#textType').change(function(){
      var selected= $(this).val();
      labeler.type=selected;
      refreshLayer();
    })
    
    content.find('#size').val(labeler.getSize());
    content.find('#size').attr('title',labeler.getSize());
    content.find('#size').change( function(){
      
      labeler.size=$(this).val()*1 +'px';
      refreshLayer();
    });

    content.find('#colorPicker').colorpicker({
      color:labeler.color
  }).on('changeColor', function(e){
    labeler.color=e.color.toString();
    refreshLayer();
  });
   
  content.find('#outlinePicker').colorpicker({
    color:labeler.outline
}).on('changeColor', function(e){
  labeler.outline=e.color.toString();
  refreshLayer();
});

  content.find('#outlineWidth').val(labeler.outlineWidth);
    content.find('#outlineWidth').attr('title',labeler.outlineWidth);
    content.find('#outlineWidth').change( function(){
      
      labeler.outlineWidth=$(this).val()*1 ;
      refreshLayer();
    });

    content.find('#align').val(labeler.align);
    content.find('#align').change(function(){
      var selected= $(this).val();
      labeler.align=selected;
      refreshLayer();
    });

    content.find('#baseline').val(labeler.baseline);
    content.find('#baseline').change(function(){
      var selected= $(this).val();
      labeler.baseline=selected;
      refreshLayer();
    });

    var rotationVal= labeler.rotation* 180/Math.PI;
    content.find('#rotation').val(rotationVal);
    content.find('#rotation').attr('title',rotationVal);
    content.find('#rotation').change( function(){
      
      labeler.rotation=$(this).val()*Math.PI/180.0 ;
      refreshLayer();
    });

   

    content.find('#font').val(labeler.font);
    content.find('#font').change(function(){
      var selected= $(this).val();
      labeler.font=selected;
      refreshLayer();
    });

    content.find('#weight').val(labeler.weight);
    content.find('#weight').change(function(){
      var selected= $(this).val();
      labeler.weight=selected;
      refreshLayer();
    });
    content.find('#placement').val(labeler.placement);
    content.find('#placement').change(function(){
      var selected= $(this).val();
      labeler.placement=selected;
      refreshLayer();
    });

    var maxangleVal= labeler.maxangle* 180/Math.PI;
    content.find('#maxangle').val(maxangleVal);
    content.find('#maxangle').attr('title',maxangleVal);
    content.find('#maxangle').change( function(){
      
      labeler.maxangle=$(this).val()*Math.PI/180.0 ;
      refreshLayer();
    });

    content.find('#overflow').val(labeler.overflow+'');
    content.find('#overflow').change(function(){
      var selected= $(this).val();
      labeler.overflow=(selected=='true');
      refreshLayer();
    });

    content.find('#offsetX').val(labeler.offsetX);
    content.find('#offsetX').attr('title',labeler.offsetX);
    content.find('#offsetX').change( function(){
      
      labeler.offsetX=$(this).val()*1 ;
      refreshLayer();
    });

    content.find('#offsetY').val(labeler.offsetY);
    content.find('#offsetY').attr('title',labeler.offsetY);
    content.find('#offsetY').change( function(){
      
      labeler.offsetY=$(this).val()*1 ;
      refreshLayer();
    });

    var $form = $(content.find('#'+self.tabId +'_form'));

            
    this.parentDialog.beforeApplyHandlers.push(function(evt){
          //self.layer.set('title',content.find('#name').val());
          var origIgone= $.validator.defaults.ignore;
          $.validator.setDefaults({ ignore:'' });
          $.validator.unobtrusive.parse($form);
          $.validator.setDefaults({ ignore:origIgone });

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

    this.parentDialog.applyHandlers.push(function(evt){
      //self.layer.set('title',content.find('#name').val());
      if(labeler){
        LayerHelper.setFeatureLabeler(self.layer,labeler);
       
      }
    });
    this.parentDialog.cancelHandlers.push(function(evt){
      LayerHelper.setFeatureLabeler(self.layer,labeler_orig);
      self.layer.changed();
    });
  }
  