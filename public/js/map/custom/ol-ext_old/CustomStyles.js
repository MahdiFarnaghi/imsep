
/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*
*  Add a chart style to display charts (pies or bars) on a map 
*/
/**
 * @requires ol.style.Circle
 * @requires ol.structs.IHasChecksum
 */
/**
 * @classdesc
 * Set chart style for vector features.
 *
 * @constructor
 * @param {} options
 *	@param {String} options.type Chart type: pie,pie3D, donut or bar
 *	@param {number} options.radius Chart radius/size, default 20
 *	@param {number} options.rotation Rotation in radians (positive rotation clockwise). Default is 0.
 *	@param {bool} options.snapToPixel use integral numbers of pixels, default true
 *	@param {_ol_style_Stroke_} options.stroke stroke style
 *	@param {String|Array<ol.color>} options.colors predefined color set "classic","dark","pale","pastel","neon" / array of color string, default classic
 *	@param {number} options.offsetX X offset in px
 *	@param {number} options.offsetY Y offset in px
 *	@param {number} options.animation step in an animation sequence [0,1]
 *	@param {number} options.max maximum value for bar chart
 * @see [Statistic charts example](../../examples/map.style.chart.html)
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.Chart = function(opt_options)
{	var options = opt_options || {};
	var strokeWidth = 0;
	if (opt_options.stroke) strokeWidth = opt_options.stroke.getWidth();
	ol.style.RegularShape.call (this,
		{	radius: options.radius + strokeWidth, 
			fill: new ol.style.Fill({color: [0,0,0]}),
			rotation: options.rotation,
			snapToPixel: options.snapToPixel
		});
	if (options.scale) this.setScale(options.scale);
	this.stroke_ = options.stroke;
	this.radius_ = options.radius || 20;
	this.donutratio_ = options.donutRatio || 0.5;
	this.type_ = options.type;
	this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0];
	this.animation_ = (typeof(options.animation) == 'number') ? { animate:true, step:options.animation } : this.animation_ = { animate:false, step:1 };
	this.max_ = options.max;
	this.data_ = options.data;
	if (options.colors instanceof Array)
	{	this.colors_ = options.colors;
	}
	else 
	{	this.colors_ = ol.style.Chart.colors[options.colors];
		if(!this.colors_) this.colors_ = ol.style.Chart.colors.classic;
	}
	this.renderChart_();
};
ol.inherits(ol.style.Chart, ol.style.RegularShape);
/** Default color set: classic, dark, pale, pastel, neon
*/
ol.style.Chart.colors =
{	"classic":	["#ffa500","blue","red","green","cyan","magenta","yellow","#0f0"],
	"dark":		["#960","#003","#900","#060","#099","#909","#990","#090"],
	"pale":		["#fd0","#369","#f64","#3b7","#880","#b5d","#666"],
	"pastel":	["#fb4","#79c","#f66","#7d7","#acc","#fdd","#ff9","#b9b"], 
	"neon":		["#ff0","#0ff","#0f0","#f0f","#f00","#00f"]
}
/**
 * Clones the style. 
 * @return {ol.style.Chart}
 */
ol.style.Chart.prototype.clone = function()
{	var s = new ol.style.Chart(
	{	type: this.type_,
		radius: this.radius_,
		rotation: this.getRotation(),
		scale: this.getScale(),
		data: this.getData(),
		snapToPixel: this.getSnapToPixel(),
		stroke: this.stroke_,
		colors: this.colors_,
		offsetX: this.offset_[0],
		offsetY: this.offset_[1],
		animation: this.animation_
	});
	s.setScale(this.getScale());
	s.setOpacity(this.getOpacity());
	return s;
};
/** Get data associatied with the chart
*/
ol.style.Chart.prototype.getData = function()
{	return this.data_;
}
/** Set data associatied with the chart
*	@param {Array<number>}
*/
ol.style.Chart.prototype.setData = function(data)
{	this.data_ = data;
	this.renderChart_();
}
/** Get symbol radius
*/
ol.style.Chart.prototype.getRadius = function()
{	return this.radius_;
}
/** Set symbol radius
*	@param {number} symbol radius
*	@param {number} donut ratio
*/
ol.style.Chart.prototype.setRadius = function(radius, ratio)
{	this.radius_ = radius;
	this.donuratio_ = ratio || this.donuratio_;
	this.renderChart_();
}
/** Set animation step 
*	@param {false|number} false to stop animation or the step of the animation [0,1]
*/
ol.style.Chart.prototype.setAnimation = function(step)
{	if (step===false) 
	{	if (this.animation_.animate == false) return;
		this.animation_.animate = false;
	}
	else
	{	if (this.animation_.step == step) return;
		this.animation_.animate = true;
		this.animation_.step = step;
	}
	this.renderChart_();
}
/** @private
*/
ol.style.Chart.prototype.renderChart_ = function(atlasManager)
{	var strokeStyle;
	var strokeWidth = 0;
	if (this.stroke_) 
	{	strokeStyle = ol.color.asString(this.stroke_.getColor());
		strokeWidth = this.stroke_.getWidth();
	}
	// no atlas manager is used, create a new canvas
	var canvas = this.getImage();
	// draw the circle on the canvas
	var context = (canvas.getContext('2d'));
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.lineJoin = 'round';
	var sum=0;
	for (var i=0; i<this.data_.length; i++)
		sum += this.data_[i];
	// reset transform
	context.setTransform(1, 0, 0, 1, 0, 0);
	// then move to (x, y)
	context.translate(0,0);
	var step = this.animation_.animate ? this.animation_.step : 1;
	//console.log(this.animation_.step)
	// Draw pie
	switch (this.type_)
	{	case "donut":
		case "pie3D":
		case "pie":
		{	var a, a0 = Math.PI * (step-1.5);
			var c = canvas.width/2;
			context.strokeStyle = strokeStyle;
			context.lineWidth = strokeWidth;
			context.save();
			if (this.type_=="pie3D") 
			{	context.translate(0, c*0.3);
				context.scale(1, 0.7);
				context.beginPath();
				context.fillStyle = "#369";
				context.arc ( c, c*1.4, this.radius_ *step, 0, 2*Math.PI);
				context.fill();
				context.stroke();
			}
			if (this.type_=="donut")
			{	context.save();
				context.beginPath();
				context.rect ( 0,0,2*c,2*c );
				context.arc ( c, c, this.radius_ *step *this.donutratio_, 0, 2*Math.PI);
				context.clip("evenodd");
			}
			for (var i=0; i<this.data_.length; i++)
			{	context.beginPath();
				context.moveTo(c,c);
				context.fillStyle = this.colors_[i%this.colors_.length];
				a = a0 + 2*Math.PI*this.data_[i]/sum *step;
				context.arc ( c, c, this.radius_ *step, a0, a);
				context.closePath();
				context.fill();
				context.stroke();
				a0 = a;
			}
			if (this.type_=="donut")
			{	context.restore();
				context.beginPath();
				context.strokeStyle = strokeStyle;
				context.lineWidth = strokeWidth;
				context.arc ( c, c, this.radius_ *step *this.donutratio_, Math.PI * (step-1.5), a0);
				context.stroke();
			}
			context.restore();
			break;
		}
		case "bar":
		default:
		{	var max=0;
			if (this.max_){
				max = this.max_;
			}
			else{
				for (var i=0; i<this.data_.length; i++)
				{	if (max < this.data_[i]) max = this.data_[i];
				}
			}
			var s = Math.min(5,2*this.radius_/this.data_.length);
			var c = canvas.width/2;
			var b = canvas.width - strokeWidth;
			var x, x0 = c - this.data_.length*s/2
			context.strokeStyle = strokeStyle;
			context.lineWidth = strokeWidth;
			for (var i=0; i<this.data_.length; i++)
			{	context.beginPath();
				context.fillStyle = this.colors_[i%this.colors_.length];
				x = x0 + s;
				var h = this.data_[i]/max*2*this.radius_ *step;
				context.rect ( x0, b-h, s, h);
				//console.log ( x0+", "+(b-this.data_[i]/max*2*this.radius_)+", "+x+", "+b);
				context.closePath();
				context.fill();
				context.stroke();
				x0 = x;
			}
		}
	}
	// Set Anchor
	var a = this.getAnchor();
	a[0] = c - this.offset_[0];
	a[1] = c - this.offset_[1];
};
/**
 * @inheritDoc
 */
ol.style.Chart.prototype.getChecksum = function()
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3] ||
		this.data_.join('|') != this.checksums_[4]);
	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
			+ this.data_.join('|');
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.data_.join('|')];
	}
	return this.checksums_[0];
};

