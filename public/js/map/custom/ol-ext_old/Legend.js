/** Create a legend for styles
 * @constructor
 * @fires select
 * @param {*} options
 *  @param {String} options.className class of the control
 *  @param {String} options.title Legend title
 *  @param {ol.size | undefined} options.size Size of the symboles in the legend, default [40, 25]
 *  @param {int | undefined} options.margin Size of the symbole's margin, default 10
 *  @param {boolean | undefined} options.collapsed Specify if attributions should be collapsed at startup. Default is true.
 *  @param {boolean | undefined} options.collapsible Specify if attributions can be collapsed, default true.
 *  @param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 *  @param { ol.style.Style | Array<ol.style.Style> | ol.StyleFunction | undefined	} options.style a style or a style function to use with features
 * @extends {ol.control.Control}
 */
ol.control.Legend = function(options) {
  options = options || {};
  var element = document.createElement('div');
  if (options.target) {
    element.className = options.className || "ol-legend";
  } else {
    element.className = (options.className || "ol-legend")
      +" ol-unselectable ol-control ol-collapsed"
      +(options.collapsible===false ? ' ol-uncollapsible': '');
    // Show on click
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.addEventListener('click', function(e) {
      element.classList.toggle('ol-collapsed');
    });
    element.appendChild(button);
    // Hide on click
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.className = 'ol-closebox';
    button.addEventListener('click', function(e) {
      element.classList.toggle('ol-collapsed');
    });
    element.appendChild(button);
  }
  // The legend
  this._imgElement = document.createElement('div');
  this._imgElement.className = 'ol-legendImg';
  element.appendChild(this._imgElement);
  this._tableElement = document.createElement('ul');
  element.appendChild(this._tableElement);
	ol.control.Control.call(this, {
    element: element,
		target: options.target
	});
  this._rows = [];
  this.set('size', options.size || [40, 25]);
  this.set('margin', options.margin===0 ? 0 : options.margin || 10);
  this.set('title', options.title || '');
  // Set the style
  this._style = options.style;
  if (options.collapsed===false) this.show();
  this.refresh();
};
ol.inherits(ol.control.Legend, ol.control.Control);
/** Set the style
 * @param { ol.style.Style | Array<ol.style.Style> | ol.StyleFunction | undefined	} style a style or a style function to use with features
 */
ol.control.Legend.prototype.setStyle = function(style) {
  this._style = style;
  this.refresh();
};
/** Add a new row to the legend
 *  * You can provide in options:
 * - a feature width a style 
 * - or a feature that will use the legend style function
 * - or properties ans a geometry type that will use the legend style function
 * - or a style and a geometry type
 * @param {*} options a list of parameters 
 *  @param {ol.Feature} options.feature a feature to draw
 *  @param {ol.style.Style} options.style the style to use if no feature is provided
 *  @param {*} options.properties properties to use with a style function
 *  @param {string} options.typeGeom type geom to draw with the style or the properties
 */
ol.control.Legend.prototype.addRow = function(row) {
  this._rows.push(row||{});
  this.refresh();
};
/** Add a new row to the legend
 * @param {*} options a list of parameters 
 *  @param {} options.
 */
ol.control.Legend.prototype.removeRow = function(index) {
  this._rows.splice(index,1);
  this.refresh();
};
/** Get a legend row
 * @param {int} index
 * @return {*}
 */
ol.control.Legend.prototype.getRow = function(index) {
  return this._rows[index];
};
/** Get a legend row
 * @return {int}
 */
ol.control.Legend.prototype.getLength = function() {
  return this._rows.length;
};
/** Refresh the legend
 */
