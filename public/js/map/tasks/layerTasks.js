function LayerTasks(app, mapContainer, layer, options) {
    var self=this;
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.layerPermissions={
        edit:false,
        view:true
    };
    
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._tasks=[];
    var custom= layer.get('custom');
    if(!custom){
        return;
    }
   
    if(custom.dataObj && custom.dataObj.id){
        var infoUrl='/datalayer/' + custom.dataObj.id +'/info';
        $.ajax(infoUrl, {
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (data) {
                   self.layerPermissions.edit= data._userHasPermission_Edit;
                   self.layerPermissions.view= data._userHasPermission_View;
                  // self.layerPermissions._userHasPermission_EditSchema= data._userHasPermission_EditSchema;
                }
                self._createTasks();
                if(self._activated){
                    self.OnDeActivated();
                    self.OnActivated();
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                self._createTasks();
                if(self._activated){
                    self.OnDeActivated();
                    self.OnActivated();
                }
            }
        }).done(function (response) {
            
        });
    }else{
        self._createTasks();
    }
    
      
}
LayerTasks.prototype._createTasks = function () {
    var self=this;
    var layer= this.layer;
    var custom= this.layer.get('custom');
    if(!custom){
        return;
    }
    if(custom.type === 'ol.layer.Vector'){
        if (custom.dataObj && custom.source === 'ol.source.Vector') {
            this._tasks.push( new VectorLayerSelectTask(this.app,this.mapContainer,layer,{}));

            if(custom.format === 'ol.format.GeoJSON'){
                if(app.identity.isAdministrator || (app.identity.isDataManager && self.layerPermissions.edit) ){
                    this._tasks.push( new VectorLayerEditTask(this.app,this.mapContainer,layer,{}));
                }
                if(app.identity.isAdministrator || app.identity.isDataAnalyst){
                    this._tasks.push( new VectorLayerAnalysisTask(this.app,this.mapContainer,layer,{}));
                }
            }
        }
    }
    
    if (custom.dataObj && custom.source === 'ol.source.GeoImage') {
        
        this._tasks.push( new RasterLayerValueTask(this.app,this.mapContainer,layer,{}));
        if(app.identity.isAdministrator || app.identity.isDataAnalyst){
            this._tasks.push( new RasterLayerAnalysisTask(this.app,this.mapContainer,layer,{}));
        }

    }
    
}
LayerTasks.prototype.getTasks = function () {

    return this._tasks;
}
LayerTasks.prototype.getTaskByName = function (name) {
    var task;
     for(var i=0; i<this._tasks.length;i++){
         
         if(name===this._tasks[i].getName()){
             task= this._tasks[i];
             break;
         }
     }
     return task;
}
LayerTasks.prototype.init = function () {
   
   for(var i=0;i< this._tasks.length;i++){
       this._tasks[i].init();
   }
   this._initialized = true;
}
LayerTasks.prototype.OnActivated = function () {
    this._activated = true;
    if (!this._initialized) {
        this.init();
    }
    for(var i=0;i< this._tasks.length;i++){
        this._tasks[i].OnActivated();
    }
  
}
LayerTasks.prototype.OnDeActivated = function () {
    if (!this._activated)
        return;
    for(var i=0;i< this._tasks.length;i++){
        this._tasks[i].OnDeActivated();
    }
    this._activated = false;
}