/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc
 * Fill style with named pattern
 *
 * @constructor
 * @param {olx.style.FillPatternOption=}  options
 *	@param {ol.style.Image|undefined} options.image an image pattern, image must be preloaded to draw on first call
 *	@param {number|undefined} options.opacity opacity with image pattern, default:1
 *	@param {olx.style.fillPattern} options.pattern pattern name (override by image option)
 *	@param {ol.color} options.color pattern color
 *	@param {ol.style.Fill} options.fill fill color (background)
 *	@param {number} options.offset pattern offset for hash/dot/circle/cross pattern
 *	@param {number} options.size line size for hash/dot/circle/cross pattern
 *	@param {number} options.spacing spacing for hash/dot/circle/cross pattern
 *	@param {number|bool} options.angle angle for hash pattern / true for 45deg dot/circle/cross
 *	@param {number} options.scale pattern scale 
 * @extends {ol.style.Fill}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.FillPattern = function(options)
{	if (!options) options = {};
	var pattern;
	var canvas = this.canvas_ = document.createElement('canvas');
	var scale = Number(options.scale)>0 ? Number(options.scale) : 1;
	var ratio = scale*ol.has.DEVICE_PIXEL_RATIO || ol.has.DEVICE_PIXEL_RATIO;
	var ctx = canvas.getContext('2d');
	if (options.image)
	{	options.image.load();
		var img = options.image.getImage();
		if (img.width)
		{	canvas.width = Math.round(img.width *ratio);
			canvas.height = Math.round(img.height *ratio);
			ctx.globalAlpha = typeof(options.opacity) == 'number' ? options.opacity:1;
			ctx.drawImage(img, 0,0, img.width, img.height, 0, 0, canvas.width, canvas.height);
			pattern = ctx.createPattern(canvas, 'repeat');
		}
		else 
		{	var self = this;
			pattern = [0,0,0,0];
			img.onload = function ()
			{	canvas.width = Math.round(img.width *ratio);
				canvas.height = Math.round(img.height *ratio);
				ctx.globalAlpha = typeof(options.opacity) == 'number' ? options.opacity:1;
				ctx.drawImage(img, 0,0, img.width, img.height, 0, 0, canvas.width, canvas.height);
				pattern = ctx.createPattern(canvas, 'repeat');
				self.setColor(pattern);
			}
		}
	}
	else
	{	var pat = this.getPattern_(options);
		canvas.width = Math.round(pat.width *ratio);
		canvas.height = Math.round(pat.height *ratio);
		ctx.beginPath();
		if (options.fill) 
		{	ctx.fillStyle = ol.color.asString(options.fill.getColor());
			ctx.fillRect(0,0, canvas.width, canvas.height);
		}
		ctx.scale(ratio,ratio);
		ctx.lineCap = "round";
		ctx.lineWidth = pat.stroke || 1;
		ctx.fillStyle = ol.color.asString(options.color||"#000");
		ctx.strokeStyle = ol.color.asString(options.color||"#000");
		if (pat.circles) for (var i=0; i<pat.circles.length; i++)
		{	var ci = pat.circles[i]; 
			ctx.beginPath();
			ctx.arc(ci[0], ci[1], ci[2], 0,2*Math.PI);
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
		}
		if (!pat.repeat) pat.repeat=[[0,0]];
		if (pat.char)
		{	ctx.font = pat.font || (pat.width)+"px Arial";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			if (pat.angle) 
			{	ctx.fillText(pat.char, pat.width/4, pat.height/4);
				ctx.fillText(pat.char, 5*pat.width/4, 5*pat.height/4);
				ctx.fillText(pat.char, pat.width/4, 5*pat.height/4);
				ctx.fillText(pat.char, 5*pat.width/4, pat.height/4);
				ctx.fillText(pat.char, 3*pat.width/4, 3*pat.height/4);
				ctx.fillText(pat.char, -pat.width/4, -pat.height/4);
				ctx.fillText(pat.char, 3*pat.width/4, -pat.height/4);
				ctx.fillText(pat.char, -pat.width/4, 3*pat.height/4);
			}
			else ctx.fillText(pat.char, pat.width/2, pat.height/2);
		}
		if (pat.lines) for (var i=0; i<pat.lines.length; i++) for (var r=0; r<pat.repeat.length; r++)
		{	var li = pat.lines[i];
			ctx.beginPath();
			ctx.moveTo(li[0]+pat.repeat[r][0],li[1]+pat.repeat[r][1]);
			for (var k=2; k<li.length; k+=2)
			{	ctx.lineTo(li[k]+pat.repeat[r][0],li[k+1]+pat.repeat[r][1]);
			}
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
			ctx.save()
			ctx.strokeStyle = 'red';
			ctx.strokeWidth = 0.1;
			//ctx.strokeRect(0,0,canvas.width,canvas.height);
			ctx.restore()
		}
		pattern = ctx.createPattern(canvas, 'repeat');
		if (options.offset)
		{	var offset = options.offset;
			if (typeof(offset) == "number") offset = [offset,offset];
			if (offset instanceof Array) 
			{	var dx = Math.round((offset[0]*ratio));
				var dy = Math.round((offset[1]*ratio));
				// New pattern
				ctx.scale(1/ratio,1/ratio)
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.translate(dx,dy);
				ctx.fillStyle = pattern;
				ctx.fillRect(-dx, -dy, canvas.width,canvas.height);
				pattern = ctx.createPattern(canvas, 'repeat');
			}
		}
	}
	ol.style.Fill.call (this, { color: pattern });
};
ol.inherits(ol.style.FillPattern, ol.style.Fill);
/**
 * Clones the style. 
 * @return {ol.style.FillPattern}
 */
