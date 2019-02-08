

function FeatureLabeler(json) {
     this.name='featureLabeler';
     this.disabled=false;
     this.fieldName=undefined;
      this.type='normal';//{normal,hide,shorten,wrap}
      this.align='';//{center,end,left,right,start}
      this.baseline='middle';//{middle,alphabetic,bottom,hanging,ideographic,top}
      this.rotation=0;//{0:0,0.785398164:45,1.570796327:90}
      this.font='Arial';//{Arial,'Courier New','Open Sans',Verdana}
      this.weight='normal';//{bold,normal}
      this.placement='point';//{line,point}
      this.maxangle=0.7853981633974483;//{45:0.7853981633974483,2.0943951023931953:120,6.283185307179586:360}
      this.overflow=false;//{false,true}
      this.size='12px';
      this.offsetX=0;
      this.offsetY=0;
      this.color='blue';
      this.outline='#ffffff';
      this.outlineWidth=3;
      this.maxreso;
     
      String.prototype.trunc = String.prototype.trunc ||
      function(n) {
        return this.length > n ? this.substr(0, n - 1) + '...' : this.substr(0);
      };

     if(json){
      this.fromJson(json);
     }
  }
  FeatureLabeler.prototype.getName=function(){
    return this.name;
  }
  FeatureLabeler.prototype.getSize=function(){
    try{
      return parseFloat(this.size);
    }catch(ex){}
    return this.size;
  }
  FeatureLabeler.prototype.clone=function(){
    var json= this.toJson();
    return new FeatureLabeler(json);
  }
  FeatureLabeler.prototype.toJson=function(){
    return {
         fieldName:this.fieldName,
         disabled:this.disabled,
          type:this.type,
            align:this.align,
            baseline:this.baseline,
            rotation:this.rotation,
            font:this.font,
            weight:this.weight,
            placement:this.placement,
            maxangle:this.maxangle,
            overflow:this.overflow,
            size:this.size,
            offsetX:this.offsetX,
            offsetY:this.offsetY,
            color:this.color,
            outline:this.outline,
            outlineWidth:this.outlineWidth,
            maxreso:this.maxreso
    };
  }
  FeatureLabeler.prototype.fromJson=function(json){
    if(!json)
      return;
     
      
      if(typeof json.disabled !=='undefined')
          this.disabled=json.disabled; 
      if(typeof json.fieldName !=='undefined')
          this.fieldName=json.fieldName; 
      if(typeof json.type !=='undefined')
         this.type=json.type; 

      if(typeof json.align !=='undefined')
        this.align=json.align; 
      if(typeof json.baseline !=='undefined')
        this.baseline=json.baseline; 
      if(typeof json.rotation !=='undefined')
        this.rotation=json.rotation; 
      if(typeof json.font !=='undefined')
        this.font=json.font; 
      if(typeof json.weight !=='undefined')
        this.weight=json.weight;      
      if(typeof json.placement !=='undefined')
        this.placement=json.placement;      
      if(typeof json.maxangle !=='undefined')
        this.maxangle=json.maxangle;      
      if(typeof json.overflow !=='undefined')
        this.overflow=json.overflow;      
      if(typeof json.size !=='undefined')
        this.size=json.size;      
      if(typeof json.offsetX !=='undefined')
        this.offsetX=json.offsetX;      
      if(typeof json.offsetY !=='undefined')
        this.offsetY=json.offsetY;      
      if(typeof json.color !=='undefined')
        this.color=json.color;      
      if(typeof json.outline !=='undefined')
        this.outline=json.outline;      
      if(typeof json.outlineWidth !=='undefined')
        this.outlineWidth=json.outlineWidth;      
      if(typeof json.maxreso !=='undefined')
        this.maxreso=json.maxreso;      

    
  }
  FeatureLabeler.prototype.getTextStyle = function(feature, resolution) {
    if(this.disabled){
      return null;
    }
    if(typeof this.fieldName ==='undefined'){
      return null;
    }
    
    var overflow = this.overflow ? (true) : undefined;
    
    if (this.font == '\'Open Sans\'' && !app.__openSansAdded) {
      var openSans = document.createElement('link');
      openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
      openSans.rel = 'stylesheet';
      document.getElementsByTagName('head')[0].appendChild(openSans);
      app.__openSansAdded = true;
    }
    var font = this.weight + ' ' + this.size + ' ' + this.font;
    var fillColor = this.color;
    var outlineColor = this.outline;
    var outlineWidth = parseInt(this.outlineWidth, 10);
    var text= this.getText(feature, resolution);
    if(typeof text==='undefined' || text===null){
      return null;
    }
    return new ol.style.Text({
      textAlign: this.align == '' ? undefined : this.align,
      textBaseline: this.baseline,
      font: font,
      text:text,
      //text: this.getText(feature, resolution),
      fill: new ol.style.Fill({color: fillColor}),
      stroke: new ol.style.Stroke({color: outlineColor, width: outlineWidth}),
      offsetX: this.offsetX,
      offsetY:this. offsetY,
      placement: this.placement,
      maxAngle: this.maxAngle,
      overflow: this.overflow,
      rotation: this.rotation
    });
  }
  FeatureLabeler.prototype.getText = function(feature, resolution) {

    var type = this.type;
    var maxResolution = this.maxreso;
    var text='';
    if(feature){
     text = feature.get(this.fieldName);
     if(typeof text==='undefined' || text===null){
       return undefined;
     }
    }

    if (resolution > maxResolution) {
      text = '';
    } else if (type == 'hide') {
      text = '';
    } else if (type == 'shorten') {
      text = text.trunc(12);
    } else if (type == 'wrap' && (!this.placement || this.placement != 'line')) {
      text = this._stringDivider(text, 16, '\n');
    }

    return text+'';
  }
  // http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
  FeatureLabeler.prototype._stringDivider=function(str, width, spaceReplacer) {
    if (str.length > width) {
      var p = width;
      while (p > 0 && (str[p] != ' ' && str[p] != '-')) {
        p--;
      }
      if (p > 0) {
        var left;
        if (str.substring(p, p + 1) == '-') {
          left = str.substring(0, p + 1);
        } else {
          left = str.substring(0, p);
        }
        var right = str.substring(p + 1);
        return left + spaceReplacer + this._stringDivider(right, width, spaceReplacer);
      }
    }
    return str;
  }