ol.control.Legend.prototype.refresh0 = function() {
  var self = this;
  var table = this._tableElement
  table.innerHTML = '';
  var width = this.get('size')[0] + 2*this.get('margin');
  var height = this.get('size')[1] + 2*this.get('margin');
  // Add a new row
  function addRow(str, title, r, i,imageData){
    var row = document.createElement('li');
    row.style.height = height + 'px';
    row.addEventListener('click', function() {
      self.dispatchEvent({ type:'select', title: str, row: r, index: i });
    });
    row.addEventListener('dblclick', function() {
      self.dispatchEvent({ type:'dblclick', title: str, row: r, index: i });
    });
    var col = document.createElement('div');
    row.appendChild(col);
    if(imageData){
      var img = document.createElement('img');
      img.src= imageData;
      col.appendChild(img);
    }
    col.style.height = height + 'px';
    col = document.createElement('div');
    if (title) {
      row.className = 'ol-title';
    } else {
      col.style.paddingLeft = width + 'px';
    }
    col.innerHTML = str || '';
    row.appendChild(col);
    table.appendChild(row);
  };

  if (this.get('title')) {
    addRow(this.get('title'), true, {}, -1);
  }
  var canvas = document.createElement('canvas');
  canvas.width = 5*width;
  canvas.height = (this._rows.length+1) * height * ol.has.DEVICE_PIXEL_RATIO;
  this._imgElement.innerHTML = '';
  this._imgElement.appendChild(canvas);
  this._imgElement.style.height = (this._rows.length+1)*height + 'px';



  var size = this.get('size');
  var widthImg = size[0] + 2*this.get('margin');
  var heightImg = size[1] + 2*this.get('margin');
  var canvasImg;
  var ratio = ol.has.DEVICE_PIXEL_RATIO;
  
  //  canvasImg = document.createElement('canvas');
  //   canvasImg.width = widthImg * ratio;
  //   canvasImg.height = heightImg * ratio;
  


  for (var i=0, r; r = this._rows[i]; i++) {
  // var imageData= this.getStyleImageData(r, canvasImg,i+(this.get('title')?1:0));

    //addRow(r.title, false, r, i,imageData);
    addRow(r.title, false, r, i);
    canvas = this.getStyleImage(r, canvas, i+(this.get('title')?1:0));
  };
};
ol.control.Legend.prototype.refresh = function() {
  var self = this;
  var table = this._tableElement
  table.innerHTML = '';
  var width = this.get('size')[0] + 2*this.get('margin');
  var height = this.get('size')[1] + 2*this.get('margin');
  // Add a new row
  function addRow(str, title, r, i,imageData){
    var row = document.createElement('li');
    row.style.height = height + 'px';
    row.addEventListener('click', function() {
      self.dispatchEvent({ type:'select', title: str, row: r, index: i });
    });
    row.addEventListener('dblclick', function() {
      self.dispatchEvent({ type:'dblclick', title: str, row: r, index: i });
    });
    var col = document.createElement('div');
    row.appendChild(col);
    if(imageData){
      var img = document.createElement('img');
      img.src= imageData;
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      img.style.objectFit='contain';
      col.appendChild(img);
    }
    col.style.height = height + 'px';
    col = document.createElement('div');
    if (title) {
      row.className = 'ol-title';
    } else {
      if(!imageData){
        col.style.paddingLeft = width + 'px';
      }else{
        col.style.paddingLeft =  '8px';
      }
    }
    col.innerHTML = str || '';
    row.appendChild(col);
    table.appendChild(row);
  };

  if (this.get('title')) {
    addRow(this.get('title'), true, {}, -1);
  }
  var canvas = document.createElement('canvas');
  canvas.width = 5*width;
  canvas.height = (this._rows.length+1) * height * ol.has.DEVICE_PIXEL_RATIO;
  this._imgElement.innerHTML = '';
  this._imgElement.appendChild(canvas);
  this._imgElement.style.height = (this._rows.length+1)*height + 'px';



  var size = this.get('size');
  var widthImg = size[0] + 2*this.get('margin');
  var heightImg = size[1] + 2*this.get('margin');
  var canvasImg;
  var ratio = ol.has.DEVICE_PIXEL_RATIO;
  
   canvasImg = document.createElement('canvas');
    canvasImg.width = widthImg * ratio;
    canvasImg.height = heightImg * ratio;
  


  for (var i=0, r; r = this._rows[i]; i++) {
    var imageData=r.imgSrc;
    if(!imageData){
      imageData= this.getStyleImageData(r, canvasImg,i+(this.get('title')?1:0));
    }
    
    addRow(r.title, false, r, i,imageData);
    
  };
};
ol.control.Legend.prototype.getVisible = function() {
  return !this.element.classList.contains('ol-collapsed');
};
ol.control.Legend.prototype.setVisible = function(value) {
  if(value){
    this.show()
  }else{
    this.hide();
  }
  
};
/** Show control
 */
