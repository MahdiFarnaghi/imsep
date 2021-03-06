
function DlgVectorTableView(mapContainer,obj,options) {
  options.showOKButton=false;
  options.closable=false;
  options.cancelButtonTitle='Close';
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
  var hasEditPermission= this.options.hasEditPermission;
  var layerSelectTask= LayerHelper.getVectorLayerSelectTask(layer);
  var editable=hasEditPermission && layerSelectTask ;

  var columns=[];
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea' && fld.type!=='nill'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      title= DOMPurify.sanitize(title, {SAFE_FOR_JQUERY: true});
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
  htm= DOMPurify.sanitize(htm, {SAFE_FOR_JQUERY: true});
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
  $form.on('submit', function(event){
    // prevents refreshing page while pressing enter key in input box
    event.preventDefault();
  });
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
    if(fld.type !=='bytea' && fld.type!=='nill'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      title= DOMPurify.sanitize(title, {SAFE_FOR_JQUERY: true});
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
  htm= DOMPurify.sanitize(htm, {SAFE_FOR_JQUERY: true});
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
  $form.on('submit', function(event){
    // prevents refreshing page while pressing enter key in input box
    event.preventDefault();
  });
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
  self.forceShowOnlySelection= self.options.forceShowOnlySelection;

  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  var source= layer.getSource();
  var fields= LayerHelper.getFields(layer);
  var features= source.getFeatures();
  var selectedDic={};
  var layerSelectTask= LayerHelper.getVectorLayerSelectTask(layer);
  var layerEditTask= LayerHelper.getVectorLayerEditTask(layer);
  var selectedFeatures;
  var selectedFeaturesCount=0;
  var hasEditPermission= this.options.hasEditPermission;
  var editable=hasEditPermission && layerEditTask ;
  var table;
  if(!self.isInitialized){
    self.showSelectedOnly=false;
    
  }
    if(layerSelectTask){
      selectedFeatures=layerSelectTask.interactionSelect.getFeatures();

        if(selectedFeatures.getLength())
        {
          selectedFeaturesCount=selectedFeatures.getLength();
          for (var i = 0, f; f = selectedFeatures.item(i); i++) {
            var fid=f.getId()
            if(!fid && f.get('_cacheInfo')){
              fid=f.get('_cacheInfo').uid;
            }
              selectedDic[fid]=true;
          } 
          if(!self.isInitialized){
            self.isInitialized=true;
            self.showSelectedOnly=true;
          } 
        }
    }
    var addNewRow= function(defaultFieldToEdit){
      if(editable){
        var feature = new ol.Feature();
        
        layerEditTask.addFeatureAttributes(feature,{
          defaultFieldToEdit:defaultFieldToEdit,
          onCommit:function(){
            // if($tr){
            //   $tr.removeClass('updating-record-faild');
            //   $tr.addClass('wait-updating-record');
            // }
          },
          onFailed:function(){
            // if($tr){
            //   $tr.removeClass('wait-updating-record');
            //   $tr.addClass('updating-record-faild');
              
            // }
          },
          onSuccess:function(data){
            // if($tr){
            //   $tr.removeClass('updating-record-faild');
            //   $tr.removeClass('wait-updating-record');
            // }
            //var feature=row._row_;
           // source.clear();
            //features= source.getFeatures();
            if(!data){
              return;
            }
            if(!data.id){
              return;
            }
            var index =features.length;
            if(feature.setId){
              feature.setId(data.id);
            }else{
              feature.id=data.id;
            }
            var d={_row_:feature};
           
            for(var i=0;i<columns.length;i++){
              //d[columns[i].field]=feature.get(columns[i].field );

              if(columns[i].codedValues){

                d[columns[i].field]=feature.get(columns[i].field );
                var key=d[columns[i].field]+'';
                if(columns[i].codedValues[key]){
                  d[columns[i].field]=columns[i].codedValues[key];
                }
                
              }else{
                d[columns[i].field]=feature.get(columns[i].field );
              }

            }
            d['_sys_featureid_']=data.id;
            d['_sys_isSelected_']= false;
          
            table.bootstrapTable('insertRow', {
              index: index,
              row: d
            });
          }

        });
    }
  };
    var editRow= function(row,index,defaultFieldToEdit,$tr){
      if(editable){
        layerEditTask.editFeatureAttributes(row._row_,{
          displayInModal:true,
          defaultFieldToEdit:defaultFieldToEdit,
          onCommit:function(){
            if($tr){
              $tr.removeClass('updating-record-faild');
              $tr.addClass('wait-updating-record');
            }
          },
          onFailed:function(){
            if($tr){
              $tr.removeClass('wait-updating-record');
              $tr.addClass('updating-record-faild');
              
            }
          },
          onSuccess:function(){
            if($tr){
              $tr.removeClass('updating-record-faild');
              $tr.removeClass('wait-updating-record');
            }
            var feature=row._row_;
            var d={_row_:feature};
            for(var i=0;i<columns.length;i++){
              //d[columns[i].field]=feature.get(columns[i].field );

              if(columns[i].codedValues){

                d[columns[i].field]=feature.get(columns[i].field );
                var key=d[columns[i].field]+'';
                if(columns[i].codedValues[key]){
                  d[columns[i].field]=columns[i].codedValues[key];
                }
                
              }else{
                d[columns[i].field]=feature.get(columns[i].field );
              }

            }
            
            d['_sys_featureid_']=row['_sys_featureid_'];
            d['_sys_isSelected_']= row['_sys_isSelected_']
            table.bootstrapTable('updateRow', {
              index: index,
              row: d
            });
          }

        });
    }
  };
  var deleteRow=function(row,index,$tr){
      if(editable){
        layerEditTask.deleteSingleFeature(row._row_,{
          msg:'Delete feature?',
          onCommit:function(){
            if($tr){
              $tr.removeClass('updating-record-faild');
              $tr.addClass('wait-updating-record');
            }
          },
          onFailed:function(){
            if($tr){
              $tr.removeClass('wait-updating-record');
              $tr.addClass('updating-record-faild');
              
            }
          },
          onSuccess:function(){
            if($tr){
              $tr.removeClass('updating-record-faild');
              $tr.removeClass('wait-updating-record');
            }
            table.bootstrapTable('remove', {
              field: '_sys_featureid_',
              values: [row['_sys_featureid_']]
            })
          }

        });
      }
    };
   var opFormaterStr= '<div style="display: flex;">';
   //opFormaterStr+='<a class="zoomTo" href="javascript:void(0)" title="Zoom to">';
   //opFormaterStr+= '<i  class="glyphicon glyphicon-zoom-in"></i>';
   //opFormaterStr+= '</a>  ';

   if(layerCustom.type!=='table'){
    opFormaterStr+= '<button style="margin: 2px;" type="button" class="zoomTo btn btn-xs btn-primary	" title="Zoomto" ><span class="glyphicon glyphicon-zoom-in"></span></button>';
   }
   
   if(editable){
    //opFormaterStr+='<a class="remove" href="javascript:void(0)" title="Remove">';
    //opFormaterStr+='<i class="fa fa-trash"></i>';
    //opFormaterStr+='</a>';
    opFormaterStr+= '<button style="margin: 2px;" type="button" class="remove btn btn-xs btn-danger	" title="Delete" ><span class="glyphicon glyphicon-remove"></span></button>';

    //opFormaterStr+='<a class="edit" href="javascript:void(0)" title="Edit">';
    //opFormaterStr+= '<i style="height:28px;width:30px;display:flex" class="attributesWindow_24_Icon"></i>';
    //opFormaterStr+= '</a>';
    opFormaterStr+= '<button style="margin: 2px;" type="button" class="edit btn btn-xs btn-info	" title="Edit" ><span class="glyphicon glyphicon-edit"></span></button>';
   }
   opFormaterStr+= '</div>';
  
   
  
  var columns=[];
  columns.push({
    checkbox:true,
    field: '_sys_isSelected_',
    sortable:true,
  });
  columns.push({
    title:'',
    field: '_sys_operate_',
    width:'100px',
    formatter:function(value, row, index) {
      return opFormaterStr;
    },
    events:{
      'click .zoomTo': function (e, value, row, index) {
        var feature= row['_row_'];
        if(feature && feature.getGeometry ){
          self.mapContainer.zoomToFeature(feature);
        }
      },
      'click .remove': function (e, value, row, index) {
        var tr=e.target.closest('tr');
               deleteRow(row,index,$(tr));
       
      },
      'click .edit': function (e, value, row, index) {
        var tr=e.target.closest('tr');
        
        //$table.bootstrapTable('updateRow', {index: index, row: row})
            editRow(row,index,undefined,$(tr));
        
      }
    }
    ,
    sortable:false,
  });
  columns.push({
    title:'id',
    field: '_sys_featureid_',
    visible:true,
    sortable:true,
  });
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea' && fld.type!=='nill'){
      var fldName=fld.name;
      var title= fld.alias|| fldName;
      title= DOMPurify.sanitize(title, {SAFE_FOR_JQUERY: true});
      var codedValues=undefined;
      if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items){
        codedValues={};
        for(var j=0;j< fld.domain.items.length;j++){
          codedValues[fld.domain.items[j].code]=fld.domain.items[j].value;
        }
      }
      columns.push({
        title:title,
        field: fldName,
        sortable:true,
        codedValues:codedValues
      })
    }
  }
  var data=[];
  for(var r=0;r<features.length;r++){
    var row= features[r];
    var d={_row_:row};
    for(var i=0;i<columns.length;i++){
      if(columns[i].codedValues){

        d[columns[i].field]=row.get(columns[i].field );
        var key=d[columns[i].field]+'';
        if(columns[i].codedValues[key]){
          d[columns[i].field]=columns[i].codedValues[key];
        }
        
      }else{
        d[columns[i].field]=row.get(columns[i].field );
      }
    }
    var fid=row.getId()
    if(!fid && row.get('_cacheInfo')){
      fid=row.get('_cacheInfo').uid;
    }
    d['_sys_featureid_']=fid;
    d['_sys_isSelected_']= (selectedDic[fid]?true:false);
    
    var isSelected=d['_sys_isSelected_'];
    if(self.showSelectedOnly){
      if(isSelected){
        data.push(d);
      }
    }else{
      data.push(d);
    }
  }
  var tableId= self.id +'-table';
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="bootstrap_table_form modal-body form-horizontal">';  
  if(self.forceShowOnlySelection){
    if(self.showSelectedOnly){
      htm+='    <label><input id="showSelectedOnly" checked="checked" disabled="disabled" type="checkbox"> Show only selected rows</label>';
    }else{
      htm+='    <label><input id="showSelectedOnly" type="checkbox" disabled="disabled"> Show only selected rows</label>';
    }
  }else{
    if(self.showSelectedOnly){
      htm+='    <label><input id="showSelectedOnly" checked="checked" type="checkbox"> Show only selected rows</label>';
    }else{
      htm+='    <label><input id="showSelectedOnly" type="checkbox"> Show only selected rows</label>';
    }
  }
  htm+='<div class="form-group" >';
  htm+='<div class="btn-toolbar">';
  //htm += ' <button type="button" class="btn btn-xs btn-primary" id="generateReport" ><i class="fa fa-bar-chart"></i> Chart</button>';
  htm += ' <button type="button" class="btn btn-xs btn-primary" id="downloadCSV" ><i class="fa fa-download"></i> Download CSV</button>';
  htm+='</div>'; 
  htm+='</div>'; 
  htm+='  <div class="form-group">';
  htm+='    <table id="'+ tableId+'" class="table table-condensed table-hover table-responsive" data-search="true" data-show-columns="true" data-pagination="false" >';
  htm+='  </table>';
  htm+='  </div>';

  // htm+='<div class="form-group">';
  // htm += '<button type="button" class="btn btn-primary" id="downloadCSV" ><i class="fa fa-download"></i> Download CSV file</button>';
  // htm+='</div>'; 

  if(editable && layerCustom.type=='table'){
    htm+='<div class="form-group" >';
    htm+='<div class="btn-toolbar">';
    htm += ' <button type="button" class="btn btn-xs btn-primary" id="addNewRecord" ><i class="glyphicon glyphicon-plus"></i> New record</button>';
    htm+='</div>'; 
    htm+='</div>'; 
  }
  htm += '</form>';
  htm+='  </div>';
  htm= DOMPurify.sanitize(htm, {SAFE_FOR_JQUERY: true});
  var content=$(htm).appendTo( this.mainPanel); 
  
 // content.find('#showSelectedOnly').prop("checked",self.showSelectedOnly?false:true);
  content.find('#showSelectedOnly').change(function(){
    var selected= $(this).prop("checked");
    self.showSelectedOnly= (selected?true:false);
    if(self.forceShowOnlySelection){
      self.showSelectedOnly=true;
    }
    self.createUI();
  })
  
  if(!features.length){
    content.find('#downloadCSV').hide();
    content.find('#generateReport').hide();
   }
   content.find('#generateReport').click(function(){
    // var reports= LayerHelper.getReports(self.layer)||[];
    // var isNew=false;
    // var report=undefined;
    // if(!reports.length){
    //   isNew=true;
    // }else{
    //   report=reports[reports.length-1];
    // }
    //   var dlg = new DlgReport(self.mapContainer, self.layer, {
    //     isNew:isNew,
    //     report:report,
    //     forceShowOnlySelection:self.showSelectedOnly,
    //     //title:self.title,
    //     onapply:function(dlg,data){
    //       var a=data;
    //       if(data.report){
    //         if(data.isNew){
    //           reports.push(data.report);
    //         }else{
    //           report.chart=data.report.chart;
    //           report.summary=data.report.summary;
    //         }
    //       }
    //       LayerHelper.setReports(self.layer,reports);
    //     }
  
    //   }).show();
  
    });
   content.find('#downloadCSV').click(function(){
      var fileName= layer.get('title')|| details.shapefileName || details.tableName ;
    var fileContent= self.exportToCsv(columns,features,selectedDic);
  
    var blob = new Blob([fileContent], {type: "text/csv;charset=utf-8"});
    saveAs(blob, fileName +".csv");

});

