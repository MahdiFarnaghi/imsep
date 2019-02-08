

function SimpleRenderer(json) {
     this.name='simpleRenderer';
     this.style=StyleFactory.randomStyle();
     if(json){
      this.fromJson(json);
     }
  }
  SimpleRenderer.prototype.getName=function(){
    return this.name;
  }
  SimpleRenderer.prototype.findStyleFunction=function(layer){
    var self= this;
    return function(feature,resolution){
      var result=self.style;
      if(layer  && layer.get('featureLabeler')){
         result.setText(layer.get('featureLabeler').getTextStyle(feature,resolution));
         // result.text_=layer.get('featureLabeler').getTextStyle(feature,resolution);
       
      } 
      return result;
    }
  }
  SimpleRenderer.prototype.getDefaultStyle=function(){
    return this.getStyle();
  }
  SimpleRenderer.prototype.setDefaultStyle=function(style){
    this.setStyle(style);
  }
  SimpleRenderer.prototype.getStyle=function(){
    return this.style;
  }
  SimpleRenderer.prototype.setStyle=function(style){
    this.style=style;
  }
  SimpleRenderer.prototype.clone=function(){
    var json= this.toJson();
    return new SimpleRenderer(json);
  }
  SimpleRenderer.prototype.toJson=function(){
    return {
        name: this.name,
        style:StyleFactory.styleToJson(this.style)
    };
  }
  SimpleRenderer.prototype.fromJson=function(json){
    if(!json)
      return;
     if(json.style) {
       try{
        this.setStyle(StyleFactory.jsonToStyle(json.style));
       }catch(ex){}
     }
    
  }