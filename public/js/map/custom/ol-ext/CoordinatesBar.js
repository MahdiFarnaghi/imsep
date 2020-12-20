ol.control.CoordinatesBar = function(opt_options) {
	var options = opt_options ? opt_options : {};
    var element = document.createElement('div');
    element.className = options.className !== undefined ? options.className : 'ol-coordinates-bar';
    
	ol.control.Control.call(this,
		{	element: element,
			//render: options.render || render,
			target: options.target
		});

	
	this.button = $('<button class="btn btn-xs  glyphicon glyphicon-cog"/>')
			.attr('type', 'button')
			.on("touchstart click", function(e)
			{	if (e && e.preventDefault)
				{	e.preventDefault();
					e.stopPropagation();
				}
				if (options.handleClick) options.handleClick.call(self, e);
			})
			
			.appendTo(element);
	this.coordinateDiv = $('<div class="ol-coordinates-panel">').appendTo(element);
    // listen(this,
    //   getChangeEventType(PROJECTION),
    //   this.handleProjectionChanged_, this);

    if (options.coordinateFormat) {
      this.coordinateFormat=options.coordinateFormat;
    }
    if (options.projection) {
      this.projection=options.projection;
    }
    this.undefinedHTML_ = options.undefinedHTML !== undefined ? options.undefinedHTML : '&#160;';
    this.renderOnMouseOut_ = !!this.undefinedHTML_;
    this.renderedHTML_ = element.innerHTML;
    this.mapProjection_ = null;
    this.transform_ = null;
    this.lastMouseMovePixel_ = null;
  };
  ol.ext.inherits(ol.control.CoordinatesBar, ol.control.Control);

 
  /**
   * @param {Event} event Browser event.
   * @protected
   */
  ol.control.CoordinatesBar.prototype.handleMouseMove=function(event) {
    var map = this.getMap();
    this.lastMouseMovePixel_ = map.getEventPixel(event);
    this.updateHTML_(this.lastMouseMovePixel_);
  }

  /**
   * @param {Event} event Browser event.
   * @protected
   */
  ol.control.CoordinatesBar.prototype.handleMouseOut=function(event) {
    this.updateHTML_(null);
    this.lastMouseMovePixel_ = null;
  }
  
  ol.control.CoordinatesBar.prototype.setProjection= function (projection){
	this.projection= projection;
	this.transform_ = null;
  }
  ol.control.CoordinatesBar.prototype.setMap = function (map) {
   // super.setMap(map);
   ol.control.Control.prototype.setMap.call(this, map);
    if (map) {
      var viewport = map.getViewport();
	  this._listener_mousemove = viewport.addEventListener('mousemove', this.handleMouseMove.bind(this));	
	  this._listener_touchstart = viewport.addEventListener('touchstart', this.handleMouseMove.bind(this));	
	//   this.listenerKeys.push(
    //     listen(viewport, EventType.MOUSEMOVE, this.handleMouseMove, this),
    //     listen(viewport, EventType.TOUCHSTART, this.handleMouseMove, this)
    //   );
      if (this.renderOnMouseOut_) {
		this._listener_mouseout = viewport.addEventListener('mouseout', this.handleMouseOut.bind(this));	
		this._listener_touchend = viewport.addEventListener('touchend', this.handleMouseOut.bind(this));
        // this.listenerKeys.push(
        //   listen(viewport, EventType.MOUSEOUT, this.handleMouseOut, this),
        //   listen(viewport, EventType.TOUCHEND, this.handleMouseOut, this)
        // );
      }
    }
  }
  ol.control.CoordinatesBar.prototype.updateHTML_= function(pixel) {
	var html = this.undefinedHTML_;
	var map = this.getMap();
	var view = map.getView();
	this.mapProjection_ = view.getProjection();
    if (pixel && this.mapProjection_) {
      if (!this.transform_) {
        var projection = this.projection;
        if (projection) {
          this.transform_ = ol.proj.getTransform(
            this.mapProjection_, projection);
        } else {
          this.transform_ = identityTransform;
        }
      }
     
      var coordinate = map.getCoordinateFromPixel(pixel);
      if (coordinate) {
        this.transform_(coordinate, coordinate);
        var coordinateFormat = this.coordinateFormat;
        if (coordinateFormat) {
          html = coordinateFormat(coordinate);
        } else {
          html = coordinate.toString();
        }
      }
    }
    if (!this.renderedHTML_ || html !== this.renderedHTML_) {
      $(this.coordinateDiv).html(html);
      this.renderedHTML_ = html;
    }
  }

  