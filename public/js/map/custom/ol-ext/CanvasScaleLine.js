/**
 * @classdesc 
 *    OpenLayers 3 Scale Line Control integrated in the canvas (for jpeg/png 
 * @see http://www.kreidefossilien.de/webgis/dokumentation/beispiele/export-map-to-png-with-scale
 *
 * @constructor
 * @extends {ol.control.ScaleLine}
 * @param {Object=} options extend the ol.control.ScaleLine options.
 * 	@param {ol.style.Style} options.style used to draw the scale line (default is black/white, 10px Arial).
 */
ol.control.CanvasScaleLine = function(options)
{	ol.control.ScaleLine.call(this, options);
	this.scaleHeight_ = 6;
	// Get style options
	if (!options) options={};
	if (!options.style) options.style = new ol.style.Style();
	this.setStyle(options.style);
	this.custom=undefined;
	this.set('showScaleNumber',options.showScaleNumber);
	this.set('ppi', options.ppi || 96)
}
ol.ext.inherits(ol.control.CanvasScaleLine, ol.control.ScaleLine);
ol.control.CanvasScaleLine.prototype.getContext = ol.control.CanvasBase.prototype.getContext;
/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {_ol_Map_} map Map.
 * @api stable
 */
ol.control.CanvasScaleLine.prototype.setMap = function (map)
{
	ol.control.CanvasBase.prototype.getCanvas.call(this, map);
		var oldmap = this.getMap();
	if (this._listener) ol.Observable.unByKey(this._listener);
	this._listener = null;
	ol.control.ScaleLine.prototype.setMap.call(this, map);
	if (oldmap) oldmap.renderSync();
	// Add postcompose on the map
	if (map) {
		
		this._listener = map.on('postcompose', this.drawScale_.bind(this));
	//	this._listener = map.on('postcompose', this.drawScale_.bind(this));
	} 
	// Hide the default DOM element
	this.element.style.visibility = 'hidden';
	this.olscale = this.element.querySelector(".ol-scale-line-inner");
}
/**
 * Change the control style
 * @param {_ol_style_Style_} style
 */
ol.control.CanvasScaleLine.prototype.setStyle = function (style)
{	var stroke = style.getStroke();
	this.strokeStyle_ = stroke ? ol.color.asString(stroke.getColor()) : "#000";
	this.strokeWidth_ = stroke ? stroke.getWidth() : 2;
	var fill = style.getFill();
	this.fillStyle_ = fill ? ol.color.asString(fill.getColor()) : "#fff";
	var text = style.getText();
	this.font_ = text ? text.getFont() : "10px Arial";
	stroke = text ? text.getStroke() : null;
	fill = text ? text.getFill() : null;
	this.fontStrokeStyle_ = stroke ? ol.color.asString(stroke.getColor()) : this.fillStyle_;
	this.fontStrokeWidth_ = stroke ? stroke.getWidth() : 3;
	this.fontFillStyle_ = fill ? ol.color.asString(fill.getColor()) : this.strokeStyle_;
	// refresh
	if (this.getMap()) this.getMap().render();
}
/** 
 * Draw attribution in the final canvas
 * @private
 */
