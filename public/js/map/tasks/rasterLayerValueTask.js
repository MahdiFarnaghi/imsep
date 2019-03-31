function  RasterLayerValueTask(app, mapContainer, layer, options) {
    this._name='RasterLayerValueTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.layer = layer;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
}
RasterLayerValueTask.prototype.getName = function () {
    return this._name;
}
RasterLayerValueTask.prototype.init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();
    if(mapProjectionCode && mapProjectionCode.indexOf(':')){
       mapProjectionCode= mapProjectionCode.split(':')[1];
   }
    var mapContainer = this.mapContainer;
    var layer = this.layer;//.getSource();
    var source = layer.getSource();
    var layerCustom= layer.get('custom');
    var numberOfBands=1;
    if(layerCustom.dataObj)
    {
        numberOfBands=layerCustom.dataObj.details.numberOfBands
      
    }
    var oidField = 'rid';
    var oid = -1;
    if (!source)
        return;
    var details = source.get('details');
    if (details) {
        oidField = details.oidField
    }
    self.interactionPointer = new ol.interaction.Pointer({
        handleDownEvent: function(e){
            var popup= mapContainer.popup;
            var coordinate=e.coordinate;
            popup.hide();
            var url = '/datalayer/' + layerCustom.dataObj.id + '/raster?request=value&srid='+mapProjectionCode;
            url+= '&x='+coordinate[0];
            url+= '&y='+coordinate[1];
            $.ajax(url, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        try{
                                var content = "";
                                content += '<table class="table table-striped table-condensed">';
                                content += '<thead>';
                                if(layer && layer.get('title')){
                                    content += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title')+'</th></tr>';      
                                }else{
                                  content += '<tr><th>Field</th><th>Value</th></tr>';
                                }

                                content += '</thead>';
                                content += '<tbody>';
                                
                                for (var key in data) {
                                    
                                        content += '<tr>';
                                        content += '<td>';
                                        content += key;
                                        content += '</td>';
                                        content += '<td>';
                                        content += data[key];
                                        content += '</td>';
                                        content += '</tr>';
                                    
                                }
                                content += '</tbody>';
                                content += '</table>';
                    
                               
                                popup.show(coordinate, content);
                                popup.getElement().parentNode.style.zIndex= 500 + map.getOverlays().getLength();                     
                            }catch(ex){
                            }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    $.notify({
                        message: ""+ errorThrown+"<br/> Make sure to click on selected raster layer area."
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    }); 
                }
            }).done(function (response) {
            
            });
        }
    });
  
    this._toolbar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });
    var mainCtrl = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="identify_raster_24_Icon" >&nbsp;</span>',
        className:'myOlbutton24',
        title: 'Get raster value',
        onToggle: function (toggle) {
            self.interactionPointer.setActive(false);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                return;
            }
            self.mapContainer.setCurrentTool({
                name: 'getRasterValue_tool',
                cursor:function(map,e){
                    if(!self._activated){
                        return '';
                    }
                    var c='url("/css/images/Identify_raster_24_cursor.png")1 1,auto'; 
                    return c;
                  },
                onActivate: function (event) {
                    map.removeInteraction(self.interactionPointer);
                    map.addInteraction(self.interactionPointer);
                    self.interactionPointer.setActive(true);
                    mainCtrl.setActive(true);  
                },
                onDeactivate: function (event) {
                    
                    self.interactionPointer.setActive(false);

                    mainCtrl.setActive(false);  
                    self.mapContainer.popup.hide();
    
                }
            });
           
        }
        //,
        // autoActivate: true,
        // active: true
    });
    this.mainCtrl=mainCtrl;
   this.mapContainer.leftToolbar.addControl(this.mainCtrl);
  
  
}
RasterLayerValueTask.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this.init();
    }
    this.mapContainer.map.addControl(this.mainCtrl);
    if(this.mainCtrl)
        {
            var ct=this.mapContainer.getCurrentTool();
            if(ct && ct.name==='getRasterValue_tool'){
               this.mainCtrl.setActive(true);
                this.mainCtrl.raiseOnToggle();
               
            }
        }
}
RasterLayerValueTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    var map = this.mapContainer.map;
    this.mapContainer.setCurrentEditAction(undefined);
    if (this.interactionPointer) {
        //map.removeInteraction(this.interactionPointer);
        this.interactionPointer.setActive(false);
    }
    if(this.mainCtrl)
    {
        this.mainCtrl.setActive(false);
    }
    
    this.mapContainer.map.removeControl(this.mainCtrl);
    this._activated = false;
}
