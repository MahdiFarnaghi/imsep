function SourceFactory(app, options) {
  this.app = app;
  this.options = options || {};
  
}
SourceFactory.prototype.createBaseTileSource = function(dataObj) {
    if (!dataObj)
        return null;
    if(dataObj.type=='OSM') {
        return new ol.source.OSM({
            crossOrigin: "Anonymous" //https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported
        });
        
    } else if (dataObj.type == 'BingMaps') {
           return new ol.source.BingMaps({
                    key: dataObj.key,
                    imagerySet: dataObj.imagerySet
                });
        
    }else if (dataObj.type == 'XYZ') {
        dataObj.params.crossOrigin= "Anonymous";
        return new ol.source.XYZ(dataObj.params);
    }
}

SourceFactory.prototype.createWMSSource = function(dataObj) {
    if (!dataObj)
    return null;
    var details = dataObj.details;
    try {
        if (typeof details === 'string' || details instanceof String){
            details = JSON.parse(details);
        }
    } catch (ex) {}
    var url = details.url;
    //var url='/proxy/?url=' +encodeURIComponent(details.url);
    if(app.url_needs_proxy(url)){
        url='/proxy/?url='+ encodeURIComponent(url);
      }
    var params= details.params ||{};
    params['TILED']=true;       
    var wmsSource = new ol.source.TileWMS({
        //url: url,// https://cors-escape.herokuapp.com/  CORS proxy
        url:url,
        params: params,
        serverType: details.serverType 
        //,transition: 0
        ,crossOrigin: "Anonymous" //https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported
    });
    wmsSource.set('details', details);
    return wmsSource;
}
SourceFactory.prototype.createWFSSource = function(dataObj,mapContainer) {
  

    if (!dataObj)
    return null;
    var details = dataObj.details;
    try {
        if (typeof details === 'string' || details instanceof String){
            details = JSON.parse(details);
        }
    } catch (ex) {}
    //var url = details.url;
    var url=details.url;// '/proxy/?url=' +details.url;
    //var url='/proxy/?url=' + encodeURIComponent(details.url);
    if(app.url_needs_proxy(url)){
        url='/proxy/?url='+ encodeURIComponent(url);
      }
    var params= details.params ||{};
    params['version']=params['version'] || '1.1.0';       
    params['srsname']=params['srsname'] || 'EPSG:3857';
    var featureType=params.typename;
    if(featureType && featureType.indexOf(':')){
        featureType= featureType.split(':')[1];
    }
    var formatGML = new ol.format.GML({
        //featureNS: 'https://gsx.geolytix.net/geoserver/geolytix_wfs',// details.url,
        featureNS:  params.typenameNamespace || details.url,
        featureType: featureType,
        srsName:  params.srsname
    });
    var xs = new XMLSerializer();
    var formatWFS = new ol.format.WFS();
    var sourceWFS = new ol.source.Vector({
        format: formatWFS,
        loader: function (extent) {
            $.ajax(url, {
                type: 'GET',
                data: {
                    service: 'WFS',
                    version: '1.1.0',
                    request: 'GetFeature',
                    typename: params.typename,
                    srsname: params.srsname,
                    bbox: extent.join(',') + ',EPSG:3857'
                },
                success: function (data) {
                    if (data) {

                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    var a = 1;
                }
            }).done(function (response) {
               // sourceWFS.clear();
                sourceWFS.addFeatures(formatWFS.readFeatures(response));
            });
        },
        //strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ()),
        strategy: ol.loadingstrategy.bbox,
        projection:  params['srsname']
    });
    
    sourceWFS.set('formatGML', formatGML); 
    sourceWFS.set('details', details);
    return sourceWFS;
}
SourceFactory.prototype.createOsmVectorSource = function(dataObj,mapContainer) {
    if (!dataObj)
        return null;
    var view = mapContainer.map.getView();
    var details = dataObj.details;
    var options= dataObj.options || {};
    var epsg4326Extent_fixed=undefined;
    var shapeType= options.shapeType || 'Point';
    if(options.info){
        epsg4326Extent_fixed= options.info.epsg4326Extent;
    }
    var filterExpression='';
    if(options.info){
        filterExpression=options.info.filterExpression;
    }
    try {
        if (typeof details === 'string' || details instanceof String){
            details = JSON.parse(details);
        }
    } catch (ex) {}
  
    var formatOSMXML = new ol.format.OSMXML();

    var OSMvectorSource = new  ol.source.Vector({
        format: formatOSMXML,
        loader: function(extent, resolution, projection) {
          var epsg4326Extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
          if(!isFinite(extent[0])){
              epsg4326Extent= mapContainer.getCurrentGeoExtentArray();
          }
          epsg4326Extent= epsg4326Extent_fixed || epsg4326Extent;

          var doAddFeatures=function(features){
            if(features){
                var filteredFeatures=[];
                for(var i=0;i< features.length;i++){
                    var feature= features[i];
                    var geometry=feature.getGeometry();
                    if(geometry){
                        var type= geometry.getType();
                        if(type=='Point')
                            type='Point';
                        else if ( type=='LineString' || type=='MultiLineString' )
                            type= 'MultiLineString';
                        else if ( type=='Polygon' || type=='MultiPolygon' )
                            type= 'MultiPolygon';  
                        
                        if(shapeType==type){
                            filteredFeatures.push(feature); 
                        }
                    }
                }
                OSMvectorSource.addFeatures(filteredFeatures);
            }
          }
          OSMvectorSource.set('loading_status', 'started');
          var initFeatures= OSMvectorSource.get('initFeatures');
          if(initFeatures){
            doAddFeatures(initFeatures);
            OSMvectorSource.set('initFeatures',null);
            OSMvectorSource.set('loading_status', 'complete');
            return;
          }

          var client = new XMLHttpRequest();
          client.open('POST', app.overpassApiServer);
          client.addEventListener('load', function() {
            var features = formatOSMXML.readFeatures(client.responseText, {
              featureProjection: view.getProjection()
            });
            doAddFeatures(features);
            OSMvectorSource.set('loading_status', 'complete');
          });
        //   //var query = '(node["highway"](' +
        //   var query = '(node(' +
        //       epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
        //       epsg4326Extent[3] + ',' + epsg4326Extent[2] +
        //       ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';

        //       //'););out meta;';
        //       // out qt for more speed in loading
        //       // out 10 to limit results count
           
          var bbox='('+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
              epsg4326Extent[3] + ',' + epsg4326Extent[2]+')' ;
              var query = '(node'+ filterExpression+ bbox +';';
              query += 'way'+ filterExpression+ bbox +';';
              query += 'rel'+ filterExpression+ bbox +';';
              query+=');(._; >;);out meta;';

            // var bbox=''+epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            // epsg4326Extent[3] + ',' + epsg4326Extent[2]+'' ;
            //   var query = '[out:xml][bbox:'+ bbox+'];'
            //     query += '(node'+ filterExpression +';';
            //     query += 'way'+ filterExpression +';';
            //     query += 'rel'+ filterExpression +';';
            //     //query+=');out;>;out meta;';
            //     query+=');(._; >;);out meta;';

/*
[out:json];
(node(35.47887202571445,51.02779608257191,35.869326696984245,51.87442999370472);rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out count;
*/


          client.send(query);
        }
        //,
        //strategy: ol.loadingstrategy.bbox// will lead to "to many requests" error
      });

    
      OSMvectorSource.set('formatOSMXML', formatOSMXML); 
      OSMvectorSource.set('details', details);
      OSMvectorSource.set('loading_status', '');

    return OSMvectorSource;
}
SourceFactory.prototype.createGeoJsonVectorSource = function(dataObj,mapContainer) {
    if (!dataObj)
        return null;
    var view = mapContainer.map.getView();
    var mapProjection = view.getProjection();

    var details = dataObj.details;
    try {
      if (typeof details === 'string' || details instanceof String){
          details = JSON.parse(details);
      }
    } catch (ex) {}
    var spatialReferenceCode;
    var srid;
    if (details['spatialReference'] && (details['spatialReference'].name || details['spatialReference'].srid)) {
        srid=details['spatialReference'].srid;
        if(details['spatialReference'].name){
            spatialReferenceCode = details['spatialReference'].name;
            if(!srid && spatialReferenceCode && spatialReferenceCode.indexOf(':')){
                srid= spatialReferenceCode.split(':')[1];
            }
        }else{
            spatialReferenceCode='EPSG:'+srid;
        }
        
        if (details['spatialReference'].proj4 && !proj4.defs[spatialReferenceCode]) {
            proj4.defs(spatialReferenceCode, details['spatialReference'].proj4);
            ol.proj.proj4.register(proj4);
        }
    }
  
    var format = new ol.format.GeoJSON({
        dataProjection: spatialReferenceCode || 'EPSG:3857'
    });
    var url = '/datalayer/' + dataObj.id + '/geojson';
  
    var vectorSource = new ol.source.Vector({
       
        format: format,
        url: url,
        loader: function (extent,resolution,projection) {
            var bbox;//[minX, minY, maxX, maxY]
            var filter= details.filter;
            
           // var settings=encodeURIComponent(JSON.stringify({filter:filter}));
           var settings=encodeURIComponent(JSON.stringify({}));
            var loadUrl=url +'?settings='+settings;
            if(extent && extent.length>=4 && extent[2]!=Infinity){
                // when using strategy
                extent = ol.extent.applyTransform(extent, ol.proj.getTransform(projection,format.dataProjection));
                bbox=extent.join(',');
                loadUrl= url+'?bbox='+bbox +','+srid +'&settings='+settings;
            }
            vectorSource.set('loading_status', 'started');
            vectorSource.dispatchEvent({
                type: "loading_started"
            });
            $.ajax(loadUrl, {
                type: 'GET',
                dataType: 'json',
                xhr: function()
                {
                  var xhr = new window.XMLHttpRequest();
                  //Upload progress
                  xhr.upload.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                      var percentComplete = evt.loaded / evt.total;
                      //Do something with upload progress
                      //    console.log(percentComplete);
                    }
                  }, false);
                  //Download progress
                  xhr.addEventListener("progress", function(evt){
                    
                    if (evt.lengthComputable) {
                        var percentage = Math.round((evt.loaded / evt.total) * 100);
                        //console.log("percent " + percentage + '%');
                        vectorSource.set('loading_percent', percentage);
                        vectorSource.dispatchEvent({
                            type: "loading_progress",
                            percentage: percentage
                        });
                    }
                  }, false);
                  return xhr;
                },
                success: function (data) {
                    if (data) {
                        if(data.features){
                            var features= format.readFeatures(data, {
                                    featureProjection: projection
                                });
                                var dataProjection= format.readProjection(data);
                                vectorSource.addFeatures(features);
                        }
                        vectorSource.set('loading_details', '');
                        vectorSource.set('loading_status', 'complete');
                        
                        vectorSource.dispatchEvent({
                            type: "loading_complete"
                        });
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    vectorSource.set('loading_details', errorThrown|| textStatus);
                    vectorSource.set('loading_status', 'failed');
                    
                    vectorSource.dispatchEvent({
                        type: "loading_failed",
                        xhr: xhr,
                        statusText: textStatus
                    });
                }
            }).done(function (response) {
               
            });
        }
        //, strategy: ol.loadingstrategy.bbox
    });
    vectorSource.set('details', details);
    vectorSource.set('shapeType', details.shapeType);
    vectorSource.set('loading_status', '');
  
    vectorSource.on('change:loading_status', function(evt, v) {
        
        // alert(this.get('loading_status'));
    })
  
    vectorSource.on('loading_failed', function(evt) {
  
        var a = 1;
        // alert(this.get('loading_status'));
    })
    
    vectorSource.requestExtent=function(onReceive,onError){
        
        var url2= '/datalayer/' + dataObj.id + '/vectorextent';
        $.ajax(url2, {
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (data) {
                    try{
                        var features= format.readFeatures(data, {
                                featureProjection: mapProjection
                            });
                            var geom= features[0].get('geometry');
                            var extent= geom.getExtent();
                            if(onReceive){
                                onReceive(extent);
                            }
                        }catch(ex){

                        }
                }
            },
            error: function (xhr, textStatus, errorThrown) {
               if(onError){
                   onError(xhr, textStatus, errorThrown);
               }
            }
        }).done(function (response) {
           
        });
    };

    return vectorSource;
  }
