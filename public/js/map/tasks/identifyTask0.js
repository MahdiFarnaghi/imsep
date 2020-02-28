function  IdentifyTask(app, mapContainer, options) {
    this._name='IdentifyTask';
    this.app = app;
    this.mapContainer = mapContainer;
    this.options = options || {};
    this._initialized = false;
    this._activated = false;

    this._toolbar = null;
}
IdentifyTask.prototype.getName = function () {
    return this._name;
}
IdentifyTask.prototype.init = function (dataObj) {
    this._initialized = true;
    var self = this;
    var map = this.mapContainer.map;
    var view = map.getView();
    var mapContainer = this.mapContainer;
    self.featureLayers={};
    self.selectInteraction =new ol.interaction.Select({
        hitTolerance: 5,
        multi: true,
        condition: ol.events.condition.singleClick,
        filter: function(feature,layer) {
            if (layer.get('custom') && (layer.get('custom').type == 'measure' || layer.get('custom').type == 'temp' || layer.get('custom').hiddenInToc))
                return false;
            else{
                var fid=feature.getId()
                if(!fid && feature.get('_cacheInfo')){
                  fid=feature.get('_cacheInfo').uid;
                }
                self.featureLayers[fid]= layer;
                return true;
            }
        }
      });
      self.selectInteraction.on('select', function(e){

            //if (!this._noselect) this.show(e.mapBrowserEvent.coordinate, options.select.getFeatures().getArray());
            if (!this._noselect)
            {
                this.show(e.mapBrowserEvent.coordinate, self.selectInteraction.getFeatures().getArray())
            }

      }.bind(this));

    this._toolbar = new ol.control.Bar({
        toggleOne: true, // one control active at the same time
        group: false // group controls together
    });
    var mainCtrl = new ol.control.Toggle({
        html: '<span style="display:block;line-height:28px;background-position:center center" class="identify_24_Icon" >&nbsp;</span>',
        className: 'myOlbutton24',
        title: 'Identify features',
    
        onToggle: function (toggle) {
            self.featureLayers={}
            self.selectInteraction.setActive(false);
            if (!toggle) {
                self.mapContainer.setCurrentTool(null);
                self.mapContainer.popup.hide();
                return;
            }
            self.mapContainer.setCurrentTool({
                name: 'identify_task_tool',
                cursor:function(map,e){
                    if(!self._activated){
                        return '';
                    }
                    var c = 'url("/css/images/identify_24_cursor.png")1 1,auto';
                    return c;
                  },
                onActivate: function (event) {
                    map.removeInteraction(self.selectInteraction);
                    map.addInteraction(self.selectInteraction);
                    self.selectInteraction.setActive(true);
                    mainCtrl.setActive(true);  
                },
                onDeactivate: function (event) {
                    
                    self.selectInteraction.setActive(false);

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
   this.mapContainer.topToolbar.addControl(this.mainCtrl);
  
  
}
IdentifyTask.prototype.OnActivated = function (dataObj) {
    this._activated = true;
    if (!this._initialized) {
        this.init();
    }
    this.mapContainer.map.addControl(this.mainCtrl);
    if(this.mainCtrl)
        {
            var ct=this.mapContainer.getCurrentTool();
            if(ct && ct.name==='identify_task_tool'){
               this.mainCtrl.setActive(true);
                this.mainCtrl.raiseOnToggle();
               
            }
        }
}
IdentifyTask.prototype.OnDeActivated = function (dataObj) {
    if (!this._activated)
        return;
    var map = this.mapContainer.map;
    this.mapContainer.setCurrentEditAction(undefined);
    if (this.selectInteraction) {
        //map.removeInteraction(this.selectInteraction);
        this.selectInteraction.setActive(false);
    }
    if(this.mainCtrl)
    {
        this.mainCtrl.setActive(false);
    }
    
    this.mapContainer.map.removeControl(this.mainCtrl);
    this._activated = false;
    this.featureLayers={}
}
IdentifyTask.prototype._getHtml=function(feature){
    var self=this;
    var map = this.mapContainer.map;
    var popup = this.mapContainer.popup;
    var featureAt;
    featureAt={
        feature:feature
    };
    if (featureAt && featureAt.feature) {
        var fid=featureAt.feature.getId()
        if(!fid && featureAt.feature.get('_cacheInfo')){
          fid=featureAt.feature.get('_cacheInfo').uid;
        }
        featureAt.layer=self.featureLayers[fid];
        var fieldsDic = {};
        var fields = null;
        var anyData = false;
        if (featureAt.layer) {
            fields = LayerHelper.getFields(featureAt.layer);
            if (fields) {
                fieldsDic = {};
                for (var i = 0; i < fields.length; i++) {
                    var fld = fields[i];
                    var fldName = fld.name;
                    var title = fld.alias || fldName;
                    fieldsDic[fldName] = title;
                    if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items ){
                        var codedValues={};
                        for(var j=0;j<fld.domain.items.length;j++){
                          codedValues[fld.domain.items[j].code]= fld.domain.items[j].value;
                        }
                        fld.codedValues=codedValues;
                    }
                }
            }

        }


        var feature = featureAt.feature;
        var layer = featureAt.layer;
        var html = '<div class="identifyTask-results">';
        var contentEl=null;
        //html += "<img src='"+feature.get("img")+"'/>";
        html += '<table class="table table-striped table-condensed">';
        html += '<thead>';
        if (layer && layer.get('title')) {
            html += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title') + '</th></tr>';
        } else {
            html += '<tr><th>Field</th><th>Value</th></tr>';
        }
        html += '</thead>';
        html += '<tbody>';
        var properties = feature.getProperties();
        var geom = feature.getGeometry();

        if (fields) {
            anyData = true;
            for (var i = 0; i < fields.length; i++) {
                var fld = fields[i];
                var fldName = fld.name;
                var title = fld.alias || fldName;
                var visible = true;
                if (typeof fld.visible !== 'undefined') {
                    visible = fld.visible;
                }
                if (typeof fld.hidden !== 'undefined') {
                    visible = !fld.hidden;
                }
                var fldValue=properties[fldName];
                if(fld.codedValues){
                    fldValue=fld.codedValues[fldValue];
                    if(typeof fldValue=='undefined'){
                        fldValue='';
                    }
                }
                if (visible) {

                    var key = fldName;
                    html += '<tr>';
                    html += '<td>';
                    html += fieldsDic[key] || title;
                    html += '</td>';
                    html += '<td>';
                    html += fldValue;
                    html += '</td>';
                    html += '</tr>';
                }
            }
        } else {
            for (var key in properties) {
                if (key !== 'geometry') {
                    anyData = true;
                    html += '<tr>';
                    html += '<td>';
                    html += fieldsDic[key] || key;
                    html += '</td>';
                    html += '<td>';
                    html += properties[key];
                    html += '</td>';
                    html += '</tr>';
                }
            }
        }
       
        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        

       
        
        //popup.show(labelPoint, content); 
        if (anyData) {
             contentEl=$(html);

             //counter
             if (this._features.length > 1) {
                var countHtml=$('<div class="ol-count"></div>');
                
                $('<div class="ol-prev"></div>')
                .on("touchstart click", function(e)
                {	
                    this._count--;
                    if (this._count<1) this._count = this._features.length;
                    html = this._getHtml(this._features[this._count-1]);
                    setTimeout(function() { 
                        popup.show(this._position, html); 
                    }.bind(this), 350 );
                }.bind(this))
                .appendTo(countHtml);

                countHtml.append(''+this._count+'/'+this._features.length);
    
                $('<div class="ol-next"></div>')
                .on("touchstart click", function(e)
                {	
                    this._count++;
                    if (this._count>this._features.length) this._count = 1;
                    html = this._getHtml(this._features[this._count-1]);
                    setTimeout(function() { 
                        popup.show(this._position, html); 
                    }.bind(this), 350 );
                }.bind(this))
                .appendTo(countHtml);
    
              
                countHtml.appendTo(contentEl);
                
            }
            // Zoom button
            var zoomHtml=$('<div class="ol-zoom"></div>');
                    
            $('<button type="button" class="ol-zoombt"><i class="fa fa-search-plus"></i></button>')
            .on("touchstart click", function(e)
            {	
                if (feature.getGeometry().getType()==='Point') {
                    map.getView().animate({
                    center: feature.getGeometry().getFirstCoordinate(),
                    zoom:  Math.max(map.getView().getZoom(), 18)
                    });
                } else  {
                    var ext = feature.getGeometry().getExtent();
                    map.getView().fit(ext, { duration:1000 });
                }
            }.bind(this))
            .appendTo(zoomHtml);
            zoomHtml.appendTo(contentEl);
         
        }else{
          
        }
    }else{
       
    }
    // Use select interaction
  if (this.selectInteraction) {
    this._noselect = true;
    this.selectInteraction.getFeatures().clear();
    this.selectInteraction.getFeatures().push(feature);
    this._noselect = false;
  }
  return   contentEl;
}
IdentifyTask.prototype.show = function (coordinate,features) {
    var self=this;
    var map = this.mapContainer.map;
    var popup = this.mapContainer.popup;
    var featureAt;
    if (coordinate instanceof ol.Feature 
        || (coordinate instanceof Array && coordinate[0] instanceof ol.Feature)) {
        features = coordinate;
        coordinate = null;
      }

    this._position= coordinate;
    this._count = 1;
    if (!(features instanceof Array)) features = [features];
    this._features = features.slice();
    if(features && features.length){
        var html = this._getHtml(features[0]);
        if(html){
            if (!coordinate || features[0].getGeometry().getType()==='Point') {
                coordinate = features[0].getGeometry().getFirstCoordinate();
              }
            popup.show(coordinate, html);
            popup.getElement().parentNode.style.zIndex = 500 + map.getOverlays().getLength();
        }else{
            popup.hide();
        }
        
    }else{
        popup.hide();
    }
   
}


