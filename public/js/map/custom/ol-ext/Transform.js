
/** Interaction Transform
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires select | rotatestart | rotating | rotateend | translatestart | translating | translateend | scalestart | scaling | scaleend
 * @param {any} options
 *  @param {function} options.filter A function that takes a Feature and a Layer and returns true if the feature may be transformed or false otherwise. 
 *  @param {Array<ol.Layer>} options.layers array of layers to transform,
 *  @param {ol.Collection<ol.Feature>} options.features collection of feature to transform,
 *	@param {ol.EventsConditionType|undefined} options.addCondition A function that takes an ol.MapBrowserEvent and returns a boolean to indicate whether that event should be handled. default: ol.events.condition.never.
 *	@param {number | undefined} options.hitTolerance Tolerance to select feature in pixel, default 0
 *	@param {bool} options.translateFeature Translate when click on feature
 *	@param {bool} options.translate Can translate the feature
 *	@param {bool} options.stretch can stretch the feature
 *	@param {bool} options.scale can scale the feature
 *	@param {bool} options.rotate can rotate the feature
 *	@param {bool} options.noFlip prevent the feature geometry to flip, default false
 *	@param {bool} options.selection the intraction handle selection/deselection, if not use the select prototype to add features to transform, default true
 *	@param {ol.events.ConditionType | undefined} options.keepAspectRatio A function that takes an ol.MapBrowserEvent and returns a boolean to keep aspect ratio, default ol.events.condition.shiftKeyOnly.
 *	@param {ol.events.ConditionType | undefined} options.modifyCenter A function that takes an ol.MapBrowserEvent and returns a boolean to apply scale & strech from the center, default ol.events.condition.metaKey or ol.events.condition.ctrlKey.
 *	@param {} options.style list of ol.style for handles
 *
 */