ol.style.FillPattern.prototype.clone = function()
{	var s = ol.style.Fill.prototype.clone.call(this);
	s.canvas_ = this.canvas_;
	return s;
};
/** Get canvas used as pattern
*	@return {canvas}
*/
ol.style.FillPattern.prototype.getImage = function()
{	return this.canvas_;
}
/** Get pattern
*	@param {olx.style.FillPatternOption}
*/
ol.style.FillPattern.prototype.getPattern_ = function(options)
{	var pat = ol.style.FillPattern.prototype.patterns[options.pattern]
		|| ol.style.FillPattern.prototype.patterns.dot;
	var d = Math.round(options.spacing)||10;
	var d2 = Math.round(d/2)+0.5;
	switch (options.pattern)
	{	case 'dot':
		case 'circle':
		{	var size = options.size===0 ? 0 : options.size/2 || 2;
			if (!options.angle)
			{	pat.width = pat.height = d;
				pat.circles = [[ d/2, d/2, size ]]
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/2+d, d/2, size ],
						[ d/2-d, d/2, size ],
						[ d/2, d/2+d, size ],
						[ d/2, d/2-d, size ],
						[ d/2+d, d/2+d, size ],
						[ d/2+d, d/2-d, size ],
						[ d/2-d, d/2+d, size ],
						[ d/2-d, d/2-d, size ] ])
				};
			}
			else
			{	d = pat.width = pat.height = Math.round(d*1.4);
				pat.circles = [[ d/4, d/4, size ], [ 3*d/4, 3*d/4, size ]];
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/4+d, d/4, size ],
						[ d/4, d/4+d, size ],
						[ 3*d/4-d, 3*d/4, size ],
						[ 3*d/4, 3*d/4-d, size ],
						[ d/4+d, d/4+d, size ], 
						[ 3*d/4-d, 3*d/4-d, size ] ]);
				}
			}
			break;
		}
		case 'tile':
		case 'square':
		{	var size = options.size===0 ? 0 : options.size/2 || 2;
			if (!options.angle)
			{	pat.width = pat.height = d;
				pat.lines = [[ d/2-size, d/2-size, d/2+size, d/2-size, d/2+size, d/2+size, d/2-size,d/2+size, d/2-size, d/2-size ]]
			}
			else
			{	pat.width = pat.height = d;
				//size *= Math.sqrt(2);
				pat.lines = [[ d/2-size,d/2, d/2,d/2-size, d/2+size,d/2, d/2,d/2+size, d/2-size,d/2 ]]
			}
			if (options.pattern=='square') pat.repeat = [[0,0], [0,d], [d,0], [0,-d], [-d,0], [-d,-d], [d,d], [-d,d], [d,-d] ]
			break;
		}
		case 'cross':
		{	// Limit angle to 0 | 45
			if (options.angle) options.angle = 45;
		}
		case 'hatch':
		{	var a = Math.round(((options.angle||0)-90)%360);
			if (a>180) a -= 360;
			a *= Math.PI/180;
			var cos = Math.cos(a);
			var sin = Math.sin(a);
			if (Math.abs(sin)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0,0.5, d, 0.5 ] ];
				pat.repeat = [ [0,0], [0,d] ];
			}
			else  if (Math.abs(cos)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0.5,0, 0.5, d] ];
				pat.repeat = [ [0,0], [d,0] ];
				if (options.pattern=='cross') 
				{	pat.lines.push ([ 0,0.5, d, 0.5 ]);
					pat.repeat.push([0,d]);
				}
			}
			else
			{	var w = pat.width = Math.round(Math.abs(d/sin)) || 1;
				var h = pat.height = Math.round(Math.abs(d/cos)) || 1;
				if (options.pattern=='cross')
				{	pat.lines = [ [-w,-h, 2*w,2*h], [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0] ];
				}
				else if (cos*sin>0) 
				{	pat.lines = [ [-w,-h, 2*w,2*h] ];
					pat.repeat = [ [0,0], [w,0], [0,h] ];
				}
				else 
				{	pat.lines = [ [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0], [-w,0], [0,h] ];
				}
			}
			pat.stroke = options.size===0 ? 0 : options.size||4;
		}
		default: break;
	}
	return pat
}
/** Static fuction to add char patterns
*	@param {title} 
*	@param {olx.fillpattern.Option}
*		- size {integer} default 10
*		- width {integer} default 10
*		- height {integer} default 10
*		- circles {Array<circles>}
*		- lines: {Array<pointlist>}
*		- stroke {integer}
*		- fill {bool}
*		- char {char}
*		- font {string} default "10px Arial"
*/
ol.style.FillPattern.addPattern = function (title, options)
{	if (!options) options={};
	ol.style.FillPattern.prototype.patterns[title || options.char] =
	{	width: options.width || options.size || 10,
		height: options.height || options.size || 10,
		font: options.font,
		char: options.char,
		circles: options.circles,
		lines: options.lines,
		repeat: options.repeat,
		stroke: options.stroke,
		angle: options.angle,
		fill: options.fill
	}
}
/** Patterns definitions
	Examples : http://seig.ensg.ign.fr/fichchap.php?NOFICHE=FP31&NOCHEM=CHEMS009&NOLISTE=1&N=8
*/
ol.style.FillPattern.prototype.patterns =
{
	"hatch":
	{	width:5,
		height:5,
		lines:[[0,2.5,5,2.5]],
		stroke:1
	},
	"cross":
	{	width:7,
		height:7,
		lines:[[0,3,10,3],[3,0,3,10]],
		stroke:1
	},
	"dot":
	{	width:8,
		height:8,
		circles:[[5,5,2]],
		stroke:false,
		fill:true,
	},
	"circle":
	{	width:10,
		height:10,
		circles:[[5,5,2]],
		stroke:1,
		fill:false,
	},
	"square":
	{	width:10,
		height:10,
		lines:[[3,3, 3,8, 8,8, 8,3, 3,3]],
		stroke:1,
		fill:false,
	},
	"tile":
	{	width:10,
		height:10,
		lines:[[3,3, 3,8, 8,8, 8,3, 3,3]],
		fill:true,
	},
	"woven":
	{	width: 12,
		height: 12,
		lines: [[ 3,3, 9,9 ],[0,12, 3,9], [9,3, 12,0], [-1,1,1,-1], [13,11,11,13]],
		stroke: 1
	},
	"crosses":
	{	width: 8,
		height: 8,
		lines: [[ 2,2, 6,6 ],[2,6,6,2]],
		stroke: 1
	},
	"caps":
	{	width: 8,
		height: 8,
		lines: [[ 2,6, 4,2, 6,6 ]],
		stroke: 1
	},
	"nylon":
	{	width: 20,
		height: 20,
//		lines: [[ 0,5, 0,0, 5,0 ],[ 5,10, 10,10, 10,5 ], [ 10,15, 10,20, 15,20 ],[ 15,10, 20,10, 20,15 ]],
//		repeat: [[0,0], [20,0], [0,20], [-20,0], [0,-20], [-20,-20]],
		lines: [[ 1,6, 1,1, 6,1 ],[ 6,11, 11,11, 11,6 ], [ 11,16, 11,21, 16,21 ],[ 16,11, 21,11, 21,16 ]],
		repeat: [[0,0], [-20,0], [0,-20] ],
		stroke: 1
	},
	"hexagon":
	{	width: 20,
		height: 12,
		lines: [[ 0,10, 4,4, 10,4, 14,10, 10,16, 4,16, 0,10 ]],
		stroke:1,
		repeat:[[0,0],[10,6],[10,-6],[-10,-6]]
	},
	"cemetry":
	{	width:15,
		height:19,
		lines:[[0,3.5,7,3.5],[3.5,0,3.5,10],
			//[7,12.5,14,12.5],[10.5,9,10.5,19]
			],
		stroke:1,
		repeat:[[0,0],[7,9]]
	},
	"sand":
	{	width:20,
		height:20,
		circles:[[1,2,1],[9,3,1],[2,16,1],
				[7,8,1],[6,14,1],[4,19,1],
				[14,2,1],[12,10,1],[14,18,1],
				[18,8,1],[18,14,1]],
		fill:1
	},
	"conglomerate":
	{	width:30,
		height:20,
		circles:[[2,4,1],[17,3,1],[26,18,1],[12,17,1],[5,17,2],[28,11,2]],
		lines:[[7,5, 6,7, 9,9, 11,8, 11,6, 9,5, 7,5], 
			[16,10, 15,13, 16,14, 19,15, 21,13, 22,9, 20,8, 19,8, 16,10], 
			[24,6, 26,7, 27,5, 26,4, 24,4, 24,6]],
		stroke:1
	},
	"gravel":
	{	width:15,
		height:10,
		circles:[[4,2,1],[5,9,1],[1,7,1]],//[9,9,1],,[15,2,1]],
		lines:[[7,5, 6,6, 7,7, 8,7, 9,7, 10,5, 9,4, 7,5], [11,2, 14,4, 14,1, 12,1, 11,2]],
		stroke:1
	},
	"brick":
	{	width:18,
		height:16,
		lines:[	[0,1,18,1],[0,10,18,10], [6,1,6,10],[12,10,12,18],[12,0,12,1]],
		stroke:1
	},
	"dolomite":
	{	width:20,
		height:16,
		lines:[[0,1,20,1],[0,9,20,9],[1,9,6,1],[11,9,14,16],[14,0,14.4,1]],
		stroke:1
	},
	"coal":
	{	width:20,
		height:16,
		lines:[[1,5, 7,1, 7,7], [11,10, 12,5, 18,9], [5,10, 2,15, 9,15,], [15,16, 15,13, 20,16], [15,0, 15,2, 20,0]],
		fill:1
	},
	"breccia":
	{	width:20,
		height:16,
		lines:[[1,5, 7,1, 7,7, 1,5], [11,10, 12,5, 18,9, 11,10], [5,10, 2,15, 9,15, 5,10], [15,16, 15,13, 22,18], [15,0, 15,2, 20,0] ],
		stroke:1,
	},
	"clay":
	{	width:20,
		height:20,
		lines:[[0,0, 3,11, 0,20], [11,0, 10,3, 13,13, 11,20], [0,0, 10,3, 20,0], [0,12, 3,11, 13,13, 20,12]],
		stroke:1
	},
	"flooded":
	{	width:15,
		height:10,
		lines:[	[0,1,10,1],[0,6,5,6], [10,6,15,6]],
		stroke:1
	},
	"chaos":
	{	width:40,
		height:40,
		lines:[[40,2, 40,0, 38,0, 40,2], 
			[4,0, 3,2, 2,5, 0,0, 0,3, 2,7, 5,6, 7,7, 8,10, 9,12, 9,13, 9,14, 8,14, 6,15, 2,15, 0,20, 0,22, 2,20, 5,19, 
				8,15, 10,14, 11,12.25, 10,12, 10,10, 12,9, 13,7, 12,6, 13,4, 16,7, 17,4, 20,0, 18,0, 15,3, 14,2, 14,0,
				12,1, 11,0, 10,1, 11,4, 10,7, 9,8, 8,5, 6,4, 5,3, 5,1, 5,0, 4,0],
			[7,1, 7,3, 8,3, 8,2, 7,1], [4,3, 5,5, 4,5, 4,3], [34,5, 33,7, 38,10, 38,8, 36,5, 34,5], 
			[ 27,0, 23,2, 21,8, 30,0, 27,0], 
			[25,8, 26,12, 26,16, 22.71875,15.375, 20,13, 18,15, 17,18, 13,22, 17,21, 19,22, 21,20, 19,18, 22,17, 30,25, 
			26,26, 24,28, 21.75,33.34375, 20,36, 18,40, 20,40, 24,37, 25,32, 27,31, 26,38, 27,37, 30,32, 32,35, 36,37, 
			38,40, 38,39, 40,40, 37,36, 34,32, 37,31, 36,29, 33,27, 34,24, 39,21, 40,21, 40,16, 37,20, 31,22, 32,25, 
			27,20, 29,15, 30,20, 32,20, 34,18, 33,12, 31,11, 29,14, 26,9, 25,8], [39,24, 37,26, 40,28, 39,24], 
			[13,15, 9,19, 14,18, 13,15], [18,23, 14,27, 16,27, 17,25, 20,26, 18,23], 
			[6,24, 2,26, 1,28, 2,30, 5,28, 12,30, 16,32, 18,30, 15,30, 12,28, 9,25, 7,27, 6,24], 
			[29,27, 32,28, 33,31, 30,29, 27,28, 29,27], 
			[5,35, 1,33, 3,36, 13,38, 15,35, 10,36, 5,35]],
		fill:1,
	},
	"grass":
	{	width:27,
		height:22,
		lines: [[0,10.5,13,10.5], [2.5,10,1.5,7], [4.5,10, 4.5,5, 3.5,4 ], [7,10, 7.5,6, 8.5,3], [10,10,11,6]],
		repeat: [[0,0],[14,10]],
		stroke:1
	},
	"swamp":
	{	width:24,
		height:23,
		lines:[ [0,10.5,9.5,10.5], [2.5,10,2.5,7], [4.5,10,4.5,4], [6.5,10,6.5,6], [3,12.5,7,12.5] ],
		repeat: [[0,0],[14,10]],
		stroke:1
	},
	"wave":
	{	width:10,
		height:8,
		lines:[ [0,0, 5,4, 10,0] ],
		stroke:1
	},
	"vine":
	{	width:13,
		height:13,
		lines:[[3,0,3,6],[9,7,9,13]],
		stroke:1.0
	},
	"forest":
	{	width:55,
		height:30,
		circles:[[7,7,3.5],[20,20,1.5],[42,22,3.5],[35,5,1.5]],
		stroke:1
	},
	"scrub":
	{	width:26,
		height:20,
		lines:[ [1,4, 4,8, 6,4] ],
		circles:[[20,13,1.5]],
		stroke:1,
	},
	"tree":
	{	width:30,
		height:30,
		lines:[[7.78,10.61,4.95,10.61,4.95,7.78,3.54,7.78,2.12,6.36,0.71,6.36,0,4.24,0.71,2.12,4.24,0,7.78,0.71,9.19,3.54,7.78,4.95,7.07,7.07,4.95,7.78]],
		repeat: [[3,1],[18,16]],
		stroke:1
	},
	"pine":
	{	width:30,
		height:30,
		lines:[[5.66,11.31,2.83,11.31,2.83,8.49,0,8.49,2.83,0,5.66,8.49,2.83,8.49]],
		repeat:[[3,1],[18,16]],
		stroke:1
	},
	"pines":
	{	width:22,
		height:20,
		lines:[[1,4,3.5,1,6,4],[1,8,3.5,5,6,8],[3.5,1,3.5,11],[12,14.5,14.5,14,17,14.5],[12,18,17,18],[14.5,12,14.5,18]],
		repeat: [[2,1]],
		stroke:1
	},
	"rock":
	{	width:20,
		height:20,
		lines:[	[1,0,1,9],[4,0,4,9],[7,0,7,9], 
				[10,1,19,1],[10,4,19,4],[10,7,19,7],
				[0,11,9,11],[0,14,9,14],[0,17,9,17], 
				[12,10,12,19],[15,10,15,19],[18,10,18,19] ],
		repeat:[[0.5,0.5]],
		stroke:1
	},
	"rocks":
	{	width:20,
		height:20,
		lines:[	[5,0, 3,0, 5,4, 4,6, 0,3, 0,5, 3,6, 5,9, 3.75,10, 2.5,10, 0,9, 0,10, 4,11, 5,14, 4,15, 0,13,
			0,13, 0,13, 0,14, 0,14, 5,16, 5,18, 3,19, 0,19, -0.25,19.9375, 5,20, 10,19, 10,20, 11,20, 12,19,
			14,20, 15,20, 17,19, 20,20, 20,19, 19,16, 20,15, 20,11, 20,10, 19,8, 20,5, 20,0, 19,0, 20,2, 19,4,
			17,4, 16,3, 15,0, 14,0, 15,4, 11,5, 10,4, 11,0, 10,0, 9,4, 6,5, 5,0,],
			[18,5, 19,6, 18,10, 16,10, 14,9, 16,5, 18,5], 
			[5,6, 9,5, 10,6, 10,9, 6,10, 5,6], 
			[14,5, 14,8, 13,9, 12,9, 11,7, 12,5, 14,5], 
			[ 5,11, 8,10, 9,11, 10,14, 6,15, 6,15, 5,11], 
			[13,10, 14,11, 15,14, 15,14, 15,14, 11,15, 10,11, 11,10, 13,10], 
			[15,12, 16,11, 19,11, 19,15, 16,14, 16,14, 15,12], 
			[6,16, 9,15, 10,18, 5,19, 6,16], 
			[10,16, 14,16, 14,18, 13,19, 11,18, 10,16], 
			[15,15, 18,16, 18,18, 16,19, 15,18, 15,15]],
		stroke:1
	}
}
/**
 * /
ol.style.FillPattern.prototype.getChecksum = function()
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var fillChecksum = (this.fill_!==null) ?
		this.fill_.getChecksum() : '-';
	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3] ||
		this.form_+"-"+this.glyphs_ != this.checksums_[4]);
	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
			+ this.form_+"-"+this.glyphs_;
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.form_+"-"+this.glyphs_];
	}
	return this.checksums_[0];
};
/**/

