function FeatureAttributesTab(options) {
  var self=this;  
  options=options||{};  
  this.tabId='tabFeatureAttributes' +(options.id?options.id:'');
 
}
FeatureAttributesTab.prototype.init=function(parentDialog){
 this.parentDialog=parentDialog;
}
FeatureAttributesTab.prototype.activate=function(){
 $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
}
FeatureAttributesTab.prototype.onshown=function(){
var self=this;
 var fElem=this.$form.find('[autofocus]').focus().select();  
 if(fElem && fElem.length){
   var offset=fElem.offset().top;
   var tabOffset= this.tabHeader.offset().top;
   self.tab.animate({
         scrollTop: offset - tabOffset -60//-160
       }, 1000);

 }
}
FeatureAttributesTab.prototype.applied=function(obj){
 var self=this;
 this.feature= obj.feature;
 this.layer=obj.layer;
 this.transactFeature= obj.transactFeature;
 this.defaultFieldToEdit=obj.defaultFieldToEdit;

 var fields= obj.fields;
 if(this.layer && this.feature){
   var layerCustom=  this.layer.get('custom');
   if(layerCustom && layerCustom.dataObj && layerCustom.dataObj.details ){
    fields= layerCustom.dataObj.details.fields;
   }
 }
 
 return fields?true:false;
}
FeatureAttributesTab.prototype.create=function(obj,isActive){
 var self=this;
 this.feature= obj.feature;
 var fields= obj.fields;
 var fieldsDic={};
 if(obj.layer){
  this.layer=obj.layer;
  this.transactFeature= obj.transactFeature;
  var layerCustom=  this.layer.get('custom');
   fields= LayerHelper.getFields( this.layer);
 }
 var active='';
 if(isActive)
   active ='active';
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="glyphicon glyphicon-list-alt"></i> Attributes</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 this.tabHeader=tabHeader;

 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
 var properties;
 if(this.feature.getProperties){
   properties = this.feature.getProperties();
 }else {
   properties = this.feature.properties ||{};
 }
 for(var i=0;i< fields.length;i++){
  var fld= fields[i];
  fld._index=i;
 }

 var groups={};
 var items=[];

 for(var i=0;i< fields.length;i++){
   var fld= fields[i];
   var group= fld.group;
   fieldsDic[fld.name]= fld;
   var fldKey='field_'+i;
   var fldType=fld.type.toLowerCase();
   var codedValuesDomain=false;
   if(fld.hidden){
     continue;
   }
   if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items){//} && fld.domain.items.length){
     codedValuesDomain=true;
   }
   if(fld.isExpression){
     //continue;
   
   }
 
   var fldHtml='';
 if(fld.isExpression){
   //continue;
   fldHtml+='  <div class="form-group">';
   fldHtml+='    <label class="" >'+  (fld.alias || fld.name)+ '</label>';
   fldHtml+='    <p class="form-control-static">'+  properties[fld.name]+'</p>';
   fldHtml+='  </div>';
 }else if (codedValuesDomain){
   if(fld.domain.multipleChoice || fld.domain.editable){
    fldHtml+=this.getCodedValuesInput_select2(fld,properties,fldKey);
   }else{
    fldHtml+=this.getCodedValuesInput(fld,properties,fldKey);
   }
 }else if(fldType=='varchar'){
       fldHtml+=this.getTextInput(fld,properties,fldKey);
   }else if (fldType=='date' ){
       fldHtml+=this.getDateInput(fld,properties,fldKey);
   }else if (fldType=='timestamp with time zone' ){
       fldHtml+=this.getDateTimeInput(fld,properties,fldKey);
   }else if (fldType=='smallint' || fldType=='integer' || fldType=='bigint'){
      fldHtml+=this.getIntegerInput(fld,properties,fldKey);
   }else if (fldType=='real' || fldType=='double precision' || fldType=='numeric'){
     fldHtml+=this.getNumberInput(fld,properties,fldKey);
   }else if (fldType=='boolean'){
     fldHtml+=this.getBoolInput(fld,properties,fldKey);
    }else if (fldType=='_filelink'){
     fldHtml+=this.getFilesInput(fld,properties,fldKey);
    
   }else if (fldType=='_documentslink'){
     fldHtml+=this.getDocumentListInput(fld,properties,fldKey);
    }
    

    var fieldItem={
      type:'field',
      html:fldHtml
    };

    var getGroup=function(fld, groupKey){
      if(!groupKey){
        return null;
      }
      groupKey=groupKey+'';
      
      if(groups[groupKey]){
        return groups[groupKey];
      }
      var groupItem;
      var parentGroupKey;
      var parentGroup;
      var groupName=groupKey;
      if(groupKey.indexOf('->')>-1){
        parentGroupKey= groupKey.substring(0,groupKey.lastIndexOf('->'));
        parentGroup= getGroup(fld,parentGroupKey);
        groupName= groupKey.substring(groupKey.lastIndexOf('->')+2)
      }
      var _index=fld._index;
      if(parentGroup){
        _index=parentGroup._index+'-'+ fld._index;
      }
      groupItem={
        type:'group',
        name:groupName,
        _index:_index,
        items:[]
      };
      groups[groupKey]=groupItem
      if(parentGroup){
        parentGroup.items.push(groupItem);
      }else{
        items.push(groupItem);
      }
      return groupItem;
    };

    if(group){
      var groupItem=getGroup(fld,group);
      if(groupItem){
        groupItem.items.push( fieldItem );
      }else{
        items.push(fieldItem);
      }
    }else{
      items.push(fieldItem);
    }
    // if(group){
    //   var groupItem;
    //   if(groups[group]){
    //     groupItem=groups[group];
    //   }else{
    //    var parentGroupName;
    //    var groupName=group;
    //     if(group.indexOf('->')>-1){
    //       parentGroupName= group.substring(0,group.lastIndexOf('->'));
    //       groupName= group.substring(group.lastIndexOf('->')+2)
    //     }
    //     groupItem={
    //       type:'group',
    //       name:groupName,
    //       _index:fld._index,
    //       items:[]
    //     };
    //     groups[group]=groupItem
    //     items.push(groupItem);
    //   }
    //   groupItem.items.push( fieldItem );
    // }else{
    //   items.push(fieldItem);
    // }


//htm+=fldHtml;
 }    
 
 var renderItem= function(item){
   var htm='';
  if(item.type=='field'){
    htm += item.html;
    htm+='<hr class="field-sep"/>';
  }else if (item.type=='group'){
    //htm += '<div class="panel-group" style="margin-bottom:10px">';
    htm += '  <div class="panel panel-default collapsible-panel">';
    htm += '    <div class="panel-heading">';
    htm +='        <button type="button" data-toggle="collapse" data-target="#pnlFieldGroup_'+ item._index+'"  aria-expanded="false" class="btn btn-link btn-block collapsed">';
    htm +='          <i class="collapse-action glyphicon"></i>';
    htm +='          <h5 class="title"><i class=" fa fa-list-alt"></i> '+item.name+'</h5>';
    htm +='        </button>';
    htm +='      </div>'; 

    htm += '    <div id="pnlFieldGroup_'+ item._index+'" class="panel-field-group panel-collapse collapse in_">';
    //htm += '      <div class="panel-body">';
    for(var j=0;j<item.items.length;j++){
      //htm+= item.items[j].html;
      htm+= renderItem(item.items[j]);
      
    }

   // htm += '      </div>';
    htm += '    </div>';

    htm += '   </div>';
  //  htm += ' </div>';

  }
  return htm;
 }
 for(var i=0;i< items.length;i++){
  var item= items[i];
   htm+= renderItem(item);
  
 }
 htm+='';
 htm+='';
 htm+='';
 htm+='';
   
 htm+='</form></div>';
 
 
 var content=$(htm).appendTo( this.tab); 
 content.find('[data-toggle="collapse"]').unbind().click(function(e){
  e.preventDefault();
  var target_element= $(this).attr("data-target")
  content.find(target_element).collapse('toggle');
  return false;
});

 this.createRelationTabs();
   


 var $form = $(content.find('#'+self.tabId+'_form'));
 this.$form=$form;
 this.updateDocumenListContent($form);
 setTimeout(function() {
 
 }, 1000);
 
  $form.find('input,textarea,select').change(function(){
     $(this).addClass('attribute-value-changed');
  });
  $form.find('input[type="checkbox"]').change(function(){
    $(this).parent().addClass('checkbox-attribute-value-changed');
 });

  $form.find('.uploadfile').click(function(){
         var fldKey= $(this).data('field-key');
         var fileListPanel= $form.find('#'+fldKey+'-panel');
         var fldStore= $form.find('#'+fldKey);
         var fileInfos=[]
         try{
           fileInfos= JSON.parse(fldStore.val());
         }catch(ex){}
         if(!fileInfos){
           fileInfos=[];
         }
         if(! Array.isArray(fileInfos)){
           fileInfos=[];
         }
         var dlg = new DlgUpload(self, {
           uploadUrl:'/dataset/uploadattachments',
           
           onUpload:function(dialogRef,results){
             console.log(results);
             for(var f =0 ;f<results.length;f++){
               var fInfo=results[f];
               fInfo.id=-1;
               fInfo.action='new';
               fileInfos.push(fInfo);
             }
             fldStore.val(JSON.stringify(fileInfos));
             fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
             dialogRef.close();
           }
           
       }, {
       title: $(this).attr('title'),
       onapply:function(dlg,data){
           console.log(data);
       }

     }).show();
  });

  $form.on('click','.remove-attachment',function(){
     var fldKey= $(this).data('field-key');
     var fileIndex= $(this).data('file-index');
     var fileListPanel= $form.find('#'+fldKey+'-panel');
     var fldStore= $form.find('#'+fldKey);
     var fileInfos=[]
     try{
       fileInfos= JSON.parse(fldStore.val());
     }catch(ex){}
     if(!fileInfos){
       fileInfos=[];
     }
     if(! Array.isArray(fileInfos)){
       fileInfos=[];
     }
     try{
       fileInfos.splice(fileIndex,1)
     }catch(ex){}
     fldStore.val(JSON.stringify(fileInfos));
     fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
  });
  $form.on('click','.delete-attachment',function(){
   var fldKey= $(this).data('field-key');
   var fileIndex= $(this).data('file-index');
   var fileListPanel= $form.find('#'+fldKey+'-panel');
   var fldStore= $form.find('#'+fldKey);
   var fileInfos=[]
   try{
     fileInfos= JSON.parse(fldStore.val());
   }catch(ex){}
   if(!fileInfos){
     fileInfos=[];
   }
   if(! Array.isArray(fileInfos)){
     fileInfos=[];
   }
   try{
     fileInfos[fileIndex].action='delete';
   }catch(ex){}
   fldStore.val(JSON.stringify(fileInfos));
   fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
});
$form.on('click','.undelete-attachment',function(){
 var fldKey= $(this).data('field-key');
 var fileIndex= $(this).data('file-index');
 var fileListPanel= $form.find('#'+fldKey+'-panel');
 var fldStore= $form.find('#'+fldKey);
 var fileInfos=[]
 try{
   fileInfos= JSON.parse(fldStore.val());
 }catch(ex){}
 if(!fileInfos){
   fileInfos=[];
 }
 if(! Array.isArray(fileInfos)){
   fileInfos=[];
 }
 try{
   fileInfos[fileIndex].action=undefined;
 }catch(ex){}
 fldStore.val(JSON.stringify(fileInfos));
 fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
 });

 $form.find('.uploadDocument').click(function(){
   var fldKey= $(this).data('field-key');
   var docIndex= $(this).data('doc-index');
   var docListPanel= $form.find('#'+fldKey+'-panel');
   var fldStore= $form.find('#'+fldKey);
   var docIds=[]
   var storeValue= fldStore.val();
   try{
     if(storeValue && storeValue !=='undefined'){
       docIds= (fldStore.val()).split(',');
     }
   }catch(ex){}
   if(!docIds){
     docIds=[];
   }
   if(! Array.isArray(docIds)){
     docIds=[];
   }
   var dlg = new DlgUpload(self, {
     uploadUrl:'/document/upload',
     
     onUpload:function(dialogRef,results){
       console.log(results);
       for(var f =0 ;f<results.length;f++){
         var fInfo=results[f];
         
         docIds.push(fInfo.id);
       }
       fldStore.val(docIds.join(','));
       docListPanel.html(self.getDocumenListContent(docIds,fldKey));
       self.updateDocumenListContent(docListPanel);
       dialogRef.close();
     }
     
 }, {
 title: $(this).attr('title'),
 onapply:function(dlg,data){
     console.log(data);
 }

}).show();
 });
 $form.find('.selectDocument').click(function(){
   var fldKey= $(this).data('field-key');
   var docIndex= $(this).data('doc-index');
   var docListPanel= $form.find('#'+fldKey+'-panel');
   var fldStore= $form.find('#'+fldKey);
   var docIds=[]
   var storeValue= fldStore.val();
   try{
     if(storeValue && storeValue !=='undefined'){
       docIds= (fldStore.val()).split(',');
     }
   }catch(ex){}
   if(!docIds){
     docIds=[];
   }
   if(! Array.isArray(docIds)){
     docIds=[];
   }
   var dlg = new DlgSelectDocument(self, {
     url:'/documents?format=json',
    
     onAdd:function(dialogRef,fInfo){
       //console.log(fInfo);
       if(fInfo.id){
         docIds.push(fInfo.id);
       }
       fldStore.val(docIds.join(','));
       docListPanel.html(self.getDocumenListContent(docIds,fldKey));
       self.updateDocumenListContent(docListPanel);
       dialogRef.close();
     }
     
 }, {
 title: $(this).attr('title'),
 onapply:function(dlg,data){
     console.log(data);
 }

}).show();
 });
 
 $form.on('click','.remove-document',function(){
   var fldKey= $(this).data('field-key');
   var docIndex= $(this).data('doc-index');
   var docListPanel= $form.find('#'+fldKey+'-panel');
   var fldStore= $form.find('#'+fldKey);
   var docIds=[]
   try{
     docIds= (fldStore.val()).split(',');
   }catch(ex){}
   if(!docIds){
     docIds=[];
   }
   if(! Array.isArray(docIds)){
     docIds=[];
   }
   try{
     docIds.splice(docIndex,1)
   }catch(ex){}
   fldStore.val(docIds.join(','));
   docListPanel.html(self.getDocumenListContent(docIds,fldKey));
   self.updateDocumenListContent(docListPanel);
});