SourceFactory.prototype.createGeoJsonVectorSource_native = function(dataObj) {
  if (!dataObj)
      return null;
  var details = dataObj.details;
  try {
    if (typeof details === 'string' || details instanceof String){
        details = JSON.parse(details);
    }
  } catch (ex) {}
  var spatialReferenceCode;
    var srid;
    if (details['spatialReference'] && (details['spatialReference'].name || details['spatialReference'].srid)) {
        srid=details['spatialReference'].srid;
        if(details['spatialReference'].name){
            spatialReferenceCode = details['spatialReference'].name;
            if(!srid && spatialReferenceCode && spatialReferenceCode.indexOf(':')){
                srid= spatialReferenceCode.split(':')[1];
            }
        }else{
            spatialReferenceCode='EPSG:'+srid;
        }
        
        if (details['spatialReference'].proj4 && !proj4.defs[spatialReferenceCode]) {
            proj4.defs(spatialReferenceCode, details['spatialReference'].proj4);
            ol.proj.proj4.register(proj4);
        }
    }

  function My_loadFeaturesXhr(url, format, success, failure) {
      return (
          /**
           * @param {import("./extent.js").Extent} extent Extent.
           * @param {number} resolution Resolution.
           * @param {import("./proj/Projection.js").default} projection Projection.
           * @this {VectorSource|import("./VectorTile.js").default}
           */
          function(extent, resolution, projection) {
              var xhr = new XMLHttpRequest();
              var me = this;
             
              this.set('loading_status', 'started');
              this.dispatchEvent({
                  type: "loading_started"
              });
              xhr.open('GET',
                  typeof url === 'function' ? url(extent, resolution, projection) : url,
                  true);
              if (format.getType() == 'arraybuffer') {
                  xhr.responseType = 'arraybuffer';
              }
              xhr.onprogress = function(event) {
                  if (event.lengthComputable) {
                      var percentage = Math.round((event.loaded / event.total) * 100);
                      //console.log("percent " + percentage + '%');
                      me.set('loading_percent', percentage);
                      me.dispatchEvent({
                          type: "loading_progress",
                          percentage: percentage
                      });
                  }
              }
              /**
               * @param {Event} event Event.
               * @private
               */
              xhr.onload = function(event) {
                  // status will be 0 for file:// urls
                 
                  if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
                      var type = format.getType();
                      /** @type {Document|Node|Object|string|undefined} */
                      var source;
                      if (type == 'json' || type == 'text') {
                          source = xhr.responseText;
                      } else if (type == 'xml') {
                          source = xhr.responseXML;
                          if (!source) {
                              source = new DOMParser().parseFromString(xhr.responseText, 'application/xml');
                          }
                      } else if (type == 'arraybuffer') {
                          source = /** @type {ArrayBuffer} */ (xhr.response);
                      }
                      if (source) {
                          success.call(this, format.readFeatures(source, {
                                  featureProjection: projection
                              }),
                              format.readProjection(source), format.getLastExtent());
                      } else {
                          failure.call(this, xhr, xhr.statusText);
                      }
                  } else {
                      failure.call(this, xhr, xhr.statusText);
                  }
              }.bind(this);
              /**
               * @private
               */
              xhr.onerror = function() {
                  failure.call(this);
              }.bind(this);
              xhr.send();
          }
      );
  }


  var myXhrLoader = function(url, format) {
      return My_loadFeaturesXhr(url, format,
          function(features, dataProjection) {
              if (this instanceof ol.source.Vector) {
                  this.addFeatures(features);
                  this.set('loading_details', '');
                  this.set('loading_status', 'complete');
                  
                  this.dispatchEvent({
                      type: "loading_complete"
                  });
              }
          },
          function(xhr, statusText,errorThrown) { // failure
              var a = 1;
              vectorSource.set('loading_details', errorThrown || textStatus);
              this.set('loading_status', 'failed');
              
              this.dispatchEvent({
                  type: "loading_failed",
                  xhr: xhr,
                  statusText: statusText
              });
          }
      );
  };

  var format = new ol.format.GeoJSON({
      dataProjection: spatialReferenceCode || 'EPSG:3857'
  });
  var url = '/datalayer/' + dataObj.id + '/geojson';

  var vectorSource = new ol.source.Vector({
     
      format: format,
      url: url,
      loader: myXhrLoader(url, format)
  });
  vectorSource.set('details', details);
  vectorSource.set('shapeType', details.shapeType);
  vectorSource.set('loading_status', '');

  vectorSource.on('change:loading_status', function(evt, v) {

      // alert(this.get('loading_status'));
  })

  vectorSource.on('loading_failed', function(evt) {

      var a = 1;
      // alert(this.get('loading_status'));
  })

  return vectorSource;
}


