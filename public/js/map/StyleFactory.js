var StyleFactory={
    randomColor:function (ranges,opacity) {
        if (!ranges) {
            ranges = [
                    [150, 255],
                    [0, 190],
                    [0, 30]
            ];
        }
        if(typeof opacity=='undefined')
            opacity=1;
        var g = function (hex) {
            //select random range and remove
            var range = ranges.splice(Math.floor(Math.random() * ranges.length), 1)[0];
            //pick a random number from within the range
            if(hex)
                return (Math.floor(Math.random() * (range[1] - range[0])) + range[0]).toString(16);
            else    
                return (Math.floor(Math.random() * (range[1] - range[0])) + range[0]);
        }
        
        var c= "rgba(" + g() + "," + g() + "," + g() +"," + opacity+")";
        return c;
        
         var g1 = g(true);
         if (g1.length < 2) g1 = '0' + g1;
         var g2 = g(true);
         if (g2.length < 2) g2 = '0' + g2;
         var g3 = g(true);
         if (g3.length < 2) g3 = '0' + g3;

        var c = "#" + g1 + g2 + g3;
        if(opacity>=0 && opacity<=1){
            var o=Math.floor(opacity* 255);
             o=o.toString(16);
            if(o.length<2) o='0'+o;
            c=c+o;
        }
        return c;
        //return Color.fromHex(c);
    },
    randomStyle:function(options){
        options=options||{};
        options.strokeWidth=  options.strokeWidth|| 1.25;
        options.strokeColor= options.strokeColor ||'#3399CC';
        var fill = new ol.style.Fill({
            color: options.fillColor? options.fillColor:StyleFactory.randomColor(null,0.5)
          });
          var stroke = new ol.style.Stroke({
            color: options.randomStrokeColor? StyleFactory.randomColor(null,0.7):options.strokeColor,
            width: options.strokeWidth
          });
          var style = 
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: fill,
                stroke: stroke,
                radius: 5
              }),
              fill: fill,
              stroke: stroke
            });

            return style;
        
    },    
        
    renderStyleSample:function(style, options){
        options = options || {};
        if (!options.width)
            options.width = 40;
        if (!options.height)
            options.height = 20;
        var w = options.width;
        var h = options.height;
        var canvas = options.canvas;
        var targetEl = options.target;
        if (!canvas && !targetEl) {
            targetEl = $('<div style="width:' + w + 'px;height=' + h + 'px;"></div>');
        }
        if (!canvas) {
            canvas = $('<canvas/>', { 'class': 'styleSample' })
                .width(w)
                .height(h);
            targetEl.append(canvas);
            canvas=canvas[0];
        }
        var vectorContext = ol.render.toContext(canvas.getContext('2d'), { size: [w, h] });
    
    
        if (!style) {
            style = new ol.style.Style({
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
        }
        var fillStyle= style.getFill? style.getFill():null;
        if(style instanceof ol.style.Fill){
            imageStyle=style;
            if(!options.type)
                options.type='Polygon';
        }
        if(!fillStyle){
            fillStyle=new ol.style.Fill();
        }   
        var strokeStyle=style.getStroke?style.getStroke():null;
        if(style instanceof ol.style.Stroke){
            imageStyle=style;
            if(!options.type)
                options.type='Line';
        }
        if(!strokeStyle)    {
            strokeStyle=new ol.style.Stroke();
        }
        var imageStyle= style.getImage?style.getImage():null;
        if(style instanceof ol.style.Image){
            imageStyle=style;
            if(!options.type)
                options.type='Point';
        }
        if(!imageStyle){
            imageStyle= new ol.style.Circle();
            // imageStyle= new ol.style.Circle({
            //     radius: 3,
            //     stroke: new ol.style.Stroke({
            //         color: 'rgba(0, 0, 0, 0.7)'
            //     }),
            //     fill: new ol.style.Fill({
            //         color: 'rgba(255, 255, 255, 0.2)'
            //     })
            // });
        }
        var drawStyle = new ol.style.Style({
            fill: fillStyle,
            stroke: strokeStyle,
            image: imageStyle
          });
        vectorContext.setStyle(drawStyle);
        var dx= w/10;
        var dy= h/10;
        if(options.type=='LineString' || options.type=='Line' || options.type=='MultiLineString' ){
            vectorContext.drawGeometry(new ol.geom.LineString([[dx, h/2], [w-2*dx, h/2]]));
        }else if(options.type=='Polygon' || options.type=='MultiPolygon' ){
            vectorContext.drawGeometry(new ol.geom.Polygon([[[dx, dy], [w-2*dx, dy], [w-2*dx, h-2*dy], [dx, h-2*dy],[dx,dy]]]));
        }else if(options.type=='Point' || options.type=='MultiPoint' ){
            vectorContext.drawGeometry(new ol.geom.Point([w/2, h/2]));
        }else{
            vectorContext.drawGeometry(new ol.geom.Polygon([[[dx, dy], [w-2*dx, dy], [w-2*dx, h-2*dy], [dx, h-2*dy],[dx,dy]]]));
            vectorContext.drawGeometry(new ol.geom.LineString([[dx, h/2], [w-2*dx, h/2]]));
            vectorContext.drawGeometry(new ol.geom.Point([w/2, h/2]));
        }
        if (targetEl)
            return targetEl;
        else
            return canvas;
    },
    
     fill: function(obj) {
        if (typeof obj == 'string' || Array.isArray(obj)) {
          obj = { color: obj };
        }
        return new ol.style.Fill(obj);
      },
      getFill:function (style){
        if(! style)
            return null;
        return {color: style.getColor()};
      },
      stroke: function(obj) {
        if (typeof obj == 'string' || Array.isArray(obj)) {
          obj = { color: obj };
        } else if (typeof obj == 'number') {
          obj = { width: obj };
        }
        return new ol.style.Stroke(obj);
      },
      getStroke:function (style){
        if(! style)
            return null;
        return {
                color: style.getColor(),
                lineCap:style.getLineCap(),
                lineJoin:style.getLineJoin(),
                lineDash:style.getLineDash(),
                miterLimit:style.getMiterLimit(),
                width:style.getWidth()
            };
        },
      text: function(obj) {
        if (typeof obj == 'string') {
          obj = { text: obj };
        }
        if (obj.fill) {
          obj.fill = StyleFactory.fill(obj.fill);
        }
        if (obj.stroke) {
          obj.stroke = StyleFactory.stroke(obj.stroke);
        }
        return new ol.style.Text(obj);
      },
      circle: function(obj) {
        if (obj.fill) {
          obj.fill = StyleFactory.fill(obj.fill);
        }
        if (obj.stroke) {
          obj.stroke = StyleFactory.stroke(obj.stroke);
        }
        return new ol.style.Circle(obj);
      },
      getCircle:function (style){
        if(! style)
            return null;
        return {
            radius: style.getRadius(),
            snapToPixel:style.getSnapToPixel(),
            fill:StyleFactory.getFill(style.getFill()),
            stroke:StyleFactory.getStroke (style.getStroke()),
            
            opacity:style.getOpacity(),
            rotation:style.getRotation(),
            scale:style.getScale()
            };
        },
      icon: function(obj) {
        return new ol.style.Icon(obj);
      },
      getFontSymbol:function (style){
        if(! style)
            return null;
        return {
            form: style.form_, //"hexagone", 
            gradient: style.gradient_,
            glyph:style.getGlyphName(),
            fontSize: style.fontSize_,
            fontStyle: style.fontStyle_,
            radius: style.radius_orig, 
            offsetX: style.offset_[0],
            offsetY: style.offset_[1],
            rotation: style.getRotation(),
            rotateWithView: style.getRotateWithView(),
            
            color: style.color_,

            fill:StyleFactory.getFill(style.fill_),
            stroke:StyleFactory.getStroke (style.stroke_),
            
            
            opacity:style.getOpacity(),
            rotation:style.getRotation(),
            scale:style.getScale()
            };
        },
        fontSymbol: function(obj) {
            if (obj.fill) {
              obj.fill = StyleFactory.fill(obj.fill);
            }
            if (obj.stroke) {
              obj.stroke = StyleFactory.stroke(obj.stroke);
            }
            return new ol.style.FontSymbol(obj);
          },
      getIcon:function (style){
        if(! style)
            return null;
        return {
            anchor: style.getAnchor(),
            anchorOrigin:style.getAnchorOrigin(),
            anchorXUnits:style.getAnchorXUnits(),
            anchorYUnits:style.getAnchorYUnits(),
            crossOrigin:style.getCrossOrigin(),
            offset:style.getOffset(),
            offsetOrigin:style.getOffsetOrigin(),

            size:style.getSize(),
            src:styke.getSrc(),
            
            snapToPixel:style.getSnapToPixel(),
            opacity:style.getOpacity(),
            rotation: style.getRotation(),
            rotateWithView: style.getRotateWithView(),
            scale:style.getScale()
            };
        },
      image: function(obj) {
        if(typeof obj.glyph !=='undefined'){
            return StyleFactory.fontSymbol(obj);
        } else if (typeof obj.radius !== 'undefined') {
          return StyleFactory.circle(obj);
        }
        return StyleFactory.icon(obj);
      },

      makeStyle:function(styleSpec) {
        var self=this;  
        if (Array.isArray(styleSpec)) {
          return styleSpec.map(function(oneSpec) {
            return self.makeStyle(oneSpec);
          });
        }
        
        var obj = {};
        Object.keys(styleSpec).forEach(function(key) {
          var val = styleSpec[key];
          if (self[key]) {
              if(key=='circle' || key=='icon' || key=='fontSymbol'){
                  try{
                    obj['image'] = new self[key](val);
                  }catch(ex){
                    var dd=11;
                  }
              }else{
                obj[key] = new self[key](val);//??????????????
              }
          } else {
            obj[key] = val;
          }
        });
        return new ol.style.Style(obj);
      },
      jsonToStyle:function(json){
        return this.makeStyle(json);
      },
      styleToJson:function (style){
        var self=this;
        var obj = {};

        if(style.getFill){
            obj['fill']= self.getFill(style.getFill());
        }
        if(style.getStroke){
            obj['stroke']= self.getStroke(style.getStroke());
        }
        if(style.getImage){
            var image= style.getImage();
            if(image instanceof ol.style.Circle)
                obj['circle']= self.getCircle(image);
            if(image instanceof ol.style.Icon)
                obj['icon']= self.getIcon(image);
            if(image instanceof ol.style.FontSymbol)
                obj['fontSymbol']= self.getFontSymbol(image);
        }
        if(style.getZIndex){
            obj['zIndex']= style.getZIndex();

        }
        return obj;

      },
      cloneStyle:function(style){
        var json= this.styleToJson(style);
        return this.jsonToStyle(json);
      }
}