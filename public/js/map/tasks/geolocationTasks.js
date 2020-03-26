function GeolocationTasks(app, mapContainer, options) {
    this.app = app;
    this.mapContainer = mapContainer;
    this.map = mapContainer.map;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
    this._subBar = null;
    this.interaction = undefined;
    this.interactionSnap = undefined;
    this.layer = undefined;
    this.sourc = undefined;
    
    this.measureTooltipElement = undefined;
    this.measureTooltip = undefined;
    this.overlays = [];
    this.keepCenter=false;
    this.zoomToLocation=false;
    this._tracking=false;
    //app.controller.geolocationTasks=this;
    app.geolocationTasks=this;
}
GeolocationTasks.prototype._init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var mapContainer = this.mapContainer;
    
    var map = this.map;
    var view = map.getView();
    var geolocation =self.geolocation= new ol.Geolocation({
        // enableHighAccuracy must be set to true to have the heading value.
        trackingOptions: {
          enableHighAccuracy: true
        },
        projection: view.getProjection()
      });
       // handle geolocation error.
       geolocation.on('error', function(error) {
       // var info = document.getElementById('info');
       // info.innerHTML = error.message;
        //info.style.display = '';
        $.notify({
            message: "Geolocation Error:"+ error.message
        },{
            type:'danger',
            delay:2000,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });
      });

      var accuracyFeature = new ol.Feature();
      geolocation.on('change:accuracyGeometry', function() {
        accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
      });
     
      var positionFeature = new ol.Feature();
      var gpsMarker=new ol.style.Icon({
        anchor: [0.5, 0.56],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '/css/images/gps_33_5.png',
        opacity:0.7
      });
      var set_gpsMarkerRotation= function(){
          if(typeof navigator!=='undefined'){
              if(navigator.compass){
                    navigator.compass.getCurrentHeading(function(compass_heading){
                        //console.log('r:'+self.map.getView().getRotation());
                        if(compass_heading &&!isNaN(compass_heading.trueHeading)){
                            var symbolRotation=compass_heading.trueHeading * Math.PI/180 + self.map.getView().getRotation();
                            gpsMarker.setRotation(symbolRotation)  ;
                        // self.map.getView().setRotation(symbolRotation);
                        
                        }
                    });
            }
        }
      }
      positionFeature.setStyle(new ol.style.Style({
       // image: gpsMarker

        image: new ol.style.Circle({
          radius: 6,
          fill: new  ol.style.Fill({
            color: '#3399CC'
          }),
          stroke: new  ol.style.Stroke({
            color: '#fff',
            width: 2
          })
        })
      }));

      view.on('change:rotation', function() {
        //console.log("fired");
        set_gpsMarkerRotation();
      });
      geolocation.on('change:position', function() {
        var coordinates = geolocation.getPosition();
        var heading=geolocation.getHeading()* 180/Math.PI;
       // console.log('heading:'+ heading);
       if(typeof navigator!=='undefined'){
            //navigator.geolocation.getCurrentPosition(function(position){
            //    console.log(position.coords.heading);
           // });
        }
        var accuracy= geolocation.get('accuracy');
        if(self.zoomToLocation && !isNaN(accuracy) && accuracy < 100){
            self.zoomToLocation=false;
            var zoom = map.getView().getZoom();
            if(zoom<18){
                zoom=18;
            }
            self.map.getView().animate({ zoom:zoom, center:coordinates });
        }
        if(self.keepCenter){
            // navigator.compass.getCurrentHeading(function(compass_heading){
            //     //console.log('r:'+self.map.getView().getRotation());
            //     if(compass_heading &&!isNaN(compass_heading.trueHeading)){
            //         var headingRotation=compass_heading.trueHeading * Math.PI/180;// + self.map.getView().getRotation();
            //         self.map.getView().setRotation(-headingRotation);
                   
            //       }
            // });
          
            var mapExtent = self.map.getView().calculateExtent(self.map.getSize());
            var dx= (mapExtent[2]- mapExtent[0])/20.0;
            var dy= (mapExtent[3]- mapExtent[1])/20.0;
            //var accuracy= geolocation.get('accuracy');
            if(!isNaN(accuracy)){
                if(accuracy < (mapExtent[2]- mapExtent[0])/4
                 && accuracy< (mapExtent[3]- mapExtent[1])/4
                ){
                    if(accuracy> dx)
                    {
                        dx= accuracy;
                    }
                    if(accuracy> dy)
                    {
                        dy= accuracy;
                    }
                }
            }
            if(coordinates[0] < (mapExtent[0]+dx) || 
                coordinates[0] > (mapExtent[2]-dx) ||
                coordinates[1] < (mapExtent[1]+dy) ||
                coordinates[1] > (mapExtent[3]-dy) 
                )
            {
                
                    self.map.getView().animate({      center:coordinates        });

            }
        }
        positionFeature.setGeometry(coordinates ?
          new ol.geom.Point(coordinates) : null);
        //   if(!isNaN(heading)){
        //     gpsMarker.setRotation(heading)  ;
        //   }
        //self.interactionSnap.addFeature(positionFeature);
        if(self._tracking){
            self.interactionSnap.setActive(true);
            app.dispatchEvent('change:position',{
                coordinates:coordinates
            })
        }
        set_gpsMarkerRotation();
      });
    self.source = new ol.source.Vector({features: [accuracyFeature, positionFeature]});
    self.layer = new ol.layer.Vector({
        source: self.source,

        updateWhileAnimating:true,
        updateWhileInteracting:true,

        custom: {
            type: 'geolocation',
            keepOnTop:true,
            skipSaving:true,
            hiddenInToc: true
        },
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });
    self.interactionSnap = new ol.interaction.Snap({
        edge:false,
        source: self.layer.getSource(),
       // features:[positionFeature]
    });
    self.interactionSnap.setActive(false);
    self.interactionSnap.removeFeature(accuracyFeature);
    app.registerSnapInteraction(self.interactionSnap);
    app.registerEventhandler('map-loaded',function(){
        self.moveLayerToTop();  
    })
