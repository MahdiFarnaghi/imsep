

function RangeValueRenderer(json) {
  this.name='rangeValueRenderer';
  this.defaultStyle=StyleFactory.randomStyle();
  this.defaultLabel='Other values';
  this.field;
  this.rangeValueInfos=[];
  if(json){
   this.fromJson(json);
  }
}
RangeValueRenderer.prototype.getName=function(){
 return this.name;
}
RangeValueRenderer.prototype.findStyleFunction=function(layer){
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
       var fItem= self.findRangeValueItem(val);
       if(fItem){
         result= fItem.style;
       }
   }
   if(layer  && layer.get('featureLabeler')){
     result.setText(layer.get('featureLabeler').getTextStyle(feature,resolution,fieldsInfo));
    // result.text_=layer.get('featureLabeler').getTextStyle(feature,resolution);
   }  
   return result;
 }
}
RangeValueRenderer.prototype.getField=function(){
 return this.field;
}
RangeValueRenderer.prototype.setField=function(fieldName){
 this.field= fieldName;
}
RangeValueRenderer.prototype.getDefaultLabel=function(){
 return this.defaultLabel;
}
RangeValueRenderer.prototype.setDefaultLabel=function(defaultLabel){
 this.defaultLabel= defaultLabel;
}
RangeValueRenderer.prototype.getDefaultStyle=function(){
 return this.defaultStyle;
}
RangeValueRenderer.prototype.setDefaultStyle=function(style){
 this.defaultStyle=style;
}

RangeValueRenderer.prototype.getRangeValueInfos=function(){
 return this.rangeValueInfos;
}
RangeValueRenderer.prototype.ClearAllValues=function(){
 this.rangeValueInfos=[];
}
RangeValueRenderer.prototype.addValue=function(minValue,maxValue,label,style){
 this.rangeValueInfos.push({
     minValue:minValue,
     maxValue:maxValue,
     label:label,
     style:style
 });
}
RangeValueRenderer.prototype.findRangeValueItem=function(value){
 if(typeof value ==='undefined')
   return null;
 for(var i=0;i<this.rangeValueInfos.length;i++){
   var item= this.rangeValueInfos[i];

   if(typeof item.minValue!=='undefined' 
     && typeof item.maxValue!=='undefined' ){
       if( value >= item.minValue && value < item.maxValue){
         return item;
       }
   }else if(typeof item.minValue!=='undefined') {
       if(value >= item.minValue){
           return item;
         }
   }else if (typeof item.maxValue!=='undefined' ){
       if(value < item.maxValue){
           return item;
       }
   }
 }
 return  null;
}
RangeValueRenderer.prototype.clone=function(){
 var json= this.toJson();
 return new RangeValueRenderer(json);
}
RangeValueRenderer.prototype.toJson=function(){
 var json= {
     name: this.name,
     defaultStyle:StyleFactory.styleToJson(this.defaultStyle),
     field:this.field,
     defaultLabel:this.defaultLabel,
     rangeValueInfos:[]
 };
 if(this.rangeValueInfos){
   for(var i=0;i<this.rangeValueInfos.length;i++){
     var item= this.rangeValueInfos[i];
     
     var itemJson={
       minValue:item.minValue,
       maxValue:item.maxValue,
       label:item.label,
       style:StyleFactory.styleToJson(item.style)
     }
     json.rangeValueInfos.push( itemJson);
   }
 }

 return json;
}
RangeValueRenderer.prototype.fromJson=function(json){
 if(!json)
   return;
 if(json.defaultStyle) {
   try{
     this.setDefaultStyle(StyleFactory.jsonToStyle(json.defaultStyle));
   }catch(ex){}
 }
 this.setField(json.field);
 this.setDefaultLabel(json.defaultLabel);
 this.rangeValueInfos=[];
 if(json.rangeValueInfos)  {
     for(var i=0;i<json.rangeValueInfos.length;i++){
       var itemJson= json.rangeValueInfos[i];
       this.addValue(itemJson.minValue,itemJson.maxValue, itemJson.label,StyleFactory.jsonToStyle(itemJson.style));
   }
 }
}