function MeasureTasks(app, mapContainer, options) {
  this.app = app;
  this.mapContainer = mapContainer;
  this.map= mapContainer.map;
  this.options = options || {};
  this._initialized = false;
  this._activated = false;

  this._toolbar = null;
  this._subBar=null;
  this.interaction=undefined;
}
MeasureTasks.prototype._init = function(dataObj) {
  this._initialized = true;
  var self = this;
  var mapContainer=this.mapContainer;
  var map=this.map;
  var source = new ol.source.Vector();
  var layer = new ol.layer.Vector({
      source: source,
      custom: {
          type:'measure',
          hiddenInToc:true
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
  map.getLayers().on('add',function(e){
      if(e.element!== layer){
          map.getLayers().remove(layer);
          map.getLayers().push(layer);
      }
    
     }) 
    var sketch;
    var helpTooltipElement;
    var helpTooltip;
    var measureTooltipElement;
    var measureTooltip;
    
    var pointerMoveHandler = function(evt) {
      if (evt.dragging) {
        return;
      }
      if(!helpTooltip)
          return;
      var helpMsg = 'Click to start drawing';
      if (sketch) {
        var geom = (sketch.getGeometry());
        if (geom instanceof ol.geom.Polygon) {
          helpMsg = 'Click to continue drawing the polygon';
        } else if (geom instanceof ol.geom.LineString) {
          helpMsg = 'Click to continue drawing the line';
        }
      }
      helpTooltipElement.innerHTML = helpMsg;
      helpTooltip.setPosition(evt.coordinate);
      helpTooltipElement.classList.remove('hidden');
    };
    self.mouseoutHandler= function(){
      helpTooltipElement.classList.add('hidden');
    }
   
    var formatLength = function(line) {
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


    var formatArea = function(polygon) {
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

    function createHelpTooltip() {
      if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
      }
      helpTooltipElement = document.createElement('div');
      helpTooltipElement.className = 'tooltip hidden';
      helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
      });
      map.addOverlay(helpTooltip);
    }


    function createMeasureTooltip() {
      if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
      }
      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'tooltip tooltip-measure';
      measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
      });
      map.addOverlay(measureTooltip);
    }
    function setMapEvents(){
        
        self._pointermove= map.on('pointermove', pointerMoveHandler);
         map.getViewport().addEventListener('mouseout', self.mouseoutHandler);
    }
    function removeMapEvents(){
        if(self._pointermove)
           ol.Observable.unByKey(self._pointermove);
        
          map.getViewport().removeEventListener('mouseout', self.mouseoutHandler); 
    }
    self.interaction=undefined;
   
    function addInteraction(type) {
      
      //var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
      self.interaction = new ol.interaction.Draw({
        source: source,
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
      mapContainer.setCurrentTool('measure_'+type);
     

      createMeasureTooltip();
      createHelpTooltip();
      removeMapEvents();
      setMapEvents();

      var listener;
      self.interaction.on('drawstart',
        function(evt) {
          // set sketch
          sketch = evt.feature;

          /** @type {module:ol/coordinate~Coordinate|undefined} */
          var tooltipCoord = evt.coordinate;

          listener = sketch.getGeometry().on('change', function(evt) {
            var geom = evt.target;
            var output;
            if (geom instanceof ol.geom.Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof ol.geom.LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        }, this);

      self.interaction.on('drawend',
        function() {
          measureTooltipElement.className = 'tooltip tooltip-static';
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          ol.Observable.unByKey(listener);

          map.getLayers().remove(layer);
          map.getLayers().push(layer);

        }, this);
    }


    this._toolbar = new ol.control.Bar();
    this._subBar = new ol.control.Bar({
          toggleOne: true, // one control active at the same time
          group: false // group controls together
      });
  
  this.mapContainer.topToolbar.addControl(this._toolbar);
    var activateInteraction=function(type){
      map.removeInteraction(self.interaction);
      addInteraction(type);
      self.mapContainer.setCurrentEditAction('draw');
    }  
    var measureLength = new ol.control.Toggle({
      html: '<span style="display:block;line-height:1em;background-position:center center" class="measure_lengthIcon" >&nbsp;</span>',
      title: 'Measure Length',
      onToggle:function(toggle){
          //console.log(toggle);
          map.removeInteraction(self.interaction);
          if(!toggle){
              removeMapEvents();
              self.mapContainer.setCurrentEditAction(undefined);
              return;
          }
          
          activateInteraction('LineString');
      }
      ,
      autoActivate: true,
      active: true
  });
  this.measureLength = measureLength;
  this._subBar.addControl(measureLength);
  map.addControl(this._toolbar)
  var measureArea = new ol.control.Toggle({
      html: '<span style="display:block;line-height:1em;background-position:center center" class="measure_areaIcon" >&nbsp;</span>',
      title: 'Measure Area',
      onToggle:function(toggle){
          //console.log(toggle);
          map.removeInteraction(self.interaction);
          if(!toggle){
              removeMapEvents();
              self.mapContainer.setCurrentEditAction(undefined);
              return;
          }
          
          activateInteraction('Polygon');
      }
     
  });
  this.measureArea = measureArea;
  this._subBar.addControl(measureArea);
 
  var clearCmd = new ol.control.Button({
      html: '<span style="display:block;line-height:1em;background-position:center center" class="deleteIcon" >&nbsp;</span>',
      title: 'Clear',
      handleClick:function(){
          source.clear()   ;        
      }
  });

  this._subBar.addControl(clearCmd);
 
  this.measureCtrl = new ol.control.Toggle({
      html: '<span style="display:block;line-height:1em;background-position:center center" class="measureIcon" >&nbsp;</span>',
      title: "measure",
      onToggle:function(toggle){
          if(!toggle){
              return;
          }
          self.measureLength.setActive(true);
          activateInteraction('LineString');
      },
      
      bar: this._subBar
      
  });

  this._toolbar.addControl(this.measureCtrl);    


  mapContainer.on('change:currentTool', function(evnt){
      var a=1;
      if(!(mapContainer.getCurrentTool()=='measure_LineString'
          || mapContainer.getCurrentTool()=='measure_Polygon'
      )){
          self.OnDeActivated();
      }
  });
}
MeasureTasks.prototype.OnActivated = function(dataObj) {
  this._activated = true;
  if (!this._initialized) {
      this._init();
  }
//  this.map.addControl(this._toolbar);
}
MeasureTasks.prototype.OnDeActivated = function() {
  if (!this._activated)
      return;
   var map=this.map;
   
   if(this.interaction)
      map.removeInteraction(this.interaction);
  if(this._pointermove)
      ol.Observable.unByKey(this._pointermove);
    map.getViewport().removeEventListener('mouseout', this.mouseoutHandler); 

   this.measureArea.setActive(false);
   this.measureLength.setActive(false);
  this.interaction=null; 
  this.mapContainer.setCurrentEditAction(undefined);  
  
 // this.map.removeControl(this._toolbar);
  this._activated = false;
}