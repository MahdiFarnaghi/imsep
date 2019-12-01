

function UniqueValueRenderer(json) {
  this.name='uniqueValueRenderer';
  this.defaultStyle=StyleFactory.randomStyle();
  this.defaultLabel='Other values';
  this.field;
  this.uniqueValueInfos={};
  if(json){
   this.fromJson(json);
  }
}
UniqueValueRenderer.prototype.getName=function(){
 return this.name;
}
UniqueValueRenderer.prototype.findStyleFunction=function(layer){
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
   var result= self.defaultStyle;
   if(!feature)
     return result;

   var val= feature.get(self.field);
   if(typeof val !== 'undefined'){
       var fItem= self.findUniqueValueItem(val);
       if(fItem){
         result= fItem.style;
       }
   }  
   if(layer  && layer.get('featureLabeler')){
    result.setText(layer.get('featureLabeler').getTextStyle(feature,resolution,fieldsInfo));
    //result.text_=layer.get('featureLabeler').getTextStyle(feature,resolution);
   } 
   return result;
 }
}
UniqueValueRenderer.prototype.getField=function(){
 return this.field;
}
UniqueValueRenderer.prototype.setField=function(fieldName){
 this.field= fieldName;
}
UniqueValueRenderer.prototype.getDefaultLabel=function(){
 return this.defaultLabel;
}
UniqueValueRenderer.prototype.setDefaultLabel=function(defaultLabel){
 this.defaultLabel= defaultLabel;
}
UniqueValueRenderer.prototype.getDefaultStyle=function(){
 return this.defaultStyle;
}
UniqueValueRenderer.prototype.setDefaultStyle=function(style){
 this.defaultStyle=style;
}

UniqueValueRenderer.prototype.getUniqueValueInfos=function(){
 return this.uniqueValueInfos;
}
UniqueValueRenderer.prototype.ClearAllValues=function(){
 this.uniqueValueInfos={};
}
UniqueValueRenderer.prototype.addValue=function(value,label,style){
 this.uniqueValueInfos[value+'']={
     value:value,
     label:label,
     style:style
 };
}
UniqueValueRenderer.prototype.findUniqueValueItem=function(value){
 return  this.uniqueValueInfos[value+''];
}
UniqueValueRenderer.prototype.clone=function(){
 var json= this.toJson();
 return new UniqueValueRenderer(json);
}
UniqueValueRenderer.prototype.toJson=function(){
 var json= {
     name: this.name,
     defaultStyle:StyleFactory.styleToJson(this.defaultStyle),
     field:this.field,
     defaultLabel:this.defaultLabel,
     uniqueValueInfos:{}
 };
 if(this.uniqueValueInfos){
   for(var key in this.uniqueValueInfos){
     var item= this.uniqueValueInfos[key];
     var itemJson={
       value:item.value,
       label:item.label,
       style:StyleFactory.styleToJson(item.style)
     }
     json.uniqueValueInfos[key]= itemJson;
   }
 }

 return json;
}
UniqueValueRenderer.prototype.fromJson=function(json){
 if(!json)
   return;
 if(json.defaultStyle) {
   try{
     this.setDefaultStyle(StyleFactory.jsonToStyle(json.defaultStyle));
   }catch(ex){}
 }
 this.setField(json.field);
 this.setDefaultLabel(json.defaultLabel);
 this.uniqueValueInfos={};
 if(json.uniqueValueInfos)  {
   for(var key in json.uniqueValueInfos){
     var itemJson= json.uniqueValueInfos[key];
     
     this.addValue(itemJson.value,itemJson.label,StyleFactory.jsonToStyle(itemJson.style));
   }
 }
}