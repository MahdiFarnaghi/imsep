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
            if(!layer){
                return false;
            }
            if (layer.get('custom') && (layer.get('custom').type == 'measure' || layer.get('custom').type == 'temp' || layer.get('custom').hiddenInToc))
                return false;
            else{
                var fid=feature.getId()
                if(!fid && feature.get('_cacheInfo')){
                  fid=feature.get('_cacheInfo').uid;
                }
                self.featureLayers[fid +'-'+ feature.ol_uid]= layer;
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
            self.selectInteraction.getFeatures().clear();
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
                    self.selectInteraction.getFeatures().clear();
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
        this.selectInteraction.getFeatures().clear();
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
        featureAt.layer=self.featureLayers[fid+'-'+ feature.ol_uid];
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
        var html = '<div class="panel panel-info">';
        var contentEl=null;
        //html += "<img src='"+feature.get("img")+"'/>";
        html +='<div class="panel-heading">';
        if (layer && layer.get('title')) {
            html += layer.get('title') ;
        } 
        html +='</div>';
        
        html +='<div class="panel-body">';

        html += '<table class="table table-striped table-condensed">';
        // html += '<thead>';
        // if (layer && layer.get('title')) {
        //     html += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title') + '</th></tr>';
        // } else {
        //     html += '<tr><th>Field</th><th>Value</th></tr>';
        // }
        html += '</thead>';
        html += '<tbody>';
        var properties = feature.getProperties();
        var geom = feature.getGeometry();

        if (fields) {
            anyData = true;
            for (var i = 0; i < fields.length; i++) {
                var fld = fields[i];
                var fldName = fld.name;
                var fldType= fld.type;
                var title = fld.alias || fldName;
                var visible = true;
                if (typeof fld.visible !== 'undefined') {
                    visible = fld.visible;
                }
                if (typeof fld.hidden !== 'undefined') {
                    visible = !fld.hidden;
                }
                if(fld.type==='nill'){
                    visible=false;
                }
                var fldValue=properties[fldName];
                if(fld.codedValues){
                    
                    if(typeof fld.codedValues[fldValue]!=='undefined'){
                        fldValue=fld.codedValues[fldValue];
                    }else if ((fldValue+'').indexOf(';')>-1){
                        var fldValue_array= (fldValue+'').split(';');
                        var fldValue_array_t=[];
                        for(var j=0;j< fldValue_array.length;j++){
                            if(typeof fld.codedValues[fldValue_array[j]]!=='undefined'){
                                fldValue_array_t.push(fld.codedValues[fldValue_array[j]]);
                            }else{
                                fldValue_array_t.push(fldValue_array[j]);
                            }
                        }
                        fldValue= fldValue_array_t.join(';');
                    }
                }
                if (visible) {
                    
                    var key = fldName;
                    html += '<tr>';
                    html += '<td>';
                    html += fieldsDic[key] || title;
                    html += '</td>';
                    html += '<td>';
                    if (fldType=='_documentslink'){
                        var docIds=[];
                        if(fldValue){
                          try{
                            docIds= fldValue.split(',');
                          }catch(ex){}
                        }
                        html+='  <div style="margin-bottom:0;" class="form-group docListPanel" >';
                        for(var j=0;docIds && j<docIds.length;j++){
                            var docId= docIds[j];
                            html+='<div style="margin-bottom: 5px;"  class="form-group row">';
                            html+='<div class="col-sm-11 document_item_" data-doc-id="'+docId+'" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"">';
                            html+='    <a  target="_blank" data-doc-id="'+docId+'" href="/document/'+ docId+'">'+ docId+ '</a>';
                            html+='</div>';
                            html+='</div>';
                            
                          }
                        html+='  </div>';

                    }else if (fldType=='_filelink'){
                        var fileInfos=[];
                        try{
                            fileInfos= JSON.parse(fldValue);
                        }catch(ex0){}
                        
                        var htm='';
                        htm+='  <div style="margin-bottom:0;" class="form-group docListPanel" >';
                        for(var f=0;fileInfos && f<fileInfos.length;f++){
                            var fileInfo= fileInfos[f];
                            if(fileInfo.action=='delete'){
                                continue;
                            }
                            htm+='<div style="margin-bottom: 5px;"  class="form-group row">';
                            if(fileInfo.id && fileInfo.dataset){
                                if(app.get_attachment_url){
                                   htm+='    <a  target="_blank" data-file-id="'+fileInfo.id+'" href="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id,false)+'">'+ fileInfo.name+ '';
                                   if(fileInfo.thumbnail){
                                     htm+='<br/><img style="display: block;max-width: 100%;" src="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id,true)+'" />';
                                   }
                                   htm+='</a>';
                                   if(fileInfo.mimeType=='audio/mp3' || fileInfo.mimeType=='audio/mp4' ||fileInfo.mimeType=='audio/m4a' || fileInfo.mimeType=='audio/x-m4a'|| fileInfo.mimeType=='audio/mpeg'){
                                     htm+=' <audio controls style="display:block;width:200px" >';
                                     htm+='    <source src="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id)+'" type="'+fileInfo.mimeType+'">';
                                     htm+='           Player not supported.';
                                     htm+=' </audio>';
                                    }else  if(fileInfo.mimeType=='video/mp4' || fileInfo.mimeType=='video/mpeg'){
                                        htm+=' <video controls style="display:block;    width: 100%; max-width: 300px;" >';
                                        htm+='    <source src="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id)+'" type="'+fileInfo.mimeType+'">';
                                        htm+='           Player not supported.';
                                        htm+=' </video>';
                                   }
                                  
                                }else{
                                   htm+='    <a  target="_blank" data-file-id="'+fileInfo.id+'" href="/dataset/'+fileInfo.dataset+'/attachment/'+ fileInfo.id+'">'+ fileInfo.name;
                                   
                                   htm+='</a>';
                                }
                              }else{
                               htm+='    <span>'+ fileInfo.name+ '</span>';
                               if(fileInfo.thumbnail_dataUrl){
                                 htm+='<img style="display: block;max-width: 100%;" src="'+fileInfo.thumbnail_dataUrl+'" />';
                               }else  if(fileInfo.dataUrl){
                                 if(fileInfo.mimeType && fileInfo.mimeType.indexOf('image/')>-1){
                                   htm+='<img style="display: block;max-width: 100%;" src="'+fileInfo.dataUrl+'" />';
                                 }
                               }
                               if(fileInfo.dataUrl){  
                                if(fileInfo.mimeType=='audio/mp3' || fileInfo.mimeType=='audio/mp4' ||fileInfo.mimeType=='audio/m4a' || fileInfo.mimeType=='audio/x-m4a'|| fileInfo.mimeType=='audio/mpeg'){
                                   htm+=' <audio controls style="display:block;width:200px" >';
                                   //htm+='    <source src="horse.ogg" type="audio/ogg">';
                                   htm+='    <source src="'+fileInfo.dataUrl +'" type="'+fileInfo.mimeType+'">';
                                   htm+='           Player not supported.';
                                   htm+=' </audio>';
                                 }else  if(fileInfo.mimeType=='video/mp4' || fileInfo.mimeType=='video/mpeg'){
                                    htm+=' <video controls style="display:block;    width: 100%; max-width: 300px;" >';
                                    htm+='    <source src="'+fileInfo.dataUrl +'" type="'+fileInfo.mimeType+'">';
                                    htm+='           Player not supported.';
                                    htm+=' </video>';
                                  }
                               }
                              }
                            htm+='  </div>';//<hr/>';

                        }
                        htm+='  </div>';
                        html += htm;
                    }else{
                        html += fldValue;
                    }
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
        
        html +='</div>';
        html +='<div class="panel-footer"><nav class="navbar"> </nav></div>';
        html +='</div>';

        

       
        html= DOMPurify.sanitize(html, {SAFE_FOR_JQUERY: true});
         //popup.show(labelPoint, content); 
         if (anyData) {
            contentEl=$(html);
             footer=contentEl.find('.panel-footer .navbar');
            this.updateDocumenListContent(contentEl)  ;
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
   
             
              // countHtml.appendTo(contentEl);
              countHtml.appendTo(footer);
               
           }
           // Zoom button
          // var zoomHtml=$('<div class="ol-zoom pull-left"></div>');
                   
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
           .appendTo(footer);
          // .appendTo(zoomHtml);
         //  zoomHtml.appendTo(contentEl);
         //  zoomHtml.appendTo(footer);
        
       }else{
         
       }
    }else{
       
    }
    // Close button
    
                    
//     $('<button type="button" style="" class="ol-closebt"><i class="fa fa-times" style="/*color:rgba(0,60,136,1);*/"></i></button>')
//     .on("touchstart click", function(e)
//     {	
        
//           popup.hide();       
       
//     }.bind(this))
//    // .appendTo(closeHtml);
//    .appendTo(footer);

// Use select interaction
  if (this.selectInteraction) {
    this._noselect = true;
    try{
        this.selectInteraction.getFeatures().clear();
    }catch(ex){}
    try{
        this.selectInteraction.getFeatures().push(feature);
    }catch(ex){}
    this._noselect = false;
  }
  return   contentEl;
}
IdentifyTask.prototype.updateDocumenListContent=function(docListPanel){
    var items=docListPanel.find('.document_item_');
    items.each(function(index){
      var item=$(this);
      var docId= item.data('doc-id');
      $.ajax( {    url: '/document/'+docId+'/info', dataType: 'json', success: function (data) {
          if(data && data.id){
            var html='    <a  target="_blank" data-doc-id="'+docId+'" href="/document/'+ docId+'">';
            if(data.thumbnail){
                html+='<img style=" " src="'+data.thumbnail+'" />';
            }else if(data.icon){
              html+='     <i style="" class="avatar fa fa-file-o fa-file-'+data.icon+'-o" > </i>'
            }
            html+= data.name+ '</a>';
              item.html(html);
          }else{
            item.parent().remove();
          }
        }
      });
    });

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


