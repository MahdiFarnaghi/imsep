

function LayerSourceTab() {
     var self=this;  
     this.tabId='tabSource';  
      
  }
  LayerSourceTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  LayerSourceTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  LayerSourceTab.prototype.applied=function(obj){
    if(obj && obj.get('custom') && obj.get('custom').type=='ol.layer.Vector')
      return true;
    else if(obj && obj.get('custom') && obj.get('custom').source=='ol.source.GeoImage')
      return true;        
    else if(obj && obj.get('custom') && obj.get('custom').source=='ol.source.WMS')
      return true;  
    else
      return false;
  }
  LayerSourceTab.prototype.create=function(obj,isActive){
    var self=this;
    this.layer=obj;
    var mapContainer= this.parentDialog.mapContainer;
    var map = mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();

    var layerCustom= obj.get('custom');
    var active='';
    if(isActive)
      active ='active';
    var sourceType='';    
    
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-database"></i> Source</a> </li>').appendTo(this.parentDialog.tabPanelNav);
   this.tab=$('<div class="tab-pane '+ active +'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
    
    // htm+='  <div class="form-group">';
    // htm+='    <label class="" for="name">Name</label>';
    // htm+='    <input type="text" name="name" id="name" value="" placeholder="Name" class="form-control" data-val="true" data-val-required="Layer name is required" />'
    // htm+='    <span class="field-validation-valid" data-valmsg-for="name" data-valmsg-replace="true"></span>';
    // htm+='  </div>';
    htm+='';
    htm+='';
    htm+='';
    htm+='';
    if(layerCustom.dataObj && layerCustom.format=='ol.format.OSMXML')  {
      sourceType='OSMXML';
      
      var details= LayerHelper.getDetails(self.layer);
      if(details){
        
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="">OSM Vector Data</label>';
        htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_osm">?</a>'  ;
        htm+='  </div>';
        

       
      }
    }
    if(layerCustom.dataObj && layerCustom.format=='ol.format.GeoJSON')  {
      sourceType='GeoJSON';
      htm+='  <div class="form-group">';
      htm+='    <label class="" for="">Vector data layer</label>';
      htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_vectorLayer">?</a>'  ;
        var label = layerCustom.dataObj.name;
        var description = layerCustom.dataObj.description || '';
        description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');
        var class_ = layerCustom.dataObj.dataType ? 'autocomplete-custom-item icon-' + layerCustom.dataObj.dataType : '';
      
        htm += '<div class="' + class_ + '" >';
        //if (item.data.thumbnail) {
          htm += '<img id="datalayerThumbnail" class="avatar48" src="/datalayer/' + layerCustom.dataObj.id + '/thumbnail" />';
        //} else {
        //   htm += '<i class="avatar48 fa fa-map"> </i>';
        //}
        htm += label + (layerCustom.dataObj.description ? '<br/><small style="white-space: pre;">' + description + '</small>' : '');
        htm += '<div class="list-inline">';
        //if (layerCustom.dataObj.OwnerUser.userName !== app.identity.name) {
          htm += '    <li><i class="fa fa-user"></i> <span>' + layerCustom.dataObj.OwnerUser.userName + '</span></li>';
        //}
        var updatedAt=layerCustom.dataObj.updatedAt;
        try {
          updatedAt = (new Date(updatedAt)).toUTCString();
        } catch (ex) {
        }
        htm += '<li><i class="fa fa-calendar"></i><span>' +updatedAt + '</span></li>';
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.id){
          if(layerCustom.dataObj.ownerUser==app.identity.id || (layerCustom.dataObj.OwnerUser && layerCustom.dataObj.OwnerUser.parent ===app.identity.id) ){
          
          htm +=' <li style="float: right;">';
          htm+='    <div class=""><button id="cmdupdatethumbnail" type="button" class="btn btn-primary btn-success btn-xs ">Update thumbnail</button></div>';
          htm +=' </lin>';
         }
        }
        
        htm += ' </div>';
        htm += '</div>';
      htm+='  </div>';
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadGeoJSON" ><i class="fa fa-download"></i> Download GeoJSON</button>';
      htm+='</div>'; 
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadShapefile" ><i class="fa fa-download"></i> Download Shapefile</button>';
      htm+='</div>'; 
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary btn-xs_" id="createLayerFromGeoJSON" ><i class="fa fa-copy"></i> Copy features to a new data layer</button>';
      htm+='</div>';
      var details= LayerHelper.getDetails(self.layer);
      if(details){
       

        if(details.shapeType){
          htm+='<div class="form-group">';
          htm+='  <label class="col-sm-3" for="shapeType">Shape type:</label>';
          htm+='    <select class="form-control " id="shapeType" disabled="disabled"  >';
          htm+='                          <option value="Point" '+((details.shapeType=='Point')?'selected="selected"':'')+' >▪    Point</option>';
          htm+='                          <option value="MultiLineString" '+((details.shapeType=='MultiLineString')?'selected="selected"':'')+'>▬ Line</option>';
          htm+='                          <option value="MultiPolygon" '+((details.shapeType=='MultiPolygon')?'selected="selected"':'')+'>◇ Polygon</option>';
          htm+='    </select>';
          htm+='  </div>';
        }
        if(details.spatialReference){
          htm+='<div class="form-group">';
          htm+='  <label class="col-sm-12" for="">Spatial reference:</label>';
          if(details.spatialReference.srid && !details.spatialReference.alias){
            if(details.spatialReference.srid==3857 || details.spatialReference.srid=='3857'){
              details.spatialReference.alias='Google Maps Global Mercator';
            }
            if(details.spatialReference.srid==4326 || details.spatialReference.srid=='4326'){
              details.spatialReference.alias='WGS 84';
            }
          }
          
          if(details.spatialReference.name){
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-1 col-sm-3" >Name:</label>';  
            if(details.spatialReference.alias)
              htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' ('+ details.spatialReference.alias+') </label>';  
            else
              htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' </label>';    
            htm+='</div>';
          }
          if(details.spatialReference.srid){
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-1 col-sm-3" >SRID:</label>';  
            htm+='  <label class="col-sm-8" >'+details.spatialReference.srid+' </label>';  
            htm+='</div>';
          }
          // if(details.spatialReference.proj4){
          //   htm+='<div class="row">';
          //   htm+='  <label class="col-sm-offset-1 col-sm-3" >PROJ4:</label>';  
          //   htm+='  <label class="col-sm-8" >'+details.spatialReference.proj4+' </label>';  
          //   htm+='</div>';
          // }
          // if(details.spatialReference.wkt){
          //   htm+='<div class="row">';
          //   htm+='  <label class="col-sm-offset-1 col-sm-3" >WKT:</label>';  
          //   htm+='  <label class="col-sm-8" >'+details.spatialReference.wkt+' </label>';  
          //   htm+='</div>';
          // }
          
          htm+='</div>';
        }
      }
     
    } 
    if(layerCustom.dataObj && layerCustom.source=='ol.source.GeoImage')  {
      sourceType='GeoImage';
      htm+='  <div class="form-group">';
      htm+='    <label class="" for="">Raster data layer</label>';
      htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_raster">?</a>'  ;
        var label = layerCustom.dataObj.name;
        var description = layerCustom.dataObj.description || '';
        description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');
        
        var class_ = layerCustom.dataObj.dataType ? 'autocomplete-custom-item icon-' + layerCustom.dataObj.dataType : '';
      
        htm += '<div class="' + class_ + '" >';
        //if (item.data.thumbnail) {
          htm += '<img id="datalayerThumbnail" class="avatar48" src="/datalayer/' + layerCustom.dataObj.id + '/thumbnail" />';
        //} else {
        //   htm += '<i class="avatar48 fa fa-map"> </i>';
        //}
        htm += label + (layerCustom.dataObj.description ? '<br/><small style="white-space: pre;">' + description + '</small>' : '');
        htm += '<div class="list-inline">';
        //if (layerCustom.dataObj.OwnerUser.userName !== app.identity.name) {
          htm += '    <li><i class="fa fa-user"></i> <span>' + layerCustom.dataObj.OwnerUser.userName + '</span></li>';
        //}
        var updatedAt=layerCustom.dataObj.updatedAt;
        try {
          updatedAt = (new Date(updatedAt)).toUTCString();
        } catch (ex) {
        }
        htm += '<li><i class="fa fa-calendar"></i><span>' +updatedAt + '</span></li>';
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.id){
          if(layerCustom.dataObj.ownerUser==app.identity.id || (layerCustom.dataObj.OwnerUser && layerCustom.dataObj.OwnerUser.parent ===app.identity.id) ){
          
          htm +=' <li style="float: right;">';
          htm+='    <div class=""><button id="cmdupdatethumbnail" type="button" class="btn btn-primary btn-success btn-xs">Update thumbnail</button></div>';
          htm +=' </lin>';
         }
        }
        htm += '<li><i class="fa fa-download"></i><a target="_blank" href="/datalayer/' +layerCustom.dataObj.id+'/raster?request=geotiff"> Download GeoTIFF</a></li>';
        htm += ' </div>';
        htm += '</div>';
      htm+='  </div>';
      var details= LayerHelper.getDetails(self.layer);
      if(details){
       

        htm+='<div class="row">';
        htm+='  <label class="col-sm-4" >Image width:</label>';  
        htm+='  <label class="col-sm-8" >'+details.rasterWidth+' Pixels </label>';  
        htm+='</div>';
        htm+='<div class="row">';
        htm+='  <label class="col-sm-4" >Image height:</label>';  
        htm+='  <label class="col-sm-8" >'+details.rasterHeight+' Pixels </label>';  
        htm+='</div>';

        var rasterTypes={
          'SingleBand':'Single-band',
          'SingleBand_Dem':'Single-band (DEM)',
          'SingleBand_Image':'Single-band (Image)',
          'MultiBand':'Multi-band',
          'Image':'Image'
        }
        htm+='<div class="row">';
        htm+='  <label class="col-sm-4" >Raster type:</label>';  
        htm+='  <label class="col-sm-8" >'+ (rasterTypes[details.rasterType] || details.rasterType) +' </label>';  
        htm+='</div>';

        


        if(details.bands){
          htm+='<div class="form-group">';
          if(details.bands.length>1){
            htm+='  <label class="col-sm-12" for="">Bands:</label>';
          }else{
            htm+='  <label class="col-sm-12" for="">Band:</label>';
          }
          for(var i=0;i<details.bands.length;i++){
            var band=details.bands[i];

              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-1 col-sm-3" >Name:</label>';  
              htm+='  <label class="col-sm-8" >'+(band.name)+' </label>';  
              htm+='</div>';
              
              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-2 col-sm-3" >ID:</label>';  
              htm+='  <label class="col-sm-7" >'+ band.id +' </label>';  
              htm+='</div>';
            
              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-2 col-sm-3" >Data type:</label>';  
              htm+='  <label class="col-sm-7" >'+ band.dataType +' </label>';  
              htm+='</div>';
              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-2 col-sm-3" >Min value:</label>';  
              htm+='  <label class="col-sm-7" >'+band.minimum+' </label>';  
              htm+='</div>';
              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-2 col-sm-3" >Max value:</label>';  
              htm+='  <label class="col-sm-7" >'+band.maximum+' </label>';  
              htm+='</div>';
              htm+='<div class="row">';
              htm+='  <label class="col-sm-offset-2 col-sm-3" >No-data value:</label>';  
              htm+='  <label class="col-sm-7" >'+band.noDataValue+' </label>';  
              htm+='</div>';
              if(band.statistics){
                htm+='<div class="row">';
                htm+='  <label class="col-sm-offset-2 col-sm-3" >Mean value:</label>';  
                htm+='  <label class="col-sm-7" >'+band.statistics.mean+' </label>';  
                htm+='</div>';

                if(typeof band.statistics.std_dev !=='undefined'){
                  htm+='<div class="row">';
                  htm+='  <label class="col-sm-offset-2 col-sm-3" >Standard deviation:</label>';  
                  htm+='  <label class="col-sm-7" >'+band.statistics.std_dev +' </label>';  
                  htm+='</div>';
                }else if(typeof band.statistics.stddev !=='undefined'){
                  htm+='<div class="row">';
                  htm+='  <label class="col-sm-offset-2 col-sm-3" >Standard deviation:</label>';  
                  htm+='  <label class="col-sm-7" >'+band.statistics.stddev +' </label>';  
                  htm+='</div>';
                }
              }
              htm+='<hr />';
          }


          htm+='</div>';
        }
        if(details.spatialReference){
          htm+='<div class="form-group">';
          htm+='  <label class="col-sm-12" for="">Spatial reference:</label>';
          
          if(details.spatialReference.srid && !details.spatialReference.alias){
            if(details.spatialReference.srid==3857 || details.spatialReference.srid=='3857'){
              details.spatialReference.alias='Google Maps Global Mercator';
            }
            if(details.spatialReference.srid==4326 || details.spatialReference.srid=='4326'){
              details.spatialReference.alias='WGS 84';
            }
          }
          
          if(details.spatialReference.name){
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-1 col-sm-3" >Name:</label>';  
            
            if(details.spatialReference.alias)
              htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' ('+ details.spatialReference.alias+') </label>';  
            else
              htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' </label>';    
            htm+='</div>';
          }
          if(details.spatialReference.srid){
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-1 col-sm-3" >SRID:</label>';  
            htm+='  <label class="col-sm-8" >'+details.spatialReference.srid+' </label>';  
            htm+='</div>';
          }
          // if(details.spatialReference.proj4){
          //   htm+='<div class="row">';
          //   htm+='  <label class="col-sm-offset-1 col-sm-3" >PROJ4:</label>';  
          //   htm+='  <label class="col-sm-8" >'+details.spatialReference.proj4+' </label>';  
          //   htm+='</div>';
          // }
          // if(details.spatialReference.wkt){
          //   htm+='<div class="row">';
          //   htm+='  <label class="col-sm-offset-1 col-sm-3" >WKT:</label>';  
          //   htm+='  <label class="col-sm-8" >'+details.spatialReference.wkt+' </label>';  
          //   htm+='</div>';
          // }
          
          htm+='</div>';
        }
      }
     
    }
    if(layerCustom.dataObj && layerCustom.format=='ol.format.WFS'){
      sourceType='WFS';
      var details= LayerHelper.getDetails(self.layer);
      if(details){
        
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="">WFS (Web Feature Service)</label>';
        htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_wfsLayer">?</a>'  ;
        htm+='  </div>';
        

        htm+='  <div class="form-group">';
        htm+='    <label class="" for="url">Service url:</label>';
        htm+='    <input type="text" name="url" id="url" value="'+details.url+'" placeholder="WFS address" autocomplete="on" class="form-control" data-val="true" data-val-required="Service url is required" />'
        htm+='    <span class="field-validation-valid" data-valmsg-for="url" data-valmsg-replace="true"></span>';
        htm+='  </div>';

        if(!details.params)
          details.params={LAYERS:''};
        
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="typename">Feature type:</label>';
        htm+='    <input type="text" name="typename" id="typename" value="'+details.params.typename+'" data-namespace="'+ (details.params.typenameNamespace?details.params.typenameNamespace:'')+ '" placeholder="WFS feature type" class="form-control" data-val="true" data-val-required="Feature type is required" />'
        htm+='    <span class="field-validation-valid" data-valmsg-for="typename" data-valmsg-replace="true"></span>';
        htm+='    <span class="help-block">Define WFS feature type. Example: ADMIN-AREA</span>';
        htm+='  <a id="cmdGetCapabilities" class="" target="_blank" href="' +details.url +'?SERVICE=WFS&REQUEST=GetCapabilities"> <i> Check service capabilities</i></a>';  
        htm+=' to explore published feature types and service availability</span>';
        htm+='</div>';
        
//if(details.shapeType){
          htm+='<div class="form-group">';
          htm+='  <label class="col-sm-3" for="shapeType">Shape type:</label>';
          htm+='    <select class="form-control " id="shapeType" >';
          htm+='                          <option value="Point" '+((layerCustom.shapeType=='Point')?'selected="selected"':'')+' >▪    Point</option>';
          htm+='                          <option value="MultiLineString" '+((layerCustom.shapeType=='MultiLineString')?'selected="selected"':'')+'>▬ Line</option>';
          htm+='                          <option value="MultiPolygon" '+((layerCustom.shapeType=='MultiPolygon')?'selected="selected"':'')+'>◇ Polygon</option>';
          htm+='    </select>';
          htm+=' </div>';
      //  }
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadGeoJSON" ><i class="fa fa-download"></i> Download GeoJSON</button>';
      htm+='</div>';
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadShapefile" ><i class="fa fa-download"></i> Download Shapefile</button>';
      htm+='</div>';
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary btn-xs_" id="createLayerFromGeoJSON" ><i class="fa fa-copoy"></i> Copy features to a new data layer</button>';
      htm+='</div>';
      }
    }
    var load_WmsCapabilities=false;
    if(layerCustom.dataObj && layerCustom.source=='ol.source.WMS'){
      sourceType='WMS';
      var details= LayerHelper.getDetails(self.layer);
      if(details){
        load_WmsCapabilities=true;
        try {
          if (typeof details === 'string' || details instanceof String){
            details = JSON.parse(details);
          }
        } catch (ex) {}
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="">WMS (Web Map Service)</label>';
        htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_wmsLayer">?</a>'  ;
        htm+='  </div>';
        

        htm+='  <div class="form-group">';
        htm+='    <label class="" for="url">Service url:</label>';
        htm+='    <input type="url" name="url" id="url" value="'+details.url+'" placeholder="WMS address" autocomplete="on" class="form-control" data-val="true" data-val-required="Service url is required" />'
        htm+='    <span class="field-validation-valid" data-valmsg-for="url" data-valmsg-replace="true"></span>';
        htm+='  </div>';

        if(!details.params)
          details.params={LAYERS:''};
        
         
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="layers">Layers:</label>';
        htm+='    <input type="text" name="layers" id="layers" value="'+details.params.LAYERS+'" placeholder="WMS Layers" class="form-control" data-val="true" data-val-required="Layers is required" />'
        htm+='    <span class="field-validation-valid" data-valmsg-for="layers" data-valmsg-replace="true"></span>';
        htm+='    <span class="help-block">Define WMS layers with a comma delimited text. Example: ROAD,RIVER,ADMIN-AREA</span>';
        htm+='      <a id="cmdGetCapabilities" class="" target="_blank" href="' +details.url +'?SERVICE=WMS&REQUEST=GetCapabilities"> <i> Check service capabilities</i></a>';  
        htm+=' to explore published layers and service availability</span>';
        htm+='</div>';
        
      
      }
    }
    htm+='</form></div>';
    
    var content=$(htm).appendTo( this.tab); 
    content.find('#name').val(this.layer.get('title'));
    var datalayerThumbnailElment= content.find('#datalayerThumbnail');
    content.find('#cmdupdatethumbnail').click(function(){
      self.updateLayerThumbnail(datalayerThumbnailElment);
    });
    if(sourceType=='GeoJSON'){
      content.find('#shapeType').val(details.shapeType);
       const source= self.layer.getSource();
       const features = source.getFeatures();
       if(!features.length){
        content.find('#downloadGeoJSON').hide();
        content.find('#downloadShapefile').hide();
        content.find('#createLayerFromGeoJSON').hide();
        
       }
      // if( source.getFormat()){
      //  const json = source.getFormat().writeFeatures(features);
      //  //content.find('#downloadGeoJSON').attr("href", 'data:text/json;charset=utf-8,' + json);

      //  content.find('#downloadGeoJSON').click(function(){
      //                 var iframe = "<iframe width='100%' height='100%' src='" +'data:text/json;charset=utf-8,' +json+ "'></iframe>";
      //                  var x = window.open();
      //                  x.document.open();
      //                  x.document.write(iframe);
      //                  x.document.close();
      //     });
      // }

      content.find('#downloadGeoJSON').click(function(){
               const source= self.layer.getSource();
              const features = source.getFeatures();
              //if( !source.getFormat())
              //  return;
                var fileName= self.layer.get('title')|| details.shapefileName || details.tableName ;
               var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
               const json = format.writeFeatures(features);
               var blob = new Blob([json], {type: "text/json;charset=utf-8"});
               saveAs(blob, fileName +".json");


              //  var shp_options = {
              //   folder: 'shapefiles',
              //   types: {
              //   point: 'points',
              //   polygon: 'polygons',
              //   polyline: 'polyline'
              //   }
              //   ,zipToBlob:true,
              //   zipCompression:'DEFLATE'
              // };

              //   shpwrite.zip( JSON.parse(json),shp_options).then(function(content) {
              //       saveAs(content, 'export.zip');
              //   });

      });
    }
    if(sourceType=='WFS'){
      content.find('#shapeType').val(layerCustom.shapeType);
      const source= self.layer.getSource();
      const features = source.getFeatures();
      if(!features.length){
       content.find('#downloadGeoJSON').hide();
       content.find('#downloadGeoShapefile').hide();
       content.find('#createLayerFromGeoJSON').hide();
      }
      // var format = new ol.format.GeoJSON({
      //   dataProjection: 'EPSG:4326'
      // });
      // const source= self.layer.getSource();
      // const features = source.getFeatures();
      // const json = format.writeFeatures(features);
      //   content.find('#downloadGeoJSON').attr("href", 'data:text/json;charset=utf-8,' + json);

      content.find('#downloadGeoJSON').click(function(){
        const source= self.layer.getSource();
       const features = source.getFeatures();
        var fileName= self.layer.get('title')|| details.shapefileName || details.tableName ;
        var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
        const json = format.writeFeatures(features);
        var blob = new Blob([json], {type: "text/json;charset=utf-8"});
        saveAs(blob, fileName +".json");
    });

  }
  if(sourceType=='WFS' || sourceType=='GeoJSON'){
      content.find('#createLayerFromGeoJSON').click(function(){
      
        mapContainer.duplicateLayer(self.layer,{
          newName:undefined,
          exportSelectionIfAny:false,
          srid:4326
      });
      

    });

    content.find('#downloadShapefile').click(function(){
      const source= self.layer.getSource();
    const features = source.getFeatures();
      var fileName= self.layer.get('title')|| details.shapefileName || details.tableName ;
      var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
      const json = format.writeFeatures(features);
      var blob = new Blob([json], {type: "text/json;charset=utf-8"});
      var details= LayerHelper.getDetails(self.layer);
      var layerInfo= JSON.parse(JSON.stringify(details));
      delete layerInfo.filter;
      delete layerInfo.datasetName;
      delete layerInfo.params;
      delete layerInfo.url;
      layerInfo.fileName=fileName +'-Copy';
      layerInfo.spatialReference = {
        name: 'EPSG:4326',
        srid: 4326
      };

      var formdata = new FormData();
      formdata.append("file", blob,'geojson.json');
      formdata.append('layerInfo',JSON.stringify(layerInfo));

      var processNotify= $.notify({
        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Copying features to new data layer...'
        },{
          z_index:50000,
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });

      $.ajax({
        url: '/datalayer/toShapefile',
        type: "POST",
        data: formdata,
        processData: false,
        contentType: false,
        
        xhrFields: {
          responseType: 'blob'
        },
        success:function(response, status, xhr) {
          var filename = "";
          var disposition = xhr.getResponseHeader('Content-Disposition');
          if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
          }
          if(!filename){
              filename='shapefile.zip';
          }
          var type = xhr.getResponseHeader('Content-Type');
          var blob = new Blob([response], { type: type });
          saveAs(blob, filename);
        }
        })        
        .done(function(data){
          processNotify.close();
              
        }).fail(function( jqXHR, textStatus, errorThrown) {
              $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 

            processNotify.close();
        });


  });


 }
    
   // var tt=content.find('#cmdGetCapabilities');
   // content.find('#cmdGetCapabilities').click(function(){
    if(false && load_WmsCapabilities){
        var url= '/proxy/?url='+ encodeURIComponent( details.url +'?SERVICE=WMS&REQUEST=GetCapabilities');
        $.ajax(url, {
            
          type: 'GET',
         // dataType: 'xml',
          //processData: false,
          contentType: 'text/xml',
          success: function (data) {
              if (data) {
                var capabilities = new ol.format.WMSCapabilities();
                var result = capabilities.read(data);
                //console.log(result); 
                $('#cmdGetCapabilities_results').text(JSON.stringify(result, null, 2));
              }
          },
          error: function (xhr, textStatus, errorThrown) {
              var a = 1;
              $.notify({
                  message: "Failed to Get WMS Capabilities, "+ errorThrown
              },{
                  type:'danger',
                  delay:2000,
                  animate: {
                      enter: 'animated fadeInDown',
                      exit: 'animated fadeOutUp'
                  }
              });
              source.clear();
          }
      });
    }
   // });
  
    if(sourceType=='WMS' || sourceType=='WFS'){
      var updateLink=function(){
        var url= content.find('#url').val();
        if(!url){
          content.find('#cmdGetCapabilities').removeAttr('href');
          content.find('#cmdGetCapabilities').addClass('disabled');

        }else{
          content.find('#cmdGetCapabilities').attr("href",url+ '?SERVICE='+ sourceType+ '&REQUEST=GetCapabilities');
          content.find('#cmdGetCapabilities').removeClass('disabled');
        }
      }
      content.find('#url').change(function(){
        updateLink();
      });

      updateLink();
    }
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
      if(sourceType=='WMS'){
        var newUrl=content.find('#url').val();
        var newLayers=content.find('#layers').val();
        if(newUrl !== LayerHelper.getDetails(self.layer).url
          || newLayers !==LayerHelper.getDetails(self.layer).params.LAYERS){
            LayerHelper.getDetails(self.layer).url=newUrl ;
            LayerHelper.getDetails(self.layer).params.LAYERS= newLayers;
            var url='/proxy/?url=' +encodeURIComponent(LayerHelper.getDetails(self.layer).url);
            self.layer.get('source').setUrl(url);
            self.layer.get('source').updateParams(LayerHelper.getDetails(self.layer).params);

            var url= '/proxy/?url='+ encodeURIComponent( LayerHelper.getDetails(self.layer).url +'?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0');
              $.ajax(url, {
                  
                type: 'GET',
                 dataType: 'xml',
                //processData: false,
                //contentType: 'text/xml',
                success: function (data) {
                    if (data) {
                     // var capabilities = new ol.format.WMSCapabilities();
                      //var result = capabilities.read(data);
                      //console.log(result); 
                      //$('#cmdGetCapabilities_results').text(JSON.stringify(result, null, 2));
                      var prefix='';
                      if(data.documentElement){
                        prefix= data.documentElement.prefix;
                      }
                      if(!prefix)
                        prefix='';
                      var elements;
                      //var elements= $('xsd\\:complexContent', data).find('xsd\\:element');
                      if(prefix){
                        elements= $( prefix+ '\\:Cpability', data).find(prefix+'\\:Layer');
                      }else
                      {
                        //elemnts= $( 'Capability',data).find('Layer Name:contains("1")');
                        elements= $( 'Capability',data).find('Layer Name');
                      }
                      if(elements.length>0){
                        var layers=newLayers.split(',');
                        var north,south,east,west;
                        for(var i=0;i<layers.length;i++){
                          for(var j=0;j< elements.length;j++)
                          {
                            var elemnt_Name= $(elements[j]).text();
                            if(elemnt_Name ==layers[i]){
                              var EX_GeographicBoundingBox= $(elements[j]).siblings('EX_GeographicBoundingBox');
                              if(EX_GeographicBoundingBox.length){
                                var westBoundLongitude= EX_GeographicBoundingBox.first().find('westBoundLongitude');
                                var eastBoundLongitude= EX_GeographicBoundingBox.first().find('eastBoundLongitude');
                                var northBoundLatitude= EX_GeographicBoundingBox.first().find('northBoundLatitude');
                                var southBoundLatitude= EX_GeographicBoundingBox.first().find('southBoundLatitude');
                                try{
                                  if(westBoundLongitude.length){
                                    var vWest= parseFloat(westBoundLongitude.text());
                                    if(!isNaN(vWest)){
                                      if(typeof west =='undefined')
                                        west= vWest;
                                       west= Math.min(west,vWest); 
                                    }
                                  }
                                  if(eastBoundLongitude.length){
                                    var vEast= parseFloat(eastBoundLongitude.text());
                                    if(!isNaN(vEast)){
                                      if(typeof east =='undefined')
                                        east= vEast;
                                       east= Math.max(east,vEast); 
                                    }
                                  }
                                  if(northBoundLatitude.length){
                                    var vNorth= parseFloat(northBoundLatitude.text());
                                    if(!isNaN(vNorth)){
                                      if(typeof north =='undefined')
                                        north= vNorth;
                                       north= Math.max(north,vNorth); 
                                    }
                                  }
                                  if(southBoundLatitude.length){
                                    var vSouth= parseFloat(southBoundLatitude.text());
                                    if(!isNaN(vSouth)){
                                      if(typeof south =='undefined')
                                        south= vSouth;
                                       south= Math.min(south,vSouth); 
                                    }
                                  }

                                }catch(ex){}
                              }
                            }
                          }
                        }
                        LayerHelper.getDetails(self.layer).ext_north=north;
                        LayerHelper.getDetails(self.layer).ext_south=south;
                        LayerHelper.getDetails(self.layer).ext_east=east;
                        LayerHelper.getDetails(self.layer).ext_west=west;

                        mapContainer.setGeoExtent(west,south,east,north)
                      }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                }
            });
          }
      }
      if(sourceType=='WFS'){
        var newUrl=content.find('#url').val();
        var newTypename=content.find('#typename').val();
        var typenameNamespace=content.find('#typename').data('namespace');
        var newShapeType= content.find('#shapeType').val();
        LayerHelper.setShapeType(self.layer,newShapeType);
        if(newUrl !== LayerHelper.getDetails(self.layer).url
          || newTypename !==LayerHelper.getDetails(self.layer).params.typename
          ){
            //layerCustom.dataObj.details.fields=null;
            LayerHelper.setFields(self.layer,null);
            LayerHelper.getDetails(self.layer).url=newUrl ;
            LayerHelper.getDetails(self.layer).params.typename= newTypename;
            LayerHelper.getDetails(self.layer).params.typenameNamespace=typenameNamespace;
            
            var vectorSource = mapContainer.sorceFactory.createWFSSource(layerCustom.dataObj,mapContainer);

            self.layer.set('source',vectorSource );
            vectorSource.clear();
            var url= '/proxy/?url='+ encodeURIComponent( LayerHelper.getDetails(self.layer).url +'?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0');
            $.ajax(url, {
              type: 'GET',
               dataType: 'xml',
              success: function (data) {
                  if (data) {
                    var prefix='';
                    if(data.documentElement){
                      prefix= data.documentElement.prefix;
                    }
                    if(!prefix)
                      prefix='';
                    var elements;
                    //var elements= $('xsd\\:complexContent', data).find('xsd\\:element');
                      elements= $( 'FeatureTypeList',data).find('FeatureType Name');
                    
                    if(elements.length>0){
                        var north,south,east,west;
                        for(var j=0;j< elements.length;j++)
                        {
                          var elemnt_Name= $(elements[j]).text();
                          if(elemnt_Name ==newTypename){
                            var WGS84BoundingBox= $(elements[j]).siblings('ows\\:WGS84BoundingBox');
                            if(WGS84BoundingBox.length){
                              var LowerCorner= WGS84BoundingBox.first().find('ows\\:LowerCorner');
                              var UpperCorner= WGS84BoundingBox.first().find('ows\\:UpperCorner');
                            
                              try{
                                if(LowerCorner.length){
                                  var vLowerCorner= LowerCorner.text();
                                  vLowerCorner=vLowerCorner.split(' ');
                                  west= parseFloat(vLowerCorner[0]);
                                  south= parseFloat(vLowerCorner[1]);
                                }
                                if(UpperCorner.length){
                                  var vUpperCorner= UpperCorner.text();
                                  vUpperCorner= vUpperCorner.split(' ');
                                  east= parseFloat(vUpperCorner[0]);
                                  north= parseFloat(vUpperCorner[1]);
                                }
                                
                              }catch(ex){}
                            }
                          }
                        }
                      
                      LayerHelper.getDetails(self.layer).ext_north=north;
                      LayerHelper.getDetails(self.layer).ext_south=south;
                      LayerHelper.getDetails(self.layer).ext_east=east;
                      LayerHelper.getDetails(self.layer).ext_west=west;

                      mapContainer.setGeoExtent(west,south,east,north)
                    }
                  }
              },
              error: function (xhr, textStatus, errorThrown) {
              }
          });
          }
          
          if(!LayerHelper.getFields(self.layer)){
            var sUrl=LayerHelper.getDetails(self.layer).url +'?SERVICE=WFS&REQUEST=DescribeFeatureType&version=1.1.0&typeName='+layerCustom.dataObj.details.params.typename;
            var url= '/proxy/?url='+ encodeURIComponent( sUrl);
            $.ajax(url, {
                
              type: 'GET',
              dataType: 'xml',
              //processData: false,
             // contentType: 'text/xml',
              
              success: function (data) {
              
                if (data) {
                 

                  var fields=[];
                   var prefix='xsd';
                   if(data.documentElement){
                    prefix= data.documentElement.prefix;
                   }
                   //var elemnts= $('xsd\\:complexContent', data).find('xsd\\:element');
                   var elemnts= $( prefix+ '\\:complexContent', data).find(prefix+'\\:element');
                    if(elemnts.length==0){

                    }
                    elemnts.each(function(){
                      var fieldName = $(this).attr("name");
                      var fieldType = $(this).attr("type");
                      if(fieldType== (prefix+':string')|| fieldType==(prefix+':date'))
                      {
                        fields.push({
                          name:fieldName,alias:fieldName,
                          type:'varchar'
                        });
                      }else if(fieldType== (prefix+':double')|| fieldType==(prefix+':float')|| fieldType==(prefix+':decimal'))
                      {
                        fields.push({
                           name:fieldName,alias:fieldName,
                          type:'numeric'
                        });
                      }else if(fieldType== (prefix+':byte')|| fieldType== (prefix+':integer	') || fieldType== (prefix+':int') || fieldType== (prefix+':short') )
                      {
                        fields.push({
                           name:fieldName,alias:fieldName,
                          type:'integer'
                        });
                     }else if(fieldType== (prefix+':long') )
                     {
                       fields.push({
                          name:fieldName,alias:fieldName,
                         type:'bigint'
                       });
                    }else if(fieldType==(prefix+':boolean'))
                     {
                       fields.push({
                          name:fieldName,alias:fieldName,
                         type:'boolean'
                       });
                     }
                  });
                  }

                  LayerHelper.setFields(self.layer,fields);
              },
              error: function (xhr, textStatus, errorThrown) {
                  var a = 1;
                 
              }
          });
          }
      }
    });
    if(sourceType=='WMS'){
      var layers_cache =undefined;// {};
      var last_wms_downloading_url;
      var layersEl=content.find('#layers');
      $(layersEl).autocomplete({
          appendTo:content,
          minLength: 0,
          source: function (request, response) {
              var term = request.term;
              var newUrl=content.find('#url').val();
              var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
              var text = $( this ).text();
              //if (term in cache) {
             if (layers_cache && !self.WMS_downloding && newUrl==last_wms_downloading_url) {
                     //var data = cache[term];
                 // var data = typename_cache;
                  var mappedData=$.map(layers_cache, function (item) {
                    if ( item.label && ( !request.term || matcher.test(item.label) || matcher.test(item.title) || matcher.test(item.keywords) ) ){
                          return {
                              label: item.label,
                              value: item.value,
                              data:item
                          };
                    }
                  })
                  response(mappedData);
                  return;
              }
              if(!self.WMS_downloding && newUrl!==last_wms_downloading_url){
                  self.WMS_downloding=true;
                  last_wms_downloading_url= newUrl;

                  var url= '/proxy/?url='+ encodeURIComponent( newUrl +'?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0');
                  $.ajax(url, {
                    type: 'GET',
                     dataType: 'xml',
                    success: function (data) {
                      self.WMS_downloding=false;
                      $('#layers').removeClass('ui-autocomplete-loading');
                        if (data) {
                          var prefix='';
                          if(data.documentElement){
                            prefix= data.documentElement.prefix;
                          }
                          if(!prefix)
                            prefix='';
                          var elements;
                          
                          //elements= $( 'Capability',data).find('Layer[queryable="1"] > Name ');
                          elements= $( 'Capability',data).find('Layer > Name ');
                          //elements = elements.find('[queryable="1"]');
                          if(elements.length>0){
                              var recievedData=[];

                              for(var j=0;j< elements.length;j++)
                              {
                                var elemnt_Name= $(elements[j]).text();
                                var item={
                                  label:elemnt_Name,
                                  value:elemnt_Name,
                                  title:elemnt_Name,
                                  keywords:''
                                };
                                var Title= $(elements[j]).siblings('Title');
                                item.title= Title.text();
                                var Keywords= $(elements[j]).siblings('ows\\:Keywords');
                                 Keywords= $(Keywords).find('ows\\:Keyword');
                                var keywords=[]; 
                                Keywords.each(function(index,element){
                                  keywords.push(element.innerHTML);
                                })
                                if(keywords.length && keywords.join){
                                  item.keywords=keywords.join(', ');
                                }
                                var OnlineResource= $(elements[j]).parent().find('Style LegendURL OnlineResource').first();
                                if(OnlineResource.length>0){
                                  item.legend= OnlineResource[0].getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                                 
                                }
                                
                                recievedData.push(item);
                              }
                              
                              layers_cache= recievedData;
                              var mappedData=$.map(layers_cache, function (item) {
                                  if ( item.label && ( !request.term || matcher.test(item.label) || matcher.test(item.title) || matcher.test(item.keywords) ) ){
                                      return {
                                          label: item.label,
                                          value: item.value,
                                          data:item
                                      };
                                }
                              })
                              response(mappedData);
                            
                          }
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                      self.WMS_downloding=false;
                      $('#layers').removeClass('ui-autocomplete-loading');
                    }
                });
             }
          },
          select: function (event, ui) {
              $(this).val(ui.item.label);
             // showResults(ui.item);
             if(!self.layer.get('title') && ui.item.data ){
               $('#'+LayerGeneralTab.TabId+'_form').find('#name').val(ui.item.data.title ||ui.item.data.label);
             }
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
            $(this).autocomplete("search");
       }).data("ui-autocomplete")._renderItem = function (ul, item) {
        
         var label = item.label;
         var title='';
         var keywords='';
         if(item.data.title){ 
           title= item.data.title || '';
         }
         if(item.data.keywords){ 
          keywords= item.data.keywords || '';
        }
         title = title.replace(/(?:\r\n|\r|\n)/g, '<br />');
         var term = this.term;
       

         if (term) {
            label = String(label).replace( new RegExp(term, "gi"),
                 "<strong class='ui-state-highlight'>$&</strong>");
            title = String(title).replace( new RegExp(term, "gi"),
                "<strong class='ui-state-highlight'>$&</strong>");
            keywords = String(keywords).replace( new RegExp(term, "gi"),
                "<strong class='ui-state-highlight'>$&</strong>");
         }
         var class_ =  '';
         var htm = '';
         htm += '<div class="' + class_ + '" >';
         
         if (item.data.legend) {
            htm += '<img class="avatar48" src="'+item.data.legend+ '" />';
         } 
         htm += '<strong>'+label+'</strong>' ;
         htm += (item.data.title ? '<pre class="nostyle" style="display:inline;"><br/><small style="">Title:' + title + '</small></pre>' : '');
         htm += (item.data.keywords ? '<pre class="nostyle" style="display:inline;"><br/><small style="">Keywords:' + keywords + '</small></pre>' : '');
         
         return $("<li></li>").append(htm).appendTo(ul);
        
     };;
         
     

    }
    if(sourceType=='WFS'){
      var typename_cache =undefined;// {};
      var last_wfs_downloading_url;
      var typeNameEl=content.find('#typename');
      $(typeNameEl).autocomplete({
          appendTo:content,
          minLength: 0,
          source: function (request, response) {
              var term = request.term;
              var newUrl=content.find('#url').val();
              var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
              var text = $( this ).text();
              //if (term in cache) {
             if (typename_cache && !self.WFS_downloding && newUrl==last_wfs_downloading_url) {
                     //var data = cache[term];
                 // var data = typename_cache;
                  var mappedData=$.map(typename_cache, function (item) {
                    if ( item.label && ( !request.term || matcher.test(item.label) || matcher.test(item.title) || matcher.test(item.keywords) ) ){
                          return {
                              label: item.label,
                              value: item.value,
                              data:item
                          };
                    }
                  })
                  response(mappedData);
                  return;
              }
              if(!self.WFS_downloding && newUrl!==last_wfs_downloading_url){
                  self.WFS_downloding=true;
                  last_wfs_downloading_url= newUrl;

                  var url= '/proxy/?url='+ encodeURIComponent( newUrl +'?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0');
                  $.ajax(url, {
                    type: 'GET',
                     dataType: 'xml',
                    success: function (data) {
                      self.WFS_downloding=false;
                        if (data) {
                          var prefix='';
                          if(data.documentElement){
                            prefix= data.documentElement.prefix;
                          }
                          if(!prefix)
                            prefix='';
                          var elements;
                          //var elements= $('xsd\\:complexContent', data).find('xsd\\:element');
                            elements= $( 'FeatureTypeList',data).find('FeatureType Name');
                            if(elements.length==0){
                              elements= $( 'wfs\\:FeatureTypeList',data).find('wfs\\:FeatureType wfs\\:Name');
                            }
                          if(elements.length>0){
                              var recievedData=[];

                              for(var j=0;j< elements.length;j++)
                              {
                                var elemnt_Name= $(elements[j]).text();
                                var namespace='';
                                if(elemnt_Name.indexOf(':')){
                                    var elemnt_Name_parts= elemnt_Name.split(':');
                                    if(elemnt_Name_parts && elemnt_Name_parts.length==2){
                                      namespace= $(data.documentElement).attr('xmlns:' + elemnt_Name_parts[0]);      
                                    }
                                }
                                
                                var item={
                                  label:elemnt_Name,
                                  value:elemnt_Name,
                                  title:elemnt_Name,
                                  namespace:namespace,
                                  keywords:''
                                };
                                var Title= $(elements[j]).siblings('Title');
                                item.title= Title.text();
                                var Keywords= $(elements[j]).siblings('ows\\:Keywords');
                                 Keywords= $(Keywords).find('ows\\:Keyword');
                                var keywords=[]; 
                                Keywords.each(function(index,element){
                                  keywords.push(element.innerHTML);
                                })
                                if(keywords.length && keywords.join){
                                  item.keywords=keywords.join(', ');
                                }
                                recievedData.push(item)
                              }
                              
                              typename_cache= recievedData;
                              var mappedData=$.map(typename_cache, function (item) {
                                  if ( item.label && ( !request.term || matcher.test(item.label) || matcher.test(item.title) || matcher.test(item.keywords) ) ){
                                      return {
                                          label: item.label,
                                          value: item.value,
                                          data:item
                                      };
                                }
                              })
                              response(mappedData);
                            
                          }
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                      self.WFS_downloding=false;
                      $('#typename').removeClass('ui-autocomplete-loading');
                    }
                });
             }
          },
          select: function (event, ui) {
              $(this).val(ui.item.label);
              $(this).data('namespace',ui.item.data.namespace);
             // showResults(ui.item);
             if(!self.layer.get('title') && ui.item.data ){
              $('#'+LayerGeneralTab.TabId+'_form').find('#name').val(ui.item.data.title ||ui.item.data.label);
             }
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
            $(this).autocomplete("search");
       }).data("ui-autocomplete")._renderItem = function (ul, item) {
        
         var label = item.label;
         var title='';
         var keywords='';
         if(item.data.title){ 
           title= item.data.title || '';
         }
         if(item.data.keywords){ 
          keywords= item.data.keywords || '';
        }
         title = title.replace(/(?:\r\n|\r|\n)/g, '<br />');
         var term = this.term;
       

         if (term) {
            label = String(label).replace( new RegExp(term, "gi"),
                 "<strong class='ui-state-highlight'>$&</strong>");
            title = String(title).replace( new RegExp(term, "gi"),
                "<strong class='ui-state-highlight'>$&</strong>");
            keywords = String(keywords).replace( new RegExp(term, "gi"),
                "<strong class='ui-state-highlight'>$&</strong>");
         }
         var class_ =  '';
         var htm = '';
         htm += '<div class="' + class_ + '" >';
         htm += '<strong>'+label+'</strong>' ;
         htm += (item.data.title ? '<pre class="nostyle" style="display:inline;"><br/><small style="">Title:' + title + '</small></pre>' : '');
         htm += (item.data.keywords ? '<pre class="nostyle" style="display:inline;"><br/><small style="">Keywords:' + keywords + '</small></pre>' : '');
         
         return $("<li></li>").append(htm).appendTo(ul);
        
     };;
         
     

    }
  }
  LayerSourceTab.prototype.updateLayerThumbnail=function(datalayerThumbnailElment){
    var self=this;
    if(! this.layer)
      return;
    this.layer.setVisible(true);
    var layerCustom= this.layer.get('custom');
   
    waitingDialog.show('Updating layer\'s thumbnail', { progressType: 'info'});
    
    app.mapContainer.exportPngBlob(function(blob){
            //https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript
            if(!blob){
                waitingDialog.hide();
                return;
            }
            var formdata = new FormData();
            formdata.append("file", blob);
            $.ajax({
            url: '/datalayer/' +  layerCustom.dataObj.id +'/thumbnail',
            type: "POST",
            data: formdata,
            processData: false,
            contentType: false,
            }).done(function(respond){
                 waitingDialog.hide();
                 if(respond.status)  { 
                    var d = new Date();
                    datalayerThumbnailElment.attr('src', '/datalayer/' + layerCustom.dataObj.id + '/thumbnail?'+d.getTime());
                    $.notify({
                        message: "Layer's thumbnail saved successfully"
                    },{
                        type:'info',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                  }else{
                      $.notify({
                        message:  respond.message ||"Failed to save thumbnail."
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                  }
            }).fail(function( jqXHR, textStatus, errorThrown) {
                waitingDialog.hide();
                $.notify({
                    message: "Failed to save thumbnail"
                },{
                    type:'danger',
                    delay:2000,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
            });
        
        });

  }
  