/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @requires ol.style.Circle
 * @requires ol.structs.IHasChecksum
 */
/**
 * @classdesc
 * A marker style to use with font symbols.
 *
 * @constructor
 * @param {} options Options.
 *  @param {number} options.glyph the glyph name or a char to display as symbol. 
 * 		The name must be added using the {@link ol.style.FontSymbol.addDefs} function.
 *  @param {string} options.form 
 * 		none|circle|poi|bubble|marker|coma|shield|blazon|bookmark|hexagon|diamond|triangle|sign|ban|lozenge|square
 * 		a form that will enclose the glyph, default none
 *  @param {number} options.radius
 *  @param {number} options.rotation
 *  @param {number} options.rotateWithView
 *  @param {number} options.opacity
 *  @param {number} options.fontSize, default 1
 *  @param {string} options.fontStyle the font style (bold, italic, bold italic, etc), default none
 *  @param {boolean} options.gradient true to display a gradient on the symbol
 *  @param {_ol_style_Fill_} options.fill
 *  @param {_ol_style_Stroke_} options.stroke
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.FontSymbol = function(options)
{	options = options || {};
	var strokeWidth = 0;
	if (options.stroke) strokeWidth = options.stroke.getWidth();
	ol.style.RegularShape.call (this,{ radius: options.radius, fill:options.fill,
									rotation:options.rotation, rotateWithView: options.rotateWithView });
	if (typeof(options.opacity)=="number") this.setOpacity(options.opacity);
	this.color_ = options.color;
	this.fontSize_ = options.fontSize || 1;
	this.fontStyle_ = options.fontStyle || '';
	this.stroke_ = options.stroke;
	this.fill_ = options.fill;
	this.radius_orig=options.radius;
	this.radius_ = options.radius -strokeWidth;
	this.form_ = options.form || "none";
	this.gradient_ = options.gradient;
	this.offset_ = [options.offsetX ? options.offsetX :0, options.offsetY ? options.offsetY :0];
	this.glyph_ = this.getGlyph(options.glyph) || "";
	this.renderMarker_();
};
ol.inherits(ol.style.FontSymbol, ol.style.RegularShape);
/** Cool stuff to get the image symbol for a style
*/
ol.style.Image.prototype.getImagePNG = function()
{	var canvas = this.getImage();
	if (canvas) 
	{	try { return canvas.toDataURL("image/png"); }
		catch(e) { return false; }
	}
	else return false;
}
/** 
 *	Font defs
 */
ol.style.FontSymbol.prototype.defs = { 'fonts':{}, 'glyphs':{} };
/** Static function : add new font defs 
 * @param {String|Object} font the font desciption
 * @param {} glyphs a key / value list of glyph definitions. 
 * 		Each key is the name of the glyph, 
 * 		the value is an object that code the font, the caracter code, 
 * 		the name and a search string for the glyph.
 */
 ol.style.FontSymbol.addDefs = function(font, glyphs)
 {	var thefont = font;
	if (typeof(font) == "string") thefont = {"font":font, "name":font, "copyright":"" };
	if (!thefont.font || typeof(thefont.font) != "string") 
	{	console.log("bad font def");
		return;
	}
	var fontname = thefont.font;
	ol.style.FontSymbol.prototype.defs.fonts[fontname] = thefont;
	for (var i in glyphs)
	{	var g = glyphs[i];
		if (typeof(g) == "string" && g.length==1) g = { char: g };
		ol.style.FontSymbol.prototype.defs.glyphs[i] =
			{	font: thefont.font,
				char: g.char || ""+String.fromCharCode(g.code) || "",
				theme: g.theme || thefont.name,
				name: g.name || i,
				search: g.search || ""
			};
	}
 };
/**
 * Clones the style. 
 * @return {ol.style.FontSymbol}
 */
ol.style.FontSymbol.prototype.clone = function()
{	var g = new ol.style.FontSymbol(
	{	glyph: "",
		color: this.color_,
		fontSize: this.fontSize_,
		fontStyle: this.fontStyle_,
		stroke: this.stroke_,
		fill: this.fill_,
		radius: this.radius_orig || (this.radius_ + (this.stroke_ ? this.stroke_.getWidth():0)),
		form: this.form_,
		gradient: this.gradient_,
		offsetX: this.offset_[0],
		offsetY: this.offset_[1],
		opacity: this.getOpacity(),
		rotation: this.getRotation(),
		rotateWithView: this.getRotateWithView()
	});
	g.setScale(this.getScale());
	g.glyph_ = this.glyph_;
	g.renderMarker_();
	return g;
};
ol.style.FontSymbol.prototype.getRadius = function() {
	return this.radius_orig || (this.radius_ + (this.stroke_ ? this.stroke_.getWidth():0));
  };
/**
 * Get the fill style for the symbol.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.FontSymbol.prototype.getFill = function() {
  return this.fill_;
};
/**
 * Get the stroke style for the symbol.
 * @return {_ol_style_Stroke_} Stroke style.
 * @api
 */
ol.style.FontSymbol.prototype.getStroke = function() {
  return this.stroke_;
};
/**
 * Get the glyph definition for the symbol.
 * @param {string|undefined} name a glyph name to get the definition, default return the glyph definition for the style.
 * @return {_ol_style_Stroke_} Stroke style.
 * @api
 */
ol.style.FontSymbol.prototype.getGlyph = function(name)
{	if (name) return ol.style.FontSymbol.prototype.defs.glyphs[name] || { "font":"none","char":name.charAt(0),"theme":"none","name":"none", "search":""};
	else return this.glyph_;
};
/**
 * Get the glyph name.
 * @return {string} the name
 * @api
 */
ol.style.FontSymbol.prototype.getGlyphName = function()
{	for (var i in ol.style.FontSymbol.prototype.defs.glyphs)
	{	if (ol.style.FontSymbol.prototype.defs.glyphs[i] === this.glyph_) return i;
	}
	return "";
};
/**
 * Get the stroke style for the symbol.
 * @return {_ol_style_Stroke_} Stroke style.
 * @api
 */
ol.style.FontSymbol.prototype.getFontInfo = function(glyph)
{	return ol.style.FontSymbol.prototype.defs.fonts[glyph.font];
}
/** @private
 */
ol.style.FontSymbol.prototype.renderMarker_ = function(atlasManager)
{
	var strokeStyle;
	var strokeWidth = 0;
	if (this.stroke_) 
	{	strokeStyle = ol.color.asString(this.stroke_.getColor());
		strokeWidth = this.stroke_.getWidth();
	}
	// no atlas manager is used, create a new canvas
	var canvas = this.getImage();
	//console.log(this.getImage().width+" / "+(2 * (this.radius_ + strokeWidth) + 1));
	/** @type {ol.style.FontSymbol.RenderOptions} */
	var renderOptions = {
		strokeStyle: strokeStyle,
		strokeWidth: strokeWidth,
		size: canvas.width,
	};
	// draw the circle on the canvas
	var context = (canvas.getContext('2d'));
	context.clearRect(0, 0, canvas.width, canvas.height);
	this.drawMarker_(renderOptions, context, 0, 0);
	// Set Anchor
	var a = this.getAnchor();
	a[0] = canvas.width / 2 - this.offset_[0];
	a[1] = canvas.width / 2 - this.offset_[1];
	//this.createMarkerHitDetectionCanvas_(renderOptions);
};
/**
 * @private
 * @param {ol.style.FontSymbol.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 */
