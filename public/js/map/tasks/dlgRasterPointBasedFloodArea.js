
function DlgRasterPointBasedFloodArea(mapContainer,obj,options) {
  options=options||{};
  options.closable=false;
    DlgTaskBase.call(this, 'DlgRasterPointBasedFloodArea'
        ,(options.title || 'Point-based flood area')
        ,  mapContainer,obj,options);   
  
  }
  DlgRasterPointBasedFloodArea.prototype = Object.create(DlgTaskBase.prototype);

 
  DlgRasterPointBasedFloodArea.prototype.createUI=function(){
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
    //this.dlg.setClosable(false);
    var self=this;
    var layer= this.obj;
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    
    self.minimumValue=undefined;
    self.seedPointElevation=undefined;
    var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
    htm +='  <div class="form-group">';
    htm +='    <label class="" for="">Raster data layer</label>';
    htm +='    <div>'+layerCustom.dataObj.name+'</div>' ;
    htm +=' </div>';

    htm+='    <div id="childContent" class="panel-body">';
    
    htm+='    </div>';

    htm += '</form>';
    htm+='  </div>';
    var content=$(htm).appendTo( this.mainPanel); 
    self.childContent=content.find('#childContent');
  
    self.populateChildPanel();
    var $form = $(content.find('#'+self.id +'_form'));
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

    this.applyHandlers.push(function(evt){

      evt.data.longitude = parseFloat(self.childContent.find('#longitude').val());
      evt.data.latitude =parseFloat(self.childContent.find('#latitude').val());
      evt.data.height = parseFloat(self.childContent.find('#height').val());
      evt.data.minimumValue= parseFloat( self.minimumValue);
      evt.data.seedPointCoorinates = ol.proj.transform([evt.data.longitude,evt.data.latitude], 'EPSG:4326',view.getProjection()); 
      evt.data.mapProjectionCode=mapProjectionCode;
      evt.data.seedPointElevation=self.seedPointElevation;
      evt.data.toElevation=evt.data.seedPointElevation+ evt.data.height;
      evt.data.outputName= layerCustom.dataObj.name + '-Flood Area';
      evt.data.outputDescription='Point-based flood area\n';
      evt.data.outputDescription+='Location:\n';
      evt.data.outputDescription+='   Longitude:' + evt.data.longitude +'\n';
      evt.data.outputDescription+='   Latitude:' + evt.data.latitude +'\n';
      evt.data.outputDescription+='   Elevation:' + evt.data.seedPointElevation +'\n';
      evt.data.outputDescription+='Water height:' + evt.data.height +'\n';
      
      var band= details.bands[0];
      var reclass=band.reclass;
      if(!reclass)
        {
          reclass={
            ranges:[],
            expression:'',
            noDataValue:band.noDataValue,
            dataType:band.dataType
          }
          band.reclass=reclass;
        }
        band.reclass.expression='['+  evt.data.minimumValue+'-'+ evt.data.toElevation +']:'+ evt.data.toElevation ;
        evt.data.band=band.id;
        evt.data.reclass=reclass;

    });

    this.changesApplied=false
  }
  DlgRasterPointBasedFloodArea.prototype.populateChildPanel=function(){
    var self=this;
    var layer= this.obj;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
  

    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    var bandName='Value';
    var minimumValue;
    if(details.bands && details.bands.length){
      bandName= details.bands[0].name;
      minimumValue= details.bands[0].minimum;
    }
    if(typeof minimumValue=='undefined'){
      minimumValue=-100000;
    }
    self.minimumValue=minimumValue;
    var htm='';
    this.childContent.html('');
    htm+='  <div class="form-group">';
    htm+='    <label class="" >Seed point:</label>';
    htm+='    <button type="button" id="pickfromMap" class="btn btn-xs btn-info	"  title="Pick from map"  style="" ><span class="glyphicon glyphicon-map-marker"></span> </button>';
    htm+='  </div>';

    htm+='  <div class="form-group">';
    htm+='  <label class=" " >Longitude:</label>';  
    htm+='  <input type="number" id="longitude" class="form-control nospinner  " value=""  name="longitude"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="longitude" data-valmsg-replace="true"></span>'; 
    htm+='</div>';
    htm+='  <div class="form-group">';
    htm+='  <label class=" " >Latitude:</label>';  
    htm+='  <input type="number" id="latitude" class="form-control nospinner  " value=""  name="latitude"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="latitude" data-valmsg-replace="true"></span>'; 
    htm+='</div>';
    htm+='<div class="form-group">';
    htm+='  <label class=" " id="seedpointElev" ></label>';  
    htm+='</div>';
    htm+='<div class="form-group">';
    htm+='  <label class="" >Water height above seed point:</label>';  
    htm+='  <input type="number" id="height" class="form-control nospinner  " value=""  name="height"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="height" data-valmsg-replace="true"></span>'; 
    htm+='</div>';
    htm+='<hr />';
  
  this.childContent.html(htm);

  this.childContent.find("#longitude").on("change", function () {
    self.extractElevationFromMap();
  });
  this.childContent.find("#latitude").on("change", function () {
    self.extractElevationFromMap();
  });

  this.childContent.find("#pickfromMap").on("click", function () {
      self.pickFromMap();
  });
 
  this.childContent.find(".nospinner").on("wheel", function (e) {
    $(this).blur();
});
  }

  DlgRasterPointBasedFloodArea.prototype.extractElevationFromMap=function(){
    var self=this;
    var layer= this.obj;
    var map = this.mapContainer.map;
    var view = map.getView();
    
    var xStr= self.childContent.find('#longitude').val();
    var yStr=self.childContent.find('#latitude').val();  
    var x= parseFloat(xStr);
    var y= parseFloat(yStr);
    if(isNaN(x)){
      return;
    }
    if(isNaN(y)){
      return;
    }
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    var bandName='Value';
    if(details.bands && details.bands.length){
      bandName= details.bands[0].name;
    }  
    var url = '/datalayer/' + layerCustom.dataObj.id + '/raster?request=value&srid=4326';
        url+= '&x='+x;
        url+= '&y='+y;
      $.ajax(url, {
              type: 'GET',
              dataType: 'json',
              success: function (data) {
                  if (data) {
                      try{
                        var seedpointElevation=0;
                        if(typeof data[bandName] !=='undefined'){
                          seedpointElevation=data[bandName];
                          self.seedPointElevation=seedpointElevation;
                          self.childContent.find('#seedpointElev').text('Elevation: ' +seedpointElevation  );
                        }else{
                          self.childContent.find('#seedpointElev').text('Elevation: Unknown' );
                        }
                                  
                      }catch(ex){
                        self.childContent.find('#seedpointElev').text('Elevation: Unknown' );
                      }
                  }
              },
              error: function (xhr, textStatus, errorThrown) {
                self.childContent.find('#seedpointElev').text('Elevation: Unknown' );
                  
              }
          }).done(function (response) {
            //self.dlg.open();
          });
  }

  DlgRasterPointBasedFloodArea.prototype.pickFromMap=function(){
    var self=this;
    var layer= this.obj;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
  

    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    var bandName='Value';
    if(details.bands && details.bands.length){
      bandName= details.bands[0].name;
    }
    self.dlg.getModal().modal('hide');
    self.dlg.getModal().hide();
    // setTimeout( function(){
    // //  self.dlg.getModal().modal('show');
    // self.dlg.open();
    // },3000);
    $.notify({
      message:"Click on map to define seed point coordinates."
  },{
      type:'info',
      delay:2000,
      animate: {
          enter: 'animated fadeInDown',
          exit: 'animated fadeOutUp'
      }
  }); 

    var interactionPointer = new ol.interaction.Pointer({
      handleDownEvent: function(e){
        
        map.removeInteraction(interactionPointer);
        interactionPointer.setActive(false);

          var coordinate=e.coordinate;
          var url = '/datalayer/' + layerCustom.dataObj.id + '/raster?request=value&srid='+mapProjectionCode;
          url+= '&x='+coordinate[0];
          url+= '&y='+coordinate[1];
          $.ajax(url, {
              type: 'GET',
              dataType: 'json',
              success: function (data) {
                  if (data) {
                      try{
                        var seedpointElevation=0;
                        if(typeof data[bandName] !=='undefined'){
                          seedpointElevation=data[bandName];
                          self.seedPointElevation=seedpointElevation;
                          self.childContent.find('#seedpointElev').text('Elevation: ' +seedpointElevation  );
                        }
                        var lonlat = ol.proj.transform(coordinate, view.getProjection(), 'EPSG:4326');
                        
                        self.childContent.find('#longitude').val(lonlat[0] );
                        self.childContent.find('#latitude').val(lonlat[1] );  
                        var seedPointCoorinates = ol.proj.transform(lonlat, 'EPSG:4326',view.getProjection());             
                      }catch(ex){
                      }
                  }
              },
              error: function (xhr, textStatus, errorThrown) {
                  $.notify({
                      message: ""+ errorThrown+"<br/> You clicked outside of the raster layer area."
                  },{
                      type:'danger',
                      delay:2000,
                      animate: {
                          enter: 'animated fadeInDown',
                          exit: 'animated fadeOutUp'
                      }
                  }); 
              }
          }).done(function (response) {
            //self.dlg.open();
          });
          self.dlg.open();
          self.childContent.find("#pickfromMap").on("click", function () {
            self.pickFromMap();
          });
      }
  });

  map.removeInteraction(interactionPointer);
  map.addInteraction(interactionPointer);
  interactionPointer.setActive(true);

  }