ol.interaction.Transform = function(options) {
    if (!options) options = {};
      var self = this;
      // Create a new overlay layer for the sketch
      this.handles_ = new ol.Collection();
      this.overlayLayer_ = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: this.handles_,
        useSpatialIndex: false,
        wrapX: false // For vector editing across the -180° and 180° meridians to work properly, this should be set to false
      }),
      name:'Transform overlay',
      displayInLayerSwitcher: false,
      // Return the style according to the handle type
      style: function (feature) {
        return (self.style[(feature.get('handle')||'default')+(feature.get('constraint')||'')+(feature.get('option')||'')]);
      }, 
    });
    // Extend pointer
    ol.interaction.Pointer.call(this, {
      handleDownEvent: this.handleDownEvent_,
      handleDragEvent: this.handleDragEvent_,
      handleMoveEvent: this.handleMoveEvent_,
      handleUpEvent: this.handleUpEvent_
    });
    // Collection of feature to transform
    this.features_ = options.features;
    // Filter or list of layers to transform 
    if (typeof(options.filter)==='function') this._filter = options.filter;
    this.layers_ = options.layers ? (options.layers instanceof Array) ? options.layers:[options.layers] : null;
    this.addFn_ = options.addCondition || function() { return false; };
    /* Translate when click on feature */
    this.set('translateFeature', (options.translateFeature!==false));
    /* Can translate the feature */
    this.set('translate', (options.translate!==false));
    /* Can stretch the feature */
    this.set('stretch', (options.stretch!==false));
    /* Can scale the feature */
    this.set('scale', (options.scale!==false));
    /* Can rotate the feature */
    this.set('rotate', (options.rotate!==false));
    /* Keep aspect ratio */
    this.set('keepAspectRatio', (options.keepAspectRatio || function(e){ return e.originalEvent.shiftKey }));
    /* Modify center */
    this.set('modifyCenter', (options.modifyCenter || function(e){ return e.originalEvent.metaKey || e.originalEvent.ctrlKey }));
    /* Prevent flip */
    this.set('noFlip', (options.noFlip || false));
    /* Handle selection */
    this.set('selection', (options.selection !== false));
    /*  */
    this.set('hitTolerance', (options.hitTolerance || 0));
    this.selection_ = [];
    // Force redraw when changed
    this.on ('propertychange', function() {
      this.drawSketch_();
    });
    // setstyle
    this.setDefaultStyle();
  };
  ol.ext.inherits(ol.interaction.Transform, ol.interaction.Pointer);
  /** Cursors for transform
  */
  ol.interaction.Transform.prototype.Cursors = {
    'default': 'auto',
    'select': 'pointer',
    'translate': 'move',
    'rotate': 'move',
    'rotate0': 'move',
    'scale': 'nesw-resize',
    'scale1': 'nwse-resize',
    'scale2': 'nesw-resize',
    'scale3': 'nwse-resize',
    'scalev': 'ew-resize',
    'scaleh1': 'ns-resize',
    'scalev2': 'ew-resize',
    'scaleh3': 'ns-resize'
  };
  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {ol.Map} map Map.
   * @api stable
   */
  ol.interaction.Transform.prototype.setMap = function(map) {
    if (this.getMap()) {
      this.getMap().removeLayer(this.overlayLayer_);
      if (this.previousCursor_) {
        this.getMap().getTargetElement().style.cursor = this.previousCursor_;
        this.previousCursor_ = undefined;
      }
    }
    ol.interaction.Pointer.prototype.setMap.call (this, map);
    this.overlayLayer_.setMap(map);
    if (map !== null) {
      this.isTouch = /touch/.test(map.getViewport().className);
      this.setDefaultStyle();
    }
  };
  /**
   * Activate/deactivate interaction
   * @param {bool}
   * @api stable
   */
  ol.interaction.Transform.prototype.setActive = function(b) {
    this.select(null);
    this.overlayLayer_.setVisible(b);
    ol.interaction.Pointer.prototype.setActive.call (this, b);
  };
  /** Set efault sketch style
  */
  ol.interaction.Transform.prototype.setDefaultStyle = function() {
    // Style
    var stroke = new ol.style.Stroke({ color: [255,0,0,1], width: 1 });
    var strokedash = new ol.style.Stroke({ color: [255,0,0,1], width: 1, lineDash:[4,4] });
    var fill0 = new ol.style.Fill({ color:[255,0,0,0.01] });
    var fill = new ol.style.Fill({ color:[255,255,255,0.8] });
    var circle = new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 12 : 6,
        points: 15
      });
    circle.getAnchor()[0] = this.isTouch ? -10 : -5;
    var bigpt = new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 16 : 8,
        points: 4,
        angle: Math.PI/4
      });
    var smallpt = new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 12 : 6,
        points: 4,
        angle: Math.PI/4
      });
    function createStyle (img, stroke, fill) {
      return [ new ol.style.Style({image:img, stroke:stroke, fill:fill}) ];
    }
    /** Style for handles */
    this.style = {
      'default': createStyle (bigpt, strokedash, fill0),
      'translate': createStyle (bigpt, stroke, fill),
      'rotate': createStyle (circle, stroke, fill),
      'rotate0': createStyle (bigpt, stroke, fill),
      'scale': createStyle (bigpt, stroke, fill),
      'scale1': createStyle (bigpt, stroke, fill),
      'scale2': createStyle (bigpt, stroke, fill),
      'scale3': createStyle (bigpt, stroke, fill),
      'scalev': createStyle (smallpt, stroke, fill),
      'scaleh1': createStyle (smallpt, stroke, fill),
      'scalev2': createStyle (smallpt, stroke, fill),
      'scaleh3': createStyle (smallpt, stroke, fill),
    };
    this.drawSketch_();
  }
  /**
   * Set sketch style.
   * @param {style} style Style name: 'default','translate','rotate','rotate0','scale','scale1','scale2','scale3','scalev','scaleh1','scalev2','scaleh3'
   * @param {ol.style.Style|Array<ol.style.Style>} olstyle
   * @api stable
   */
  ol.interaction.Transform.prototype.setStyle = function(style, olstyle) {
    if (!olstyle) return;
    if (olstyle instanceof Array) this.style[style] = olstyle;
    else this.style[style] = [ olstyle ];
    for (var i=0; i<this.style[style].length; i++) {
      var im = this.style[style][i].getImage();
      if (im) {
        if (style == 'rotate') im.getAnchor()[0] = -5;
        if (this.isTouch) im.setScale(1.8);
      }
      var tx = this.style[style][i].getText();
      if (tx) {
        if (style == 'rotate') tx.setOffsetX(this.isTouch ? 14 : 7);
        if (this.isTouch) tx.setScale(1.8);
      }
    }
    this.drawSketch_();
  };
  /** Get Feature at pixel
   * @param {ol.Pixel}
   * @return {ol.feature}
   * @private
   */
  ol.interaction.Transform.prototype.getFeatureAtPixel_ = function(pixel) {
    var self = this;
    return this.getMap().forEachFeatureAtPixel(pixel,
      function(feature, layer) {
        var found = false;
        // Overlay ?
        if (!layer) {
          if (feature===self.bbox_) return false;
          self.handles_.forEach (function(f) { if (f===feature) found=true; });
          if (found) return { feature: feature, handle:feature.get('handle'), constraint:feature.get('constraint'), option:feature.get('option') };
        }
        // No seletion
        if (!self.get('selection')) {
          // Return the currently selected feature the user is interacting with.
          if (self.selection_.some(function(f) { return feature === f; })) {
            return { feature: feature };
          }
          return null;
        }
        // filter condition
        if (self._filter) {
          if (self._filter(feature,layer)) return { feature: feature };
          else return null;
        }
        // feature belong to a layer
        else if (self.layers_) {
          for (var i=0; i<self.layers_.length; i++) {
            if (self.layers_[i]===layer) return { feature: feature };
          }
          return null;
        }
        // feature in the collection
        else if (self.features_) {
          self.features_.forEach (function(f) { if (f===feature) found=true; });
          if (found) return { feature: feature };
          else return null;
        }
        // Others
        else return { feature: feature };
      },
      { hitTolerance: this.get('hitTolerance') }
    ) || {};
  }
  /** Draw transform sketch
  * @param {boolean} draw only the center
  */
  ol.interaction.Transform.prototype.drawSketch_ = function(center) {
    var i, f, geom;
    this.overlayLayer_.getSource().clear();
    if (!this.selection_.length) return;
    var ext = this.selection_[0].getGeometry().getExtent();
    // Clone and extend
    ext = ol.extent.buffer(ext, 0);
    for (i=1, f; f = this.selection_[i]; i++) {
      ol.extent.extend(ext, f.getGeometry().getExtent());
    }
    if (center===true) {
      if (!this.ispt_) {
        this.overlayLayer_.getSource().addFeature(new ol.Feature( { geometry: new ol.geom.Point(this.center_), handle:'rotate0' }) );
        geom = ol.geom.Polygon.fromExtent(ext);
        f = this.bbox_ = new ol.Feature(geom);
        this.overlayLayer_.getSource().addFeature (f);
      }
    }
    else {
      if (this.ispt_) {
        var p = this.getMap().getPixelFromCoordinate([ext[0], ext[1]]);
        ext = ol.extent.boundingExtent([
          this.getMap().getCoordinateFromPixel([p[0]-10, p[1]-10]),
          this.getMap().getCoordinateFromPixel([p[0]+10, p[1]+10])
        ]);
      }
      geom = ol.geom.Polygon.fromExtent(ext);
      f = this.bbox_ = new ol.Feature(geom);
      var features = [];
      var g = geom.getCoordinates()[0];
      if (!this.ispt_) {
        features.push(f);
        // Middle
        if (this.get('stretch') && this.get('scale')) for (i=0; i<g.length-1; i++) {
          f = new ol.Feature( { geometry: new ol.geom.Point([(g[i][0]+g[i+1][0])/2,(g[i][1]+g[i+1][1])/2]), handle:'scale', constraint:i%2?"h":"v", option:i });
          features.push(f);
        }
        // Handles
        if (this.get('scale')) for (i=0; i<g.length-1; i++) {
          f = new ol.Feature( { geometry: new ol.geom.Point(g[i]), handle:'scale', option:i });
          features.push(f);
        }
        // Center
        if (this.get('translate') && !this.get('translateFeature')) {
          f = new ol.Feature( { geometry: new ol.geom.Point([(g[0][0]+g[2][0])/2, (g[0][1]+g[2][1])/2]), handle:'translate' });
          features.push(f);
        }
      }
      // Rotate
      if (this.get('rotate')) {
        f = new ol.Feature( { geometry: new ol.geom.Point(g[3]), handle:'rotate' });
        features.push(f);
      }
      // Add sketch
      this.overlayLayer_.getSource().addFeatures(features);
    }
  };
  /** Select a feature to transform
  * @param {ol.Feature} feature the feature to transform
  * @param {boolean} add true to add the feature to the selection, default false
  */
  ol.interaction.Transform.prototype.select = function(feature, add) {
    if (!feature) {
      this.selection_ = [];
      this.drawSketch_();
      return;
    }
    if (!feature.getGeometry || !feature.getGeometry()) return;
    // Add to selection
    if (add) this.selection_.push(feature);
    else this.selection_ = [feature];
    this.ispt_ = (this.selection_.length===1 ? (this.selection_[0].getGeometry().getType() == "Point") : false);
    this.drawSketch_();
    this.watchFeatures_();
    // select event
    this.dispatchEvent({ type:'select', feature: feature, features: this.selection_ });
  };
  /** Watch selected features
   * @private
   */
  ol.interaction.Transform.prototype.watchFeatures_ = function() {
    // Listen to feature modification
    if (this._featureListeners) {
      this._featureListeners.forEach(function (l) {
        ol.Observable.unByKey(l)
      });
    }
    this._featureListeners = [];
    this.selection_.forEach(function(f) {
      this._featureListeners.push(
        f.on('change', function() {
          this.drawSketch_();
        }.bind(this))
      );
    }.bind(this));
  };
  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `true` to start the drag sequence.
   */
  ol.interaction.Transform.prototype.handleDownEvent_ = function(evt) {
    var sel = this.getFeatureAtPixel_(evt.pixel);
    var feature = sel.feature;
    if (this.selection_.length
      && this.selection_.indexOf(feature) >=0
      && ((this.ispt_ && this.get('translate')) || this.get('translateFeature'))
    ){
      sel.handle = 'translate';
    }
    if (sel.handle) {
      this.mode_ = sel.handle;
      this.opt_ = sel.option;
      this.constraint_ = sel.constraint;
      // Save info
      this.coordinate_ = evt.coordinate;
      this.pixel_ = evt.pixel;
      this.geoms_ = [];
      var extent = ol.extent.createEmpty();
      for (var i=0, f; f=this.selection_[i]; i++) {
        this.geoms_.push(f.getGeometry().clone());
        extent = ol.extent.extend(extent, f.getGeometry().getExtent());
      }
      this.extent_ = (ol.geom.Polygon.fromExtent(extent)).getCoordinates()[0];
      if (this.mode_==='rotate') {
        this.center_ = this.getCenter() || ol.extent.getCenter(extent);
        // we are now rotating (cursor down on rotate mode), so apply the grabbing cursor
        var element = evt.map.getTargetElement();
        element.style.cursor = this.Cursors.rotate0;
        this.previousCursor_ = element.style.cursor;
      } else {
        this.center_ = ol.extent.getCenter(extent);
      }
      this.angle_ = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);
      this.dispatchEvent({
        type: this.mode_+'start',
        feature: this.selection_[0], // backward compatibility
        features: this.selection_,
        pixel: evt.pixel,
        coordinate: evt.coordinate
      });
      return true;
    }
    else if (this.get('selection')) {
      if (feature){
        if (!this.addFn_(evt)) this.selection_ = [];
        var index = this.selection_.indexOf(feature);
        if (index < 0) this.selection_.push(feature);
        else this.selection_.splice(index,1);
      } else {
        this.selection_ = [];
      }
      this.ispt_ = this.selection_.length===1 ? (this.selection_[0].getGeometry().getType() == "Point") : false;
      this.drawSketch_();
      this.watchFeatures_();
      this.dispatchEvent({ type:'select', feature: feature, features: this.selection_, pixel: evt.pixel, coordinate: evt.coordinate });
      return false;
    }
  };
  /**
   * Get features to transform
   * @return {Array<ol.Feature>}
   */
  ol.interaction.Transform.prototype.getFeatures = function() {
    return this.selection_;
  };
  /**
   * Get the rotation center
   * @return {ol.coordinates|undefined}
   */
  ol.interaction.Transform.prototype.getCenter = function() {
    return this.get('center');
  };
  /**
   * Set the rotation center
   * @param {ol.coordinates|undefined} c the center point, default center on the objet
   */
  ol.interaction.Transform.prototype.setCenter = function(c) {
    return this.set('center', c);
  }
  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   */
  ol.interaction.Transform.prototype.handleDragEvent_ = function(evt) {
    var i, f, geometry;
    switch (this.mode_) {
      case 'rotate': {
        var a = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);
        if (!this.ispt) {
          // var geometry = this.geom_.clone();
          // geometry.rotate(a-this.angle_, this.center_);
          // this.feature_.setGeometry(geometry);
          for (i=0, f; f=this.selection_[i]; i++) {
            geometry = this.geoms_[i].clone();
            geometry.rotate(a - this.angle_, this.center_);
            f.setGeometry(geometry);
          }
        }
        this.drawSketch_(true);
        this.dispatchEvent({
          type:'rotating',
          feature: this.selection_[0],
          features: this.selection_,
          angle: a-this.angle_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        });
        break;
      }
      case 'translate': {
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];
        //this.feature_.getGeometry().translate(deltaX, deltaY);
        for (i=0, f; f=this.selection_[i]; i++) {
          f.getGeometry().translate(deltaX, deltaY);
        }
        this.handles_.forEach(function(f) {
          f.getGeometry().translate(deltaX, deltaY);
        });
        this.coordinate_ = evt.coordinate;
        this.dispatchEvent({
          type:'translating',
          feature: this.selection_[0],
          features: this.selection_,
          delta:[deltaX,deltaY],
          pixel: evt.pixel,
          coordinate: evt.coordinate
        });
        break;
      }
      case 'scale': {
        var center = this.center_;
        if (this.get('modifyCenter')(evt)) {
          center = this.extent_[(Number(this.opt_)+2)%4];
        }
        var scx = (evt.coordinate[0] - center[0]) / (this.coordinate_[0] - center[0]);
        var scy = (evt.coordinate[1] - center[1]) / (this.coordinate_[1] - center[1]);
        if (this.get('noFlip')) {
          if (scx<0) scx=-scx;
          if (scy<0) scy=-scy;
        }
        if (this.constraint_) {
          if (this.constraint_=="h") scx=1;
          else scy=1;
        } else {
          if (this.get('keepAspectRatio')(evt)) {
            scx = scy = Math.min(scx,scy);
          }
        }
        for (i=0, f; f=this.selection_[i]; i++) {
          geometry = this.geoms_[i].clone();
          geometry.applyTransform(function(g1, g2, dim) {
            if (dim<2) return g2;
            for (i=0; i<g1.length; i+=dim) {
              if (scx!=1) g2[i] = center[0] + (g1[i]-center[0])*scx;
              if (scy!=1) g2[i+1] = center[1] + (g1[i+1]-center[1])*scy;
            }
            return g2;
          });
          f.setGeometry(geometry);
        }
        this.drawSketch_();
        this.dispatchEvent({
          type:'scaling',
          feature: this.selection_[0],
          features: this.selection_,
          scale:[scx,scy],
          pixel: evt.pixel,
          coordinate: evt.coordinate
        });
        break;
      }
      default: break;
    }
  };
  /**
   * @param {ol.MapBrowserEvent} evt Event.
   */
  ol.interaction.Transform.prototype.handleMoveEvent_ = function(evt) {
    // console.log("handleMoveEvent");
    if (!this.mode_) {
      var sel = this.getFeatureAtPixel_(evt.pixel);
      var element = evt.map.getTargetElement();
      if (sel.feature)
      {	var c = sel.handle ? this.Cursors[(sel.handle||'default')+(sel.constraint||'')+(sel.option||'')] : this.Cursors.select;
        if (this.previousCursor_===undefined)
        {	this.previousCursor_ = element.style.cursor;
        }
        element.style.cursor = c;
      }
      else
      {	if (this.previousCursor_!==undefined) element.style.cursor = this.previousCursor_;
        this.previousCursor_ = undefined;
      }
    }
  };
  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `false` to stop the drag sequence.
   */
  ol.interaction.Transform.prototype.handleUpEvent_ = function(evt) {
    // remove rotate0 cursor on Up event, otherwise it's stuck on grab/grabbing
    if (this.mode_ === 'rotate') {
      var element = evt.map.getTargetElement();
      element.style.cursor = this.Cursors.default;
      this.previousCursor_ = undefined;
    }
    //dispatchEvent
    this.dispatchEvent({
      type:this.mode_+'end',
      feature: this.selection_[0],
      features: this.selection_,
      oldgeom: this.geoms_[0],
      oldgeoms: this.geoms_
    });
    this.drawSketch_();
    this.mode_ = null;
    return false;
  };
  