ol.style.FontSymbol.prototype.drawPath_ = function(renderOptions, context)
{
	var s = 2*this.radius_+renderOptions.strokeWidth+1;
	var w = renderOptions.strokeWidth/2;
	var c = renderOptions.size / 2;
	// Transfo to place the glyph at the right place
	var transfo = { fac:1, posX:renderOptions.size / 2, posY:renderOptions.size / 2 };
	context.lineJoin = 'round';
	context.beginPath();
	// Draw the path with the form
	switch (this.form_)
	{	case "none": transfo.fac=1;  break;
		case "circle":
		case "ban":
			context.arc ( c, c, s/2, 0, 2 * Math.PI, true);
			break;
		case "poi":
			context.arc ( c, c -0.4*this.radius_, 0.6*this.radius_, 0.15*Math.PI, 0.85*Math.PI, true);
			context.lineTo ( c-0.89*0.05*s, (0.95+0.45*0.05)*s+w);
			context.arc ( c, 0.95*s+w, 0.05*s, 0.85*Math.PI, 0.15*Math.PI, true);
			transfo = { fac:0.45, posX:c, posY:c -0.35*this.radius_ };
			break;
		case "bubble":
			context.arc ( c, c -0.2*this.radius_, 0.8*this.radius_, 0.4*Math.PI, 0.6*Math.PI, true);
			context.lineTo ( 0.5*s+w, s+w);
			transfo = { fac:0.7, posX:c, posY:c -0.2*this.radius_ };
			break;
		case "marker":
			context.arc ( c, c -0.2*this.radius_, 0.8*this.radius_, 0.25*Math.PI, 0.75*Math.PI, true);
			context.lineTo ( 0.5*s+w, s+w);
			transfo = { fac:0.7, posX: c, posY: c -0.2*this.radius_ };
			break;
		case "coma":
		/*
			context.arc( renderOptions.size / 2, renderOptions.size / 2 +0.2*this.radius_, 0.8*this.radius_, 0.5*Math.PI, 0, true);
			context.arc( renderOptions.size / 2, renderOptions.size / 2 -0.2*this.radius_, 0.8*this.radius_, 0, 0.5*Math.PI, true);
		*/
			context.moveTo ( c + 0.8*this.radius_, c -0.2*this.radius_);
			context.quadraticCurveTo ( 0.95*s+w, 0.75*s+w, 0.5*s+w, s+w);
			context.arc ( c, c -0.2*this.radius_, 0.8*this.radius_, 0.45*Math.PI, 0, false);
			transfo = { fac:0.7, posX: c, posY: c -0.2*this.radius_ };
			break;
		default:
		{	var pts;
			switch (this.form_)
			{	case "shield": 
					pts = [ 0.05,0, 0.95,0, 0.95,0.8, 0.5,1, 0.05,0.8, 0.05,0 ]; 
					transfo.posY = 0.45*s+w ;
					break;
				case "blazon": 
					pts = [ 0.1,0, 0.9,0, 0.9,0.8, 0.6,0.8, 0.5,1, 0.4,0.8, 0.1,0.8, 0.1,0 ]; 
					transfo.fac = 0.8;
					transfo.posY = 0.4*s+w ;
					break;
				case "bookmark": 
					pts = [ 0.05,0, 0.95,0, 0.95,1, 0.5,0.8, 0.05,1, 0.05,0 ]; 
					transfo.fac = 0.9;
					transfo.posY = 0.4*s+w ;
					break;
				case "hexagon": 
					pts = [ 0.05,0.2, 0.5,0, 0.95,0.2, 0.95,0.8, 0.5,1, 0.05,0.8, 0.05,0.2 ]; 
					transfo.fac = 0.9;
					transfo.posY = 0.5*s+w ;
					break;
				case "diamond": 
					pts = [ 0.25,0, 0.75,0, 1,0.2, 1,0.4, 0.5,1, 0,0.4, 0,0.2, 0.25,0 ]; 
					transfo.fac = 0.75 ;
					transfo.posY = 0.35*s+w ;
					break;
				case "triangle": 
					pts = [ 0,0, 1,0, 0.5,1, 0,0 ]; 
					transfo.fac = 0.6 ;
					transfo.posY = 0.3*s+w ;
					break;
				case "sign": 
					pts = [ 0.5,0.05, 1,0.95, 0,0.95, 0.5,0.05 ]; 
					transfo.fac = 0.7 ;
					transfo.posY = 0.65*s+w ;
					break;
				case "lozenge": 
					pts = [ 0.5,0, 1,0.5, 0.5,1, 0,0.5, 0.5,0 ]; 
					transfo.fac = 0.7;
					break;
				case "square": 
				default: 
					pts = [ 0,0, 1,0, 1,1, 0,1, 0,0 ]; break;
			}
			for (var i=0; i<pts.length; i+=2) context.lineTo ( pts[i]*s+w, pts[i+1]*s+w);
		}
	}
	context.closePath();
	return transfo;
}
/**
 * @private
 * @param {ol.style.FontSymbol.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.FontSymbol.prototype.drawMarker_ = function(renderOptions, context, x, y)
{	var fcolor = this.fill_ ? this.fill_.getColor() : "#000";
	var scolor = this.stroke_ ? this.stroke_.getColor() : "#000";
	if (this.form_ == "none" && this.stroke_ && this.fill_)
	{	scolor = this.fill_.getColor();
		fcolor = this.stroke_.getColor();
	}
	// reset transform
	context.setTransform(1, 0, 0, 1, 0, 0);
	// then move to (x, y)
	context.translate(x, y);
	var tr = this.drawPath_(renderOptions, context);
	if (this.fill_) 
	{	if (this.gradient_ && this.form_!="none")
		{	var grd = context.createLinearGradient(0,0,renderOptions.size/2,renderOptions.size);
			grd.addColorStop (1, ol.color.asString(fcolor));
			grd.addColorStop (0, ol.color.asString(scolor));
			context.fillStyle = grd;
		}
		else context.fillStyle = ol.color.asString(fcolor);
		context.fill();
	}
	if (this.stroke_ && renderOptions.strokeWidth) {
		context.strokeStyle = renderOptions.strokeStyle;
		context.lineWidth = renderOptions.strokeWidth;
		context.stroke();
	}
	// Draw the symbol
	if (this.glyph_.char)
	{	
		var fontWeight='';
		if(this.glyph_.font=='Font Awesome 5 Free'){
			fontWeight= 900;
		}
		context.font = this.fontStyle_ +' ' + fontWeight +' '
				+ (2*tr.fac*(this.radius_)*this.fontSize_)+"px "
				+ '"'+this.glyph_.font+'"';
						
		context.strokeStyle = context.fillStyle;
		context.lineWidth = renderOptions.strokeWidth * (this.form_ == "none" ? 2:1);
		context.fillStyle = ol.color.asString(this.color_ || scolor);
		context.textAlign = "center";
		context.textBaseline = "middle";
		var t = this.glyph_.char;
		if (renderOptions.strokeWidth && scolor!="transparent") context.strokeText(t, tr.posX, tr.posY);
		context.fillText(t, tr.posX, tr.posY);
	}
	if (this.form_=="ban" && this.stroke_ && renderOptions.strokeWidth) 
	{	context.strokeStyle = renderOptions.strokeStyle;
		context.lineWidth = renderOptions.strokeWidth;
		var r = this.radius_ + renderOptions.strokeWidth;
		var d = this.radius_ * Math.cos(Math.PI/4);
		context.moveTo(r + d, r - d);
		context.lineTo(r - d, r + d);
		context.stroke();
	}
};
/**
 * @inheritDoc
 */
ol.style.FontSymbol.prototype.getChecksum = function()
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var fillChecksum = (this.fill_!==null) ?
		this.fill_.getChecksum() : '-';
	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3] ||
		this.form_+"-"+this.glyphs_ != this.checksums_[4]);
	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
			+ this.form_+"-"+this.glyphs_;
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.form_+"-"+this.glyphs_];
	}
	return this.checksums_[0];
};

/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*
*  Photo style for vector features
*/
/**
 * @requires ol.style.RegularShape
 * @requires ol.structs.IHasChecksum
 */
