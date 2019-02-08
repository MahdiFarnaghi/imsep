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
    this.layer = undefined;
    this.sourc = undefined;
    
    this.measureTooltipElement = undefined;
    this.measureTooltip = undefined;
    this.overlays = [];
    this.zoomToLocation=false;
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
      positionFeature.setStyle(new ol.style.Style({
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

      geolocation.on('change:position', function() {
        var coordinates = geolocation.getPosition();
        positionFeature.setGeometry(coordinates ?
          new ol.geom.Point(coordinates) : null);
      });
    self.source = new ol.source.Vector({features: [accuracyFeature, positionFeature]});
    self.layer = new ol.layer.Vector({
        source: self.source,
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
        title: 'Keep center',
        onToggle: function (toggle) {
            //console.log(toggle);
           
            if (!toggle) {
                self.zoomToLocation=false;
                return;
            }
            self.zoomToLocation=true;
        }
        ,
        // autoActivate: true,
         active: self.zoomToLocation
    });
    this.keepCenterCmd = keepCenterCmd;
    this._subBar.addControl(keepCenterCmd);
    map.addControl(this._toolbar)
  

    this.taskCtrl = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measureIcon" >&nbsp;</span>',
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_24_Icon" >&nbsp;</span>',
        html: '<i class=" glyphicon glyphicon-record"></i>',
        className:'myOlbutton24',
        title: "measure",
        onToggle:function(toggle){
            if(!toggle){
                self.deActivate();

                return;
            }
            self.layer.setVisible(true);
            self.geolocation.setTracking(toggle);
            //self.measureLength.setActive(true);
            //activateInteraction('LineString');
        }
        //,
       // bar: this._subBar
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
    this.map.getLayers().remove(this.layer);
    this.map.getLayers().push(this.layer);
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


GeolocationTasks.prototype.createMeasureTooltip = function () {
    if (this.measureTooltipElement) {
        this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'tooltip tooltip-measure';
    this.measureTooltip = new ol.Overlay({
        element: this.measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    this.overlays.push(this.measureTooltip);
    this.map.addOverlay(this.measureTooltip);
    this.measureTooltip.getElement().parentNode.style.zIndex = this.map.getOverlays().getLength();
}