SourceFactory.prototype.createGeoImageSource_old = function(dataObj,mapContainer) {
    if (!dataObj)
        return null;
    var view = mapContainer.map.getView();
     var mapProjectionCode = view.getProjection().getCode();
     if(mapProjectionCode && mapProjectionCode.indexOf(':')){
        mapProjectionCode= mapProjectionCode.split(':')[1];
    }
    if(!mapProjectionCode)
    {
        mapProjectionCode=3857;
    }
    var details = dataObj.details;
    try {
      if (typeof details === 'string' || details instanceof String){
          details = JSON.parse(details);
      }
    } catch (ex) {}
    var spatialReferenceCode;
    var srid;
    if (details['spatialReference'] && (details['spatialReference'].name || details['spatialReference'].srid)) {
        srid=details['spatialReference'].srid;
        if(details['spatialReference'].name){
            spatialReferenceCode = details['spatialReference'].name;
            if(!srid && spatialReferenceCode && spatialReferenceCode.indexOf(':')){
                srid= spatialReferenceCode.split(':')[1];
            }
        }else{
            spatialReferenceCode='EPSG:'+srid;
        }
        
        if (details['spatialReference'].proj4 && !proj4.defs[spatialReferenceCode]) {
            proj4.defs(spatialReferenceCode, details['spatialReference'].proj4);
            ol.proj.proj4.register(proj4);
        }
    }
    var metadata_3857= details.metadata_3857;
    
    // var url = '/datalayer/' + dataObj.id + '/raster?srid='+mapProjectionCode;
    // if(details.display){
    //     url+='&display='+ encodeURIComponent(JSON.stringify(details.display));
    // }
  
    // var geoImageSource = new ol.source.GeoImage({
    //     url: url,
    //     imageCenter: [
    //             metadata_3857.upperleftx + (metadata_3857.scalex* (metadata_3857.width+2)/2.0) ,
    //             metadata_3857.upperlefty + (metadata_3857.scaley* (metadata_3857.height+2)/2.0)
    //         ],
    //     //	imageScale: [metadata_3857.scalex*16,metadata_3857.scaley*16], pyramidLevel=16
    //         imageScale: [metadata_3857.scalex,metadata_3857.scaley],
	// 		imageCrop: [0,0,metadata_3857.width,metadata_3857.height],
	// 		//imageRotate: Number($("#rotate").val()*Math.PI/180),
	// 		projection: 'EPSG:'+ mapProjectionCode

    //     //, strategy: ol.loadingstrategy.bbox
    // });
    // geoImageSource.getExtent=function(){
    //     var extent = 
    //     [metadata_3857.upperleftx ,
    //       metadata_3857.upperlefty+  (metadata_3857.scaley* metadata_3857.height) ,
    //       metadata_3857.upperleftx + (metadata_3857.scalex * metadata_3857.width),
    //       metadata_3857.upperlefty];

    //       return extent;
    // }
    // geoImageSource.set('details', details);
  
    var maxZoom=18;
    var minZoom=0;
  if(details.metadata_3857 && details.metadata_3857.scalex){
    maxZoom= view.getZoomForResolution(details.metadata_3857.scalex);
    maxZoom= Math.floor(maxZoom)-1-(0);
    minZoom= maxZoom-4;
    if(minZoom<0)
    {
        minZoom=0;
    }
  }
    var url = '/datalayer/' + dataObj.id + '/rastertile?size=256&x={x}&y={y}&z={z}&srid='+mapProjectionCode;
    url+='&ref_z='+(maxZoom -1-(0));
    var postParams=undefined;
    var method='GET';
    if(details.display){
        var display= JSON.parse(JSON.stringify(details.display));
        if(display && display.customColorMap){
            for(var i=0;i<display.customColorMap.length;i++){
                delete display.customColorMap[i].caption;
            }
        }
        //url+='&display='+ encodeURIComponent(JSON.stringify(display));
        method='POST';
        postParams='display='+ encodeURIComponent(JSON.stringify(display));
        if((url.length+ postParams.length)< 2000){
            method='GET';
            url += '&'+postParams;
        }
    }
   
    var geoImageSource = new ol.source.XYZ({
        url: url
        ,tileSize:[256,256]
        ,maxZoom:maxZoom
        ,minZoom:minZoom
        //,maxZoom:12//view.getZoomForResolution(0.5)
        //,minZoom:11
    });
    geoImageSource.getExtent=function(){
        var extent = 
        [metadata_3857.upperleftx ,
          metadata_3857.upperlefty+  (metadata_3857.scaley* metadata_3857.height) ,
          metadata_3857.upperleftx + (metadata_3857.scalex * metadata_3857.width),
          metadata_3857.upperlefty];

          return extent;
    }
    geoImageSource.set('details', details);

    return geoImageSource;
  }
  SourceFactory.prototype.createGeoImageSource = function(dataObj,mapContainer) {
    if (!dataObj)
        return null;
    var view = mapContainer.map.getView();
     var mapProjectionCode = view.getProjection().getCode();
     if(mapProjectionCode && mapProjectionCode.indexOf(':')){
        mapProjectionCode= mapProjectionCode.split(':')[1];
    }
    if(!mapProjectionCode)
    {
        mapProjectionCode=3857;
    }
    var details = dataObj.details;
    try {
      if (typeof details === 'string' || details instanceof String){
          details = JSON.parse(details);
      }
    } catch (ex) {}
    var spatialReferenceCode;
    var srid;
    if (details['spatialReference'] && (details['spatialReference'].name || details['spatialReference'].srid)) {
        srid=details['spatialReference'].srid;
        if(details['spatialReference'].name){
            spatialReferenceCode = details['spatialReference'].name;
            if(!srid && spatialReferenceCode && spatialReferenceCode.indexOf(':')){
                srid= spatialReferenceCode.split(':')[1];
            }
        }else{
            spatialReferenceCode='EPSG:'+srid;
        }
        
        if (details['spatialReference'].proj4 && !proj4.defs[spatialReferenceCode]) {
            proj4.defs(spatialReferenceCode, details['spatialReference'].proj4);
            ol.proj.proj4.register(proj4);
        }
    }
    var metadata_3857= details.metadata_3857;
    
    // var url = '/dataset/' + dataObj.id + '/raster?srid='+mapProjectionCode;
    // if(details.display){
    //     url+='&display='+ encodeURIComponent(JSON.stringify(details.display));
    // }
  
    // var geoImageSource = new ol.source.GeoImage({
    //     url: url,
    //     imageCenter: [
    //             metadata_3857.upperleftx + (metadata_3857.scalex* (metadata_3857.width+2)/2.0) ,
    //             metadata_3857.upperlefty + (metadata_3857.scaley* (metadata_3857.height+2)/2.0)
    //         ],
    //     //	imageScale: [metadata_3857.scalex*16,metadata_3857.scaley*16], pyramidLevel=16
    //         imageScale: [metadata_3857.scalex,metadata_3857.scaley],
	// 		imageCrop: [0,0,metadata_3857.width,metadata_3857.height],
	// 		//imageRotate: Number($("#rotate").val()*Math.PI/180),
	// 		projection: 'EPSG:'+ mapProjectionCode

    //     //, strategy: ol.loadingstrategy.bbox
    // });
    // geoImageSource.getExtent=function(){
    //     var extent = 
    //     [metadata_3857.upperleftx ,
    //       metadata_3857.upperlefty+  (metadata_3857.scaley* metadata_3857.height) ,
    //       metadata_3857.upperleftx + (metadata_3857.scalex * metadata_3857.width),
    //       metadata_3857.upperlefty];

    //       return extent;
    // }
    // geoImageSource.set('details', details);
  
    var maxZoom=18;
    var minZoom=0;
  if(details.metadata_3857 && details.metadata_3857.scalex){
    maxZoom= view.getZoomForResolution(details.metadata_3857.scalex);
    maxZoom= Math.floor(maxZoom)-1-(0);
    minZoom= maxZoom-4;
    if(minZoom<0)
    {
        minZoom=0;
    }
  }
    var url = '/datalayer/' + dataObj.id + '/rastertile?size=256&x={x}&y={y}&z={z}&srid='+mapProjectionCode;
    url+='&ref_z='+(maxZoom -1-(0));
    var postParams=undefined;
    var method='GET';
    if(details.display){
        var display= JSON.parse(JSON.stringify(details.display));
        if(display && display.customColorMap){
            for(var i=0;i<display.customColorMap.length;i++){
                delete display.customColorMap[i].caption;
            }
        }
        //url+='&display='+ encodeURIComponent(JSON.stringify(display));
        method='POST';
        postParams='display='+ encodeURIComponent(JSON.stringify(display));
        if((url.length+ postParams.length)< 2000){
            method='GET';
            url += '&'+postParams;
        }
    }
   
    var geoImageSource = new ol.source.XYZ({
        url: url
        ,tileSize:[256,256]
        ,maxZoom:maxZoom
        ,minZoom:minZoom
        //,maxZoom:12//view.getZoomForResolution(0.5)
        //,minZoom:11
    });
    geoImageSource.setTileLoadFunction(function(tile, src) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        geoImageSource.set('loading_details', '');
        geoImageSource.set('loading_status', 'started');
        xhr.addEventListener('loadend', function (evt) {
          var data = this.response;
          var xx= xhr;
          if(data && data.type=='text/plain'){
            
            geoImageSource.set('loading_details', xhr.statusText|| 'Failed');
            geoImageSource.set('loading_status', 'failed');
            tile.setState(3);
          }else{
            if (data ) {
                tile.getImage().src = URL.createObjectURL(data);
                geoImageSource.set('loading_details', '');
                geoImageSource.set('loading_status', 'complete');
            } else {
                //tile.setState(TileState.ERROR);
                tile.setState(3);
            }
            }
        });
        xhr.addEventListener('error', function () {
          //tile.setState(TileState.ERROR);
          tile.setState(3);
        });
        if(method=='POST'){
          
            xhr.open(method, src);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.send(postParams);
        }else{
            xhr.open(method, src);
            xhr.send();
        }
      });
    geoImageSource.getExtent=function(){
        var extent = 
        [metadata_3857.upperleftx ,
          metadata_3857.upperlefty+  (metadata_3857.scaley* metadata_3857.height) ,
          metadata_3857.upperleftx + (metadata_3857.scalex * metadata_3857.width),
          metadata_3857.upperlefty];

          return extent;
   }
   geoImageSource.set('details', details);

    return geoImageSource;
  }