/**
 * @classdesc
 * Set Photo style for vector features.
 *
 * @constructor
 * @param {} options
 *  @param { default | square | round | anchored | folio } options.kind
 *  @param {boolean} options.crop crop within square, default is false
 *  @param {Number} options.radius symbol size
 *  @param {boolean} options.shadow drop a shadow
 *  @param {ol.style.Stroke} options.stroke
 *  @param {String} options.src image src
 *  @param {String} options.crossOrigin The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data with the Canvas renderer.
 *  @param {Number} options.offsetX Horizontal offset in pixels. Default is 0.
 *  @param {Number} options.offsetY Vertical offset in pixels. Default is 0.
 *  @param {function} options.onload callback when image is loaded (to redraw the layer)
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.Photo = function(options)
{	options = options || {};
	this.sanchor_ = options.kind=="anchored" ? 8:0;
	this.shadow_ = Number(options.shadow) || 0;
	if (!options.stroke) 
	{	options.stroke = new ol.style.Stroke({ width: 0, color: "#000"})
	}
	var strokeWidth = options.stroke.getWidth();
	if (strokeWidth<0) strokeWidth = 0;
	if (options.kind=='folio') strokeWidth += 6;
	options.stroke.setWidth(strokeWidth);
	ol.style.RegularShape.call (this,
	{	radius: options.radius + strokeWidth + this.sanchor_/2 + this.shadow_/2, 
		points:0
	//	fill:new ol.style.Fill({color:"red"}) // No fill to create a hit detection Image
	});
	// Hack to get the hit detection Image (no API exported)
	if (!this.hitDetectionCanvas_)
	{	var img = this.getImage();
		for (var i in this)
		{	if (this[i] && this[i].getContext && this[i]!==img)
			{	this.hitDetectionCanvas_ = this[i];
				break;
			}
		}
	}
	this.stroke_ = options.stroke;
	this.fill_ = options.fill;
	this.crop_ = options.crop;
	this.crossOrigin_ = options.crossOrigin;
	this.kind_ = options.kind || "default";
	this.radius_ = options.radius;
	this.src_ = options.src;
	this.offset_ = [options.offsetX ? options.offsetX :0, options.offsetY ? options.offsetY :0];
	this.onload_ = options.onload;
	if (typeof(options.opacity)=='number') this.setOpacity(options.opacity);
	if (typeof(options.rotation)=='number') this.setRotation(options.rotation);
	this.renderPhoto_();
};
ol.inherits(ol.style.Photo, ol.style.RegularShape);
/**
 * Clones the style. 
 * @return {ol.style.Photo}
 */
ol.style.Photo.prototype.clone = function()
{	return new ol.style.Photo(
	{	stroke: this.stroke_,
		fill: this.fill_,
		shadow: this.shadow_,
		crop: this.crop_,
		crossOrigin: this.crossOrigin_,
		kind: this.kind_,
		radius: this.radius_,
		src: this.src_,
		offsetX: this.offset_[0],
		offsetY: this.offset_[1],
		opacity: this.getOpacity(),
		rotation: this.getRotation()
	});
};
/**
 * Draws a rounded rectangle using the current state of the canvas. 
 * Draw a rectangle if the radius is null.
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate 
 * @param {Number} width The width of the rectangle 
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius.
 */
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) 
{	if (!r) this.rect(x,y,w,h);
	else
	{	if (w < 2 * r) r = w / 2;
		if (h < 2 * r) r = h / 2;
		this.beginPath();
		this.moveTo(x+r, y);
		this.arcTo(x+w, y, x+w, y+h, r);
		this.arcTo(x+w, y+h, x, y+h, r);
		this.arcTo(x, y+h, x, y, r);
		this.arcTo(x, y, x+w, y, r);
		this.closePath();
	}
	return this;
}
/**
 * Draw the form without the image
 * @private
 */
ol.style.Photo.prototype.drawBack_ = function(context, color, strokeWidth)
{	var canvas = context.canvas;
	context.beginPath();
    context.fillStyle = color;
	context.clearRect(0, 0, canvas.width, canvas.height);
	switch (this.kind_)
	{	case 'square':
			context.rect(0,0,canvas.width-this.shadow_, canvas.height-this.shadow_);
			break;
		case 'circle':
			context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_+strokeWidth, 0, 2 * Math.PI, false);
			break;
		case 'folio':
			offset = 6;
			strokeWidth -= offset;
			context.strokeStyle = 'rgba(0,0,0,0.5)';
			var w = canvas.width-this.shadow_-2*offset;
			var a = Math.atan(6/w);
			context.save();
			context.rotate(-a);
			context.translate(-6,2);
			context.beginPath();
			context.rect(offset,offset,w,w);
			context.stroke();
			context.fill();
			context.restore();
			context.save();
			context.translate(6,-1);
			context.rotate(a);
			context.beginPath();
			context.rect(offset,offset,w,w);
			context.stroke();
			context.fill();
			context.restore();
			context.beginPath();
			context.rect(offset,offset,w,w);
			context.stroke();
			break;
		case 'anchored':
			context.roundRect(this.sanchor_/2,0,canvas.width-this.sanchor_-this.shadow_, canvas.height-this.sanchor_-this.shadow_, strokeWidth);
			context.moveTo(canvas.width/2-this.sanchor_-this.shadow_/2,canvas.height-this.sanchor_-this.shadow_);
			context.lineTo(canvas.width/2+this.sanchor_-this.shadow_/2,canvas.height-this.sanchor_-this.shadow_);
			context.lineTo(canvas.width/2-this.shadow_/2,canvas.height-this.shadow_);break;
		default: /* roundrect */
			context.roundRect(0,0,canvas.width-this.shadow_, canvas.height-this.shadow_, strokeWidth);
			break;
	}
	context.closePath();
}
/**
 * @private
 */
ol.style.Photo.prototype.renderPhoto_ = function()
{
	var strokeStyle;
	var strokeWidth = 0;
	if (this.stroke_) 
	{	strokeStyle = ol.color.asString(this.stroke_.getColor());
		strokeWidth = this.stroke_.getWidth();
	}
	var canvas = this.getImage();
	// Draw hitdetection image
	var context = this.hitDetectionCanvas_.getContext('2d');
	this.drawBack_(context,"#000",strokeWidth);
    context.fill();
	// Draw the image
	var context = (canvas.getContext('2d'));
	this.drawBack_(context,strokeStyle,strokeWidth);
	// Draw a shadow
	if (this.shadow_)
	{	context.shadowColor = 'rgba(0,0,0,0.5)';
		context.shadowBlur = this.shadow_/2;
		context.shadowOffsetX = this.shadow_/2;
		context.shadowOffsetY = this.shadow_/2;
	}
    context.fill();
	context.shadowColor = 'transparent';
	var self = this;
	var img = this.img_ = new Image();
	if (this.crossOrigin_) img.crossOrigin = this.crossOrigin_;
	img.src = this.src_;
	// Draw image
	if (img.width) self.drawImage_(img);
	else img.onload = function()
	{	self.drawImage_(img);
		// Force change (?!)
		// self.setScale(1);
		if (self.onload_) self.onload_();
	};
	// Set anchor
	var a = this.getAnchor();
	a[0] = (canvas.width - this.shadow_)/2;
	a[1] = (canvas.height - this.shadow_)/2;
	if (this.sanchor_)
	{	a[1] = canvas.height - this.shadow_;
	}
}
/**
 * Draw an timage when loaded
 * @private
 */
ol.style.Photo.prototype.drawImage_ = function(img)
{	var canvas = this.getImage();
	// Remove the circle on the canvas
	var context = (canvas.getContext('2d'));
	var strokeWidth = 0;
	if (this.stroke_) strokeWidth = this.stroke_.getWidth();
	var size = 2*this.radius_;
	context.save();
	if (this.kind_=='circle')
	{	context.beginPath();
		context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_, 0, 2 * Math.PI, false);
		context.clip();
	}
	var s, x, y, w, h, sx, sy, sw, sh;
	// Crop the image to a square vignette
	if (this.crop_) 
	{	s = Math.min (img.width/size, img.height/size);
		sw = sh = s*size;
		sx = (img.width-sw)/2;
		sy = (img.height-sh)/2;
		x = y = 0;
		w = h = size+1;
	}
	// Fit the image to the size
	else 
	{	s = Math.min (size/img.width, size/img.height);
		sx = sy = 0;
		sw = img.width;
		sh = img.height;
		w = s*sw;
		h = s*sh;
		x = (size-w)/2;
		y = (size-h)/2;
	}
	x += strokeWidth + this.sanchor_/2;
	y += strokeWidth;
	context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
	context.restore();
	// Draw a circle to avoid aliasing on clip
	if (this.kind_=='circle' && strokeWidth)
	{	context.beginPath();
		context.strokeStyle = ol.color.asString(this.stroke_.getColor());
		context.lineWidth = strokeWidth/4;
		context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_, 0, 2 * Math.PI, false);
		context.stroke();
	}
}
/**
 * @inheritDoc
 */
ol.style.Photo.prototype.getChecksum = function()
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var fillChecksum = (this.fill_!==null) ?
		this.fill_.getChecksum() : '-';
	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3]);
	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-');
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_];
	}
	return this.checksums_[0];
};

