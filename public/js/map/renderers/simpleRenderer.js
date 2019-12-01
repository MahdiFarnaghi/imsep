

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
 var fieldsInfo={};
 var fields= LayerHelper.getFields(layer);
 if(fields){
   for(var i=0;i< fields.length;i++){
     var fld= fields[i];
     fieldsInfo[fld.name]= fld;
     if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items ){
       var codedValues={};
       for(var j=0;j<fld.domain.items.length;j++){
         codedValues[fld.domain.items[j].code]= fld.domain.items[j].value;
       }
       fieldsInfo[fld.name].codedValues=codedValues;
     }
   }
 }
  
 return function(feature,resolution){
   var result=self.style;
   if(layer  && layer.get('featureLabeler')){
      result.setText(layer.get('featureLabeler').getTextStyle(feature,resolution,fieldsInfo));
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