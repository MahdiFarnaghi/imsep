function FeatureAttributesTab() {
  var self=this;    
  this.tabId='tabFeatureAttributes';
 
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

 var fields;
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
 this.layer=obj.layer;
 this.transactFeature= obj.transactFeature;
 var layerCustom=  this.layer.get('custom');
 var fields= LayerHelper.getFields( this.layer);
 var active='';
 if(isActive)
   active ='active';
 var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="glyphicon glyphicon-list-alt"></i> Attributes</a> </li>').appendTo(this.parentDialog.tabPanelNav);
 this.tabHeader=tabHeader;

 this.tab=$('<div class="tab-pane '+active+'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
 var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
 var properties = this.feature.getProperties();

 for(var i=0;i< fields.length;i++){
   var fld= fields[i];
   var fldKey='field_'+i;
   var fldType=fld.type.toLowerCase();
   var codedValuesDomain=false;
   if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items && fld.domain.items.length){
     codedValuesDomain=true;
   }
   if(fld.isExpression){
     //continue;
   
   }
 //   'varchar':'variable-length character string, up to defined Length',
 // 'boolean':'Boolean values like;true|false,yes|no,1|0',
 // smallint: '2 bytes small integer, range:	-32768 to +32767',
 // integer:'4 bytes typical choice for integer, range: -2147483648 to +2147483647',
 // bigint:'8 bytes large integer, rage: -9223372036854775808 to +9223372036854775807',
 // numeric:'variable	number with user-specified precision. <br /> Example, A numeric field with Length=5 and Scale=2 can store -999.99 to 999.99 ',
 // real:'4 bytes	variable-precision, inexact	6 decimal digits precision',
 // 'double precision':'8 bytes	variable-precision, inexact	15 decimal digits precision',
 // 'date':'4 bytes date (no time of day)',
 // 'timestamp with time zone':'8 bytes	both date and time with time zone, example:2018-08-28 12:22:01.673<span class="label label-info">+04:30</span>',
 // 'bytea':'BLOB, Binary Large OBject'
 if(fld.isExpression){
   //continue;
   htm+='  <div class="form-group">';
   htm+='    <label class="" >'+  (fld.alias || fld.name)+ '</label>';
   htm+='    <p class="form-control-static">'+  properties[fld.name]+'</p>';
   htm+='  </div>';
 }else if (codedValuesDomain){
   htm+=this.getCodedValuesInput(fld,properties,fldKey);
 }else if(fldType=='varchar'){
       htm+=this.getTextInput(fld,properties,fldKey);
   }else if (fldType=='date' ){
       htm+=this.getDateInput(fld,properties,fldKey);
   }else if (fldType=='timestamp with time zone' ){
       htm+=this.getDateTimeInput(fld,properties,fldKey);
   }else if (fldType=='smallint' || fldType=='integer' || fldType=='bigint'){
      htm+=this.getIntegerInput(fld,properties,fldKey);
   }else if (fldType=='real' || fldType=='double precision' || fldType=='numeric'){
     htm+=this.getNumberInput(fld,properties,fldKey);
   }else if (fldType=='boolean'){
     htm+=this.getBoolInput(fld,properties,fldKey);
    }else if (fldType=='_filelink'){
     htm+=this.getFilesInput(fld,properties,fldKey);
    
   }else if (fldType=='_documentslink'){
     htm+=this.getDocumentListInput(fld,properties,fldKey);
    }
    

 }     
 
 htm+='';
 htm+='';
 htm+='';
 htm+='';
   
 htm+='</form></div>';
 
 
 var content=$(htm).appendTo( this.tab); 
 


 var $form = $(content.find('#'+self.tabId+'_form'));
 this.$form=$form;
 this.updateDocumenListContent($form);
 setTimeout(function() {
 
 }, 1000);
 
  $form.find('input,textarea,select').change(function(){
     $(this).addClass('attribute-value-changed');
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
 this.parentDialog.beforeApplyHandlers.push(function(evt){
       //self.layer.set('title',content.find('#name').val());
       //$.validator.setDefaults({ ignore:':hidden' });

       var orIgnore= $.validator.defaults.ignore;
       $.validator.setDefaults({ ignore:'' });
       $.validator.unobtrusive.parse($form);
       $.validator.setDefaults({ ignore:orIgnore });

       $form.validate();
       if(! $form.valid()){
         evt.cancel= true;
         tabHeader.find('a').addClass('text-danger');
         self.activate();
        
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
   var properties = self.feature.getProperties();
   for(var i=0;i< fields.length;i++){
     var fld= fields[i];
     var fldKey= 'field_'+i;
     var fldType=fld.type.toLowerCase();
     var cmp= $form.find('#'+ fldKey);
     if(cmp.length==0){
       continue;
     }
     var v= cmp.val();
     if(fldType=='varchar' || fldType=='_filelink'|| fldType=='_documentslink'){
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
       if(!isNaN(+v)){ 
         if(!isNaN(parseInt(v))){
           properties[fld.name]= parseInt(v);
         }
       }
     }else if (fldType=='real' || fldType=='double precision' || fldType=='numeric'){
       if(!isNaN(+v)){ 
         if(!isNaN(parseFloat(v))){
           properties[fld.name]= parseFloat(v);
         }
       }
     }else if (fldType=='boolean'){
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

   self.feature.setProperties(properties);
 });
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
   if(fld.description){
     htm+='      <small class="text-muted">'+fld.description+'</small>';
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
   if(fld.description){
     htm+='      <small class="text-muted">'+fld.description+'</small>';
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
   if(fld.description){
     htm+='      <small class="text-muted">'+fld.description+'</small>';
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
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   htm+='    <input type="number" data-field-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   
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
     if(typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined'){
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="9223372036854775807"  ';
       error_msg=' data-val-range="Value must be >= '+ fld.domain.minValue+'"';
       validate=true;
     }
     if(typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined'){
       val_htm=' data-val-range-min="-9223372036854775808"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be <= '+ fld.domain.maxValue+'"';
       validate=true;
     }
     if((typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined')
       && (typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined')
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
   if(fld.description){
     htm+='      <small class="text-muted">'+fld.description+'</small>';
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
 htm+='  <div class="form-group">';
   htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
   htm+='    <input type="number" data-field-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
   
  
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
     if(typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined'){
       val_htm=' data-val-range-min="' +fld.domain.minValue+'"  ';
       val_htm+=' data-val-range-max="9223372036854775807"  ';
       error_msg=' data-val-range="Value must be >= '+ fld.domain.minValue+'"';
       validate=true;
     }
     if(typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined'){
       val_htm=' data-val-range-min="-9223372036854775808"  ';
       val_htm+=' data-val-range-max="' +fld.domain.maxValue+'"  ';
       error_msg=' data-val-range="Value must be <= '+ fld.domain.maxValue+'"';
       validate=true;
     }
     if((typeof fld.domain.minValue !=='undefined' && fld.domain.minValue!=='undefined')
       && (typeof fld.domain.maxValue !=='undefined' && fld.domain.maxValue!=='undefined')
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
   if(fld.description){
     htm+='      <small class="text-muted">'+fld.description+'</small>';
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
 htm+='  <div class="form-group">';
 if(isRequired){
   htm+='    <label class="">';
   htm+='    <input type="checkbox" data-field-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value=""  class="" ';
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
     htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >Null</option>';
     htm+='    </select>';
 } 
 if(fld.description){
   htm+='      <small class="text-muted">'+fld.description+'</small>';
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
 htm+='  <div class="form-group">';
 htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
 htm+='    <input type="hidden" name="'+fldKey+'" id="'+fldKey+'" data-field-name="'+fld.name+'" value="'+value+'" readonly class="form-control"></input>';
 htm+='  </div>';
 htm+='  <div class="form-group" id="'+fldKey+'-panel">';
 htm+= self.getFileListContent(fileInfos,fldKey);
 if(fld.description){
   htm+='      <small class="text-muted">'+fld.description+'</small>';
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
             html+='<img style="height: 2em; margin-right: 0.2em;" src="'+data.thumbnail+'" />';
         }else if(data.icon){
           html+='     <i style="font-size: 2em;margin-right: 0.2em;" class="avatar fa fa-file-o fa-file-'+data.icon+'-o" > </i>'
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
 htm+='  <div class="form-group">';


     htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
     htm+='    <select data-field-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="form-control" >';
     for(var i=0;i< codedValues.length;i++){
       var item=codedValues[i];
       htm+='    <option value="'+item.code+'" '+ (((value+'')==(item.code+'')) ? 'selected="selected"' : '' ) +' >'+ item.value+'</option>';  
     }
     if(!isRequired){
       htm+='<option disabled ="disabled" role="separator" />';
       htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >Null</option>';
     }
     htm+='    </select>';
     if(fld.description){
       htm+='      <small class="text-muted">'+fld.description+'</small>';
     }
  
   htm+='  </div>';

   return htm;
}