//$.fn.select2.defaults.set( "theme", "bootstrap" );
//$.fn.modal.Constructor.prototype.enforceFocus = function() {};

var select2s= $form.find('.select2Single,.select2Multiple');
select2s.each(function(index){
  var select2Elm=$(this);
  var fieldName= select2Elm.data('field-name');
  var fld= fieldsDic[fieldName];
  var data=[];
  if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items && fld.domain.items.length){
    for(var i=0;i< fld.domain.items.length;i++){
      var item=fld.domain.items[i];
      data.push({
        id:item.code,text:item.value
      })
    }
  }
var tags= select2Elm.data('tags');
var allowClear= select2Elm.data('allow-clear');
var placeholder=select2Elm.data('placeholder');

  select2Elm.select2({
    theme: "bootstrap",
    //dropdownParent:$(self.parentDialog.dlg.getModal()),
    //dropdownParent: $(this).parent(), //https://github.com/select2/select2-bootstrap-theme/issues/41#issuecomment-310825598
    dropdownParent: $(this).parent().parent().parent().parent().parent(),
    data:data,
    tags:tags,
    placeholder: placeholder,
    allowClear:allowClear// (allowClear=='true' || allowClear )?true:false
  });

  //$(select2Elm).on("select2:select", function(e) { 
    $(select2Elm).on("change", function(e) { 
    //$(this).addClass('attribute-value-changed');
    //$($(select2Elm).select2("container")).addClass('attribute-value-changed');
    select2Elm.data('select2').$container.addClass('attribute-value-changed');
});
});

 this.parentDialog.beforeApplyHandlers.push(function(evt){
       //self.layer.set('title',content.find('#name').val());
       //$.validator.setDefaults({ ignore:':hidden' });

       var orIgnore= $.validator.defaults.ignore;
       $.validator.setDefaults({ ignore:'' });
       $.validator.unobtrusive.parse($form);
       $.validator.setDefaults({ ignore:orIgnore });

       $form.find('.collapsible-panel').removeClass('has-validation-error');

       $form.validate();
       if(! $form.valid()){
         evt.cancel= true;
         tabHeader.find('a').addClass('text-danger');
         self.activate();
         $form.find('.collapsible-panel').has('.input-validation-error').addClass('has-validation-error');
         

         var errElm=$form.find('.input-validation-error').first();
         if(errElm){
           var offset=errElm.offset().top;
           var tabOffset= tabHeader.offset().top;
           self.tab.animate({
                 scrollTop: offset - tabOffset -60//-160
               }, 1000);
       
         }
       }else{
         tabHeader.find('a').removeClass('text-danger');
       }
 });

 this.parentDialog.cancelHandlers.push(function(evt){
  // self.layer.setOpacity(origOpacity);
 });
 this.parentDialog.applyHandlers.push(function(evt){
 
   var properties;
    if(self.feature.getProperties){
      properties = self.feature.getProperties();
    }else {
      properties = self.feature.properties ||{};
    }

   for(var i=0;i< fields.length;i++){
     var fld= fields[i];
     var fldKey= 'field_'+i;
     var fldType=fld.type.toLowerCase();
     var cmp= $form.find('#'+ fldKey);
     if(cmp.length==0){
       continue;
     }
     var v= cmp.val();
     if(fld.domain && fld.domain.type=='codedValues'){
       if(Array.isArray(v)){
         v= v.join(';');
       }
     }
     if(fldType=='varchar' || fldType=='_filelink'|| fldType=='_documentslink'){
       if(v=='Null'){
         v=null;
       }
       properties[fld.name]= v;
     }else if (fldType=='date' ){
       var dv=v;
       try{
         //dv= new Date(v);
       }catch(ex){}
       //if(!isNaN(dv)){
         properties[fld.name]= dv;
     //  }
     }else if (fldType=='timestamp with time zone' ){
       if(v==='')
         v=undefined;
       properties[fld.name]= v;
     }else if (fldType=='smallint' || fldType=='integer' || fldType=='bigint'){
      if(v===''){
        properties[fld.name]= undefined;
       }else{
       if(!isNaN(+v)){ 
         if(!isNaN(parseInt(v))){
           properties[fld.name]= parseInt(v);
         }
       }
      }
     }else if (fldType=='real' || fldType=='double precision' || fldType=='numeric'){
       if(v===''){
        properties[fld.name]= undefined;
       }else{
        if(!isNaN(+v)){ 
          if(!isNaN(parseFloat(v))){
            properties[fld.name]= parseFloat(v);
          }
        }
        }
     }else if (fldType=='boolean'){
       if(cmp && cmp.length && cmp[0].type=='checkbox'){
         v= cmp.prop('checked');
       }
       if(v==='')
         properties[fld.name]= null;
       else{
         if(v===false || v==='0' || v===0 || v==='false' || v==='False'|| v==='FALSE' || v==='no' || v==='No' || v==='NO')
           properties[fld.name]= false;
         else
           properties[fld.name]= true; 
       }
      }
   }  

   if(self.dataRelationshipsTabs && self.dataRelationshipsTabs.length){
    var feature_dataRelationships=[];
    for(var i=0;i<self.dataRelationshipsTabs.length;i++){
      var tab_r=self.dataRelationshipsTabs[i];
      feature_dataRelationships.push($(tab_r).data('dataRelationship'));
    }
    properties['_dataRelationships']=feature_dataRelationships;
   }
  if(self.feature.setProperties){
    self.feature.setProperties(properties);
  }else{
    self.feature.properties=properties;
  }
 });
}
FeatureAttributesTab.prototype.createRelationTabs=function(){
  var self=this;
  if(!this.layer){
    return;
  }
  var layerCustom=  this.layer.get('custom');
  this.dataRelationshipsTabs=[];
  this.dataRelationshipsContent={};
  
  var feature_dataRelationships=this.feature.get('_dataRelationships') ||[];

  var dataRelationships;
    if(layerCustom && layerCustom.dataObj){
        dataRelationships=layerCustom.dataObj.dataRelationships;
    }
    this.dataRelationships=dataRelationships;

    if(dataRelationships && dataRelationships.length){
      for(var i=0;i<dataRelationships.length;i++){
        var dataRelationship= JSON.parse(JSON.stringify(dataRelationships[i]));
        dataRelationship.rows=[];
        for(var j=0;j< feature_dataRelationships.length;j++){
          if(feature_dataRelationships[j].id== dataRelationship.id){
            dataRelationship.rows=JSON.parse(JSON.stringify(feature_dataRelationships[j].rows));
          }
        }
        var tabHeader_r=$('<li class=""><a href="#' +self.tabId+ '-r' + i+ '" data-toggle="tab"><i class="fa fa-chain"></i> '+
        (dataRelationship._isOrigin? dataRelationship.forwardLabel:dataRelationship.backwardLabel)+ '</a> </li>').appendTo(this.parentDialog.tabPanelNav);
        
        var tab_r=$('<div class="tab-pane " id="' +self.tabId+'-r' + i+'"></div>').appendTo(this.parentDialog.tabPanelContent);
        this.dataRelationshipsTabs.push(tab_r);
        $(tab_r).data('dataRelationship',dataRelationship);
          
          this.fillRelationTabRows(tab_r);
          
        
      }
    }

}
FeatureAttributesTab.prototype.fillRelationTabRows=function(tab_r){
  var self=this;
  var dataRelationship =$(tab_r).data('dataRelationship');
  if(!dataRelationship){
    return;
  }
  var fields=dataRelationship._isOrigin?dataRelationship.destinationDatasetDetails.fields:dataRelationship.originDatasetDetails.fields;
 var rows= dataRelationship.rows||[];
  var htm='<div class=" form-horizontal">'; 

  htm+='  <div class="form-group">';
  htm+='    <table  class="table table-condensed table-hover table-responsive" >';
  htm+='    <thead>';
  htm+='      <tr>';
  htm+='        <th></th>'
  for(var i=0;i<fields.length && i< 4;i++){
    htm+='      <th>' + (fields[i].alias || fields[i].name)+'</th>';  
  }
  htm+='      </tr>';
  htm+='    </thead>';
  htm+='    <tbody>';
  var nRows=0;
  for(var r=0;r<rows.length;r++){
    var row= rows[r];
    var _editInfo= row.properties['_editInfo'];

    var class_='';
    if(_editInfo && _editInfo.action=='delete'){
      class_ += ' featureAttributes_row_deleted';
    }else if(_editInfo && _editInfo.modified){
      if(_editInfo.action=='insert'){
        class_ +=' featureAttributes_row_inserted';
      }else{
        class_ +=' featureAttributes_row_modified';
      }
    }
    htm+='      <tr class="'+class_+'" >';
    htm+='        <td>';
    if(_editInfo && _editInfo.action=='delete'){
      htm+='          <button style="margin: 2px;" type="button" data-row="'+r+'" class="remove btn btn-xs btn-danger	" title="UnDelete" ><span class="glyphicon glyphicon-repeat"></span></button>';
    }else{
      htm+='          <button style="margin: 2px;" type="button" data-row="'+r+'" class="remove btn btn-xs btn-danger	" title="Delete" ><span class="glyphicon glyphicon-remove"></span></button>';
      nRows++;
    }
    htm+='          <button style="margin: 2px;" type="button" data-row="'+r+'" class="edit btn btn-xs btn-info	" title="Edit" ><span class="glyphicon glyphicon-edit"></span></button>';
    htm+='        </td>';
    for(var i=0; row.properties && i<fields.length && i< 4;i++){
      var v=row.properties[fields[i].name ];
      if(typeof v=='undefined'){
        v=null;
      }
      if(v===null){
      //  v='';
      }
      htm+='      <td>' + v +'</td>';  
    }
    htm+='      </tr>';
  }
  htm+='    </tbody>';
  if(dataRelationship.cardinality=='OneToMany'
    || dataRelationship.cardinality=='ManyToMany'
    || (dataRelationship.cardinality=='OneToOne' && nRows<1)
  ){
    htm+='    <tfoot>';
    htm+='      <tr>';
    htm+='        <th>';
    htm+='          <button style="margin: 2px;" type="button"  class="addrow btn btn-xs btn-primary	" title="Add new row" ><span class="glyphicon glyphicon-plus"></span> Add</button>';
    htm+='        </th>';
    htm+='      </tr>';
    htm+='    </tfoot>'; 
  }
  htm+='  </table>';
  htm+='  </div>';

  htm+='</div>';

  tab_r.html(htm);

  tab_r.find('button.remove').click(function(){
    var r= $(this).data('row');
    var row= dataRelationship.rows[r];
    row.properties['_editInfo']=row.properties['_editInfo']||{};
    if(row.properties['_editInfo'].action=='insert'){
      dataRelationship.rows.splice(r,1);
    }else{
      if(row.properties['_editInfo'].action=='delete'){
        row.properties['_editInfo'].action='undelete';
        row.properties['_editInfo'].modified=row.properties['_editInfo'].modified;
      }else{
        row.properties['_editInfo'].action='delete';
      }

      dataRelationship._editInfo=dataRelationship._editInfo||{};
      dataRelationship._editInfo['modified']=true;
    }
    self.fillRelationTabRows(tab_r);
  });
  tab_r.find('button.addrow').click(function(){
    var r= $(this).data('row');
    var row= {
      id:-1,
      properties:{}
    };
    var options={};
    var defaultFieldToEdit=options.defaultFieldToEdit; 
    var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
        {
            //layer:vector,
            fields:fields,
            dataRelationship:dataRelationship,
            feature:row,
            defaultFieldToEdit:defaultFieldToEdit//,
            //transactFeature:self.transactFeature
        }
        , {
        title:'Edit attributes',
        tabs:[
            new FeatureAttributesTab()
            //,
            //new FeatureShapeTab(),
            //new FeaturePointTab()
          ],
        onapply:function(dlg){
            //
           
            row.properties['_editInfo']=row.properties['_editInfo']||{};
            row.properties['_editInfo'].action='insert';
            row.properties['_editInfo'].modified=true;

            dataRelationship._editInfo=dataRelationship._editInfo||{};
            dataRelationship._editInfo['modified']=true;
            dataRelationship.rows.push( row);
            self.fillRelationTabRows(tab_r);
            
        },
        helpLink:'/help#editing_attributes'

      }).show();
  });
  tab_r.find('button.edit').click(function(){
    var r= $(this).data('row');
    //alert(r);
    var row= dataRelationship.rows[r];
    var options={};
    var defaultFieldToEdit=options.defaultFieldToEdit; 
    var featurePropertiesDlg = new ObjectPropertiesDlg(self.mapContainer, 
        {
            //layer:vector,
            fields:fields,
            dataRelationship:dataRelationship,
            feature:row,
            defaultFieldToEdit:defaultFieldToEdit//,
            //transactFeature:self.transactFeature
        }
        , {
        title:'Edit attributes',
        tabs:[
            new FeatureAttributesTab()
            //,
            //new FeatureShapeTab(),
            //new FeaturePointTab()
          ],
        onapply:function(dlg){
            //
           
            row.properties['_editInfo']=row.properties['_editInfo']||{};
            if(row.properties['_editInfo'].action!='insert'){
              row.properties['_editInfo'].action='update';
            }
            row.properties['_editInfo'].modified=true;

            dataRelationship._editInfo=dataRelationship._editInfo||{};
            dataRelationship._editInfo['modified']=true;

            self.fillRelationTabRows(tab_r);
            
        },
        helpLink:'/help#editing_attributes'

      }).show();

  });
  //this.dataRelationshipsContent[dataRelationship.name]=$(htm).appendTo( tab_r);
}
FeatureAttributesTab.prototype.getTextInput=function(fld,properties,fldKey){
 var name= fld.name;

 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 htm='';
 var validate=false;
 var useTextArea=false;
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 if(!fld.length || fld.length >200){
     useTextArea=true;
 }
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   if(useTextArea){
       htm+='    <textarea data-field-name="'+fld.name+'" '+ autofocus +' name="'+fldKey+'" id="' +fldKey +'" rows="4" placeholder="'+placeholder+'" class="form-control" ';
   }else{
       htm+='    <input type="text" data-field-name="'+fld.name+'" '+ autofocus +' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   }
   if(isRequired){
     validate=true;
     htm+=' data-val-required="'+caption +' is required"';
   }
   if(fld.length){
     validate=true;
     htm+=' data-val-length="Input length exceeds maximum length of '+ fld.length +' characters" data-val-length-max="' + fld.length + '" ';
   }

   

   if(validate){
     htm+=' data-val="true"';
   }
   if(useTextArea){
     htm+=' >'+value+'</textarea>';
   }else{
     htm+='    />';
   }
   if(fld.hint){
     htm+='      <small class="text-muted">'+fld.hint+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getDateTimeInput=function(fld,properties,fldKey){
 var name= fld.name;
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 htm='';
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   htm+='    <input type="text" data-field-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   
   if(isRequired){
     validate=true;
     htm+=' data-val-required="'+caption +' is required"';
   }
  
   if(validate){
     htm+=' data-val="true"';
   }
   htm+='    />';
   if(fld.hint){
     htm+='      <small class="text-muted">'+fld.hint+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getDateInput=function(fld,properties,fldKey){
 var name= fld.name;
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 htm='';
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   htm+='    <input type="date" data-field-name="'+fld.name+'" '+ autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   
   if(isRequired){
     validate=true;
     htm+=' data-val-required="'+caption +' is required"';
   }
   
   if(validate){
     htm+=' data-val="true"';
   }
   htm+='    />';
   if(fld.hint){
     htm+='      <small class="text-muted">'+fld.hint+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getIntegerInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 htm='';
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   if(app.isMobile()){
    htm+='    <input type="text" inputmode="numeric" data-field-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   }else{
    htm+='    <input type="number"  data-field-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   }
   
   validate=true;
   htm+=' data-val-integer="Input an integer" ';
   if(isRequired){
     validate=true;
     htm+=' data-val-required="'+caption +' is required"';
   }
   var rangeValueHtml='';
   if(fldType=='smallint'){
     validate=true;
     rangeValueHtml+=' data-val-range="Input a number  from -32768 to +32767" data-val-range-min="-32768" data-val-range-max="32767" ';
   }else if(fldType=='integer'){
     validate=true;
     rangeValueHtml+=' data-val-range="Input a number  from -2147483648 to +2147483647" data-val-range-min="-2147483648" data-val-range-max="2147483647" ';
   }else if(fldType=='bigint'){
     validate=true;
     rangeValueHtml+=' data-val-range="Input a number  from -9223372036854775808 to +9223372036854775807" data-val-range-min="-9223372036854775808" data-val-range-max="9223372036854775807" ';
   }

   if(fld.domain && fld.domain.type=='range'){
     var error_msg='';
     var val_htm='';
     if(typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined' && fld.domain.minValue!==''){
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="9223372036854775807"  ';
       error_msg=' data-val-range="Value must be >= '+ fld.domain.minValue+'"';
       validate=true;
     }
     if(typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined'  && fld.domain.maxValue!==''){
       val_htm=' data-val-range-min="-9223372036854775808"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be <= '+ fld.domain.maxValue+'"';
       validate=true;
     }
     if((typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined' && fld.domain.minValue!=='')
       && (typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined' && fld.domain.maxValue!=='')
       )
     {
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be between '+  fld.domain.minValue + ' and '+ fld.domain.maxValue +'"';
       validate=true;
     }
     if(error_msg){
       htm+=val_htm;
       htm+= error_msg ;
       rangeValueHtml='';
     }
   }

   htm+= rangeValueHtml + ' ';

   if(validate){
     htm+=' data-val="true"';
   }
   htm+='    />';
   if(fld.hint){
     htm+='      <small class="text-muted">'+fld.hint+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getNumberInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 var pattern;//='^\d+(?:\.\d{0,2})?$';
 htm='';
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   if(app.isMobile()){
    htm+='    <input type="text" inputmode="numeric" data-field-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   }else{
    htm+='    <input type="number"  data-field-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   }
  
   if(isRequired){
     validate=true;
     htm+=' data-val-required="'+caption +' is required"';
   }
   
    validate=true;
    htm+=' data-val-number="Input a number" ';
   if(pattern){
     //htm+=' pattern="'+ pattern+'"';
     validate=true;
     htm+=' data-val-regex="Incorrect number"  data-val-regex-pattern="' + pattern+'"';
   }
   if(fld.domain && fld.domain.type=='range'){
     var error_msg='';
     var val_htm='';
     if(typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined' && fld.domain.minValue!==''){
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="9223372036854775807"  ';
       error_msg=' data-val-range="Value must be >= '+ fld.domain.minValue+'"';
       validate=true;
     }
     if(typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined'  && fld.domain.maxValue!==''){
       val_htm=' data-val-range-min="-9223372036854775808"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be <= '+ fld.domain.maxValue+'"';
       validate=true;
     }
     if((typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined' && fld.domain.minValue!=='')
       && (typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined' && fld.domain.maxValue!=='')
       )
     {
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be between '+  fld.domain.minValue + ' and '+ fld.domain.maxValue +'"';
       validate=true;
     }
     if(error_msg){
       htm+=val_htm;
       htm+= error_msg ;
     }
   }
   if(validate){
     htm+=' data-val="true"';
   }
   htm+='    />';
   if(fld.hint){
     htm+='      <small class="text-muted">'+fld.hint+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getBoolInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='Null';
 }
 if(value===null){
     value='Null';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;

     isRequired=true;

 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 var pattern;//='^\d+(?:\.\d{0,2})?$';
 htm='';

//     <label class="col-sm-7 checkbox">
//     <input type="checkbox" name="status" @(html.equals('inactive',model._user.status) ? '' : 'checked' ) value="" />Is Active
// </label>

 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
 if(isRequired){
   htm+='    <label class="">';
   htm+='    <input type="checkbox" data-field-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value=""  class="" ';
   if(value=='Null'){
     value=null;
   }
   if(value){
     htm+='    checked="checked"';
   }
   htm+=' />';
   htm+= caption ;
   htm+='    </label>';
 }else{

     htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
     htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="form-control" >';
     htm+='    <option value="1" '+ ((value) ? 'selected="selected"' : '' ) +' >True</option>';
     htm+='    <option value="0" '+ ((value) ? '':'selected="selected"' ) +' >False</option>';
     htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >'+app.DROPDOWN_NULL || 'Null'+'</option>';
     htm+='    </select>';
 } 
 if(fld.hint){
   htm+='      <small class="text-muted">'+fld.hint+'</small>';
 }
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getFilesInput=function(fld,properties,fldKey){
 var self=this;
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='Null';
 }
 if(value===null){
     value='Null';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 var pattern;//='^\d+(?:\.\d{0,2})?$';
 htm='';

//     <label class="col-sm-7 checkbox">
//     <input type="checkbox" name="status" @(html.equals('inactive',model._user.status) ? '' : 'checked' ) value="" />Is Active
// </label>
 var fileInfos=[];
 if(value){
   try{
     fileInfos= JSON.parse(value);
   }catch(ex){}
 }
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
 htm+='    <input type="hidden" name="'+fldKey+'" id="'+fldKey+'" data-field-name="'+fld.name+'" value="'+value+'" readonly class="form-control"></input>';
 htm+='  </div>';
 htm+='  <div class="form-group" id="'+fldKey+'-panel">';
 htm+= self.getFileListContent(fileInfos,fldKey);
 if(fld.hint){
   htm+='      <small class="text-muted">'+fld.hint+'</small>';
 }
 htm+='  </div>';
 if(editable){
   htm+='<button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-primary form-control___ uploadfile "><span class="glyphicon glyphicon-plus"></span></button>';
 }
 
  
  

   return htm;
}
FeatureAttributesTab.prototype.getFileListContent=function(fileInfos,fldKey){
 var htm='';
 // htm+='<div class="table-responsive col-sm-12">';
 // htm+='<table class="table table-condensed">';
 // for(var i=0;fileInfos && i<fileInfos.length;i++){
 //   var fileInfo= fileInfos[i];
 //   htm+='<tr>';
 //   if(fileInfo.name){
 //     htm+='<td>';
 //     htm+='    <a  target="_blank" data-file-id="'+fileInfo.id+'" href="">'+ fileInfo.name+ '</a>';
 //     htm+='</td>';
 //   }
 //   htm+='<td>';
 //   if(fileInfo.action=='new'){
 //      htm +=' <button type="button" class="remove-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'" data-file-index="'+i+'"   title="Remove"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
 //   }else{
 //     if(fileInfo.action='delete'){
 //       htm +=' <button type="button" class="undelete-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'" data-file-index="'+i+'" title="Undelete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
 //     }else{
 //       htm +=' <button type="button" class="delete-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'"  data-file-index="'+i+'" title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
 //     }
 //   }
 //   htm+='</td>';

 //   htm+='</tr>';
 // }
 // htm+='</table>';
 // htm+='</div>';

 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 for(var i=0;fileInfos && i<fileInfos.length;i++){
   var fileInfo= fileInfos[i];
   htm+='<div class="form-group row">';
   htm+='<div class="col-sm-2">';
   if(fileInfo.action=='new'){
      htm +=' <button type="button" class="remove-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'" data-file-index="'+i+'"   title="Remove"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
   }else{
     if(fileInfo.action='delete'){
       htm +=' <button type="button" class="undelete-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'" data-file-index="'+i+'" title="Undelete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
     }else{
       htm +=' <button type="button" class="delete-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'"  data-file-index="'+i+'" title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
     }
   }
   htm+='</div>';
   htm+='<div class="col-sm-10" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"">';
   if(fileInfo.name){
     
     htm+='    <a  target="_blank" data-file-id="'+fileInfo.id+'" href="">'+ fileInfo.name+ '</a>';
     
   }
  

   htm+='</div>';
   htm+='</div>';
   
 }


 return htm;
}
//
FeatureAttributesTab.prototype.getDocumentListInput=function(fld,properties,fldKey){
 var self=this;
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='';
 }
 if(value===null){
     value='';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 var pattern;//='^\d+(?:\.\d{0,2})?$';
 htm='';

//     <label class="col-sm-7 checkbox">
//     <input type="checkbox" name="status" @(html.equals('inactive',model._user.status) ? '' : 'checked' ) value="" />Is Active
// </label>
 var docIds=[];
 if(value){
   try{
     docIds= value.split(',');
   }catch(ex){}
 }
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
 htm+='    <input type="hidden" name="'+fldKey+'" id="'+fldKey+'" data-field-name="'+fld.name+'" value="'+value+'" readonly class="form-control"></input>';
 htm+='  </div>';
 htm+='  <div style="margin-bottom:0;" class="form-group docListPanel" id="'+fldKey+'-panel">';
 htm+= self.getDocumenListContent(docIds,fldKey);
 htm+='  </div>';
 if(editable){
   htm+='<div class="btn-toolbar">';
   htm+='  <button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-xs btn-primary form-control___ uploadDocument " title="بارگذاری سند" ><span class="glyphicon glyphicon-cloud-upload"></span></button>';
   htm+='  <button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-xs btn-primary form-control___ selectDocument " title="انتخاب سند" ><span class="glyphicon glyphicon-paperclip"></span></button>';
   htm+='</div>';
 }
 
   return htm;
}
FeatureAttributesTab.prototype.getDocumenListContent=function(docIds,fldKey){
 var htm='';
 

 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 for(var i=0;docIds && i<docIds.length;i++){
   var docId= docIds[i];
   htm+='<div style="margin-bottom: 5px;"  class="form-group row">';
   htm+='<div class="col-sm-1">';
   
   htm +='   <button type="button" class="remove-document btn btn-xs btn-warning	" data-field-key="'+fldKey+'" data-doc-index="'+i+'"   title="Remove"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
   
   htm+='</div>';
   htm+='<div class="col-sm-11 document_item_" data-doc-id="'+docId+'" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"">';
     
     htm+='    <a  target="_blank" data-doc-id="'+docId+'" href="/document/'+ docId+'">'+ docId+ '</a>';
   
   htm+='</div>';
   htm+='</div>';
   
 }


 return htm;
}
FeatureAttributesTab.prototype.updateAllDocumenListContent=function(){
}
FeatureAttributesTab.prototype.updateDocumenListContent=function(docListPanel){
 var items=docListPanel.find('.document_item_');
 items.each(function(index){
   var item=$(this);
   var docId= item.data('doc-id');
   $.ajax( {    url: '/document/'+docId+'/info', dataType: 'json', success: function (data) {
       if(data && data.id){
         var html='    <a  target="_blank" data-doc-id="'+docId+'" href="/document/'+ docId+'">';
         if(data.thumbnail){
             html+='<img style="" src="'+data.thumbnail+'" />';
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


FeatureAttributesTab.prototype.getCodedValuesInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= fld.alias || name;
 var editable= true;
 var notNull= fld.notNull;
// if( typeof fld.default!=='undefined'){
//   notNull=true;
// }
 var codedValues= fld.domain.items;

 if(typeof fld.editable !=='undefined' ){
   editable=fld.editable;
 }
 var isRequired=false;
 if(!fld.default && notNull){
   isRequired=true;
 }
 if(typeof value ==='undefined'){
   value='Null';
 }
 if(value===null){
     value='Null';
 }
 var placeholder= '';
 if(!notNull){
   placeholder='Null';
 }
 if(typeof fld.default !=='undefined'){
     placeholder= fld.default;
 }
 var autofocus='';
 if(this.defaultFieldToEdit== fld.name){
   autofocus='autofocus';
 }
 var pattern;//='^\d+(?:\.\d{0,2})?$';
 htm='';


//     <label class="col-sm-7 checkbox">
//     <input type="checkbox" name="status" @(html.equals('inactive',model._user.status) ? '' : 'checked' ) value="" />Is Active
// </label>

 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+fld.description+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';


     htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
     htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="form-control" >';
     for(var i=0;i< codedValues.length;i++){
       var item=codedValues[i];
       htm+='    <option value="'+item.code+'" '+ (((value+'')==(item.code+'')) ? 'selected="selected"' : '' ) +' >'+ item.value+'</option>';  
     }
     if(!isRequired){
       //htm+='<option disabled ="disabled" role="separator" />';
       htm+='    <option value="Null" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >'+app.DROPDOWN_NULL || 'Null'+'</option>';
     }
     htm+='    </select>';
     if(fld.hint){
       htm+='      <small class="text-muted">'+fld.hint+'</small>';
     }
  
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getCodedValuesInput_select2=function(fld,properties,fldKey){
  var name= fld.name;
  var fldType=fld.type.toLowerCase();
  var value= properties[name];
  var caption= fld.alias || name;
  var editable= true;
  var notNull= fld.notNull;
 // if( typeof fld.default!=='undefined'){
 //   notNull=true;
 // }
  var codedValues= fld.domain.items;
  
  
  
  if(typeof fld.editable !=='undefined' ){
    editable=fld.editable;
  }
  var isRequired=false;
  if(!fld.default && notNull){
    isRequired=true;
  }
  if(typeof value ==='undefined'){
    value='';
  }
  if(value===null){
      value='';
  }
  var values=[];
  if(value){
    values= (value+'').split(';');
  }
  
  var placeholder= '';
  if(!notNull){
    placeholder='Null';
  }
  if(typeof fld.default !=='undefined'){
      placeholder= fld.default;
  }
  var autofocus='';
  if(this.defaultFieldToEdit== fld.name){
    autofocus='autofocus';
  }
  var pattern;//='^\d+(?:\.\d{0,2})?$';
  htm='';
 
 
 //     <label class="col-sm-7 checkbox">
 //     <input type="checkbox" name="status" @(html.equals('inactive',model._user.status) ? '' : 'checked' ) value="" />Is Active
 // </label>
 
  var validate=false;
  if(fld.description){
    htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
    htm+='      <p class="">'+fld.description+'</p>';
    htm+='  </div>';
  }
  htm+='  <div class="form-group">';
 
 
      htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
      if(fld.domain.multipleChoice){
        htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'[]" id="' +fldKey +'"  class="select2Multiple form-control" multiple="multiple" style="width:auto;_width_:100%;" ';
      }else{
        htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="select2Single form-control" style="width:auto;_width_:100%;" ';
      }
      if(fld.domain.editable){
        htm+='   data-tags="true" ';        
      }
      if(!isRequired){
        htm+='   data-allow-clear="true" ';
      }
      if(placeholder){
        htm+='   data-placeholder="'+placeholder+'" ';
      }
      htm+=' >';
      if(!fld.domain.multipleChoice && !isRequired){
        htm+='    <option></option>'; // fix to not select first one
      }
      for(var j=0;j<values.length;j++){
        var value=values[j];
        var value_str=value;
        for(var i=0;i< codedValues.length;i++){
          var item=codedValues[i];
          if((item.code +'') ==value ){
            value_str=item.value;
          }
        }
        htm+='    <option value="'+value+'" selected="selected" >'+ value_str+'</option>';  
      }

      if(!isRequired){
        
      //  htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >Null</option>';
      }
      htm+='    </select>';
      if(fld.hint){
        htm+='      <small class="text-muted">'+fld.hint+'</small>';
      }
   
    htm+='  </div>';
 
    return htm;
 }