//    self.interactionSnap.addFeature(positionFeature);
   // map.addInteraction(self.interactionSnap);
    // move layer to top of map
    map.getLayers().on('add', function (e) {
        if (e.element !== self.layer && e.element.get('custom')) {
            if(!e.element.get('custom').keepOnTop){  
                  if (self._activated) {
                      self.moveLayerToTop();
                  }
              }
          }

    })

    this._toolbar = new ol.control.Bar();
    this._subBar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });

    this.mapContainer.topToolbar.addControl(this._toolbar);

    var keepCenterCmd = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_lengthIcon" >&nbsp;</span>',
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_length_24_Icon" >&nbsp;</span>',
        html: '<i class=" glyphicon glyphicon-lock"></i>',
        className:'myOlbutton24',
        title: 'Keep me in map view',
        _statusTip:'<i  class="status_tip_glyph glyphicon glyphicon-lock"></i> Keep me in map view',
        onToggle: function (toggle) {
            //console.log(toggle);
           if(toggle){
            mapContainer.showTopStatus(this._statusTip,3000);
           }else{
            mapContainer.showTopStatus('');
           }
            if (!toggle) {
                self.keepCenter=false;
                return;
            }
            self.keepCenter=true;
        }
        ,
        // autoActivate: true,
         active: self.keepCenter
    });
    this.keepCenterCmd = keepCenterCmd;
    this._subBar.addControl(keepCenterCmd);
    map.addControl(this._toolbar)
  

    this.taskCtrl = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measureIcon" >&nbsp;</span>',
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_24_Icon" >&nbsp;</span>',
        html: '<i class=" glyphicon glyphicon-record"></i>',
        className:'myOlbutton24',
        title: "My location",
        _statusTip:'<i  class="status_tip_glyph glyphicon glyphicon-record"></i> My location',
        onToggle:function(toggle){
            if(toggle){
                var controls= this.getSubBar().getControls();
                var control_index= 0;
                var control_n= controls.length;
                var showControlStatus= function(){
                    if(control_index>=0 && control_index<control_n){
                        var control=controls[control_index];
                        var _statusTip=control._statusTip || control.get('title') || '  ';
                        var delay=3000;
                        if(_statusTip=='  '){
                            delay=100;
                        }
                        if(_statusTip){
                            mapContainer.showTopStatus(_statusTip,delay,control.element,function(){
                                control_index++;
                                showControlStatus();
                            });
                        }
                    }
                }
                mapContainer.showTopStatus(this._statusTip,3000,undefined,function(){
                       showControlStatus();
                });
                
            }else{
                mapContainer.showTopStatus('');
            }
            if(!toggle){
                self.zoomToLocation=false;
                self.deActivate();
                
                self.geolocation.setTracking(false);
                self._tracking=false;
                self.interactionSnap.setActive(false);
                return;
            }
            self.interactionSnap.setActive(true);
            self.layer.setVisible(true);
            self.geolocation.setTracking(toggle);
            self._tracking=toggle;
            if(toggle){
                self.zoomToLocation=true;
                // self.map.getView().animate({
                //     center:self.geolocation.getPosition()
                // });
            }
            // if(cordova.plugins && cordova.plugins.diagnostic){
            //     cordova.plugins.diagnostic.isGpsLocationEnabled(function(enabled){
            //         if(!enabled){
            //             cordova.plugins.diagnostic.switchToLocationSettings();
            //         }
            //     }, function(error){
            //         cordova.plugins.diagnostic.switchToLocationSettings();

            //     });    
            // }
           
        }
        , bar: this._subBar
    });

    this._toolbar.addControl(this.taskCtrl);

    
}
GeolocationTasks.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this._init();
    }
    this.clear();
    if (this.layer && this.layer.getSource) {
        //this.layer.getSource().clear();
        this.layer.setVisible(true);
    }
    //  this.map.addControl(this._toolbar);
}
GeolocationTasks.prototype.OnDeActivated = function () {
    if (!this._activated)
        return;
    var map = this.map;

    this.deActivate();
    this._activated = false;
}
GeolocationTasks.prototype.clear = function () {
    if (this.layer && this.layer.getSource) {
        //this.layer.getSource().clear();
        this.layer.setVisible(false);
    }
    for (var i = 0; i < this.overlays.length; i++) {
        this.map.removeOverlay(this.overlays[i]);
    }
    this.measureTooltip = null;
    this.overlays = [];
}
GeolocationTasks.prototype.deActivate = function () {

    var map = this.map;
   this.geolocation.setTracking(false);
    if (this.measureTooltip) {
        this.map.removeOverlay(this.measureTooltip);
    }
    if (this.layer && this.layer.getSource) {
        //this.layer.getSource().clear();
        this.layer.setVisible(false);
    }
    if (!this._activated)
        return;
    this._activated = false;
}
GeolocationTasks.prototype.moveLayerToTop = function () {
   // this.map.removeInteraction(this.interactionSnap);
    this.map.getLayers().remove(this.layer);
    this.map.getLayers().push(this.layer);
   // this.map.addInteraction(this.interactionSnap);
}

GeolocationTasks.prototype.formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};



GeolocationTasks.prototype.isTracking=function(){
    return this._tracking;
}

GeolocationTasks.prototype.isTracking=function(){
    return this._tracking;
}
GeolocationTasks.prototype.getPosition=function(){
    var coordinates = this.geolocation.getPosition();  
   // var view = this.map.getView();
//var mapProjectionCode = view.getProjection().getCode();
  //  var transform= ol.proj.getTransform("EPSG:4326",mapProjectionCode);
  //  transform(coordinates,coordinates);
    return coordinates;

}
