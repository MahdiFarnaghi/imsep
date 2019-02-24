function MeasureTasks(app, mapContainer, options) {
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
    this.helpTooltipElement = undefined;
    this.helpTooltip = undefined;
    this.measureTooltipElement = undefined;
    this.measureTooltip = undefined;
    this.sketch = undefined;
    this.overlays = [];
    this.routeStopPoints=[];
    this.task=null;
}
MeasureTasks.prototype._init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var mapContainer = this.mapContainer;
    var map = this.map;
    self.source = new ol.source.Vector();
    self.layer = new ol.layer.Vector({
        source: self.source,
        custom: {
            type: 'measure',
            keepOnTop:true,
            skipSaving:true,
            hiddenInToc: true
        },
        style:function(feature,resolution){ 
          if(feature.get('isRoute')){
            return  new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(237,50,72,0.85)',
                    width: 5
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ff0000'
                    })
                })
            });
          }else{
            return  new ol.style.Style({
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
                });
            }
        }
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

    self.interaction = undefined;

    function addInteraction(type,task) {
        self.task=task;
        //var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
        self.interaction = new ol.interaction.Draw({
            source: self.source,
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        map.addInteraction(self.interaction);



        self.createMeasureTooltip();
        self.createHelpTooltip();
        self.removeMapEvents();
        self.setMapEvents();

        var listener;
        self.interaction.on('drawstart',
            function (evt) {
                // set sketch
                self.sketch = evt.feature;

                /** @type {module:ol/coordinate~Coordinate|undefined} */
                var tooltipCoord = evt.coordinate;

                listener = self.sketch.getGeometry().on('change', function (evt) {
                    var geom = evt.target;
                    var output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = self.formatArea(geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();
                    } else if (geom instanceof ol.geom.LineString) {
                        output = self.formatLength(geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    if (!self.measureTooltip) {
                        self.createMeasureTooltip();
                    }
                    self.measureTooltipElement.innerHTML = output;
                    self.measureTooltip.setPosition(tooltipCoord);
                });
            }, this);

        self.interaction.on('drawend',
            function (evt) {
                if(self.task=='route'){
                    if(evt.feature){
                        var geom= evt.feature.getGeometry();
                        var coords = ol.proj.toLonLat(geom.getCoordinates());
                        self.routeStopPoints.push(coords);
                        if(self.routeStopPoints.length>=2){
                            self.findRoute();
                        }
                    }
                }else{
                    self.measureTooltipElement.className = 'tooltip tooltip-static';
                    self.measureTooltip.setOffset([0, -7]);
                    // unset sketch
                    self.sketch = null;
                    // unset tooltip so that a new one can be created
                    self.measureTooltipElement = null;
                    self.createMeasureTooltip();
                    ol.Observable.unByKey(listener);

                    self.moveLayerToTop();
                }
            }, this);
    }
    var activateInteraction = function (type,task) {
        self.routeStopPoints=[];
        map.removeInteraction(self.interaction);
        addInteraction(type,task);
        self.mapContainer.setCurrentEditAction('draw');
    }

    this._toolbar = new ol.control.Bar();
    this._subBar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });

    this.mapContainer.topToolbar.addControl(this._toolbar);

    var measureLength = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_lengthIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_length_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Measure Length',
        onToggle: function (toggle) {
            //console.log(toggle);
            map.removeInteraction(self.interaction);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.removeMapEvents();
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }
            mapContainer.setCurrentTool({
                isMeasureTool: true,
                name: 'measure_LineString',
                onActivate: function (event) {
                    if (event.prevTool) {

                    }
                    measureLength.setActive(true);
                    // map.addInteraction(self.interaction);
                },
                onDeactivate: function (event) {
                    if (event.newTool) {
                        if (!event.newTool.isMeasureTool) {
                            self.deActivate();
                        }
                    } else {
                        self.deActivate();
                    }
                    measureLength.setActive(false);

                }
            });
            activateInteraction('LineString','length');
        }
        //,
        // autoActivate: true,
        // active: true
    });
    this.measureLength = measureLength;
    this._subBar.addControl(measureLength);
    map.addControl(this._toolbar)
    var measureArea = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_areaIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_area_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Measure Area',
        onToggle: function (toggle) {
            //console.log(toggle);
            map.removeInteraction(self.interaction);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.removeMapEvents();
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }
            mapContainer.setCurrentTool({
                isMeasureTool: true,
                name: 'measure_Polygon',
                onActivate: function (event) {
                    if (event.prevTool) {

                    }
                    measureArea.setActive(true);
                    //  map.addInteraction(self.interaction);
                },
                onDeactivate: function (event) {
                    if (event.newTool) {
                        if (!event.newTool.isMeasureTool) {
                            self.deActivate();
                        }
                    } else {
                        self.deActivate();
                    }
                    measureArea.setActive(false);

                }
            });
            activateInteraction('Polygon','area');
        }

    });
    this.measureArea = measureArea;
    this._subBar.addControl(measureArea);

    var measureRoute = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_lengthIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center;" class="" ><i class="fa fa-route"></i></span>',
        className:'myOlbutton24',
        title: 'Find Route',
        onToggle: function (toggle) {
            //console.log(toggle);
            map.removeInteraction(self.interaction);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.removeMapEvents();
                self.mapContainer.setCurrentEditAction(undefined);
                return;
            }
            mapContainer.setCurrentTool({
                isMeasureTool: true,
                name: 'measure_Route',
                onActivate: function (event) {
                    if (event.prevTool) {

                    }
                    measureRoute.setActive(true);
                    // map.addInteraction(self.interaction);
                },
                onDeactivate: function (event) {
                    if (event.newTool) {
                        if (!event.newTool.isMeasureTool) {
                            self.deActivate();
                        }
                    } else {
                        self.deActivate();
                    }
                    measureRoute.setActive(false);

                }
            });
            activateInteraction('Point','route');
        }
        //,
        // autoActivate: true,
        // active: true
    });
    this.measureRoute = measureRoute;
    this._subBar.addControl(measureRoute);


    var clearCmd = new ol.control.Button({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="deleteIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="delete_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Clear',
        handleClick: function () {
            self.clear();
        }
    });

    this._subBar.addControl(clearCmd);

    this.measureCtrl = new ol.control.Toggle({
        //html: '<span style="display:block;line-height:28px;background-position:center center" class="measureIcon" >&nbsp;</span>',
        html: '<span style="display:block;line-height:28px;background-position:center center" class="measure_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: "measure",
        // onToggle:function(toggle){
        //     if(!toggle){
        //         self.deActivate();
        //         return;
        //     }
        //     //self.measureLength.setActive(true);
        //     //activateInteraction('LineString');
        // },
        bar: this._subBar
    });

    this._toolbar.addControl(this.measureCtrl);
}
MeasureTasks.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this._init();
    }
    this.clear();
    //  this.map.addControl(this._toolbar);
}
MeasureTasks.prototype.OnDeActivated = function () {
    if (!this._activated)
        return;
    var map = this.map;

    this.deActivate();
    this._activated = false;
}
MeasureTasks.prototype.clear = function () {
    if (this.layer && this.layer.getSource) {
        this.layer.getSource().clear();
    }
    for (var i = 0; i < this.overlays.length; i++) {
        this.map.removeOverlay(this.overlays[i]);
    }
    this.measureTooltip = null;
    this.overlays = [];
    this.routeStopPoints=[];
}
MeasureTasks.prototype.deActivate = function () {

    var map = this.map;
    if (this.interaction)
        map.removeInteraction(this.interaction);
    this.removeMapEvents();
    if (this.helpTooltip) {
        this.map.removeOverlay(this.helpTooltip);
    }
    if (this.measureTooltip) {
        this.map.removeOverlay(this.measureTooltip);
    }
    if (!this._activated)
        return;
    this._activated = false;

    this.measureArea.setActive(false);
    this.measureLength.setActive(false);
    this.interaction = null;
    this.mapContainer.setCurrentEditAction(undefined);

    // this.map.removeControl(this._toolbar);
    this._activated = false;
}
MeasureTasks.prototype.moveLayerToTop = function () {
    this.map.getLayers().remove(this.layer);
    this.map.getLayers().push(this.layer);
}
MeasureTasks.prototype.findRoute = function () {
    var self=this;
    if(this.routeStopPoints.length<2)
    {
        return;
    }
    var coordinateList=[];
    for(var i=0;i<this.routeStopPoints.length;i++){
        coordinateList.push(
            this.routeStopPoints[i].join(',')
        );
    }
    var coordinates= coordinateList.join('|');
    
    var api_key = app.routeServiceTokens[Math.floor(Math.random()*app.routeServiceTokens.length)];
    var url='https://api.openrouteservice.org/directions?api_key='+api_key ;
    url+= '&coordinates='+encodeURIComponent(coordinates);
    url+= '&profile=driving-car&format=geojson';

    
            $.ajax(url, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        var geojson=data;
                        var featureProjection='EPSG:3857';
                        var format = new ol.format.GeoJSON({ featureProjection:featureProjection,  dataProjection:'EPSG:4326'        });
                        var features;
                        try{
                         features= format.readFeatures(geojson);
                        }catch(ex){
                            try{
                             var geojsonObj=JSON.parse(geojson);
                             features= format.readFeatures(geojsonObj);
                            }catch(ex2){
             
                            }
                        }
                        if(features){
                            for(var j=0;j<features.length;j++){
                                features[j].set('isRoute',true) ;
                                self.createRouteTooltip(features[j]);
                            }
                            self.source.addFeatures(features);
                        }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    var msg= errorThrown || textStatus;
                    if(xhr.responseJSON){
                        if(xhr.responseJSON.error && xhr.responseJSON.error.message){
                            msg= xhr.responseJSON.error.message;
                        }
                    }
                    var a = 1;
                    $.notify({
                        message: "Failed to find route, "+ msg
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
               
                  // source.refresh();
                }
            }).done(function() {
               
               // source.refresh();
            });
}
MeasureTasks.prototype.createRouteTooltip = function (feature) {
    if(!feature){
        return;
    }
    var geom= feature.getGeometry();
    if(!geom)
        return;
    var element = document.createElement('div');
    element.className = 'tooltip tooltip-measure';
    var routeTooltip = new ol.Overlay({
        element: element,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    this.overlays.push(routeTooltip);
    this.map.addOverlay(routeTooltip);
    routeTooltip.getElement().parentNode.style.zIndex = this.map.getOverlays().getLength();
     var html='';
     var summary= feature.get('summary');
     if(summary && summary.length){
        var result= summary[summary.length-1];
        var distanceStr='';
        if (result.distance > 1000) {
            distanceStr = (Math.round(result.distance / 1000 * 100) / 100) +
                ' ' + 'km';
        } else {
            distanceStr = (Math.round(result.distance * 100) / 100) +
                ' ' + 'm';
        }
        html+='Disatace:'+ distanceStr;
        try{
            var d = Number(result.duration);
            var h = Math.floor(d / 3600);
            var m = Math.floor(d % 3600 / 60);
            var s = Math.floor(d % 3600 % 60);

            var hDisplay = h > 0 ? h + (h == 1 ? " h" : " h") : "";
            var mDisplay = m > 0 ? m + (m == 1 ? " m" : " m") : "";
            var sDisplay = s > 0 ? s + (s == 1 ? " s" : " s") : "";
            var  durationStr='';
            if(h>0){
                  durationStr= hDisplay +','+ mDisplay;
            }else{
                durationStr=  mDisplay+',' + sDisplay; 
            }
            html+='<br/>Duration:'+ durationStr;
        }catch(ex){}
     }
    //formatLength
    element.innerHTML=html;
    var coords=geom.getCoordinates();
    if(coords && coords.length){
        routeTooltip.setPosition(coords[coords.length-1]);
    }

}
MeasureTasks.prototype.pointerMoveHandler = function (evt) {
    if (evt.dragging) {
        return;
    }
    if (!this.helpTooltip)
        return;
    var helpMsg = 'Click to start drawing';
    if(this.task==='route'){
        if(this.routeStopPoints.length==0){
            helpMsg = 'Origin';

        }else{
            helpMsg = 'Destination';
        }
    }else{
        if (this.sketch) {
            var geom = (this.sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                helpMsg = 'Click to continue drawing the polygon';
            } else if (geom instanceof ol.geom.LineString) {
                helpMsg = 'Click to continue drawing the line';
            }
        }
    }
    this.helpTooltipElement.innerHTML = helpMsg;
    this.helpTooltip.setPosition(evt.coordinate);
    this.helpTooltipElement.classList.remove('hidden');
};
MeasureTasks.prototype.mouseoutHandler = function () {
    if (this.helpTooltipElement) {
        this.helpTooltipElement.classList.add('hidden');
    }
}

MeasureTasks.prototype.formatLength = function (line) {
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


MeasureTasks.prototype.formatArea = function (polygon) {
    var area = ol.sphere.getArea(polygon);
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};
MeasureTasks.prototype.createHelpTooltip = function () {
    if (this.helpTooltipElement) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    this.helpTooltipElement = document.createElement('div');
    this.helpTooltipElement.className = 'tooltip hidden';
    if (this.helpTooltip) {
        this.map.removeOverlay(this.helpTooltip);
    }

    this.helpTooltip = new ol.Overlay({
        element: this.helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });

    //this.overlays.push(this.helpTooltip);
    this.map.addOverlay(this.helpTooltip);
    this.helpTooltip.getElement().parentNode.style.zIndex = 10000 + this.map.getOverlays().getLength();
}


MeasureTasks.prototype.createMeasureTooltip = function () {
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
MeasureTasks.prototype.setMapEvents = function () {

    this._pointermove = this.map.on('pointermove', this.pointerMoveHandler.bind(this));
    this.map.getViewport().addEventListener('mouseout', this.mouseoutHandler.bind(this));
}
MeasureTasks.prototype.removeMapEvents = function () {
    if (this._pointermove)
        ol.Observable.unByKey(this._pointermove);

    this.map.getViewport().removeEventListener('mouseout', this.mouseoutHandler);
}