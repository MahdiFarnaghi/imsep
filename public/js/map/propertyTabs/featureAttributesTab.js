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
FeatureAttributesTab.prototype.field_i18n=function(fld,key,defaultValue){
  var i18n=app.i18n;
  var k=key;
  var returnValue=defaultValue;
  if(i18n && (returnValue in i18n)){
    returnValue = i18n[returnValue];
  }
  if(i18n && fld &&  fld.name){
    k= fld.name+'.'+key;
  
    if((k in i18n)){
      returnValue = i18n[k];
    }
    if(key=='codedValues'){
      k= fld.name+'.codedValues.'+(defaultValue +'').trim();
      if((k in i18n)){
        returnValue = i18n[k];
      }
    }
  }
  
  if(fld && fld.i18n && fld.i18n[app.language]){
    i18n=fld.i18n[app.language];
    if(key in i18n){
      if(key=='codedValues'){
        k = (defaultValue+'').trim();
        if( k in i18n['codedValues'] ){
          returnValue =i18n['codedValues'][k];
        }
      }else{
        returnValue = i18n[key];
      }
    }
  }
  
  return returnValue;
  
}
FeatureAttributesTab.prototype.onshown=function(){
var self=this;
if(!this.$form){
  return;
}
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
FeatureAttributesTab.prototype.create__=function(obj,isActive){
  var self=this;
  this.feature= obj.feature;
  var autosaveId='autosave';
  
 
  if(obj.layer){
   this.layer=obj.layer;
   this.transactFeature= obj.transactFeature;
   var layerCustom=  this.layer.get('custom');
    fields= LayerHelper.getFields( this.layer);
    autosaveId+= '_'+ this.layer.get('title');
  }
  if(this.feature){
    if(this.feature.getId){
      var fid=this.feature.getId()
      if(!fid && this.feature.get('_cacheInfo')){
                    fid=this.feature.get('_cacheInfo').uid;
      }
      if(!fid){
        fid=-1;
      }
      autosaveId+= '_'+fid;
    }
   } 
  if(app && app.controller && app.controller.storageService){
    app.controller.storageService.get(autosaveId).then(function(data){
       if(data){
        console.log('autosaved data loaded');
        self.create_inner(obj,isActive,data);
       }else{
        self.create_inner(obj,isActive,null);
       }
    }).catch(function(error){
      console.log('failed to load autosaved data');
      self.create_inner(obj,isActive,null);
    });
 }else{
  self.create_inner(obj,isActive,null);
 }

}
FeatureAttributesTab.prototype.create=function(obj,isActive){
 var self=this;
 this.feature= obj.feature;
 var fields= obj.fields;
 var fieldsDic={};
 this.fileInfosStorage={};
 
 var autosaveId=obj.autosaveId?obj.autosaveId:false;
 self._autosave_done=false;
 var initData= obj.initData?obj.initData:null;

 if(obj.layer){
  this.layer=obj.layer;
  this.transactFeature= obj.transactFeature;
  var layerCustom=  this.layer.get('custom');
   fields= LayerHelper.getFields( this.layer);
   //autosaveId+= '_'+ this.layer.get('title');
 }

 

//  if(this.feature){
//   if(this.feature.getId){
//     var fid=this.feature.getId()
//     if(!fid && this.feature.get('_cacheInfo')){
//                   fid=this.feature.get('_cacheInfo').uid;
//     }
//     if(!fid){
//       fid=-1;
//     }
//     autosaveId+= '_'+fid;
//   }
//  } 
 var active='';
 if(isActive)
   active ='active';
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="glyphicon glyphicon-list-alt"></i> Attributes</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 this.tabHeader=tabHeader;

 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
 var properties;
 var orig_propertues=null;
 if(this.feature.getProperties){
   properties = this.feature.getProperties();
 }else {
   properties = this.feature.properties ||{};
 }
 try{
  orig_propertues = JSON.parse(JSON.stringify(properties));
 }catch(ex){
 }
 if(!orig_propertues){
  orig_propertues={}
  for(var i=0;properties && i< fields.length;i++){
    var fld= fields[i];
    orig_propertues[fld.name]=properties[fld.name];
    if(typeof orig_propertues[fld.name]=='undefined' && typeof fld.default!=='undefined'){
      orig_propertues[fld.name]=fld.default;
    }
   }
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
   group=self.field_i18n(fld,'group',fld.group);
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
   var fld_alias = self.field_i18n(fld,'alias',fld.alias);
   fldHtml+='  <div class="form-group">';
   fldHtml+='    <label class="" >'+  (fld_alias || fld.name)+ '</label>';
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
   }else if (fldType=='nill' ){
        fldHtml+=this.getNillInput(fld,properties,fldKey);
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
     fldHtml+=this.getFilesInput(fld,properties,initData,fldKey);
    
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
 
 htm= DOMPurify.sanitize(htm, {SAFE_FOR_JQUERY: true});
 
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
 $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
 setTimeout(function() {
 
 }, 1000);
 
  $form.find('input,textarea,select').change(function(){
     $(this).addClass('attribute-value-changed');
     $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
  });
  $form.find('input[type="checkbox"]').change(function(){
    $(this).parent().addClass('checkbox-attribute-value-changed');
    $form.find('.collapsible-panel').has('.checkbox-attribute-value-changed').addClass('has-attribute-value-changed');
 });

  $form.find('.uploadfile').click(function(){
         var fldKey= $(this).data('field-key');
         var fileListPanel= $form.find('#'+fldKey+'-panel');
         var fldStore= $form.find('#'+fldKey);
         var fileInfos=[]
         try{
           //fileInfos= JSON.parse(fldStore.val());
           fileInfos= self.fileInfosStorage[fldKey];
         }catch(ex){}
         if(!fileInfos){
           fileInfos=[];
         }
         if(! Array.isArray(fileInfos)){
           fileInfos=[];
         }
         self.fileInfosStorage[fldKey]= fileInfos;

         var dlg = new DlgUpload(self, {
           //uploadUrl:'/dataset/uploadattachments',
           uploadUrl:app.get_uploadattachments_url(),
           onUpload:function(dialogRef,results){
             console.log(results);
             for(var f =0 ;f<results.length;f++){
               var fInfo=results[f];
               fInfo.id=-1;
               fInfo.action='new';
               fileInfos.push(fInfo);
             }
             //fldStore.val(JSON.stringify(fileInfos));
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
  
  $form.find('.cameraCapture').unbind().click(function(){
    var fldKey= $(this).data('field-key');
    var fileListPanel= $form.find('#'+fldKey+'-panel');
    var fldStore= $form.find('#'+fldKey);
    var fileInfos=[]
    try{
      //fileInfos= JSON.parse(fldStore.val());
      fileInfos= self.fileInfosStorage[fldKey];
    }catch(ex){}
    if(!fileInfos){
      fileInfos=[];
    }
    if(! Array.isArray(fileInfos)){
      fileInfos=[];
    }
    self.fileInfosStorage[fldKey]= fileInfos;
    navigator.camera.getPicture(function(imageData){
      var fInfo={name:'captured'};
          fInfo.id=-1;
          fInfo.action='new';
          fInfo.dataUrl="data:image/jpeg;base64,"+imageData;
          fInfo.mimeType='image/jpeg';
          fileInfos.push(fInfo);
          fileListPanel.html(self.getFileListContent(fileInfos,fldKey));

    },function(message) {
      alert('Failed because: ' + message);
    }, { quality: 50,
      destinationType: Camera.DestinationType.DATA_URL 
     });

   
  });

  
  $form.find('.startRecordAudio').unbind().click(function(){
    var fldKey= $(this).data('field-key');
    var me=$(this);
    var parent=$(this).parent();
    var fldName= $(this).data('field-name');
    var fileListPanel= $form.find('#'+fldKey+'-panel');
    var fldStore= $form.find('#'+fldKey);
    var fileInfos=[]
    try{
      //fileInfos= JSON.parse(fldStore.val());
      fileInfos= self.fileInfosStorage[fldKey];
    }catch(ex){}
    if(!fileInfos){
      fileInfos=[];
    }
    if(! Array.isArray(fileInfos)){
      fileInfos=[];
    }
    self.fileInfosStorage[fldKey]= fileInfos;

    parent.find('.stopRecordAudio').show();
    
    parent.find('.audioAmplitude').css('width', '0%');
    parent.find('.audioAmplitude_progress').show();

    me.hide();
    var outputFile=app.getTempAudioRecordingLocation(fldName+"_recording.mp3");
    var src = outputFile.fileName;
    var mediaRec = new Media(src,
        // success callback
        function() {
          // parent.find('.stopRecordAudio').hide();
          // parent.find('.audioAmplitude_progress').hide();
          // me.show();
          // clearInterval(mediaTimer);
          onEnd_Stop();
            console.log("recordAudio():Audio Success");
            window.resolveLocalFileSystemURL(outputFile.dirName + outputFile.fileName, function (fileEntry) {
              
              fileEntry.file(function(file){
                app.fileToDataUrlAsync(file).then(function(dataUrl){
                  var fInfo={name:'recorded'};
                  fInfo.id=-1;
                  fInfo.action='new';
                  fInfo.dataUrl=dataUrl;
                  fInfo.mimeType='audio/mp3';
                  fileInfos.push(fInfo);
                  fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
  
                }).catch(function(error){
                  console.error(error)
                });

              } ,function(err){
                console.error(error)
              });


             
              
            }, function (error) {
              console.error(error)
            });  
        },

        // error callback
        function(err) {
          
          onEnd_Stop();
          

            console.log("recordAudio():Audio Error: "+ err.code);
        });
        
      var mediaTimer = setInterval(function () {
        // get media amplitude
        mediaRec.getCurrentAmplitude(
            // success callback
            function (amp) {
                console.log(amp + "%");
                parent.find('.audioAmplitude').css('width', (amp*100)+'%');
            },
            // error callback
            function (e) {
                console.log("Error getting amp=" + e);
            }
        );
      }, 300);

        parent.find('.stopRecordAudio').unbind().click(function(){
          
          mediaRec.stopRecord();
          mediaRec.release();
          onEnd_Stop();
        });

        function onEnd_Stop(){
          parent.find('.stopRecordAudio').hide();
          parent.find('.audioAmplitude_progress').hide();
          parent.find('.startRecordAudio').show();
          clearInterval(mediaTimer);
          me.show();
        }
        mediaRec.startRecord();
       
  });

  $form.on('click','.remove-attachment',function(){
     var fldKey= $(this).data('field-key');
     var fileIndex= $(this).data('file-index');
     var fileListPanel= $form.find('#'+fldKey+'-panel');
     var fldStore= $form.find('#'+fldKey);
     var fileInfos=[]
     try{
     //  fileInfos= JSON.parse(fldStore.val());
     fileInfos=self.fileInfosStorage[fldKey];
     }catch(ex){}
     if(!fileInfos){
       fileInfos=[];
     }
     if(! Array.isArray(fileInfos)){
       fileInfos=[];
     }
     self.fileInfosStorage[fldKey]=fileInfos;
     try{
       fileInfos.splice(fileIndex,1)
     }catch(ex){}
     //fldStore.val(JSON.stringify(fileInfos));
     fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
  });
  $form.on('click','.delete-attachment',function(){
   var fldKey= $(this).data('field-key');
   var fileIndex= $(this).data('file-index');
   var fileListPanel= $form.find('#'+fldKey+'-panel');
   var fldStore= $form.find('#'+fldKey);
   var fileInfos=[]
   try{
     //fileInfos= JSON.parse(decodeURIComponent(fldStore.val()));
     fileInfos= self.fileInfosStorage[fldKey]
   }catch(ex){}
   if(!fileInfos){
     fileInfos=[];
   }
   if(! Array.isArray(fileInfos)){
     fileInfos=[];
   }
   self.fileInfosStorage[fldKey]=fileInfos;
   try{
     fileInfos[fileIndex].action='delete';
   }catch(ex){}
   //fldStore.val(JSON.stringify(fileInfos));
   fileListPanel.html(self.getFileListContent(fileInfos,fldKey));
});
$form.on('click','.undelete-attachment',function(){
 var fldKey= $(this).data('field-key');
 var fileIndex= $(this).data('file-index');
 var fileListPanel= $form.find('#'+fldKey+'-panel');
 var fldStore= $form.find('#'+fldKey);
 var fileInfos=[]
 try{
   //fileInfos= JSON.parse( fldStore.val());
   fileInfos=self.fileInfosStorage[fldKey];
 }catch(ex){}
 if(!fileInfos){
   fileInfos=[];
 }
 if(! Array.isArray(fileInfos)){
   fileInfos=[];
 }
 self.fileInfosStorage[fldKey]= fileInfos;
 try{
   fileInfos[fileIndex].action=undefined;
 }catch(ex){}
 //fldStore.val(JSON.stringify(fileInfos));
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
        id:item.code,
        text:self.field_i18n(fld,'codedValues',item.value)
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
    $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
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
          if(errElm.scrollintoview){
            errElm.scrollintoview({
              duration: 1000,
             // direction: "vertical",
              viewPadding: { y: 80 },
              complete: function() {
                  // highlight the element so user's focus gets where it needs to be
              }
            });
          }else{
           var offset=errElm.offset().top;
           var tabOffset= tabHeader.offset().top;
            self.tab.animate({
                  scrollTop: offset - tabOffset -60//-160
                }, 1000);
         
          }
         }
       }else{
         tabHeader.find('a').removeClass('text-danger');
       }
 });

 this.parentDialog.cancelHandlers.push(function(evt){
  
  clearAutoSaved();
   clearAutoSavedTimeout();
 });
 this.parentDialog.applyHandlers.push(function(evt){
 
   var properties;
    if(self.feature.getProperties){
      properties = self.feature.getProperties();
    }else {
      properties = self.feature.properties ||{};
    }

    populatePropertiesFromForm(properties);

  if(self.feature.setProperties){
    self.feature.setProperties(properties);
  }else{
    self.feature.properties=properties;
  }
  clearAutoSaved();
 });

 function populatePropertiesFromForm(properties){
    if(!properties){
      return;
    }
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      var fldKey= 'field_'+i;
      var fldType=fld.type.toLowerCase();
      
      if(fldType=='_filelink'){
        if(self.fileInfosStorage){
          properties[fld.name]= JSON.stringify(self.fileInfosStorage[fldKey]);
        }
        continue;
      }
      
      
      var cmp= $form.find('#'+ fldKey);
      if(cmp.length==0 ){
        continue;
      }
      var v= cmp.val();
      if(fld.domain && fld.domain.type=='codedValues'){
        if(Array.isArray(v)){
          v= v.join(';');
        }
      }
      if(v){
        v=DOMPurify.sanitize(v);
      }
      if(fldType=='varchar' || fldType=='_documentslink'){
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
 }

 if(initData){
   for(var key in initData){
    if (Object.prototype.hasOwnProperty.call(initData, key)) {
      var fldValue= initData[key];
      var searchKey="[data-field-name='"+key+"']";
      var elem;
      elem=$form.find('.select2Single'+searchKey+'');
      if(elem && elem.length){
        try{

          if (elem.find("option[value='" + fldValue + "']").length) {
            elem.val(fldValue);
            elem.trigger('change');
          } else { 
              // Create a DOM Option and pre-select by default
              //var newOption = new Option(data.text, data.id, true, true);
              var newOption = new Option(fldValue, fldValue, true, true);
              // Append it to the select
              elem.append(newOption).trigger('change');
          } 

        


          elem.data('select2').$container.addClass('attribute-value-changed');
        }catch(ex){
          console.log(ex);
        }
        continue;
      }
      elem=$form.find('.select2Multiple'+searchKey+'');
      if(elem && elem.length){
        fldValue=fldValue+'';
        try{
          fldValue=fldValue.split(';');
          if(fldValue.length){ // apend none existing values
            for(var v=0;v<fldValue.length;v++){
              var sValue=fldValue[v];
              if (!elem.find("option[value='" + sValue + "']").length) {
                var newOption = new Option(sValue, sValue, true, true);
                 elem.append(newOption)
              }
            }
          }
          elem.val(fldValue);
          elem.trigger('change');
          elem.data('select2').$container.addClass('attribute-value-changed');
          $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
        }catch(ex){
          console.log(ex);
        }
        continue;
      }
      elem=$form.find('input[type!="checkbox"]'+searchKey+',textarea'+searchKey+',select'+searchKey+'');
      if(elem && elem.length){
        elem.val(fldValue).addClass('attribute-value-changed');
        $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
        continue;
      }
      
      elem= $form.find('input[type="checkbox"]'+searchKey+'');
      if(elem && elem.length){
        elem.prop('checked',fldValue?true:false);
        elem.addClass('attribute-value-changed');
        elem.parent().addClass('checkbox-attribute-value-changed');
        $form.find('.collapsible-panel').has('.attribute-value-changed').addClass('has-attribute-value-changed');
        continue;
      }
     
      
     
    }
   }
 }
 function clearAutoSavedTimeout(){
  if (self.autosave_timeoutId) {
    
    clearTimeout(self.autosave_timeoutId);
    console.log('autosaved cleared');
  }
 }
 clearAutoSavedTimeout();

 function autosave(){
    if(!autosaveId){
      return;
    }
    //console.log('autosaving...');
    var properties={} ;
    var changed_properties={}
    var count=0;
    populatePropertiesFromForm(properties);
    for(var key in properties){
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        var val= properties[key];
        if(typeof val==='undefined'){
          val='';
        }
        if(val===null){
          val='';
        }
        val=val+'';
        if(orig_propertues){
          if(key in orig_propertues){
            var origValue=orig_propertues[key];
            if(typeof origValue==='undefined'){
              origValue='';
            }
            if(origValue===null){
              origValue='';
            }
            if(val !== (origValue+'')){
              changed_properties[key]=properties[key];
              count++;
            }
          }
        }
      }
    }
    if(count){
      if(autosaveId && app && app.controller && app.controller.storageService){
          app.controller.storageService.set(autosaveId,changed_properties).then(function(e){
              self._autosave_done=true;
              console.log(changed_properties);
              console.log('autosave done:'+ autosaveId);

              //app.controller.storageService.cacheMap()
          }).catch(function(error){
            console.log('autosave failed');
          });
      }
      
      
    }
    self.autosave_timeoutId= setTimeout(function() {
      autosave();
    }, app.AttributePage_AutoSave_Timeout *1000);
 }
 this.autosave_timeoutId= setTimeout(function() {
    autosave();
 }, app.AttributePage_AutoSave_Timeout *1000);

 function clearAutoSaved(){
  clearAutoSavedTimeout();
 // if(self._autosave_done){
    if(app && app.controller && app.controller.storageService){
      app.controller.storageService.delete(autosaveId).then(function(e){
          self._autosave_done=false;
          console.log('autosaved data removed:'+ autosaveId);
      }).catch(function(error){
        console.log('failed to remove autosaved data');
      });
  }
//  }
 }

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
 var caption= this.field_i18n(fld,'alias',fld.alias) || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
     htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint) +'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getNillInput=function(fld,properties,fldKey){
  var name= fld.name;
 
  var value= properties[name];
  var caption= this.field_i18n(fld,'alias',fld.alias) || name;
  htm='';
  var validate=false;
  var useTextArea=false;
  if(fld.description){
   htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
   //htm+='  <hr style="margin-bottom: 0;" />';
   htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
   htm+='  </div>';
 }
  htm+='  <div class="form-group">';
    htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
    if(fld.hint){
      htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint) +'</small>';
    }
    htm+='  </div>';
 
    return htm;
 }
FeatureAttributesTab.prototype.getDateTimeInput=function(fld,properties,fldKey){
 var name= fld.name;
 var value= properties[name];
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
     htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getDateInput=function(fld,properties,fldKey){
 var name= fld.name;
 var value= properties[name];
 var caption= this.field_i18n(fld,'alias',fld.alias) || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
     htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getIntegerInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
     htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getNumberInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
     htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
   }
   htm+='    <span class="field-validation-valid" data-valmsg-for="'+fldKey+'" data-valmsg-replace="true"></span>';
   htm+='  </div>';

   return htm;
}
FeatureAttributesTab.prototype.getBoolInput=function(fld,properties,fldKey){
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder= app.DROPDOWN_NULL || 'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
   htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
 }
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getFilesInput=function(fld,properties,initData,fldKey){
 var self=this;
 var name= fld.name;
 var fldType=fld.type.toLowerCase();
 var value= properties[name];
 var attribute_value_changed='';
 if(initData &&  initData[name]){
   value=initData[name];
   attribute_value_changed='attribute-value-changed';
 }
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder= app.DROPDOWN_NULL ||'Null';
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
 
 this.fileInfosStorage[fldKey]=fileInfos;
 
 var validate=false;
 if(fld.description){
  htm+='  <div class="form-group" style="margin-bottom: 0;"  >';
  //htm+='  <hr style="margin-bottom: 0;" />';
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';
 htm+='    <label class="'+attribute_value_changed+'" for="'+ fldKey+'">'+ caption+ '</label>';
 //htm+='    <input type="hidden" name="'+fldKey+'" id="'+fldKey+'" data-field-name="'+fld.name+'" value="'+app.htmlEncode(value)+'" readonly class="form-control"></input>';
 htm+='  </div>';
 htm+='  <div class="form-group" id="'+fldKey+'-panel">';
 htm+= self.getFileListContent(fileInfos,fldKey);
 if(fld.hint){
   htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
 }
 htm+='  </div>';
 if(editable){
  htm+='<div class="container upload-commands">';
   htm+='<button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-default form-control___ uploadfile "><span class="glyphicon glyphicon-upload"></span></button>';
   if(!fld.defaultMimeType || (fld.defaultMimeType && fld.defaultMimeType.indexOf('image/')>-1 )){
    if(navigator && navigator.camera){
      htm+='<button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-primary form-control___ cameraCapture "><span class="glyphicon glyphicon-camera"></span></button>';
    }
  }
  if(!fld.defaultMimeType || (fld.defaultMimeType && fld.defaultMimeType.indexOf('audio/')>-1 )){
    if(typeof Media !=='undefined'){
        htm+='<button  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-primary form-control___ startRecordAudio "><span class="glyphicon glyphicon-record"></span></button>';
        htm+='<button style="display:none;"  type="button" data-field-name="'+fld.name+'" data-field-key="'+fldKey+'"  class="btn btn-danger form-control___ stopRecordAudio "><span class="glyphicon glyphicon-stop"></span></button>';
        htm+='<div style="display:none;" class="progress audioAmplitude_progress">';
        htm+='<div   class="progress-bar progress-bar-success progress-bar-striped active audioAmplitude"  style="width:0%"> Recording Audio </div>';
        htm+='</div>';
    }
  }
  htm+='</div>';
 }
 
  
  

   return htm;
}
FeatureAttributesTab.prototype.getFileListContent=function(fileInfos,fldKey){
 var htm='';
 
 for(var i=0;fileInfos && i<fileInfos.length;i++){
   var fileInfo= fileInfos[i];
   var rowClass='';
    if(fileInfo.action=='new'){
      rowClass='info';
    }else if (fileInfo.action=='delete') {
      rowClass='danger';
    }else{
      // rowClass='warning';
    }

   htm+='<div class="form-group row '+ rowClass+'">';
   htm+='<div class="col-xs-2">';
   if(fileInfo.action=='new'){
      htm +=' <button type="button" class="remove-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'" data-file-index="'+i+'"   title="Remove"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
   }else{
     if(fileInfo.action=='delete'){
       htm +=' <button type="button" style="text-decoration: line-through;" class="undelete-attachment btn btn-xs btn-warning	" data-field-key="'+fldKey+'" data-file-index="'+i+'" title="Undelete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
     }else{
       htm +=' <button type="button" class="delete-attachment btn btn-xs btn-danger	" data-field-key="'+fldKey+'"  data-file-index="'+i+'" title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button>';
     }
   }
   htm+='</div>';
   if(fileInfo.action=='delete'){
      htm+='<div class="col-xs-10" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;text-decoration: line-through;">';
   }else   {
      htm+='<div class="col-xs-10" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">';
   }
   if(fileInfo.name){
     if(fileInfo.id && fileInfo.dataset){
       if(app.get_attachment_url){
          htm+='    <a  target="_blank" data-file-id="'+fileInfo.id+'" href="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id,false)+'">'+ fileInfo.name+ '';
          if(fileInfo.thumbnail){
            htm+='<img style="display: block;max-width: 100%;" src="'+app.get_attachment_url(fileInfo.dataset, fileInfo.id,true)+'" />';
          }
          htm+='</a>';
          if(fileInfo.mimeType=='audio/mp3' || fileInfo.mimeType=='audio/mp4'|| fileInfo.mimeType=='audio/mpeg'){
            htm+=' <audio controls style="display:block;    width: 100%; max-width: 300px;" >';
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
        if(fileInfo.mimeType=='audio/mp3' || fileInfo.mimeType=='audio/mp4'|| fileInfo.mimeType=='audio/mpeg'){
          htm+=' <audio controls style="display:block;    width: 100%; max-width: 300px;" >';
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
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
 var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
   placeholder=app.DROPDOWN_NULL ||'Null';
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
  htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
  htm+='  </div>';
}
 htm+='  <div class="form-group">';


     htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
     htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="form-control" >';
     for(var i=0;i< codedValues.length;i++){
       var item=codedValues[i];
       var item_value=this.field_i18n(fld,'codedValues',item.value);
       
       htm+='    <option value="'+item.code+'" '+ (((value+'')==(item.code+'')) ? 'selected="selected"' : '' ) +' >'+ item_value+'</option>';  
     }
     if(!isRequired){
       //htm+='<option disabled ="disabled" role="separator" />';
       htm+='    <option value="Null" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >'+app.DROPDOWN_NULL || 'Null'+'</option>';
     }
     htm+='    </select>';
     if(fld.hint){
       htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
     }
  
   htm+='  </div>';

   return htm;
}

FeatureAttributesTab.prototype.getCodedValuesInput_select2=function(fld,properties,fldKey){
  var name= fld.name;
  var fldType=fld.type.toLowerCase();
  var value= properties[name];
  var caption= this.field_i18n(fld,'alias',fld.alias)  || name;
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
    placeholder= app.DROPDOWN_NULL || 'Null';
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
    htm+='      <p class="">'+this.field_i18n(fld,'description',fld.description)+'</p>';
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
        htm+='    <option value="'+value+'" selected="selected" >'+  this.field_i18n(fld,'codedValues',value_str)+'</option>';  
      }

      if(!isRequired){
        
      //  htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >Null</option>';
      }
      htm+='    </select>';
      if(fld.hint){
        htm+='      <small class="text-muted">'+this.field_i18n(fld,'hint',fld.hint)+'</small>';
      }
   
    htm+='  </div>';
 
    return htm;
 }