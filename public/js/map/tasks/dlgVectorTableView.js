
function DlgVectorTableView(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgVectorTableView'
      ,(options.title || 'Attributes')
      ,  mapContainer,obj,options);   

}
DlgVectorTableView.prototype = Object.create(DlgTaskBase.prototype);


DlgVectorTableView.prototype.createUI_0=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var source= layer.getSource();
  var fields= LayerHelper.getFields(layer);
  var features= source.getFeatures();

  var columns=[];
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      columns.push({
        title:title,
        name:fldName,
        data:fldName
      })
    }
  }
  var tableId= self.id +'-table';
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  
  htm+='  <div class="form-group">';
  htm+='    <table id="'+ tableId+'" class="table table-condensed table-hover table-responsive" >';
  htm+='    <thead>';
  htm+='      <tr>';
  for(var i=0;i<columns.length;i++){
    htm+='      <th>' + columns[i].title+'</th>';  
  }
  htm+='      </tr>';
  htm+='    </thead>';
  htm+='    <tbody>';
  for(var r=0;r<features.length;r++){
    var row= features[r];
    htm+='      <tr>';
    for(var i=0;i<columns.length;i++){
      htm+='      <td>' + row.get(columns[i].name )+'</td>';  
    }
    htm+='      </tr>';
  }
  htm+='    </tbody>';
  
  htm+='    <tfoot>';
  htm+='      <tr>';
  for(var i=0;i<columns.length;i++){
    htm+='      <th>' + columns[i].title+'</th>';  
  }
  htm+='      </tr>';
  htm+='    </tfoot>';
  htm+='  </table>';
  htm+='  </div>';

 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
  var tableEl=content.find('#'+tableId);
  var table=tableEl.DataTable({
    select: {
      style: 'single'
  }
  }
    );
   
  table.on( 'select', function ( e, dt, type, indexes ) {
    if ( type === 'row' ) {
        var data = table.rows( indexes ).data().pluck( 'id' );
 
        // do something with the ID of the selected items
    }
} );

// tableEl.on( 'click', 'tbody tr', function () {
//   if ( table.row( this, { selected: true } ).any() ) {
//       table.row( this ).deselect();
//   }
//   else {
//       table.row( this ).select();
//   }
// } );

  var $form = $(content.find('#'+self.id +'_form'));
  
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      evt.cancel= true;
      var errElm=$form.find('.input-validation-error').first();
      if(errElm){
        var offset=errElm.offset().top;
        //var tabOffset= tabHeader.offset().top;
        var tabOffset=0;
        //tabOffset=self.mainPanel.offset().top;
        tabOffset=$form.offset().top;
        self.mainPanel.find('.scrollable-content').animate({
              scrollTop: offset - tabOffset //-60//-160
            }, 1000);
    
      }
    }
  });

  this.applyHandlers.push(function(evt){
     // evt.data.distance=content.find('#distance').val();
  });

  this.changesApplied=false
  this.dlg.setSize(BootstrapDialog.SIZE_WIDE);
}
DlgVectorTableView.prototype.createUI_1=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var source= layer.getSource();
  var fields= LayerHelper.getFields(layer);
  var features= source.getFeatures();

  var columns=[];
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      columns.push({
        title:title,
        name:fldName,
        data:fldName
      })
    }
  }
  var data=[];
  for(var r=0;r<features.length;r++){
    var row= features[r];
    var d={};
    for(var i=0;i<columns.length;i++){
      d[columns[i].name]=row.get(columns[i].name );
    }
    data.push(d);
  }
  var tableId= self.id +'-table';
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  
  htm+='  <div class="form-group">';
  htm+='    <table id="'+ tableId+'" class="table table-condensed table-hover table-responsive" >';
  htm+='  </table>';
  htm+='  </div>';

 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
  var tableEl=content.find('#'+tableId);
  var table=tableEl.DataTable({
    data:data,columns:columns
    ,select:{
      style:'api'
    }
  }
    );
   
  table.on( 'select', function ( e, dt, type, indexes ) {
    if ( type === 'row' ) {
        var data = table.rows( indexes ).data().pluck( 'id' );
 
        // do something with the ID of the selected items
    }
} );