/** Add a setTextPath style to draw text along linestrings
@toto letterpadding/spacing, wordpadding/spacing
*/
(function()
{
/** Internal drawing function called on postcompose
* @param {ol.eventPoscompose} e postcompose event
*/
function drawTextPath (e)
{	// Prent drawing at large resolution
	if (e.frameState.viewState.resolution > this.textPathMaxResolution_) return;
	var extent = e.frameState.extent;
	var c2p = e.frameState.coordinateToPixelTransform;
	// Get pixel path with coordinates
	function getPath(c, readable)
	{	var path1 = [];
		for (var k=0; k<c.length; k++) 
		{	path1.push(c2p[0]*c[k][0]+c2p[1]*c[k][1]+c2p[4]);
			path1.push(c2p[2]*c[k][0]+c2p[3]*c[k][1]+c2p[5]);
		}
		// Revert line ?
		if (readable && path1[0]>path1[path1.length-2])
		{	var path2 = [];
			for (var k=path1.length-2; k>=0; k-=2)
			{	path2.push(path1[k]);
				path2.push(path1[k+1]);
			}
			return path2;
		}
		else return path1;
	}
	var ctx = e.context;
	ctx.save();
	ctx.scale(e.frameState.pixelRatio,e.frameState.pixelRatio);
	var features = this.getSource().getFeaturesInExtent(extent);
	for (var i=0, f; f=features[i]; i++)
	{	{	var style = this.textPathStyle_(f,e.frameState.viewState.resolution);
			for (var s,j=0; s=style[j]; j++)
			{	
				var g = s.getGeometry() || f.getGeometry();
				var c;
				switch (g.getType())
				{	case "LineString": c = g.getCoordinates(); break;
					case "MultiLineString": c = g.getLineString(0).getCoordinates(); break;
					default: continue;
				}
				var st = s.getText();
				var path = getPath(c, st.getRotateWithView() );
				ctx.font = st.getFont();
				ctx.textBaseline = st.getTextBaseline();
				ctx.textAlign = st.getTextAlign();
				ctx.lineWidth = st.getStroke() ? (st.getStroke().getWidth()||0) : 0;
				ctx.strokeStyle = st.getStroke() ? (st.getStroke().getColor()||"#fff") : "#fff";
				ctx.fillStyle = st.getFill() ? st.getFill().getColor()||"#000" : "#000";
				// New params
				ctx.textJustify = st.getTextAlign()=="justify";
				ctx.textOverflow = st.getTextOverflow ? st.getTextOverflow():"";
				ctx.minWidth = st.getMinWidth ? st.getMinWidth():0;
				// Draw textpath
				ctx.textPath(st.getText()||f.get("name"), path);
			}
		}
	}
	ctx.restore();
}
/** Set the style for features. 
*	This can be a single style object, an array of styles, or a function that takes a feature and resolution and 
*	returns an array of styles. If it is undefined the default style is used. 
*	If it is null the layer has no style (a null style). 
*	See ol.style for information on the default style.
*	@param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} style
*	@param {Number} maxResolution to display text, default: 0
*/
ol.layer.Vector.prototype.setTextPathStyle = function(style, maxResolution)
{
	// Remove existing style
	if (style===null)
	{	if (this.textPath_) this.unByKey(this.textPath_);
		this.textPath_ = null;
		this.changed();
		return;
	}
	// New postcompose
	if (!this.textPath_)
	{	this.textPath_ = this.on('postcompose', drawTextPath.bind(this));
	}
	// Set textPathStyle
	if (style===undefined)
	{	style = [ new ol.style.Style({ text: new ol.style.Text()}) ];
	}
	if (typeof(style) == "function") this.textPathStyle_ = style;
	else this.textPathStyle_ = function() { return style; };
	this.textPathMaxResolution_ = Number(maxResolution) || Number.MAX_VALUE;
	// Force redraw
	this.changed();
}
/** Add new properties to ol.style.Text
* to use with ol.layer.Vector.prototype.setTextPathStyle
* @constructor
* @param {} options
*	@param {visible|ellipsis|string} textOverflow
*	@param {number} minWidth minimum width (px) to draw text, default 0
*/
ol.style.TextPath = function(options)
{	if (!options) options={};
	ol.style.Text.call (this, options);
	this.textOverflow_ = typeof(options.textOverflow)!="undefined" ?  options.textOverflow : "visible";
	this.minWidth_ = options.minWidth || 0;
}
ol.inherits(ol.style.TextPath, ol.style.Text);
ol.style.TextPath.prototype.getTextOverflow = function()
{	return this.textOverflow_; 
};
ol.style.TextPath.prototype.getMinWidth = function()
{	return this.minWidth_; 
};
/**/
})();
/** CanvasRenderingContext2D: draw text along path
* @param {string} text
* @param {Array<Number>} path
*/
CanvasRenderingContext2D.prototype.textPath = function (text, path)
{
	var ctx = this;
	function dist2D(x1,y1,x2,y2)
	{	var dx = x2-x1;
		var dy = y2-y1;
		return Math.sqrt(dx*dx+dy*dy);
	}
	var di, dpos=0;
	var pos=2;
	function getPoint(path, dl)
	{	if (!di || dpos+di<dl)
		{ for (; pos<path.length; )
			{	di = dist2D(path[pos-2],path[pos-1],path[pos],path[pos+1]);
				if (dpos+di>dl) break;
				pos += 2;
				if (pos>=path.length) break;
				dpos += di;
			}
		}
		var x, y, a, dt = dl-dpos;
		if (pos>=path.length) 
		{	pos = path.length-2;
		}
		if (!dt) 
		{	x = path[pos-2];
			y = path[pos-1];
			a = Math.atan2(path[pos+1]-path[pos-1], path[pos]-path[pos-2]);
		}
		else
		{	x = path[pos-2]+ (path[pos]-path[pos-2])*dt/di;
			y = path[pos-1]+(path[pos+1]-path[pos-1])*dt/di;
			a = Math.atan2(path[pos+1]-path[pos-1], path[pos]-path[pos-2]);
		}
		return [x,y,a];
	}
	var letterPadding = ctx.measureText(" ").width *0.25;
	var start = 0;
	var d = 0;
	for (var i=2; i<path.length; i+=2)
	{	d += dist2D(path[i-2],path[i-1],path[i],path[i+1])
	}
	if (d < ctx.minWidth) return;
	var nbspace = text.split(" ").length -1;
	// Remove char for overflow
	if (ctx.textOverflow != "visible")
	{	if (d < ctx.measureText(text).width + (text.length-1 + nbspace) * letterPadding)
		{	var overflow = (ctx.textOverflow=="ellipsis") ? '\u2026' : ctx.textOverflow;
			do
			{	nbspace = text.split(" ").length -1;
				text = text.slice(0,text.length-1);
			} while (text && d < ctx.measureText(text+overflow).width + (text.length + overflow.length-1 + nbspace) * letterPadding)
			text += overflow;
		}
	}
	switch (ctx.textJustify || ctx.textAlign)
	{	case true: // justify
		case "center":
		case "end":
		case "right":
		{	// Text align
			if (ctx.textJustify) 
			{	start = 0;
				letterPadding = (d - ctx.measureText(text).width) / (text.length-1 + nbspace);
			}
			else
			{	start = d - ctx.measureText(text).width - (text.length + nbspace) * letterPadding;
				if (ctx.textAlign == "center") start /= 2;
			}
			break;
		}
		default: break;
	}
	for (var t=0; t<text.length; t++)
	{	var letter = text[t];
		var wl = ctx.measureText(letter).width;
		var p = getPoint(path, start+wl/2);
		ctx.save();
		ctx.textAlign = "center";
		ctx.translate(p[0], p[1]);
		ctx.rotate(p[2]);
		if (ctx.lineWidth) ctx.strokeText(letter,0,0);
		ctx.fillText(letter,0,0);
		ctx.restore();
		start += wl+letterPadding*(letter==" "?2:1);
	}
};
//NB: (Not confirmed)To use this module, you just have to :
//   import('ol-ext/layer/getpreview')
/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*
*  Shadow image style for point vector features
*/
/**
 * @requires ol.style.Circle
 * @requires ol.structs.IHasChecksum
 */
/**
 * @classdesc
 * Set Shadow style for point vector features.
 *
 * @constructor
 * @param {} options Options.
 *   @param {ol.style.Fill | undefined} options.fill fill style, default rgba(0,0,0,0.5)
 *   @param {number} options.radius point radius
 * 	 @param {number} options.blur lur radius, default radius/3
 * 	 @param {number} options.offsetX x offset, default 0
 * 	 @param {number} options.offsetY y offset, default 0
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.Shadow = function(options)
{	options = options || {};
	if (!options.fill) options.fill = new ol.style.Fill({ color: "rgba(0,0,0,0.5)" });
	ol.style.RegularShape.call (this,{ radius: options.radius, fill: options.fill });
	this.fill_ = options.fill;
	this.radius_ = options.radius;
	this.blur_ = options.blur===0 ? 0 : options.blur || options.radius/3;
	this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0];
	this.renderShadow_();
};
ol.inherits(ol.style.Shadow, ol.style.RegularShape);
/**
 * Clones the style. 
 * @return {ol.style.Shadow}
 */
ol.style.Shadow.prototype.clone = function()
{	var s = new ol.style.Shadow(
	{	fill: this.fill_,
		radius: this.radius_,
		blur: this.blur_,
		offsetX: this.offset_[0],
		offsetY: this.offset_[1]
	});
	s.setScale(this.getScale());
	s.setOpacity(this.getOpacity());
	return s;
};
/**
 * @private
 */
ol.style.Shadow.prototype.renderShadow_ = function()
{	
	var radius = this.radius_;
	var canvas = this.getImage();
	var s = [canvas.width, canvas.height];
	s[1] = radius;
	// Remove the circle on the canvas
	var context = (canvas.getContext('2d'));
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.scale(1,0.5);
	context.arc(radius, -radius, radius-this.blur_, 0, 2 * Math.PI, false);
    context.fillStyle = '#000';
	context.shadowColor = this.fill_.getColor();
	context.shadowBlur = 0.7*this.blur_;
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 1.5*radius;
	context.closePath();
    context.fill();
	context.shadowColor = 'transparent';
	// Set anchor
	var a = this.getAnchor();
	a[0] = canvas.width /2 -this.offset_[0];
	a[1] = canvas.height/2 -this.offset_[1];
}
/**
 * @inheritDoc
 */
ol.style.Shadow.prototype.getChecksum = function()
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var fillChecksum = (this.fill_!==null) ?
		this.fill_.getChecksum() : '-';
	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3] ||
		this.form_+"-"+this.glyphs_ != this.checksums_[4]);
	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
			+ this.form_+"-"+this.glyphs_;
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.form_+"-"+this.glyphs_];
	}
	return this.checksums_[0];
};