ol.control.Legend.prototype.show = function() {
  this.element.classList.remove('ol-collapsed');
};
/** Hide control
 */
ol.control.Legend.prototype.hide = function() {
  this.element.classList.add('ol-collapsed');
};
/** Toggle control
 */
ol.control.Legend.prototype.toggle = function() {
  this.element.classList.toggle('ol-collapsed');
};
/** Get the image for a style 
 * You can provide in options:
 * - a feature width a style 
 * - or a feature that will use the legend style function
 * - or properties ans a geometry type that will use the legend style function
 * - or a style and a geometry type
 * @param {*} options
 *  @param {ol.Feature} options.feature a feature to draw
 *  @param {ol.style.Style} options.style the style to use if no feature is provided
 *  @param {*} options.properties properties to use with a style function
 *  @param {string} options.typeGeom type geom to draw with the style or the properties
 * @param {Canvas|undefined} canvas a canvas to draw in
 * @param {int|undefined} row row number to draw in canvas
 * @return {CanvasElement}
 */
ol.control.Legend.prototype.getStyleImage = function(options, theCanvas, row) {
  options = options || {};
  var size = this.get('size');
  var width = size[0] + 2*this.get('margin');
  var height = size[1] + 2*this.get('margin');
  var canvas = theCanvas;
  var ratio = ol.has.DEVICE_PIXEL_RATIO;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  var ctx = canvas.getContext('2d');
  ctx.save();
  var vectorContext = ol.render.toContext(ctx);
  var typeGeom = options.typeGeom;
  var style;
  var feature = options.feature;
  if (!feature && options.properties && typeGeom) {
    feature = new ol.Feature(new ol.geom[typeGeom]([0,0]));
    feature.setProperties(options.properties);
  }
  if (feature) {
    style = feature.getStyle();
    if (!style) {
      style = typeof(this._style) === 'function' ? this._style(feature) : this._style || [];
    }
    typeGeom = feature.getGeometry().getType();
  } else {
    style = options.style;
  }
  if (!(style instanceof Array)) style = [style];
  var cx = width/2;
  if(options.leftOffset){
    cx=cx+ options.leftOffset;
  }
  var cy = height/2;
  var sx = size[0]/2;
  var sy = size[1]/2;
  var i, s;
  // Get point offset
  if (typeGeom === 'Point') {
    var extent = null;
    for (i=0; s= style[i]; i++) {
      var img = s.getImage();
      if (img && img.getAnchor) {
        var anchor = img.getAnchor();
        var size = img.getSize();
        var dx = anchor[0] - size[0];
        var dy = anchor[1] - size[1];
        if (!extent) {
          extent = [dx, dy, dx+size[0], dy+size[1]];
        } else {
          ol.extent.extend(extent, [dx, dy, dx+size[0], dy+size[1]]);
        }
      }
    }
    if (extent) {
      cx = cx + (extent[2] + extent[0])/2;
      cy = cy + (extent[3] + extent[1])/2;
    }
  }
  // Draw image
  cy += (theCanvas ? row*height : 0);
  for (i=0; s= style[i]; i++) {
    vectorContext.setStyle(s);
    switch (typeGeom) {
      case ol.geom.Point:
      case 'Point':
        vectorContext.drawGeometry(new ol.geom.Point([cx, cy]));
        break;
      case ol.geom.LineString:
      case 'LineString':
        ctx.save();
          ctx.rect(this.get('margin') * ratio, 0, size[0] *  ratio, canvas.height);
          ctx.clip();
          vectorContext.drawGeometry(new ol.geom.LineString([[cx-sx, cy], [cx+sx, cy]]));
        ctx.restore();
        break;
      case ol.geom.Polygon:
      case 'Polygon':
        vectorContext.drawGeometry(new ol.geom.Polygon([[[cx-sx, cy-sy], [cx+sx, cy-sy], [cx+sx, cy+sy], [cx-sx, cy+sy], [cx-sx, cy-sy]]]));
        break;
    }
  }
  ctx.restore();
  return canvas;
};

