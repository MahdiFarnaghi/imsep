var RendererFactory={
    createSimpleRenderer:function(json){
      return new SimpleRenderer(json);
    },
    createUniqueValueRenderer:function(json){
      return new UniqueValueRenderer(json);
    },
    createRangeValueRenderer:function(json){
      return new RangeValueRenderer(json);
    },
    createFromJson:function(json){
      if(!json){
        return this.createSimpleRenderer();
      }
      if(json.name=='simpleRenderer'){
          return new SimpleRenderer(json);
      }else if (json.name=='uniqueValueRenderer'){
          return new UniqueValueRenderer(json);
      }else if (json.name=='rangeValueRenderer'){
        return new RangeValueRenderer(json);
      }
      return this.createSimpleRenderer();
    }
};