SourceFactory.prototype.createGtmSource = function(dataObj,mapContainer) {
  
    if (!dataObj)
    return null;
var view = mapContainer.map.getView();
var mapProjection = view.getProjection();

var details = dataObj.details;
try {
  if (typeof details === 'string' || details instanceof String){
      details = JSON.parse(details);
  }
} catch (ex) {}
details.shapeType='MultiPolygon';
details.srid=4326;
var spatialReferenceCode='EPSG:4326';
if(!details.fields){
    details.fields=[];
    details.fields.push({
        name:'task_id',alias:'Task_id',
        type:'bigint',
        hidden:true
    });
    details.fields.push({
        name:'task_name',alias:'Task name',
        type:'varchar'
    });
    details.fields.push({
        name:'topic',alias:'Topic',
        type:'varchar'
    });
    details.fields.push({
        name:'topic_words',alias:'Topic words',
        type:'varchar'
    });
    details.fields.push({
        name:'date_time_min',alias:'date_time_min',
        type:'timestamp with time zone'
    }); 
    details.fields.push({
        name:'date_time_max',alias:'date_time_max',
        type:'timestamp with time zone'
    });
}

var format = new ol.format.GeoJSON({
    dataProjection: spatialReferenceCode 
});
var url = '/gtm/geojson';

var vectorSource = new ol.source.Vector({
   
    format: format,
    url: url,
    loader: function (extent,resolution,projection) {
        var bbox;//[minX, minY, maxX, maxY]
        var filter= details.filter;
        var version= details.version || '1.0'
        var task_id= details.task_id || -1;
       // var settings=encodeURIComponent(JSON.stringify({filter:filter}));
       var settings=encodeURIComponent(JSON.stringify({
           filter:filter,
           version: version
       }));
        var loadUrl=url +'?task_id='+task_id+'&version='+version+'&settings='+settings;
        if(extent && extent.length>=4 && extent[2]!=Infinity){
            // when using strategy
            extent = ol.extent.applyTransform(extent, ol.proj.getTransform(projection,format.dataProjection));
            bbox=extent.join(',');
            loadUrl= urloadUrl+'&bbox='+bbox
        }
        vectorSource.set('loading_status', 'started');
        vectorSource.dispatchEvent({
            type: "loading_started"
        });
        try{
            if (vectorSource._lastXhr && vectorSource._lastXhr.readyState != 4) {
                vectorSource._lastXhr.abort();
            }
        }catch(ex){}
        vectorSource._lastXhr=$.ajax(loadUrl, {
            type: 'GET',
            dataType: 'json',
            xhr: function()
            {
              var xhr = new window.XMLHttpRequest();
              //Upload progress
              xhr.upload.addEventListener("progress", function(evt){
                if (evt.lengthComputable) {
                  var percentComplete = evt.loaded / evt.total;
                  //Do something with upload progress
                  //    console.log(percentComplete);
                }
              }, false);
              //Download progress
              xhr.addEventListener("progress", function(evt){
                
                if (evt.lengthComputable) {
                    var percentage = Math.round((evt.loaded / evt.total) * 100);
                    //console.log("percent " + percentage + '%');
                    vectorSource.set('loading_percent', percentage);
                    vectorSource.dispatchEvent({
                        type: "loading_progress",
                        percentage: percentage
                    });
                }
              }, false);
              return xhr;
            },
            success: function (data) {
                if (data) {
                    if(data.features){
                        var features= format.readFeatures(data, {
                                featureProjection: projection
                            });
                            var dataProjection= format.readProjection(data);
                            vectorSource.addFeatures(features);
                    }
                    vectorSource.set('loading_details', '');
                    vectorSource.set('loading_status', 'complete');
                    
                    vectorSource.dispatchEvent({
                        type: "loading_complete"
                    });
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                if(textStatus !=='abort'){
                    vectorSource.set('loading_details', errorThrown|| textStatus);
                    vectorSource.set('loading_status', 'failed');
                    
                    vectorSource.dispatchEvent({
                        type: "loading_failed",
                        xhr: xhr,
                        statusText: textStatus
                    });
                }else{
                    vectorSource.set('loading_details', errorThrown|| textStatus);
                    vectorSource.set('loading_status', 'aborted');
                    
                    vectorSource.dispatchEvent({
                        type: "loading_aborted",
                        xhr: xhr,
                        statusText: textStatus
                    });
                }
            }
        }).done(function (response) {
           
        });
    }
    //, strategy: ol.loadingstrategy.bbox
});
vectorSource.set('details', details);
vectorSource.set('shapeType', details.shapeType);
vectorSource.set('loading_status', '');

vectorSource.on('change:loading_status', function(evt, v) {
    
    // alert(this.get('loading_status'));
})

vectorSource.on('loading_failed', function(evt) {

    var a = 1;
    // alert(this.get('loading_status'));
})

// vectorSource.requestExtent=function(onReceive,onError){
    
//     var url2= '/datalayer/' + dataObj.id + '/vectorextent';
//     $.ajax(url2, {
//         type: 'GET',
//         dataType: 'json',
//         success: function (data) {
//             if (data) {
//                 try{
//                     var features= format.readFeatures(data, {
//                             featureProjection: mapProjection
//                         });
//                         var geom= features[0].get('geometry');
//                         var extent= geom.getExtent();
//                         if(onReceive){
//                             onReceive(extent);
//                         }
//                     }catch(ex){

//                     }
//             }
//         },
//         error: function (xhr, textStatus, errorThrown) {
//            if(onError){
//                onError(xhr, textStatus, errorThrown);
//            }
//         }
//     }).done(function (response) {
       
//     });
// };

return vectorSource;
}