ol.control.Legend.prototype.getStyleImageData = function(options,canvas,  row) {
  options = options || {};
  var size = this.get('size');
  var width = size[0] + 2*this.get('margin');
  var height = size[1] + 2*this.get('margin');
//  var canvas;
  var ratio = ol.has.DEVICE_PIXEL_RATIO;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  var ctx = canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var vectorContext = ol.render.toContext(ctx);
  var typeGeom = options.typeGeom;
  var style;
  var feature = options.feature;
  if (!feature && options.properties && typeGeom) {
    feature = new ol.Feature(new ol.geom[typeGeom]([0,0]));
    feature.setProperties(options.properties);
  }
  if (feature) {
    style = feature.getStyle();
    if (!style) {
      style = typeof(this._style) === 'function' ? this._style(feature) : this._style || [];
    }
    typeGeom = feature.getGeometry().getType();
  } else {
    style = options.style;
  }
  if (!(style instanceof Array)) style = [style];
  var cx = width/2;
  if(options.leftOffset){
    cx=cx+ options.leftOffset;
  }
  var cy = height/2;
  var sx = size[0]/2;
  var sy = size[1]/2;
  var i, s;
  // Get point offset
  if (typeGeom === 'Point') {
    var extent = null;
    for (i=0; s= style[i]; i++) {
      var img = s.getImage();
      if (img && img.getAnchor) {
        var anchor = img.getAnchor();
        var size = img.getSize();
        var dx = anchor[0] - size[0];
        var dy = anchor[1] - size[1];
        if (!extent) {
          extent = [dx, dy, dx+size[0], dy+size[1]];
        } else {
          ol.extent.extend(extent, [dx, dy, dx+size[0], dy+size[1]]);
        }
      }
    }
    if (extent) {
      cx = cx + (extent[2] + extent[0])/2;
      cy = cy + (extent[3] + extent[1])/2;
    }
  }
  // Draw image
 // cy += (theCanvas ? row*height : 0);
 cy+=0;

  for (i=0; s= style[i]; i++) {
    vectorContext.setStyle(s);
    switch (typeGeom) {
      case ol.geom.Point:
      case 'Point':
        vectorContext.drawGeometry(new ol.geom.Point([cx, cy]));
        break;
      case ol.geom.LineString:
      case 'LineString':
       // ctx.save();
       //   ctx.rect(this.get('margin') * ratio, 0, size[0] *  ratio, canvas.height);
       //   ctx.clip();
          vectorContext.drawGeometry(new ol.geom.LineString([[cx-sx, cy], [cx+sx, cy]]));
       // ctx.restore();
        break;
      case ol.geom.Polygon:
      case 'Polygon':
        vectorContext.drawGeometry(new ol.geom.Polygon([[[cx-sx, cy-sy], [cx+sx, cy-sy], [cx+sx, cy+sy], [cx-sx, cy+sy], [cx-sx, cy-sy]]]));
        break;
    }
  }
  ctx.restore();
  var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.

  return image;
};