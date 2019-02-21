
function DlgVectorSearch(mapContainer,obj,options) {
  options.showApplyButton=true;
  options.applyButtonTitle='Validate';
  options.closable=false;
  if(!options.title){
    if(obj.get && obj.get('title')){
      options.title='Search: '+ obj.get('title') ;
    }else{
      options.title='Search';
    }
  }
  DlgTaskBase.call(this, 'DlgVectorSearch'
      ,(options.title || 'Search')
      ,  mapContainer,obj,options);   

}
DlgVectorSearch.prototype = Object.create(DlgTaskBase.prototype);


DlgVectorSearch.prototype.createUI=function(){
  var map = this.mapContainer.map;
  var view = map.getView();
  var mapProjectionCode = view.getProjection().getCode();

  //this.dlg.setClosable(false);
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var origFilter= details.filter;
  var filter= details.filter;
  if(!filter)
    {
      filter={
        expression:'',
        spatialFilter:null
      }
     // details.filter= filter;
    }
    filter= JSON.parse(JSON.stringify(filter));
   this.filter= filter;
   

  var tabPanelHtml= '<div id="tabPanel">';
  tabPanelHtml+='<ul id="tabPanel_nav" class="nav  nav-pills__ nav-tabs nav-tab-bar_"></ul>';
  tabPanelHtml+='<div id="tabPanel_content" class="tab-content clearfix_"></div>';
  tabPanelHtml+='</div>';
  this.tabPanel= $(tabPanelHtml).appendTo(this.mainPanel);
  this.tabPanelNav=this.tabPanel.find('#tabPanel_nav');
  this.tabPanelContent=this.tabPanel.find('#tabPanel_content');

  var tabAttrbutesContent= this.createAttributesPanelUI(true);
  this.tabAttrbutesContent=tabAttrbutesContent;
  var tabSpatialContent= this.createSpatialPanelUI(false);
  this.tabSpatialContent=tabSpatialContent;
  this.setActions();


  this.applyHandlers.push(function(evt){
    
        var expression= tabAttrbutesContent.find('#expression').val();
        filter.expression= expression;
        evt.data.filter=filter;
        if(evt.dialogAction=='apply'){
          
        }

        var applySpatialFilterEl= tabSpatialContent.find('#applySpatialFilter');
        var applySpatialFilter= applySpatialFilterEl.prop('checked');
        var spatialOperator= tabSpatialContent.find('#spatialOperator').val();
        var shapeOrLayer = tabSpatialContent.find("input[name='shapeOrLayer']:checked").val();
        var byFeaturesOfLayer;
        if(shapeOrLayer=='layer'){
          byFeaturesOfLayer =tabSpatialContent.find('#byFeaturesOfLayer').val();
          try{
            byFeaturesOfLayer=parseInt(byFeaturesOfLayer);
          }catch(ex){}
        }
        var geomArray=[];
        if(self.layer){
            var features = self.layer.getSource().getFeatures();
            for(var i=0;i< features.length;i++){
              geomArray.push( features[i].getGeometry());
            }
        }
        if(applySpatialFilter && (geomArray.length>0 || byFeaturesOfLayer)){
         
          var feature;
          var searchAreajson;
          if(geomArray.length>0){
            if(geomArray.length>1){
            feature = new ol.Feature({
              geometry: new ol.geom.GeometryCollection(geomArray),
              name: 'Search area'
              });
            }else{
              feature = new ol.Feature({
                geometry: geomArray[0],
                name: 'Search area'
              });
            }
         
            var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:3857'});
             searchAreajson = format.writeFeatureObject(feature);
            
         }
          evt.data.filter.spatialFilter={
            spatialOperator:spatialOperator,
            searchArea:searchAreajson,
            searchAreaSrid: 3857,
            byFeaturesOfLayer:byFeaturesOfLayer
          };
        }else {
          evt.data.filter.spatialFilter=undefined;
        }
        
        
  });

  this.cancelHandlers.push(function(evt){
  
    details.filter= origFilter;
    layer.getSource().clear();
    
  });

  this.changesApplied=false
}
DlgVectorSearch.prototype.setActions=function(){
  
  this.setAttributesPanelUI_actions(this.tabAttrbutesContent);
  this.createSpatialPanelUI_actions(this.tabSpatialContent);
}
DlgVectorSearch.prototype.createAttributesPanelUI=function(isActive){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var filter= this.filter;
  var fields= layerCustom.dataObj.details.fields;
  if(!fields){
    fields=[];
  }
  this.fields= fields;

  var active='';
  if(isActive)
    active ='active';
  var tabId='dlgVectorSearch_tabAttrbutes';
  var tabHeader=$('<li class="'+active+'"><a href="#' + tabId+ '" data-toggle="tab"><i class="glyphicon glyphicon-list-alt"></i> Attributes</a> </li>').appendTo(this.tabPanelNav);
  
  this.tabAttrbutes=$('<div class="tab-pane '+active+'" id="'+tabId+'"></div>').appendTo(this.tabPanelContent);

  var htm='<div class="scrollable-content" ><form id="'+tabId+'_form" class="modal-body form-horizontal">';  

  

  htm+='<div class="form-group">';
  htm+='  <label class="col-sm-2 control-label" for="fieldName">Field:</label>';
  htm+='   <div class="col-sm-10 ">  <select class="form-control " id="fieldName" >';
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea'){
      var fldName=fld.name;
      var fldCaption= fld.alias|| fldName;
      htm+=' <option value="'+ fldName+ '" >' + fldCaption+ '</option>';
    }
  }
  htm+='    </select></div>';
  htm+=' </div>';

  htm+='<div class="form-group">';
  htm+='  <label class="col-sm-2 control-label" for="operator">Operator:</label>';
  htm+='    <div class="col-sm-4 "><select class="form-control  " id="operator" >';
  htm+='                          <option value="=" >=</option>';
  htm+='                          <option value="<>" >&#x3C;&#x3E;</option>';
  htm+='                          <option value=">" >&#x3E;</option>';
  
  htm+='                          <option value=">=" >&#x3E;=</option>';
  htm+='                          <option value="<" >&#x3C;</option>';
  htm+='                          <option value="<=" >&#x3C;=</option>';
  htm+='                          <option value="LIKE" >LIKE</option>';
  htm+='                          <option value="IS NULL" >IS NULL</option>';
  htm+='                          <option value="IS NOT NULL" >IS NOT NULL</option>';
  
  htm+='    </select></div>';
  htm+=' </div>';

  
  htm+='<div class="form-group">';
  htm+='  <label class="col-sm-2 control-label" for="sampleValue">Value:</label>';
  htm+='  <div class="col-sm-10 ">'
  htm+='    <input id="sampleValue" class=" mySearch-searchinput form-control background-position-right" placeholder="Value" type="search" />'
  htm+='    <button id="addToExpression" type="button" class="btn btn-primary btn-success btn-xs "><span class="glyphicon glyphicon-plus"></span>Add to expression</button>';
  htm+='  </div>';
  htm+=' </div>';

  htm+='  <div class="form-group">';
  htm+='    <label class="" for="expression">Expression:</label>';
  htm+='    <textarea type="text" name="expression" rows="3" id="expression" autofocus placeholder="Expression" class="form-control" >'+ (filter.expression?filter.expression:'')+ '</textarea>';
  htm+='    <button id="clearExpression" type="button" class="btn btn-primary btn-danger btn-xs "><span class="glyphicon glyphicon-remove"></span>Clear</button>';
  htm+='  </div>';

 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.tabAttrbutes); 
  
  var fieldNameEl=content.find('#fieldName');
  var sampleValueEl=content.find('#sampleValue');
  var expressionEl=content.find('#expression');
  var operatorEl= content.find('#operator');
  


  var $form = $(content.find('#'+tabId +'_form'));
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
      tabHeader.find('a').addClass('text-danger');
      //self.activate();
      $('.nav-tabs a[href="#' + tabId + '"]').tab('show');
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

  return content;
}
DlgVectorSearch.prototype.setAttributesPanelUI_actions=function(content){
  var self= this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var filter= this.filter;
  var fields=self.fields;
  var fieldNameEl=content.find('#fieldName');
  var sampleValueEl=content.find('#sampleValue');
  var expressionEl=content.find('#expression');
  var operatorEl= content.find('#operator');
  fieldNameEl.change(function(){
    
    var fldName= $(this).val();
    var source= layer.getSource();
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
    sampleValueEl.val(undefined);
    sampleValueEl.autocomplete({
      appendTo:content,
      minLength: 0,
      source: function (request, response) {
          if (valueArray) {

              response($.map(valueArray, function (item) {
                        return {
                            label: item,
                            value: item
                        }

                      })
                    );
          }
      },
      focus: function (event, ui) {
        //commentes 2016/05/03
      //  $(this).val(ui.item.label);
        return false;
      },
      open: function() {
          $("ul.ui-menu").width($(this).innerWidth());
      }
      // select: function (event, ui) {
      //     content.find('#sampleValue').val(ui.item.label);

         
      //     return false;
      // }
    }) .focus(function (event, ui) {
      $(this).autocomplete("search");
    });
    
  });

  fieldNameEl.trigger('change');
  content.find('#clearExpression').click(function(){
    expressionEl.val(undefined);
  });

  content.find('#addToExpression').click(function(){
    var expression=expressionEl.val();
    var fieldName= fieldNameEl.val();
    var operator= operatorEl.val();

    var field=undefined;
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      if(fld.name ===fieldName){
        field=fld;
        break;
      }
    }
    if(!field){
      return;
    }
    fieldName= '"'+fieldName+'"';
    var logicalOperator = 'AND';
    var newExp = "";
    var needValue = true;
    if (operator == "IS NULL" || operator == "IS NOT NULL")
        needValue = false;
    if (!needValue) {
        newExp = '(' + fieldName + ' ' + operator + ')';
    } else {
      var v = sampleValueEl.val();
      var s = new String();
      s = v + "";
    
      if (!s)
          s = "";
      if (field.type == "varchar"
          || field.type == "timestamp with time zone"
          || field.type == "date"
          ) {
          //if (s.charAt(0) != "'")
           //   s = "N'" + s + "'";
           s = "'" + s + "'";
      } else {
          if (s == "" && needValue) {
              alert("Value is not defined");
              return;
          }
          if (operator == "LIKE") {
             // alert("Operator 'LIKE' is used for String Fields");
              //return;
              fieldName= fieldName+"::text";
              s = "'" + s + "'";

          }
      }

      newExp = '(' + fieldName + ' ' + operator + ' ' + s +')';
    }

    if(newExp){
      if (!expression) {
          if (logicalOperator == 'NOT')
            expression =logicalOperator + ' ' + newExp;
          else
            expression =newExp;
      } else {
          expression= expression + ' ' + logicalOperator + ' ' + newExp
      }
    }

    expressionEl.val(expression);

  });
}
DlgVectorSearch.prototype.createSpatialPanelUI=function(isActive){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var filter= this.filter;
  
  
  var active='';
  if(isActive)
    active ='active';
  var tabId='dlgVectorSearch_tabSpatial';
  var tabHeader=$('<li class="'+active+'"><a href="#' + tabId+ '" data-toggle="tab"><i class="glyphicon glyphicon-globe"></i> Spatial</a> </li>').appendTo(this.tabPanelNav);
  
  this.tabSpatial=$('<div class="tab-pane '+active+'" id="'+tabId+'"></div>').appendTo(this.tabPanelContent);

  var htm='<div class="scrollable-content" ><form id="'+tabId+'_form" class="modal-body form-horizontal">';  

  
  htm+='<div class="form-group">';
  htm+='  <div class="checkbox col-sm-12 ">';
  if(filter.spatialFilter){
    htm+='    <label><input id="applySpatialFilter" checked="checked" type="checkbox"> Select features that:</label>';
  }else{
    htm+='    <label><input id="applySpatialFilter" type="checkbox"> Select features that:</label>';
  }
  htm+='  </div>';
  htm+=' </div>';

  htm+='<div class="form-group">';
  htm+='    <div class="col-sm-5 "><select class="form-control  " id="spatialOperator" >';
  htm+='                          <option value="ST_Intersects" >Intersect</option>';
  htm+='                          <option value="NOT ST_Intersects" >Do not Intersect</option>';
  htm+='                          <option value="ST_Contains" >Contain</option>';
  htm+='                          <option value="NOT ST_Contains" >Do not Contain</option>';
  htm+='                          <option value="ST_Within" >Are within</option>';
  htm+='                          <option value="NOT ST_Within" >Are not within</option>';
  htm+='                          <option value="ST_DWithin" >Are within distance</option>';
  htm+='                          <option value="ST_Nearest" >Are nearest to</option>';

  htm+='    </select></div>';
  htm+=' </div>';
  htm+='  <div class="form-group" id="ST_DWithin_options">';
  htm+='    <span class="col-sm-2 " for="distance">Distance:</span>';
  htm+='    <div class="col-sm-3 ">';
  htm+='      <input type="number" name="distance" id="distance" value="" placeholder="Meters" class="form-control" data-val="true" data-val-requiredif="Distance is required" data-val-requiredif-dependentproperty="spatialOperator"  data-val-requiredif-targetvalue="ST_DWithin"  />'
  htm+='    </div>';
  htm+='    <span class="field-validation-valid" data-valmsg-for="distance" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  htm+='  <div class="form-group" id="ST_Nearest_options">';
  htm+='    <span class="col-sm-5 " for="nearestSearchDistance">Maximum search distance:</span>';
  htm+='    <div class="col-sm-4 ">';
  htm+='      <input type="number" name="nearestSearchDistance" id="nearestSearchDistance" value="" placeholder="Meters" class="form-control" data-val="true" data-val-requiredif="Distance is required" data-val-requiredif-dependentproperty="spatialOperator"  data-val-requiredif-targetvalue="ST_Nearest"  />'
  htm+='    </div>';
  htm+='    <span class="field-validation-valid" data-valmsg-for="nearestSearchDistance" data-valmsg-replace="true"></span>';
  htm+='  </div>';
  htm+='  <div class="form-group" id="ST_Nearest_options2">';
  htm+='    <span class="col-sm-5 " for="nearestMaxNumber">Find maximum</span>';
  htm+='    <div class="col-sm-2 ">';
  htm+='      <input type="number" name="nearestMaxNumber" id="nearestMaxNumber" min="1" value="1" placeholder="" class="form-control" data-val="true" data-val-requiredif="Maximum number of nearest features is required"  />'
  htm+='    </div>';
  htm+='    <span class=" " >of nearest features</span>';
  htm+='    <span class="field-validation-valid" data-valmsg-for="nearestMaxNumber" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  htm+='<div class="form-group">';
  htm+='  <div class="radio col-sm-12 ">';
  if(!(filter.spatialFilter && filter.spatialFilter.byFeaturesOfLayer)){
    htm+='    <label><input id="shapeOrLayer_shape" name="shapeOrLayer" value="shape" checked="checked" type="radio"> Drawing shape:</label>';
  }else{
    htm+='    <label><input id="shapeOrLayer_shape" name="shapeOrLayer" value="shape" type="radio"> Drawing shape:</label>';
  }
  htm+='  </div>';
  htm+=' </div>';
  
  htm+='<div class="form-group">';
  htm+='  <div class="col-sm-1 ">'
  htm+='    <button  type="button"  title="Point"  id="drawPoint" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawPointIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
  htm+='  </div>';
  htm+='  <div class="col-sm-1 ">'
  htm+='    <button  type="button"   title="Box" id="drawBox" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawRectangleIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
  htm+='  </div>';
  htm+='  <div class="col-sm-1 ">'
  htm+='    <button  type="button"   title="Circle" id="drawCircle" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawCircleIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
  htm+='  </div>';
  htm+='  <div class="col-sm-1 ">'
  htm+='    <button  type="button"   title="Polygon" id="drawPolygon" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawPolygonIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
  htm+='  </div>';
  htm+='  <div class="col-sm-1 ">'
  htm+='    <button  type="button"   title="Line" id="drawLine" style="display:block;line-height:28px;width:28px;background-position:center center" class="drawLineIcon btn btn-primary btn-success btn-xs" >&nbsp;</button>'
  htm+='  </div>';
  htm+=' </div>';

  htm+='  <div class="form-group">';
  htm+='   <div class="col-sm-offset-1 col-sm-2 ">'
  htm+='    <button id="clearShapes" type="button" class="btn btn-primary btn-danger btn-xs "><span class="glyphicon glyphicon-remove"></span>Clear shapes</button>';
  htm+='   </div>';
  htm+='  </div>';

  htm+='<div class="form-group">';
  htm+='  <div class="radio col-sm-12 ">';
  if((filter.spatialFilter && filter.spatialFilter.byFeaturesOfLayer)){
    htm+='    <label><input id="shapeOrLayer_layer" name="shapeOrLayer" value="layer" checked="checked" type="radio"> Layer:</label>';
  }else{
    htm+='    <label><input id="shapeOrLayer_layer" name="shapeOrLayer" value="layer" type="radio"> Layer:</label>';
  }
  htm+='  </div>';
  htm+=' </div>';
 

  var layers= this.mapContainer.getAllLayersList();
  var layerList=[];
    
    for(var i= layers.length-1 ;i>=0;i--){
        var lyr= layers[i];
        
        var custom= lyr.get('custom');
        if(!custom){
            continue;
        }
        if(layer==lyr){
          continue;
        }
        if(custom.type === 'ol.layer.Vector'){

          if(custom.format === 'ol.format.GeoJSON' && custom.dataObj && custom.dataObj.details ){
            layerList.push({
              title:lyr.get('title'),
              value:custom.dataObj.id
            })
          }
        }
    }

   htm+='<div class="form-group">';
  htm+='    <div class="col-sm-12 "><select class="form-control  " id="byFeaturesOfLayer" >';
  htm+='                          <option value="" ></option>';
  for(var i=0;i<layerList.length;i++){
    var lyr= layerList[i];
    if(filter.spatialFilter && filter.spatialFilter.byFeaturesOfLayer==lyr.value){
      htm+='    <option selected="selected" value="' +lyr.value+ '" >'+ lyr.title+ '</option>';    
    }else{
      htm+='    <option value="' +lyr.value+ '" >'+ lyr.title+ '</option>';    
    }

  }
 
  htm+='    </select></div>';
  htm+=' </div>';

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.tabSpatial); 
  
  
  if(filter.spatialFilter){
    if(filter.spatialFilter.spatialOperator){
       content.find('#spatialOperator').val(filter.spatialFilter.spatialOperator);
    }
    this.addShape(filter.spatialFilter.searchArea);
  }
  
  content.find('#spatialOperator').change(function(){
    var operator=$(this).val();
    if(operator==='ST_DWithin'){
      content.find('#ST_DWithin_options').show();
    }else{
      content.find('#ST_DWithin_options').hide();
    }
    if(operator==='ST_Nearest'){
      content.find('#ST_Nearest_options').show();
      content.find('#ST_Nearest_options2').show();
    }else{
      content.find('#ST_Nearest_options').hide();
      content.find('#ST_Nearest_options2').hide();
    }
    //
  });
  content.find('#spatialOperator').trigger('change');
  
  var $form = $(content.find('#'+tabId +'_form'));
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
      tabHeader.find('a').addClass('text-danger');
      //self.activate();
      $('.nav-tabs a[href="#' + tabId + '"]').tab('show');
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

  return content;
}
DlgVectorSearch.prototype.createSpatialPanelUI_actions=function(content){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var filter= this.filter;
  
  var fieldNameEl=content.find('#fieldName');
  var sampleValueEl=content.find('#sampleValue');
  var expressionEl=content.find('#expression');
  var operatorEl= content.find('#operator');

   
  content.find('#drawPoint').click(function(){self.drawShape('point'); });
  content.find('#drawBox').click(function(){self.drawShape('box'); });
  content.find('#drawCircle').click(function(){self.drawShape('circle'); });
  content.find('#drawPolygon').click(function(){self.drawShape('polygon'); });
  content.find('#drawLine').click(function(){self.drawShape('line'); });

  content.find('#clearShapes').click(function(){
    if(self.layer){
      self.layer.getSource().clear();
  
    }
    self.tabSpatialContent.find('#applySpatialFilter').prop('checked',false);
   
  })
  
  content.find('#byFeaturesOfLayer').change(function(){
    var selectedLayer= $(this).val();
    if(selectedLayer){
      self.tabSpatialContent.find('#shapeOrLayer_layer').prop('checked',true);
      self.tabSpatialContent.find('#applySpatialFilter').prop('checked',true);
    }else{
      self.tabSpatialContent.find('#shapeOrLayer_shape').prop('checked',true);
    }
  })
}
DlgVectorSearch.prototype.moveLayerToTop = function () {
  var map = this.mapContainer.map;
  map.getLayers().remove(this.layer);
  map.getLayers().push(this.layer);
}
DlgVectorSearch.prototype.closed=function(){
  var map = this.mapContainer.map;
   map.getLayers().remove(this.layer);
   if(this.onLayerAddEventKey){
    ol.Observable.unByKey(this.onLayerAddEventKey);
   }
}
DlgVectorSearch.prototype.createLayer=function(){
  var mapContainer = this.mapContainer;
  var map = mapContainer.map;
  var self=this;
  if(!this.source){
    this.source = new ol.source.Vector();
  }
    this.layer = new ol.layer.Vector({
        source: this.source,
        custom: {
            type: 'drawing',
            keepOnTop:true,
            skipSaving:true,
            hiddenInToc: true
        }
        // ,
        // style: new ol.style.Style({
        //     fill: new ol.style.Fill({
        //         color: 'rgba(255, 255, 255, 0.2)'
        //     }),
        //     stroke: new ol.style.Stroke({
        //         color: '#ffcc33',
        //         width: 2
        //     }),
        //     image: new ol.style.Circle({
        //         radius: 7,
        //         fill: new ol.style.Fill({
        //             color: '#ffcc33'
        //         })
        //     })
        // })
    });
  self.onLayerAddEventKey=  map.getLayers().on('add', function (e) {
      if (e.element !== self.layer && e.element.get('custom')) {
        if(!e.element.get('custom').keepOnTop){  
            
                  self.moveLayerToTop();
            
          }
      }

  });
}
DlgVectorSearch.prototype.addShape=function(shape){
  if(!shape)
  {
    return;
  }
  var self=this;
  var mapContainer = this.mapContainer;
  var map = mapContainer.map;
  var view = map.getView();
  var mapProjectionCode = view.getProjection().getCode();
  var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:3857'});
  if(!this.layer){
   this.createLayer();
  }
  var features= format.readFeatures(shape, {
    featureProjection: mapProjectionCode
  });

this.layer.getSource().addFeatures(features);
this.layer.changed();
this.moveLayerToTop();
}
DlgVectorSearch.prototype.drawShape=function(shapeType){
  var self=this;
  self.tabSpatialContent.find('#applySpatialFilter').prop('checked',true);
  self.tabSpatialContent.find('#shapeOrLayer_shape').prop('checked',true);
  var mapContainer = this.mapContainer;
  var map = mapContainer.map;
 
  if(!self.layer){
   self.createLayer();
  }

  self.interaction = undefined;

  function addInteraction(shapeType) {
        var type='Point';
        var geometryFunction=undefined;
        if(shapeType=='line'){
          type='LineString';
        }else if (shapeType=='polygon'){
          type='Polygon';
        }else if (shapeType=='circle'){
          type='Circle';
          geometryFunction = ol.interaction.Draw.createRegularPolygon();
        }else if (shapeType=='box'){
          type='Circle';
          geometryFunction = ol.interaction.Draw.createBox();
        }
        
        self.interaction = new ol.interaction.Draw({
            source: self.source,
            type: type,
            geometryFunction:geometryFunction
        });
        map.addInteraction(self.interaction);
        self.interaction.on('drawend', function (e) {
          map.removeInteraction(self.interaction);
          self.moveLayerToTop();
          
          self.dlg.open();
          self.setActions();

        });

    }
    
        map.removeInteraction(self.interaction);
        addInteraction(shapeType);

        self.dlg.getModal().modal('hide');
        self.dlg.getModal().hide();

}

