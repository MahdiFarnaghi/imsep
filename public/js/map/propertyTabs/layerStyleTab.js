

function LayerStyleTab() {
     var self=this;    
     this.tabId='tabStyle';
     
  }
  LayerStyleTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  LayerStyleTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  LayerStyleTab.prototype.applied=function(obj){
    if(obj && obj.get('custom') && obj.get('custom').type=='ol.layer.Vector')
      return true;
    else
      return false;
  }
  LayerStyleTab.prototype.create=function(obj,isActive){
    this.layer=obj;
    var self=this;
    var active='';
    if(isActive)
      active ='active';
    var mapContainer= this.parentDialog.mapContainer;
    var renderer_orig= LayerHelper.getRenderer( this.layer);
    var renderer;
    var simpleRenderer,uniqueValueRenderer,rangeValueRenderer;
    var  sourceType='';
    var layerCustom=  this.layer.get('custom');
    if(layerCustom && layerCustom.dataObj && layerCustom.format=='ol.format.GeoJSON')  {
        sourceType='GeoJSON';
    }
    if(layerCustom && layerCustom.dataObj && layerCustom.format=='ol.format.WFS'){
      sourceType='WFS';
    }
    if(renderer_orig && renderer_orig.clone)
      {
        renderer= renderer_orig.clone();
      }else
      {
        renderer= renderer_orig;
      }
    if(!renderer){
      renderer= RendererFactory.createSimpleRenderer();
    }
    var defaultStyle=renderer.getDefaultStyle();
    if(renderer.name=='simpleRenderer'){
      simpleRenderer= renderer;
    }else
    {
      simpleRenderer= RendererFactory.createSimpleRenderer();
      simpleRenderer.setDefaultStyle(defaultStyle);
    }
    if(renderer.name=='uniqueValueRenderer'){
      uniqueValueRenderer= renderer;
    }else
    {
      uniqueValueRenderer= RendererFactory.createUniqueValueRenderer();
      uniqueValueRenderer.setDefaultStyle(defaultStyle);
    }
    if(renderer.name=='rangeValueRenderer'){
      rangeValueRenderer= renderer;
    }else
    {
      rangeValueRenderer= RendererFactory.createRangeValueRenderer();
      rangeValueRenderer.setDefaultStyle(defaultStyle);
    }
    var shapeType= LayerHelper.getShapeType( this.layer);

    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-paint-brush"></i> Style</a> </li>').appendTo(this.parentDialog.tabPanelNav);
    
    this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+ self.tabId+'_form" class="modal-body form-horizontal">'; 

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-offset-1_ col-sm-12 checkbox">';
    htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_style">?</a>'  ;
    htm+='   <input type="checkbox" id="displayInLegend" name="displayInLegend" ' +((LayerHelper.getDisplayInLegend(this.layer))? 'checked="checked"':'')  +' value="" /> Show in legend';
    htm+='</label>';
    htm+='</div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3" for="rendererType">Display type:</label>';
    //htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#layerProperties_style">?</a>'  ;
    htm+='    <select class="form-control " id="rendererType" >';
    htm+='                          <option value="simpleRenderer" '+((renderer.name=='simpleRenderer')?'selected="selected"':'')+' >Simple</option>';
    htm+='                          <option value="uniqueValueRenderer" '+((renderer.name=='uniqueValueRenderer')?'selected="selected"':'')+'>Unique values</option>';
    htm+='                          <option value="rangeValueRenderer" '+((renderer.name=='rangeValueRenderer')?'selected="selected"':'')+'>Range values</option>';
    htm+='    </select>';
    htm+=' </div>';
    
    //htm+='  <div class="panel">';
    htm+='    <div id="rendererContent" class="panel-body">';
    
    htm+='    </div>';
    //htm+='  </div>';
    htm+='';
    htm+='';
    
    
    htm+='</form></div>';
    
    var content=$(htm).appendTo( this.tab); 
    //content.find('#name').val(this.layer.get('title'));
    self.rendererContent=content.find('#rendererContent');
    self.renderer=renderer;
    content.find('#rendererType').change(function(){
        var selected= $(this).val();
        if(selected=='simpleRenderer'){
          self.renderer=simpleRenderer;
        }else if(selected=='uniqueValueRenderer'){
          self.renderer=uniqueValueRenderer;
        }else if(selected=='rangeValueRenderer'){
          self.renderer=rangeValueRenderer;
        }
        self.populateRendererPanel();
    });
    self.populateRendererPanel();
    
    
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
      if(self.renderer){
        // self.layer.set('renderer',self.renderer);
        // self.layer.get('custom').dataObj.details.renderer= self.renderer.toJson();
        // self.layer.setStyle(self.renderer.findStyleFunction());
        //var featureLabeler= new FeatureLabeler({fieldName:'val'});
        //LayerHelper.setFeatureLabeler(self.layer,featureLabeler);
        //self.layer.set('featureLabeler',featureLabeler);
        LayerHelper.setRenderer(self.layer,self.renderer);
      }

      LayerHelper.setDisplayInLegend(self.layer,content.find('#displayInLegend').prop("checked"));
    });
  }
  LayerStyleTab.prototype.populateRendererPanel=function(){
    if(!this.renderer){
      return;
    }
    if(this.renderer.name=='simpleRenderer'){
      this.populateSimpleRenderer();
    }else if(this.renderer.name=='uniqueValueRenderer'){
      this.populateUniqueValueRenderer();
    }else if(this.renderer.name=='rangeValueRenderer'){
      this.populateRangeRenderer();
    }
  }
  LayerStyleTab.prototype.populateSimpleRenderer=function(){
    if(!this.renderer){
      return;
    }
    var self= this;
    var shapeType= LayerHelper.getShapeType( this.layer);
    
    this.rendererContent.html('');
    this.rendererContent.html('');

    var htm='';
    

   
    htm+='<div class="form-group row">';
    htm+='  <label class="col-sm-3">Style:</label>';
    htm+='  <div class="col-sm-9 " id="renderer_defaultStyle" ></div>';
    htm+=' </div>';
    //htm+='<button id="testStyle" type="button" class="btn btn-primary btn-success">test<i class="fa fa-plane" title="fire_station"></i></button><i class="fa maki-fire_station" title="fire_station"></i>';
    
    // this.rendererContent.html(htm);
    // var defaultSym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    // this.rendererContent.html(defaultSym);
    // //self.rendererContent.dblclick(genRandom);
    // self.rendererContent.click(function(){
    //   var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, self.renderer.getDefaultStyle(), {
    //     title:'Style',
    //     tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
    //     activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
    //     onapply:function(dlg){
    //        var defaultSym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    //        self.rendererContent.html(defaultSym);
    //     }
    //   }).show();
    // });

    this.rendererContent.html(htm);
    this.rendererContent.find('#testStyle').click(function(){
      var testStyle= new ol.style.Style(
        {	image:new ol.style.FontSymbol(
         {	form: '', //"hexagone", 
          gradient: false,
         // glyph: 'maki-fire_station',//car[Math.floor(Math.random()*car.length)], 
         glyph:'fa-plane',
          fontSize: 1,
          fontStyle: '',
          radius: 15, 
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          rotateWithView: false,
          
          color: 'blue',
          fill: new ol.style.Fill(
          {	color: 'white'
          }),
          stroke: new ol.style.Stroke(
          {	color: 'yellow',
            width: 2
          })
        }),
        stroke: new ol.style.Stroke(
        {	width: 2,
          color: '#f80'
        }),
        fill: new ol.style.Fill(
        {	color: [255, 136, 0, 0.6]
        })
      });

      var defaultSym=StyleFactory.renderStyleSample(testStyle,{width:80,height:40,type:shapeType || 'Polygon'});
      self.rendererContent.find('#renderer_defaultStyle').html(defaultSym);
      self.renderer.setDefaultStyle(testStyle);
    });

    var defaultSym=StyleFactory.renderStyleSample(this.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    this.rendererContent.find('#renderer_defaultStyle').html(defaultSym);
    this.rendererContent.find('#renderer_defaultStyle').first().click(function(e){
      e.stopPropagation();
      e.preventDefault();
      var symContainer=$(this);
      var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, self.renderer.getDefaultStyle(), {
        title:'Style',
        tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
        activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
        onapply:function(dlg){
          var sym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
          symContainer.html(sym);
        },
        helpLink:'/help#style'
      }).show();

    });

    

   // genRandom();
  }
  LayerStyleTab.prototype.populateUniqueValueRenderer=function(){
    var self=this;
    if(!this.renderer){
      return;
    }
    var layerCustom=  this.layer.get('custom');
    var fields= layerCustom.dataObj.details.fields;
    if(!fields)
      return;
    
    var shapeType= LayerHelper.getShapeType( this.layer);
    
    this.rendererContent.html('');

    var htm='';
    

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3" for="renderer_field">Field name:</label>';
    htm+='    <select class="form-control " id="renderer_field" >';
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      if(fld.type !=='bytea'){
        var fldName=fld.name;
        var fldCaption= fld.alias|| fldName;
        var selected= (fld.name=== this.renderer.getField());
        htm+=' <option value="'+ fldName+ '" '+((selected)?'selected="selected"':'')+' >' + fldCaption+ '</option>';
      }
    }
    htm+='    </select>';
    htm+=' </div>';
    htm+='<div class="form-group">';
    htm+='<button id="cmdAddAllUniqueValues" type="button" class="btn btn-primary btn-success">Add all values</button>';
    htm+='</div>';
    htm+='<div class="form-group row">';
    htm+='  <label class="col-sm-3">Default style:</label>';
    htm+='  <div class="col-sm-9 " id="renderer_defaultStyle" ></div>';
    htm+=' </div>';
    
    htm+='<div class="table-responsive col-sm-12">';
    htm+=' <table class="table table-condensed"><thead><tr>';
    htm+=' <th>Value</th>';    
    htm+=' <th class="">Style</th>';
    //htm+=' <th> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:"><span class="glyphicon glyphicon-plus"></span> Add</button></th>'; 
    htm+=' <th></th>';
    htm+=' </tr></thead>';
    htm+=' <tbody id="tblItems">';
    var items=this.renderer.getUniqueValueInfos();
    var i=0;
    for(var key in items){
      var item= items[key];
      htm+='<tr>';
      htm+='<td>' +item['value'] +'</td>' ;
      htm+='<td id="item_' +i +'"></td>' ;
      //htm+='<td></td>';
      htm +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	" id="delete_'+i+'" data-key="'+key+'"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      htm+='</tr>';
      i++;
    }
    htm+=' </tbody>';
    htm+=' </table>';

    this.rendererContent.html(htm);
    var defaultSym=StyleFactory.renderStyleSample(this.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    this.rendererContent.find('#renderer_defaultStyle').append(defaultSym);
    this.rendererContent.find('#renderer_defaultStyle').first().click(function(e){
      e.stopPropagation();
      e.preventDefault();
     // self.renderer.setDefaultStyle(StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2}));
      //var sym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
      var symContainer=$(this);
      
      var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, self.renderer.getDefaultStyle(), {
        title:'Style',
        tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
        activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
        onapply:function(dlg){
          var sym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
          symContainer.html(sym);
        },
        helpLink:'/help#style'
      }).show();

    })
   // var items=this.renderer.getUniqueValueInfos();
    var i=0;
    for(var key in items){
      var item= items[key];
      var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
      this.rendererContent.find('#item_'+i).first().data('_rendererItem', item);
      this.rendererContent.find('#item_'+i).first().click(function(e){
        e.stopPropagation();
				e.preventDefault();
        var item= $(this).data('_rendererItem');
        // item.style=StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2});
        // var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
        // $(this).html(sym);

        var symContainer=$(this);
        var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, item.style, {
          title:'Style',
          tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
          activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
          onapply:function(dlg){
            var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
            symContainer.html(sym);
          },
          helpLink:'/help#editing_style'
        }).show();


      })
      this.rendererContent.find('#item_'+i).html(sym);

      this.rendererContent.find('#delete_'+i).click(function(e){
        e.stopPropagation();
				e.preventDefault();
        var keyToRemove= $(this).data('key');
      //  items.splice(index, 1);
        try{
          delete items[keyToRemove];
          self.populateUniqueValueRenderer();
        }catch(ex0){}
      });

      i++;
    }

    this.rendererContent.find('#cmdAddAllUniqueValues').click(function(){
      var fldName= self.rendererContent.find('#renderer_field').val();
      var source= self.layer.getSource();
      var features = source.getFeatures();
      var valueDic={};
      for(var i=0;i< features.length;i++){
        var value= features[i].get(fldName);
        valueDic[value+'']= value;
      }
      var valueArray=[];
      for(var key in valueDic){
        valueArray.push(valueDic[key]);
      }
      valueArray=valueArray.sort();

      self.renderer.setField(fldName);
      self.renderer.ClearAllValues();
      for(var i=0;i< valueArray.length;i++){
        self.renderer.addValue(valueArray[i],valueArray[i]+'',StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2}));
      }
      self.populateRendererPanel(); 
    });
  }
  LayerStyleTab.prototype.populateRangeRenderer=function(){
    var self=this;
    if(!this.renderer){
      return;
    }
    var layerCustom=  this.layer.get('custom');
    var fields= layerCustom.dataObj.details.fields;
    if(!fields)
      return;
    
    var shapeType= LayerHelper.getShapeType( this.layer);
   // var defaultSym=StyleFactory.renderStyleSample(this.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    this.rendererContent.html('');

    var htm='';
    

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3" for="renderer_field">Field name:</label>';
    htm+='    <select class="form-control " id="renderer_field" >';
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      if(fld.type ==='smallint' ||
        fld.type ==='integer'||
        fld.type ==='bigint'||
        fld.type ==='numeric'||
        fld.type ==='real'||
        fld.type ==='double precision'||
        fld.type ==='date'||
        fld.type ==='timestamp with time zone'
      ){
        var fldName=fld.name;
        var fldCaption= fld.alias|| fldName;
        var selected= (fld.name=== this.renderer.getField());
        htm+=' <option value="'+ fldName+ '" '+((selected)?'selected="selected"':'')+' >' + fldCaption+ '</option>';
      }
    }
    htm+='    </select>';
    htm+=' </div>';
    htm+='<div class="form-group">';
    htm+='<button id="cmdCreateRangevalue" type="button" class="btn btn-primary btn-success">Create range values</button>';
    htm+='</div>';
    htm+='<div class="form-group row">';
    htm+='  <label class="col-sm-3">Default style:</label>';
    htm+='  <div class="col-sm-9 " id="renderer_defaultStyle" ></div>';
    htm+=' </div>';
    
    htm+='<div class="table-responsive col-sm-12">';
    htm+=' <table class="table table-condensed"><thead><tr>';
    htm+=' <th>From</th>';    
    htm+=' <th>To</th>';    
    htm+=' <th class="">Style</th>';
    //htm+=' <th> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:"><span class="glyphicon glyphicon-plus"></span> Add</button></th>'; 
    htm+=' <th></th>';
    htm+=' </tr></thead>';
    htm+=' <tbody id="tblItems">';
    var items=this.renderer.getRangeValueInfos();
    
    for(var i=0;i <items.length;i++){
      var item= items[i];
      var fromValue= item['minValue'];
      var toValue= item['maxValue'];
      htm+='<tr>';
      htm+='<td>' + ((typeof fromValue !=='undefined')?fromValue:'')  +'</td>' ;
      htm+='<td>' + ((typeof toValue !=='undefined')?toValue:'')  +'</td>' ;
      htm+='<td id="item_' +i +'"></td>' ;
      //htm+='<td></td>';
      htm +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	" id="delete_'+i+'" data-index="'+i+'"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      htm+='</tr>';
    }
    htm+=' </tbody>';
    htm+=' </table>';

    this.rendererContent.html(htm);
    
    var defaultSym=StyleFactory.renderStyleSample(this.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
    this.rendererContent.find('#renderer_defaultStyle').append(defaultSym);
    this.rendererContent.find('#renderer_defaultStyle').first().click(function(e){
      e.stopPropagation();
      e.preventDefault();
      // self.renderer.setDefaultStyle(StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2}));
      // var sym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
      // $(this).html(sym);

      var symContainer=$(this);
        var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, self.renderer.getDefaultStyle(), {
          title:'Style',
          tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
          activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
          onapply:function(dlg){
            var sym=StyleFactory.renderStyleSample(self.renderer.getDefaultStyle(),{width:80,height:40,type:shapeType || 'Polygon'});
            symContainer.html(sym);
          },
          helpLink:'/help#style'
        }).show();

    })
    for(var i=0;i <items.length;i++){
      var item= items[i];
      var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
      this.rendererContent.find('#item_'+i).html(sym);

      this.rendererContent.find('#item_'+i).first().data('_rendererItem', item);
      this.rendererContent.find('#item_'+i).first().click(function(e){
        e.stopPropagation();
				e.preventDefault();
        var item= $(this).data('_rendererItem');
        // item.style=StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2});
        // var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
        // $(this).html(sym);
        var symContainer=$(this);
        var layerPropertiesDlg = new ObjectPropertiesDlg(self.parentDialog.mapContainer, item.style, {
          title:'Style',
          tabs:[new StyleImageTab(),new StyleStrokeTab(),new StyleFillTab() ],
          activeTabIndex:(shapeType=='Point')?0:((shapeType=='MultiPolygon')?2:1),
          onapply:function(dlg){
            var sym=StyleFactory.renderStyleSample(item.style,{width:80,height:40,type:shapeType || 'Polygon'});
            symContainer.html(sym);
          },
          helpLink:'/help#style'
        }).show();
      });
      
      this.rendererContent.find('#delete_'+i).click(function(e){
        e.stopPropagation();
        e.preventDefault();
        try{
          var indexToRemove= $(this).data('index');
          items.splice(indexToRemove, 1);
        //delete items[keyToRemove];
          self.populateRangeRenderer();
        }catch(ex){}
      });
      
    }

    this.rendererContent.find('#cmdCreateRangevalue').click(function(){
      var numberOnRanges=3;
      var fldName= self.rendererContent.find('#renderer_field').val();
      var source= self.layer.getSource();
      var features = source.getFeatures();
      var valueDic={};
      for(var i=0;i< features.length;i++){
        var value= features[i].get(fldName);
        valueDic[value+'']= value;
      }
      var valueArray=[];
      for(var key in valueDic){
        valueArray.push(valueDic[key]);
      }
      valueArray=valueArray.sort(function(a,b){
          if(a > b)
            return 1;
          else if(b>a)
            return -1;
          else
            return 0;
      });
      BootstrapDialog.show({
        title:'Number of ranges',
        size:BootstrapDialog.SIZE_SMALL,
        message: 'Input number of ranges: <input type="number" min="1" class="form-control">',
        onshow: function(dialogRef){
            var hash = 'inputNumberOfRanges';
            window.location.hash = hash;
            window.onhashchange = function() {
              if (!location.hash){
                dialogRef.close();
              }
            }
        },
        onhide: function(dialogRef){
            // var fruit = dialogRef.getModalBody().find('input').val();
            // if($.trim(fruit.toLowerCase()) !== 'banana') {
            //     alert('Need banana!');
            //     return false;
            // }
            var hash = 'inputNumberOfRanges';
            //history.pushState('', document.title, window.location.pathname);
            history.pushState('', document.title, window.location.pathname + window.location.search);
        },
        buttons: [{
            label: 'OK',
            cssClass: 'btn-primary',
            action: function(dialogRef) {
                dialogRef.close();
                var numberOnRanges = dialogRef.getModalBody().find('input').val();
                numberOnRanges= parseInt(numberOnRanges);
                self.renderer.setField(fldName);
                self.renderer.ClearAllValues();
                var cR= valueArray.length/ (numberOnRanges);
                var fromValue=undefined;
                var toValue = undefined;
                for(var i=0;cR>0 && i< valueArray.length;i+=cR){
                  var c= Math.floor(i);
                  if(c==0)
                    continue;
                  
                    
                    fromValue=toValue;
                    toValue= valueArray[c];
                    // if(c+cR> valueArray.length)
                    //   toValue=undefined;
                    self.renderer.addValue(fromValue,toValue,'',StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2}));
                    if(i+cR>= valueArray.length){
                      fromValue=toValue;
                      toValue=undefined;
                      self.renderer.addValue(fromValue,toValue,'',StyleFactory.randomStyle({randomStrokeColor:true,strokeWidth:2}));
                    }
                    
                }
                self.populateRendererPanel(); 
            }
        },{
          label: 'Cancel',
          action: function(dialogRef) {
            dialogRef.close();
          }
        }
      ]
    });
      
    });
   
  }
  