content.find('#addNewRecord').click(function(){
  addNewRow(undefined);
});

  var tableEl=content.find('#'+tableId);
   table=tableEl.bootstrapTable({
    //showToggle:true,
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
      var index = $el.closest('tr').data('index');
      var feature= row['_row_'];
      if(feature && feature.getGeometry ){
        self.mapContainer.zoomToFeature(feature);
      }
      // if(feature){
      //   editRow(row,index);
      // }
    	//alert('check index: ' + $el.closest('tr').data('index'));
    });
    table.on('dbl-click-cell.bs.table', function (e, field, value, row, $el) {
      var tr=$el.closest('tr');
      var index=$el.closest('tr').data('index');

      var feature= row['_row_'];
      if(feature){
        editRow(row,index,field,$(tr));
      }
      // EditCellValue($el.closest('tr').data('index'),
      //               $el.closest('td'), 
      //               row.id, 
      //               value);
    });
  var $form = $(content.find('#'+self.id +'_form'));
  $form.on('submit', function(event){
    // prevents refreshing page while pressing enter key in input box
    event.preventDefault();
  });
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
       if(column.field=='_sys_operate_')
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
        if(column.field=='_sys_operate_')
           continue;   
        if(typeof column.visible !=='undefined' && !column.visible)
           continue; 
        if(!column.field)
           continue;            
         var rowVal=row.get(column.field );
         if(column.field=='_sys_featureid_'){
           rowVal= row.getId();
         }
         var innerValue='';
         if(rowVal===null){

         }else if (typeof rowVal==='undefined'){

         }else{
          if (rowVal instanceof Date) {
            innerValue = rowVal.toLocaleString();
          }else{
            innerValue=rowVal.toString();
          }
         }
          //var innerValue = rowVal === null ? '' : rowVal.toString();
          
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
    if(!fid && row.get('_cacheInfo')){
      fid=row.get('_cacheInfo').uid;
    }
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