tableEl.on( 'click', 'tbody tr', function () {
  if ( table.row( this, { selected: true } ).any() ) {
      table.row( this ).deselect();
  }
  else {
      table.row( this ).select();
  }
} );

  var $form = $(content.find('#'+self.id +'_form'));
  
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      evt.cancel= true;
      var errElm=$form.find('.input-validation-error').first();
      if(errElm){
        var offset=errElm.offset().top;
        //var tabOffset= tabHeader.offset().top;
        var tabOffset=0;
        //tabOffset=self.mainPanel.offset().top;
        tabOffset=$form.offset().top;
        self.mainPanel.find('.scrollable-content').animate({
              scrollTop: offset - tabOffset //-60//-160
            }, 1000);
    
      }
    }
  });

  this.applyHandlers.push(function(evt){
     // evt.data.distance=content.find('#distance').val();
  });

  this.changesApplied=false
  this.dlg.setSize(BootstrapDialog.SIZE_WIDE);
}

DlgVectorTableView.prototype.createUI=function(){
 
  var self=this;
  self.mainPanel.html('');
  var layer= this.obj;
  
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var source= layer.getSource();
  var fields= LayerHelper.getFields(layer);
  var features= source.getFeatures();
  var selectedDic={};
  var layerSelectTask= LayerHelper.getVectorLayerSelectTask(layer);
  var selectedFeatures;
  if(!self.isInitialized){
    self.showSelectedOnly=false;
    
  }
    if(layerSelectTask){
      selectedFeatures=layerSelectTask.interactionSelect.getFeatures();

        if(selectedFeatures.getLength())
        {
                for (var i = 0, f; f = selectedFeatures.item(i); i++) {
                   selectedDic[f.getId()]=true;
                } 
                if(!self.isInitialized){
                  self.isInitialized=true;
                  self.showSelectedOnly=true;
                } 
        }
    }

  var columns=[];
  columns.push({
    checkbox:true,
    field: '_isSelected_',
    sortable:true,
  });
  columns.push({
    title:'id',
    field: '_featureid_',
    visible:true,
    sortable:true,
  });
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      columns.push({
        title:title,
        field: fldName,
        sortable:true,
      })
    }
  }
  var data=[];
  for(var r=0;r<features.length;r++){
    var row= features[r];
    var d={_row_:row};
    for(var i=0;i<columns.length;i++){
      d[columns[i].field]=row.get(columns[i].field );
    }
    var fid=row.getId()
    d['_featureid_']=fid;
    d['_isSelected_']= (selectedDic[fid]?true:false);
    
    var isSelected=d['_isSelected_'];
    if(self.showSelectedOnly){
      if(isSelected){
        data.push(d);
      }
    }else{
      data.push(d);
    }
  }
  var tableId= self.id +'-table';
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  if(self.showSelectedOnly){
    htm+='    <label><input id="showSelectedOnly" checked="checked" type="checkbox"> Show only selected rows</label>';
  }else{
    htm+='    <label><input id="showSelectedOnly" type="checkbox"> Show only selected rows</label>';
  }
  htm+='  <div class="form-group">';
  htm+='    <table id="'+ tableId+'" class="table table-condensed table-hover table-responsive" data-search="true" data-show-columns="true" data-pagination="false" >';
  htm+='  </table>';
  htm+='  </div>';

  htm+='<div class="form-group">';
  htm += '<button type="button" class="btn btn-primary" id="downloadCSV" ><i class="fa fa-download"></i> Download CSV file</button>';
  htm+='</div>'; 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  
 // content.find('#showSelectedOnly').prop("checked",self.showSelectedOnly?false:true);
  content.find('#showSelectedOnly').change(function(){
    var selected= $(this).prop("checked");
    self.showSelectedOnly= (selected?true:false);
   
    self.createUI();
  })
  
  if(!features.length){
    content.find('#downloadCSV').hide();
   }
   content.find('#downloadCSV').click(function(){
    

    
     var fileName= layer.get('title')|| details.shapefileName || details.tableName ;
    var fileContent= self.exportToCsv(columns,features,selectedDic);
  
    var blob = new Blob([fileContent], {type: "text/csv;charset=utf-8"});
    saveAs(blob, fileName +".csv");

});
  var tableEl=content.find('#'+tableId);
  var table=tableEl.bootstrapTable({
    data:data,columns:columns
  }
    );
   
    table.on('check.bs.table', function (e, row, $el) {
      var feature= row['_row_'];
      if(feature && layerSelectTask && layerSelectTask.interactionSelect){
        
        //layerSelectTask.interactionSelect.addFeature_(feature);
        layerSelectTask.interactionSelect.getFeatures().push(feature);
        layerSelectTask.interactionSelect.dispatchEvent({
           type: 'select',
           selected: [feature],
           deselected: []
        });  
      }
    	//alert('check index: ' + $el.closest('tr').data('index'));
    });
    table.on('check-all.bs.table', function (e, rows) {
      var features=[];
     
      
      if( layerSelectTask && layerSelectTask.interactionSelect){
        layerSelectTask.interactionSelect.getFeatures().clear();
        for(var i=0;i<rows.length;i++){
          var feature= rows[i]['_row_'];
          layerSelectTask.interactionSelect.getFeatures().push(feature);
          features.push(feature);
        }
        
        layerSelectTask.interactionSelect.dispatchEvent({
           type: 'select',
           selected: features,
           deselected: []
        });  
      }
    	
    });
    
    table.on('uncheck.bs.table', function (e, row, $el) {
    //	alert('uncheck index: ' + $el.closest('tr').data('index'));
    var feature= row['_row_'];
    if(feature && layerSelectTask && layerSelectTask.interactionSelect){
     
      layerSelectTask.interactionSelect.getFeatures().remove(feature);
        layerSelectTask.interactionSelect.dispatchEvent({
           type: 'select',
           selected: [],
           deselected: [feature]
        }); 
    }
    });
    table.on('uncheck-all.bs.table', function (e, rows) {
      if( layerSelectTask && layerSelectTask.interactionSelect){
        layerSelectTask.interactionSelect.getFeatures().clear();
      }
    	
    });

    
    table.on('dbl-click-row.bs.table', function (e, row, $el) {
      var feature= row['_row_'];
      if(feature && feature.getGeometry ){
        self.mapContainer.zoomToFeature(feature);
      }
    	//alert('check index: ' + $el.closest('tr').data('index'));
    });
  var $form = $(content.find('#'+self.id +'_form'));
  
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      evt.cancel= true;
      var errElm=$form.find('.input-validation-error').first();
      if(errElm){
        var offset=errElm.offset().top;
        //var tabOffset= tabHeader.offset().top;
        var tabOffset=0;
        //tabOffset=self.mainPanel.offset().top;
        tabOffset=$form.offset().top;
        self.mainPanel.find('.scrollable-content').animate({
              scrollTop: offset - tabOffset //-60//-160
            }, 1000);
    
      }
    }
  });

  this.applyHandlers.push(function(evt){
     // evt.data.distance=content.find('#distance').val();
  });

  this.changesApplied=false
  this.dlg.setSize(BootstrapDialog.SIZE_WIDE);
}