/*	Copyright (c) 2018 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc
 * Stroke style with named pattern
 *
 * @constructor
 * @param {any}  options
 *	@param {ol.style.Image|undefined} options.image an image pattern, image must be preloaded to draw on first call
 *	@param {number|undefined} options.opacity opacity with image pattern, default:1
 *	@param {olx.style.fillPattern} options.pattern pattern name (override by image option)
 *	@param {ol.colorLike} options.color pattern color
 *	@param {ol.style.Fill} options.fill fill color (background)
 *	@param {number} options.offset pattern offset for hash/dot/circle/cross pattern
 *	@param {number} options.size line size for hash/dot/circle/cross pattern
 *	@param {number} options.spacing spacing for hash/dot/circle/cross pattern
 *	@param {number|bool} options.angle angle for hash pattern / true for 45deg dot/circle/cross
 *	@param {number} options.scale pattern scale 
 * @extends {ol.style.Fill}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.StrokePattern = function(options)
{	if (!options) options = {};
	var pattern;
	var canvas = this.canvas_ = document.createElement('canvas');
	var scale = Number(options.scale)>0 ? Number(options.scale) : 1;
	var ratio = scale*ol.has.DEVICE_PIXEL_RATIO || ol.has.DEVICE_PIXEL_RATIO;
	var ctx = canvas.getContext('2d');
	if (options.image)
	{	options.image.load();
		var img = options.image.getImage();
		if (img.width)
		{	canvas.width = Math.round(img.width *ratio);
			canvas.height = Math.round(img.height *ratio);
			ctx.globalAlpha = typeof(options.opacity) == 'number' ? options.opacity:1;
			ctx.drawImage(img, 0,0, img.width, img.height, 0, 0, canvas.width, canvas.height);
			pattern = ctx.createPattern(canvas, 'repeat');
		}
		else 
		{	var self = this;
			pattern = [0,0,0,0];
			img.onload = function ()
			{	canvas.width = Math.round(img.width *ratio);
				canvas.height = Math.round(img.height *ratio);
				ctx.globalAlpha = typeof(options.opacity) == 'number' ? options.opacity:1;
				ctx.drawImage(img, 0,0, img.width, img.height, 0, 0, canvas.width, canvas.height);
				pattern = ctx.createPattern(canvas, 'repeat');
				self.setColor(pattern);
			}
		}
	}
	else
	{	var pat = this.getPattern_(options);
		canvas.width = Math.round(pat.width *ratio);
		canvas.height = Math.round(pat.height *ratio);
		ctx.beginPath();
		if (options.fill) 
		{	ctx.fillStyle = ol.color.asString(options.fill.getColor());
			ctx.fillRect(0,0, canvas.width, canvas.height);
		}
		ctx.scale(ratio,ratio);
		ctx.lineCap = "round";
		ctx.lineWidth = pat.stroke || 1;
		ctx.fillStyle = ol.color.asString(options.color||"#000");
		ctx.strokeStyle = ol.color.asString(options.color||"#000");
		if (pat.circles) for (var i=0; i<pat.circles.length; i++)
		{	var ci = pat.circles[i]; 
			ctx.beginPath();
			ctx.arc(ci[0], ci[1], ci[2], 0,2*Math.PI);
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
		}
		if (!pat.repeat) pat.repeat=[[0,0]];
		if (pat.char)
		{	ctx.font = pat.font || (pat.width)+"px Arial";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			if (pat.angle) 
			{	ctx.fillText(pat.char, pat.width/4, pat.height/4);
				ctx.fillText(pat.char, 5*pat.width/4, 5*pat.height/4);
				ctx.fillText(pat.char, pat.width/4, 5*pat.height/4);
				ctx.fillText(pat.char, 5*pat.width/4, pat.height/4);
				ctx.fillText(pat.char, 3*pat.width/4, 3*pat.height/4);
				ctx.fillText(pat.char, -pat.width/4, -pat.height/4);
				ctx.fillText(pat.char, 3*pat.width/4, -pat.height/4);
				ctx.fillText(pat.char, -pat.width/4, 3*pat.height/4);
			}
			else ctx.fillText(pat.char, pat.width/2, pat.height/2);
		}
		if (pat.lines) for (var i=0; i<pat.lines.length; i++) for (var r=0; r<pat.repeat.length; r++)
		{	var li = pat.lines[i];
			ctx.beginPath();
			ctx.moveTo(li[0]+pat.repeat[r][0],li[1]+pat.repeat[r][1]);
			for (var k=2; k<li.length; k+=2)
			{	ctx.lineTo(li[k]+pat.repeat[r][0],li[k+1]+pat.repeat[r][1]);
			}
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
			ctx.save()
			ctx.strokeStyle = 'red';
			ctx.strokeWidth = 0.1;
			//ctx.strokeRect(0,0,canvas.width,canvas.height);
			ctx.restore()
		}
		pattern = ctx.createPattern(canvas, 'repeat');
		if (options.offset)
		{	var offset = options.offset;
			if (typeof(offset) == "number") offset = [offset,offset];
			if (offset instanceof Array) 
			{	var dx = Math.round((offset[0]*ratio));
				var dy = Math.round((offset[1]*ratio));
				// New pattern
				ctx.scale(1/ratio,1/ratio)
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.translate(dx,dy);
				ctx.fillStyle = pattern;
				ctx.fillRect(-dx, -dy, canvas.width,canvas.height);
				pattern = ctx.createPattern(canvas, 'repeat');
			}
		}
	}
	options.color = pattern;
	ol.style.Stroke.call (this, options);
};
ol.inherits(ol.style.StrokePattern, ol.style.Stroke);
/**
 * Clones the style. 
 * @return {ol.style.StrokePattern}
 */
ol.style.StrokePattern.prototype.clone = function()
{	var s = ol.style.Fill.prototype.clone.call(this);
	s.canvas_ = this.canvas_;
	return s;
};
/** Get canvas used as pattern
*	@return {canvas}
*/
ol.style.StrokePattern.prototype.getImage = function()
{	return this.canvas_;
}
/** Get pattern
*	@param {olx.style.FillPatternOption}
*/
ol.style.StrokePattern.prototype.getPattern_ = function(options)
{	var pat = ol.style.FillPattern.prototype.patterns[options.pattern]
		|| ol.style.FillPattern.prototype.patterns.dot;
	var d = Math.round(options.spacing)||10;
	var d2 = Math.round(d/2)+0.5;
	switch (options.pattern)
	{	case 'dot':
		case 'circle':
		{	var size = options.size===0 ? 0 : options.size/2 || 2;
			if (!options.angle)
			{	pat.width = pat.height = d;
				pat.circles = [[ d/2, d/2, size ]]
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/2+d, d/2, size ],
						[ d/2-d, d/2, size ],
						[ d/2, d/2+d, size ],
						[ d/2, d/2-d, size ],
						[ d/2+d, d/2+d, size ],
						[ d/2+d, d/2-d, size ],
						[ d/2-d, d/2+d, size ],
						[ d/2-d, d/2-d, size ] ])
				};
			}
			else
			{	d = pat.width = pat.height = Math.round(d*1.4);
				pat.circles = [[ d/4, d/4, size ], [ 3*d/4, 3*d/4, size ]];
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/4+d, d/4, size ],
						[ d/4, d/4+d, size ],
						[ 3*d/4-d, 3*d/4, size ],
						[ 3*d/4, 3*d/4-d, size ],
						[ d/4+d, d/4+d, size ], 
						[ 3*d/4-d, 3*d/4-d, size ] ]);
				}
			}
			break;
		}
		case 'tile':
		case 'square':
		{	var size = options.size===0 ? 0 : options.size/2 || 2;
			if (!options.angle)
			{	pat.width = pat.height = d;
				pat.lines = [[ d/2-size, d/2-size, d/2+size, d/2-size, d/2+size, d/2+size, d/2-size,d/2+size, d/2-size, d/2-size ]]
			}
			else
			{	pat.width = pat.height = d;
				//size *= Math.sqrt(2);
				pat.lines = [[ d/2-size,d/2, d/2,d/2-size, d/2+size,d/2, d/2,d/2+size, d/2-size,d/2 ]]
			}
			if (options.pattern=='square') pat.repeat = [[0,0], [0,d], [d,0], [0,-d], [-d,0], [-d,-d], [d,d], [-d,d], [d,-d] ]
			break;
		}
		case 'cross':
		{	// Limit angle to 0 | 45
			if (options.angle) options.angle = 45;
		}
		case 'hatch':
		{	var a = Math.round(((options.angle||0)-90)%360);
			if (a>180) a -= 360;
			a *= Math.PI/180;
			var cos = Math.cos(a);
			var sin = Math.sin(a);
			if (Math.abs(sin)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0,0.5, d, 0.5 ] ];
				pat.repeat = [ [0,0], [0,d] ];
			}
			else  if (Math.abs(cos)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0.5,0, 0.5, d] ];
				pat.repeat = [ [0,0], [d,0] ];
				if (options.pattern=='cross') 
				{	pat.lines.push ([ 0,0.5, d, 0.5 ]);
					pat.repeat.push([0,d]);
				}
			}
			else
			{	var w = pat.width = Math.round(Math.abs(d/sin)) || 1;
				var h = pat.height = Math.round(Math.abs(d/cos)) || 1;
				if (options.pattern=='cross')
				{	pat.lines = [ [-w,-h, 2*w,2*h], [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0] ];
				}
				else if (cos*sin>0) 
				{	pat.lines = [ [-w,-h, 2*w,2*h] ];
					pat.repeat = [ [0,0], [w,0], [0,h] ];
				}
				else 
				{	pat.lines = [ [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0], [-w,0], [0,h] ];
				}
			}
			pat.stroke = options.size===0 ? 0 : options.size||4;
		}
		default: break;
	}
	return pat
}