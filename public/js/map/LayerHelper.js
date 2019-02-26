var LayerHelper={
    getDetails:function(layer){
       var layerCustom= layer.get('custom');
       if(layerCustom && layerCustom.dataObj){
       
        try {
            if (typeof layerCustom.dataObj.details === 'string' || layerCustom.dataObj.details instanceof String){
                layerCustom.dataObj.details = JSON.parse(layerCustom.dataObj.details);
            }
          } catch (ex) {}
          return layerCustom.dataObj.details;
       }else
        return null;
    },
    setDetails:function(layer,details){
        var layerCustom= layer.get('custom');
        if(!layerCustom){
            layer.set('custom',{});
            layerCustom=layer.get('custom');
        }
        if(!layerCustom.dataObj)
            layerCustom.dataObj={};
        layerCustom.dataObj.details=details;        
        

        
        return details;
    },
    getFields:function(layer){
        var layerCustom= layer.get('custom');
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.details ){
         return layerCustom.dataObj.details.fields;
        }else
         return null;
     },
     setFields:function(layer,fields){
         var layerCustom= layer.get('custom');
         if(!layerCustom){
             layer.set('custom',{});
             layerCustom=layer.get('custom');
         }
         if(!layerCustom.dataObj)
             layerCustom.dataObj={};
         if(!layerCustom.dataObj.details)
             layerCustom.dataObj.details={};        
         
         layerCustom.dataObj.details.fields=fields;
         return fields;
     },
     getShapeType:function(layer){
        var layerCustom= layer.get('custom');
        if(layerCustom && typeof layerCustom['shapeType'] !==undefined)
         {
             return layerCustom['shapeType'];
         }
        
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.details ){
         return layerCustom.dataObj.details.shapeType;
        }
        
        return null;
     },
     
     setShapeType:function(layer,shapetype){
        var details= this.getDetails(layer);
        if(!details)
            details= this.setDetails(layer,{});
        var layerCustom= layer.get('custom');
        
         layerCustom['shapeType']=shapetype;
         details.shapeType=shapetype;
     },
     getRenderer:function(layer){
        var renderer= layer.get('renderer');
        if(renderer)
            return renderer;
        var layerCustom= layer.get('custom');
        
        
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.details ){
         return RendererFactory.createFromJson(layerCustom.dataObj.details.renderer);
        }
        return null;
     },
     setRenderer:function(layer,renderer){
         var layerCustom= layer.get('custom');
         if(!layerCustom){
             layer.set('custom',{});
             layerCustom=layer.get('custom');
         }
         if(!layerCustom.dataObj)
             layerCustom.dataObj={};
        if(!layerCustom.dataObj.details)
             layerCustom.dataObj.details={};  
               
         
 
         layer.set('renderer',renderer);
         if(renderer){
            layerCustom.dataObj.details.renderer= renderer.toJson();
            layer.setStyle(renderer.findStyleFunction(layer));
         }else{
            layerCustom.dataObj.details.renderer= null;
            layer.setStyle(StyleFactory.randomStyle());
         }

        
         
         return renderer;
     },
     getFeatureLabeler:function(layer){
        var featureLabeler= layer.get('featureLabeler');
        if(featureLabeler)
            return featureLabeler;
        var layerCustom= layer.get('custom');
        
        
        if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.details && layerCustom.dataObj.details.featureLabeler ){
             return new FeatureLabeler(layerCustom.dataObj.details.featureLabeler);
        }
        return null;
     },
     setFeatureLabeler:function(layer,featureLabeler){
        var layerCustom= layer.get('custom');
        if(!layerCustom){
            layer.set('custom',{});
            layerCustom=layer.get('custom');
        }
        if(!layerCustom.dataObj)
            layerCustom.dataObj={};
       if(!layerCustom.dataObj.details)
            layerCustom.dataObj.details={};  
              
        

        layer.set('featureLabeler',featureLabeler);
        if(featureLabeler){
           layerCustom.dataObj.details.featureLabeler= featureLabeler.toJson();
          
        }else{
           layerCustom.dataObj.details.featureLabeler= null;
        }

       
        
        return featureLabeler;
    },
     setRasterDisplay:function(layer,display){
        var layerCustom= layer.get('custom');
        if(!layerCustom){
            layer.set('custom',{});
            layerCustom=layer.get('custom');
        }
        if(!layerCustom.dataObj)
            layerCustom.dataObj={};
       if(!layerCustom.dataObj.details)
            layerCustom.dataObj.details={};  
              
        
        layerCustom.dataObj.details.display=display;
        layer.set('display',display);
        if(display){
          
        }else{
           
        }

       
        
        return display;
    },
     getVectorLayerSelectTask:function(layer){
      if(! layer)
      return null;   
       var layerTasks= layer.get('layerTasks');
       if( layerTasks){
           return layerTasks.getTaskByName('VectorLayerSelectTask');
       }else{
           return null;
       }
     },
     getVectorLayerEditTask:function(layer){
        if(! layer)
        return null;   
         var layerTasks= layer.get('layerTasks');
         if( layerTasks){
             return layerTasks.getTaskByName('VectorLayerEditTask');
         }else{
             return null;
         }
       }
}