DlgVectorTableView.prototype.exportToCsv=function(columns, rows,selectedDic) {
  var writeHeader = function () {
    var finalVal = '';
    var isFirst=true;
    for (var j = 0; j < columns.length; j++) {
       var column= columns[j];
       if(column.checkbox)
          continue;
       if(typeof column.visible !=='undefined' && !column.visible)
          continue; 
      if(!column.field)
          continue;                 
        var innerValue = column.title;
        var result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
        if (!isFirst)
            finalVal += ',';
        isFirst=false    ;
        finalVal += result;
    }
    return finalVal + '\n';
};
  var processRow = function (row) {
      var finalVal = '';
      var isFirst=true;
      for (var j = 0; j < columns.length; j++) {
        var column= columns[j];
        if(column.checkbox)
           continue;
        if(typeof column.visible !=='undefined' && !column.visible)
           continue; 
        if(!column.field)
           continue;            
         var rowVal=row.get(column.field );
         if(column.field=='_featureid_'){
           rowVal= row.getId();
         }
          var innerValue = rowVal === null ? '' : rowVal.toString();
          if (rowVal instanceof Date) {
              innerValue = rowVal.toLocaleString();
          };
          var result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0)
              result = '"' + result + '"';
          if (!isFirst)
              finalVal += ',';
          isFirst=false    ;
          finalVal += result;
      }
      return finalVal + '\n';
  };

  var csvFile = '';
  csvFile += writeHeader();
  for (var i = 0; i < rows.length; i++) {
    var row= rows[i];
    var fid=row.getId()
    
    var isSelected=(selectedDic[fid]?true:false);;
    if(this.showSelectedOnly){
      if(isSelected){
        csvFile += processRow(row);
      }
    }else{
      csvFile += processRow(row);
    }

      
  }

  return csvFile;
}