ol.control.CanvasScaleLine.prototype.drawScale_ = function(e)
{	if ( this.element.style.visibility!=="hidden" ) return;
	var ctx = e.context;
	if(!ctx){
		 ctx = this.getContext(e);
	}
	if (!ctx){
		return;
	} 
	// Get size of the scale div
	var scalewidth = parseInt(this.olscale.style.width);
	if(this.custom && this.custom.width ){
		scalewidth= this.custom.width;
	}
	if (!scalewidth) return;

	var showScaleNumber= this.get('showScaleNumber');

	var text = this.olscale.textContent;
	var scaleNumber='';
 var printing=false;
	//////////////////////////////////
	var map= this.getMap();
	//printing= map.get('_printing');
	var _printingScale= map.get('_printingScale');
	if(!_printingScale){
		_printingScale=1.0;
	}

	var formatScale = function (d) {
		if (d>100) d = Math.round(d/100) * 100;
		else d = Math.round(d);
		return '1 / '+ d.toLocaleString();
	  };

	var resolution = this.getMap().getView().getResolution();
    var dpi = 25.4 / 0.28;
    var mpu = this.viewState_.projection.getMetersPerUnit();
    var inchesPerMeter = 39.37;
	var _scale1= parseFloat(resolution.toString()) * mpu * inchesPerMeter * dpi;
	_scale1=Math.round(_scale1)*_printingScale;
	//_scale1 = formatScale(_scale1);


	
	var view = map.getView();
    var proj = view.getProjection();
    var center = view.getCenter();
    var px = map.getPixelFromCoordinate(center);
    px[1] += 1;
    var coord = map.getCoordinateFromPixel(px);
    var d = ol.sphere.getDistance(
      ol.proj.transform(center, proj, 'EPSG:4326'),
	  ol.proj.transform(coord, proj, 'EPSG:4326'));
	///////////////////////////////
	var pointResolution=d;
	//var minWidth_=64*_printingScale ;
	var minWidth_=100*_printingScale ;
	var nominalCount = minWidth_ * pointResolution;
	var suffix=';'
	if (nominalCount < 0.001) {
        suffix = 'μm';
        pointResolution *= 1000000;
      } else if (nominalCount < 1) {
        suffix = 'mm';
        pointResolution *= 1000;
      } else if (nominalCount < 1000) {
        suffix = 'm';
      } else {
        suffix = 'km';
        pointResolution /= 1000;
      }
	var LEADING_DIGITS = [1, 2, 5];
	var i = 3 * Math.floor(Math.log(minWidth_ * pointResolution) / Math.log(10));
	  var count, cal_width, decimalCount;
	  while (true) {
		decimalCount = Math.floor(i / 3);
		var decimal = Math.pow(10, decimalCount);
		count = LEADING_DIGITS[((i % 3) + 3) % 3] * decimal;
		cal_width = Math.round(count / pointResolution);
		if (isNaN(cal_width)) {
		  //this.element.style.display = 'none';
		 // this.renderedVisible_ = false;
		  return;
		} else if (cal_width >= minWidth_) {
		  break;
		}
		++i;
	  }
	 

	  text= count + ' '+ suffix;
	  scalewidth=cal_width;
	  //text=text+','+(count)+','+(cal_width-scalewidth)

	/////////////////////////////
	  var dpi2 = 25.4 / 0.28; 
	d *= this.get('ppi')/.0254
	//d *= 128/.0254
	//d *= dpi2/.0254;
	d= d*_printingScale;
	var _scale2 = d;
	scaleNumber= formatScale(_scale2)
	// var textParts= text.split(' ');
	// if(textParts.length>1){
	// 	var textScale= textParts[0];
	// 	try{
	// 		textScale= parseFloat(textScale);
		
	// 		var widthFactor= _scale2/_scale1 * _printingScale;
	// 		//var widthFactor=  _printingScale;
	// 		scalewidth = scalewidth /widthFactor;
	// 	}catch(ex){

	// 	}
	// }
	// _scale1= formatScale(_scale1);
	// _scale2= formatScale(_scale2);
	// if(printing){
	// 	text=_scale2;
	// }
	////////////////////////////
		

	var position = {left: this.element.offsetLeft, top: this.element.offsetTop};
	if(this.custom && typeof this.custom.left !=='undefined' ){
		position.left= this.custom.left;
	}
	if(this.custom && typeof this.custom.top !=='undefined' ){
		position.top= this.custom.top;
	}
	// Retina device
	var ratio = e.frameState.pixelRatio;
	ctx.save();
	ctx.scale(ratio,ratio);
/*
	// Position if transform:scale()
	var container = this.getMap().getTargetElement();
	var scx = container.offsetWidth / container.getBoundingClientRect().width;
	var scy = container.offsetHeight / container.getBoundingClientRect().height;
	position.left *= scx;
	position.top *= scy;
*/
	// On top
	position.top += this.element.clientHeight - this.scaleHeight_;
	// Draw scale text
	ctx.beginPath();
    ctx.strokeStyle = this.fontStrokeStyle_;
    ctx.fillStyle = this.fontFillStyle_;
    ctx.lineWidth = this.fontStrokeWidth_;
    ctx.textAlign = "center";
	ctx.textBaseline ="bottom";
	if(this.custom && typeof this.custom.font !=='undefined' ){
		ctx.font = this.custom.font;
	}else{
		ctx.font = this.font_;
	}
	var ctxDirection= ctx.direction;
	ctx.direction='ltr';
	
	

	if(printing){
		//text='Scale: '+text;
		showScaleNumber=false
	}
	if(showScaleNumber && scaleNumber){
		ctx.strokeText(scaleNumber, position.left+scalewidth/2, position.top);
		ctx.fillText(scaleNumber, position.left+scalewidth/2, position.top);

		ctx.textAlign = "start";
		ctx.textBaseline = "hanging";
		ctx.strokeText(text,4+ position.left+scalewidth, position.top +  this.scaleHeight_/2);
		ctx.fillText(text, 4+ position.left+scalewidth,  position.top +  this.scaleHeight_/2);
	}else{
		ctx.strokeText(text, position.left+scalewidth/2, position.top);
		ctx.fillText(text, position.left+scalewidth/2, position.top);
	}
	ctx.direction=ctxDirection;
	ctx.closePath();
	// Draw scale bar
	position.top += 2;
	ctx.lineWidth = this.strokeWidth_;
	ctx.strokeStyle = this.strokeStyle_;
	if(!printing){
		var max = 4;
		var n = parseInt(text);
		while (n%10 === 0) n/=10;
		if (n%5 === 0) max = 5;
		for (var i=0; i<max; i++)
		{	ctx.beginPath();
			ctx.fillStyle = i%2 ? this.fillStyle_ : this.strokeStyle_;
			ctx.rect(position.left+i*scalewidth/max, position.top, scalewidth/max, this.scaleHeight_);
			ctx.stroke();
			ctx.fill();
			ctx.closePath();
		}
	}
	ctx.restore();
	
}

ol.control.CanvasScaleLine.prototype.setScale = function (value) {
	var map = this.getMap();
	if (map && value) {
	  if (value.target) value = value.target.value;
	  var fac = value;
	  if (typeof(value)==='string') {
		fac = value.split('/')[1];
		if (!fac) fac = value;
		fac = fac.replace(/[^\d]/g,'');
		fac = parseInt(fac);
	  }
	  // Calculate new resolution
	  var view = map.getView();
	  var proj = view.getProjection();
	  var center = view.getCenter();
	  var px = map.getPixelFromCoordinate(center);
	  px[1] += 1;
	  var coord = map.getCoordinateFromPixel(px);
	  var d = ol.sphere.getDistance(
		ol.proj.transform(center, proj, 'EPSG:4326'),
		ol.proj.transform(coord, proj, 'EPSG:4326'));
	  d *= this.get('ppi')/.0254
	  view.setResolution(view.getResolution()*fac/d);
	}
	//this._showScale();
  };