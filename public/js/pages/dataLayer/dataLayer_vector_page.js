$(function () {
  
  pageTask.init();

  var keywordArray= $('#keywordArray').val();
  var keywords=[];
  if(keywordArray){
    keywords=keywordArray.split(';');
  }
  $('#keywords').select2({
    data: keywords,
    dir: app.layout,
    tags: true,tokenSeparators: [';', '؛']
 });
 
//   $.ajax( {    url: '/permissiontypes?accesstype=data', dataType: 'json', success: function (data) {
//     if( data && data.items){
//         var mappedData=$.map(data.items, function (item) {
//                 return {
//                     id: item.id,
//                     text: item.caption || item.contentType,
//                     data:item
//                 };
//         });
//         $('#permissionTypes').select2({
//             data: mappedData,
//             dir: app.layout
//         });
      
//     }
// }
// });

  $.ajax( {    url: '/users', dataType: 'json', success: function (data) {
    if(data){
        var mappedData=$.map(data, function (item) {
                return {
                    id: item.id,
                    text: item.userName,
                    data:item
                };
        });
        $('#usersWhoCanViewData').select2({
            data: mappedData,
            dir: app.layout
        });
        $('#usersWhoCanEditData').select2({
          data: mappedData,
          dir: app.layout
       });
    }
}
});

$.ajax( {    url: '/groups', dataType: 'json', success: function (data) {
  if(data){
      var mappedData=$.map(data, function (item) {
              return {
                id: item.id,
                text: (item.caption ||item.name),
                data:item
              };
      });
      $('#groupsWhoCanViewData').select2({
          data: mappedData,
          dir: app.layout
      });
      $('#groupsWhoCanEditData').select2({
        data: mappedData,
        dir: app.layout
     });
  }
}
});

});
var pageTask={
  init:function(){
    var me= this;
    this.fieldTypeCaptions={
      'varchar':'Text',
      'smallint':'Small Integer',
      'integer':'Integer',
      'bigint':'Big Integer',
      'real':'Real',
      'double precision':'Double',
      'numeric':'Numeric',
      'boolean':'Boolean',
      'bytea':'BLOB',
      'date':'Date',
      'timestamp with time zone':'DateTime',
      '_filelink':'File',
      '_documentslink':'Link to documents',
      'nill':'None'
    }
    var detailsStr=$('#details').val();
    var details= {};
    try{
      details= JSON.parse(detailsStr);
    }catch(ex){}
    
    this.fillUI(details);
    $('#cmdSave').click(function(){
      me.submit();
    })
  },
  fillUI:function(details){
    
    if(!details.fields)
       details.fields=[];
    var fields=  details.fields;
    this.details=details;
    this.fields=fields;
    var shapeType=$('#shapeType');
    if(shapeType && shapeType.length){
      this.isFeatureClass=true;
    }else{
      this.isFeatureClass=false;
    }
    if(this.isFeatureClass){
      if(details.shapeType)
        shapeType.val(details.shapeType);
      if(!details.isNew)  {
        shapeType.prop('disabled', true);
      }
     }
    var htm='';
    if(this.isFeatureClass && details.spatialReference){
     // htm+='<div class="form-group">';
      htm+='  <label class="col-sm-12" for="">Spatial reference:</label>';
      
      if(details.spatialReference.srid && !details.spatialReference.alias){
        if(details.spatialReference.srid==3857 || details.spatialReference.srid=='3857'){
          details.spatialReference.alias='Google Maps Global Mercator';
        }
        if(details.spatialReference.srid==4326 || details.spatialReference.srid=='4326'){
          details.spatialReference.alias='WGS 84';
        }
      }
      
      if(details.spatialReference.name){
        htm+='<div class="row">';
        htm+='  <label class="col-sm-offset-1 col-sm-3" >Name:</label>';  
        
        if(details.spatialReference.alias)
            htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' ('+ details.spatialReference.alias+') </label>';  
          else
            htm+='  <label class="col-sm-8" >'+details.spatialReference.name+ ' </label>';    
        htm+='</div>';
      }
      if(details.spatialReference.srid){
        htm+='<div class="row">';
        htm+='  <label class="col-sm-offset-1 col-sm-3" >SRID:</label>';  
        htm+='  <label class="col-sm-8" >'+details.spatialReference.srid+' </label>';  
        htm+='</div>';
      }
      // if(details.spatialReference.proj4){
      //   htm+='<div class="row">';
      //   htm+='  <label class="col-sm-offset-1 col-sm-3" >PROJ4:</label>';  
      //   htm+='  <label class="col-sm-8" >'+details.spatialReference.proj4+' </label>';  
      //   htm+='</div>';
      // }
      // if(details.spatialReference.wkt){
      //   htm+='<div class="row">';
      //   htm+='  <label class="col-sm-offset-1 col-sm-3" >WKT:</label>';  
      //   htm+='  <label class="col-sm-8" >'+details.spatialReference.wkt+' </label>';  
      //   htm+='</div>';
      // }
      
    //  htm+='</div>';
    }
    if(this.isFeatureClass){
      $('#spatialreferenceInfo').html(htm);
    }
    this.fillFieldList();
   // this.fillJSON_details();
  },
  fillJSON_details:function(){
    var self=this;
    try{
      var strTemp=  JSON.stringify(this.details);
      var cloned= JSON.parse(strTemp);
      // delete cloned['workspace'];
      // delete cloned['styles'];
      // delete cloned['defaultField'];
      // //delete cloned['datasetName'];
      // delete cloned['history'];
      // delete cloned['fileName'];
      if(cloned.fields){
        for(var i=0;i< cloned.fields.length;i++){
       //   delete cloned.fields[i]['_action'];
        }
      }
      //var str=  JSON.stringify(cloned, null, "\t");
      var str=  JSON.stringify(cloned.fields, null, "\t");

      $('#detailsJSON').val(str);
      $('#cmdSaveJSON').unbind().click(function(){
        var data=$('#detailsJSON').val();
        var dataJson;
        try{
         var dataJson= JSON.parse(data);
        }catch(ex){
          alert('Error in parsing JSON');
          return;
        }
        self.details.fields= dataJson;
        self.fillUI(self.details);
      });
      $('#cmdSaveJSON_').unbind().click(function(){
         var data=$('#detailsJSON').val();
         var dataJson;
         try{
          var dataJson= JSON.parse(data);
         }catch(ex){
           alert('Error in parsing JSON');
           return;
         }
         if(!dataJson){
          alert('Error in parsing JSON');
          return;
         }
         var name= dataJson.filebaseName ||  dataJson.name;
         if(!name){
          alert('No name specified in JSON');
          return;
         }

        var formData={
          name:name,
          overwrite_file:'true',
          data:data
        };
         $.ajax({
          url: '/jsonfile',
          type: "POST",
          dataType: 'json',
          data:JSON.stringify(formData),
          contentType: 'application/json; charset=utf-8',
          cache: false
          }).done(function(respond){
                 // waitingDialog.hide();
                  
                  if(respond.status)  { 
                      $.notify({
                          message:'Saved successfully'
      
                      },{
                          type:'info',
                          delay:2000,
                          animate: {
                              enter: 'animated fadeInDown',
                              exit: 'animated fadeOutUp'
                          }
                      });
                    }else{
                        $.notify({
                           message:  respond.message ||"Failed to save Template."
                         
                        },{
                            type:'danger',
                            delay:2000,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            }
                        });
                    }
          }).fail(function( jqXHR, textStatus, errorThrown) {
            
              
              $.notify({
                  message: "Failed to save Template"
                 // message: app.i18n['Dataset.FailedToSaveTemplate']
              },{
                  type:'danger',
                  delay:2000,
                  animate: {
                      enter: 'animated fadeInDown',
                      exit: 'animated fadeOutUp'
                  }
              });
          });

      })
    }catch(ex){}
  },
   fillFieldList:function(){
    var details= this.details; 
    var fields= this.fields;
    this.fillJSON_details();
    var fieldsContainer= $('#fieldsContainer');
   
   

    var html='<div class="table-responsive col-sm-12">';
    html+=' <table class="table table-condensed"><thead><tr>';
    html+=' <th>Name</th>';    
    html+=' <th class="hidden-xs hidden-sm">Alias</th>';
    html+=' <th class="hidden-xs hidden-sm">Type</th>';
    html+=' <th class="hidden-xs ">Length</th>';
    html+=' <th class="hidden-xs ">Default value</th>';
    html+=' <th> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:pageTask.editField(-1,-1);"><span class="glyphicon glyphicon-plus"></span> Add</button></th>'; 
    html+=' <th></th>';
    html+=' </tr></thead>';
    html+=' <tbody id="tblItems">';
    for(var i=0;i< fields.length;i++){
      var fld= fields[i];
      if(!fld._action)
          fld._action={};
      var rowClass='';
      if(fld._action.isNew){
        rowClass='info';
      }else if (fld._action.delete) {
        rowClass='danger';
      }else if (fld._action.modified){
        rowClass='warning';
      } 
      var fieldTypeCaption=this.fieldTypeCaptions[fld.type.toLowerCase()];         
      html+=' <tr class="'+rowClass +'" >';
      html+=' <td>'+DOMPurify.sanitize(fld.name, {SAFE_FOR_JQUERY: true}) + '</td>';    
      html+=' <td class="hidden-xs hidden-sm" >'+  DOMPurify.sanitize((fld.alias?fld.alias:''), {SAFE_FOR_JQUERY: true}) + '</td>';    
      html+=' <td class="hidden-xs hidden-sm">'+fieldTypeCaption +'</td>';    
      html+=' <td class="hidden-xs ">'+ DOMPurify.sanitize(((typeof fld.length!=='undefined')?fld.length:''), {SAFE_FOR_JQUERY: true}) +'</td>';    
      html+=' <td class="hidden-xs ">'+ DOMPurify.sanitize(((typeof fld.default!=='undefined')?fld.default:''), {SAFE_FOR_JQUERY: true}) + '</td>';    
      html+=' <td>';
      if(!fld._action.delete){
        html+='<button type="button" class="btn btn-xs btn-info	" onclick="javascript:pageTask.editField('+i+');"><span class="glyphicon glyphicon-edit"></span> Edit</button>'; 
      }else{
        html+='<button type="button" class="btn btn-xs btn-info disabled	" disabled onclick="javascript:"><span class="glyphicon glyphicon-edit"></span> Edit</button>'; 
      }
      html+=' <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:pageTask.editField(-1,'+i+');"><span class="glyphicon glyphicon-plus"></span> Add</button></th>'; 
      html+=' </td>';
      if(fld._action.delete){
        html+=' <td><button type="button" class="btn btn-xs btn-danger	" title="Undelete" style=" text-decoration: line-through;" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+i+');"><span class="glyphicon glyphicon-remove"></span> Undelete</button>'+'</td>';    
      }else
        html+=' <td><button type="button" class="btn btn-xs btn-danger	"  title="Delete"  style="" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+i+');"><span class="glyphicon glyphicon-remove"></span> Delete</button>'+'</td>';    
      html+=' </tr>';
    }
    if(fields.length>0){
      // html+=' <tr>';    
      // html+=' <td></td>';    
      // html+=' <td class="hidden-xs hidden-sm"></td>';
      // html+=' <td class="hidden-xs hidden-sm"></td>';
      // html+=' <td class="hidden-xs "></td>';
      // html+=' <td class="hidden-xs "></td>';
      // html+=' <td> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:pageTask.editField(-1);"><span class="glyphicon glyphicon-plus"></span> Add</button></td>'; 
      // html+=' <td></td>';
      // html+=' </tr>';
    }
    html+=' </tbody>';
    html+=' </table>';
    html+=' </div>';
    fieldsContainer.html(html);
  },
  deleteField:function (index){
    var me=this;
    var fields= this.fields;
    var field= fields[index];
    if(!field._action)
       field._action={};
    if(field._action.isNew){
        if(index >=0 && index < fields.length)
        {
          fields.splice(index,1);
        }
    }else{
      if(field._action['delete'])
        delete field._action['delete'];
      else
        field._action['delete']=true;
    } 
    me.fillFieldList();
  },
  editField:function (index,insertAfter){
    var me=this;
    var fields= this.fields;
    var field;
    var addField=false;
    if(index<0){
      
     
      addField=true;
      field={
        _action:{
          isNew:true
        }
      }
      
      if(typeof insertAfter !=='undefined'){
        var insertAfterField=fields[insertAfter];
        if(insertAfterField){
          field.group= insertAfterField.group;
        }
      }
    }else if (index< fields.length){
       field= fields[index];
    }

    if(!field)
      return;
    if(!field._action){
      field._action={};
    }
    
    if(!field._action.isNew){
      if(!field._action.origField){
        field._action.origField={
          name: field.name,
          description:field.description,
          hint:field.hint,
          hidden: field.hidden,
          group:field.group,
          alias:field.alias,
          type: field.type,
          length:field.length,
          default:field.default,
          notNull:field.notNull,
          isExpression:field.isExpression,
          expression:field.expression

        }
      }
    }
    field._action.index=index;
    var shapeType=$('#shapeType').val();
    var editFieldDlg= new EditFieldDlg({
      field:field,
      shapeType:shapeType,
      details:me.details,
      onValidate:function(evt){
        var exists = false;
        for(var i=0;i< fields.length;i++){
           if(index != i){
            if(evt.field.name.toLowerCase()== (fields[i].name+'').toLowerCase())
            {
              exists=true;
              break;
            }
          }
        }
         if(exists){
           evt.valid=false;
           evt.message= evt.field.name + ' already exists!';
           return;
         }
         
        
      },
      onSuccess:function(evt){
          field._action.modified=true;
          field.name=evt.field.name;
          field.alias=evt.field.alias;
          field.description=evt.field.description;
          field.hint=evt.field.hint;
          field.hidden= evt.field.hidden,
          field.group=evt.field.group,
          field.type=evt.field.type;
          field.length= evt.field.length;
          field.scale= evt.field.scale;
          field.default= evt.field.default;
          field.notNull=evt.field.notNull;
          field.isExpression=evt.field.isExpression;
          field.expression=evt.field.expression;
          if(field.type=='_filelink') {
            field.defaultMimeType=evt.field.defaultMimeType;
          }else{
            delete field.defaultMimeType;
          } 
          
          field.domain=evt.field.domain;

          if(field._action.origField){
           
            // var origFieldStr=JSON.stringify(field._action.origField);
            // var fieldStr=JSON.stringify(field);
            // if(origFieldStr==fieldStr){
            //   field._action.modified=false;
            // }
            if(field.name === field._action.origField.name
              && field.alias == field._action.origField.alias
              && field.type === field._action.origField.type
              && field.length == field._action.origField.length
              && field.scale == field._action.origField.scale
              && field.default == field._action.origField.default
              && field.notNull == field._action.origField.notNull
              && field.expression == field._action.origField.expression
              ){
                field._action.modified=false;
              }
          }
          if(addField){
            if(field.expression){
              field.isExpression=true;
            }
            if(typeof insertAfter !=='undefined'){
              if(insertAfter==-1){
                fields.unshift(field);  
              }else{
                fields.splice(insertAfter+1,0, field);  
              }
            }else{
              fields.push (field);          
            }
          }
        me.fillFieldList();
      }
    });
    editFieldDlg.show();
  },
  submit:function(){
    var self= this;
    $.validator.unobtrusive.parse(document);
    
    var $form= $('#mainForm');
    $form.validate();
    var frmDetail=$('#frmDetail');
    frmDetail.validate();
    var v1=frmDetail.valid();
    var v2=$form.valid();
    if(! (v1 && v2 ))
    {
      var errElm=$('.input-validation-error').first();
      if(errElm){
          $('html, body').animate({
              scrollTop: errElm.offset().top-20
            }, 1000);
     
       }

      return;
    }
    //mainForm.submit();
    waitingDialog.show('Saving Dataset', { progressType: ''});
    var datasetName= this.details.datasetName;
    if(this.isFeatureClass && this.details.isNew){
      
      this.details.shapeType=$('#shapeType').val();
    }
    if(!datasetName){
      datasetName='';
    }
    
    // var fields=[];
    
    // for(var j=0;j<100;j++){
    //   var tFields=JSON.parse(JSON.stringify(this.details.fields));
    //   for(var i=0;i<tFields.length;i++){
    //     var fld= tFields[i];
    //     fld.name =fld.name +'_'+j;
    //     if(fld.alias){
    //       fld.alias= fld.alias+' '+j;
    //     }
    //     fields.push(fld);
    //   }
    // } 
    // this.details.fields=fields;



  
    $form.find('#details').val( JSON.stringify( this.details));

    $.ajax({
        type: $form.attr('method'),
        url: $form.attr('action'),
        data: $form.serialize(),
        success: function (data) {
         
            waitingDialog.hide();

          var clean_uri = location.protocol + '//' + location.host + location.pathname;
          var savedPathName='/datalayer/'+ data.id;
          if(savedPathName !=location.pathname){ 
                var new_uri = location.protocol + '//' + location.host + savedPathName;
                window.history.replaceState({}, document.title, new_uri);
          }
          
          if(data.status){
            $.notify({
                message: "Dataset saved successfully"
            },{
                type:'success',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
            if(data.item && data.item.details){
              try{
                self.fillUI(JSON.parse(data.item.details));
              }catch(ex){}
            }
            //window.location.href=location.protocol + '//' + location.host + '/datasets';
            //#region validating
            var url = '/datalayer/' + data.id + '/geojson';
            var settings=encodeURIComponent(JSON.stringify({filter:{},validate:true}));
            var loadUrl=url +'?settings='+settings;

            var processNotify= $.notify({
                message: '<i class="wait-icon-with-padding">Validating ...</i><br />'
            },{
                type:'info',
                delay:0,
                z_index:50000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });


            $.ajax(loadUrl, {
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data) {
                       if(data.status){
                            $.notify({
                                message:  data.rowCount + " row(s) are returned successfully."
                            },{
                                type:'success',
                                delay:3000,
                                z_index:50000,
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                }
                            }); 
                            setTimeout(function(){
                              window.location.href=location.protocol + '//' + location.host + '/datalayers';
                            },2000);
                            
                       }else{
                            $.notify({
                                message:"Validation failed <br />Error:"+ data.message + '<br/> Check fields\' expressions'
                            },{
                                type:'danger',
                                delay:5000,
                                z_index:50000,
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                }
                            }); 
                       } 
                        
                    }
                    processNotify.close();
                },
                error: function (xhr, textStatus, errorThrown) {
                    $.notify({
                        message: ""+ errorThrown+"<br/>Failed to complete task"
                    },{
                        type:'danger',
                        delay:3000,
                        z_index:50000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    }); 
                    processNotify.close();
                }
            }).done(function (response) {
                 processNotify.close();
            });
            //#endregion validating
          }else{
            var msg=data.errors || data.error|| data.message || "Failed to save Dataset";
            msg=msg+'';
            msg=msg.replace(new RegExp(datasetName, 'g'), '');
            $.notify({
                message:msg
            },{
                type:'danger',
                delay:10000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
          }
          
        },
        error: function ( jqXHR,  textStatus,  errorThrown) {
            waitingDialog.hide();
            console.log('An error occurred.');
            $.notify({
                message: "Failed to save Dataset"
            },{
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
        },
    });
  }
};



function EditFieldDlg(options) {
  var me=this;
  this.fieldTypeTips={
    'varchar':'variable-length character string, up to defined Length',
    'boolean':'Boolean values like;true|false,yes|no,1|0',
    smallint: '2 bytes small integer, range:	-32768 to +32767',
    integer:'4 bytes typical choice for integer, range: -2147483648 to +2147483647',
    bigint:'8 bytes large integer, rage: -9223372036854775808 to +9223372036854775807',
    numeric:'variable	number with user-specified precision. <br /> Example, A numeric field with Length=5 and Scale=2 can store -999.99 to 999.99 ',
    real:'4 bytes	variable-precision, inexact	6 decimal digits precision',
    'double precision':'8 bytes	variable-precision, inexact	15 decimal digits precision',
    'date':'4 bytes date (no time of day)',
    'timestamp with time zone':'8 bytes	both date and time with time zone, example:2018-08-28 12:22:01.673<span class="label label-info">+04:30</span>',
    'bytea':'BLOB, Binary Large OBject',
    '_filelink':'Keeps a link to an uploaded file',
    '_documentslink':'Keeps links to uploaded document files',
    'nill':'Dummy field used for adding descriptions to attribute form'
  }    

    this.options = options || {};
   this.field= this.options.field;
   this.parent_shapeType=this.options.shapeType;
   this.parent_details= this.options.details ||{};   
   if(typeof this.field.type==='undefined'){
     this.field.type='varchar';
     this.field.length=20;
   }
   this.onSuccess=this.options.onSuccess;
   this.onValidate=this.options.onValidate;
   this.body= $('#fieldDlgTemplate').clone();
    
   this.dlg = new BootstrapDialog({
     title: 'Field properties',
     message: function(dialogItself){
      var $content=me.body;
      me.initFrom();
      var $type= $content.find('#type').change(function(){
        //$content.find('#typeTip').html(me.fieldTypeTips[$(this).val()]);
        me.updateUI();
      })
      me.updateUI();
      return $content;
     },
     draggable:true,
     closable: true,
         closeByBackdrop: true,
         closeByKeyboard: true,
     buttons: [
        {
       label: 'OK',
       // no title as it is optional
       cssClass: 'btn-primary',
       action: function(dialogItself){
           if(me.apply()){
             me.changesApplied=true;
             dialogItself.close();
           }
       }
   },{
       label: 'Cancel',
       action: function(dialogItself){
           
           dialogItself.close();
       }
   }],
   onshow: function(dialogRef){
   //  alert('Dialog is popping up, its message is ' + dialogRef.getMessage());
 },
 onshown: function(dialogRef){
   //  alert('Dialog is popped up.');
 },
 onhide: function(dialogRef){
    // alert('Dialog is popping down, its message is ' + dialogRef.getMessage());
 },
 onhidden: function(dialogRef){
    // alert('Dialog is popped down.');
    if(!me.changesApplied)
       me.cancelSettings();
 }
  });

}
EditFieldDlg.prototype.initFrom=function(){
  var me= this;
  var $content= this.body;
  if(!me.field)
    return;
    $content.find('#name').val(typeof me.field.name==='undefined'?'':me.field.name);
    $content.find('#alias').val(typeof me.field.alias==='undefined'?'':me.field.alias);
    $content.find('#description').val(typeof me.field.description==='undefined'?'':me.field.description);
    $content.find('#hint').val(typeof me.field.hint==='undefined'?'':me.field.hint);
    $content.find('#group').val(typeof me.field.group==='undefined'?'':me.field.group);
    $content.find('#hidden').prop('checked',me.field.hidden?true:false);
    $content.find('#defaultMimeType').val(typeof me.field.defaultMimeType==='undefined'?'':me.field.defaultMimeType);

    var $type= $content.find('#type');
  $type.val(typeof me.field.type==='undefined'?'varchar':me.field.type);
  var selType=$type.val();
  $content.find('#typeTip').html(me.fieldTypeTips[selType]);
  
  $content.find('#length').val(typeof me.field.length==='undefined'?'':me.field.length);
  $content.find('#scale').val(typeof me.field.scale==='undefined'?'':me.field.scale);
  //$content.find('#default').val(typeof me.field.default==='undefined'?'':me.field.default);
  $content.find('#default').val(me.field.default);
  
 var srid;
 if(me.parent_details && me.parent_details.spatialReference) {
   srid= me.parent_details.spatialReference.srid;
 }
 var expressionOptions='';
    if(me.parent_shapeType){
    if(me.parent_shapeType=='MultiPolygon' || me.parent_shapeType=='Polygon'){
        
        if(srid== 4326){
          expressionOptions+='<option value="ST_Area(geom::geography)" > Area</option>';
          expressionOptions+='<option value="ST_Perimeter(geom::geography)" > Perimeter</option>';
        }else{
          expressionOptions+='<option value="ST_Area(geom)" > Area</option>';
          expressionOptions+='<option value="ST_Perimeter(geom)" > Perimeter</option>';
        }
        //expressionOptions+='<option value="ST_AsText(ST_Centroid(geom))" > Centroid</option>';
        expressionOptions+='<option value="ST_X(ST_Centroid(geom))" > Centroid.X</option>';
        expressionOptions+='<option value="ST_Y(ST_Centroid(geom))" > Centroid.Y</option>';
    }
    if(me.parent_shapeType=='MultiLineString' || me.parent_shapeType=='LineString'){
        if(srid== 4326){
          expressionOptions+='<option value="ST_Length(geom::geography)" > Length</option>';
        }else{
          expressionOptions+='<option value="ST_Length(geom)" > Length</option>';
        }
        //expressionOptions+='<option value="ST_AsText(ST_Centroid(geom))" > Centroid</option>';
        expressionOptions+='<option value="ST_X(ST_Centroid(geom))" > Centroid.X</option>';
        expressionOptions+='<option value="ST_Y(ST_Centroid(geom))" > Centroid.Y</option>';
    }
    if(me.parent_shapeType=='Point'){
        expressionOptions+='<option value="ST_X(geom)" > X</option>';
       
        expressionOptions+='<option value="ST_Y(geom)" > Y</option>';
        
        if(srid!== 4326){
          expressionOptions+='<option value="ROUND(ST_X(ST_Transform(geom,4326))::numeric,4)" > Longitude</option>';
          expressionOptions+='<option value="ROUND(ST_Y(ST_Transform(geom,4326))::numeric,4)" > Latitude</option>';
        }
    }
}
   //ST_Centroid 
  
  if(expressionOptions){
    $content.find('#expression').append(expressionOptions);
    $content.find('#expression').val(me.field.expression);
    $content.find('#expression').change(function(){
      $content.find('#type').val('real');
    })
  }
  
  $content.find('#domain').change(function(){
    var domainType=$(this).val();
    
    $content.find('.domainTypePanel').hide();
    $content.find('#domainTypePanel_'+ domainType).removeClass('hidden');
    $content.find('#domainTypePanel_'+ domainType).show();
  });
  var dv_counter=0;
  function addCodeValue (code,value) {
    var newRow = $("<tr>");
   
    var cols = "";

    cols += '<td><input type="text" class="form-control codedValues_domainCode  nospinner" value="'+code+'"  name="domainCode' + dv_counter + '"  data-val="true" data-val-required="Code value is required"/><span class="field-validation-valid" data-valmsg-for="domainCode'+dv_counter+'" data-valmsg-replace="true"></span></td>';
    cols += '<td><input type="text" class="form-control codedValues_domainValue nospinner" value="'+value+'"  name="domainValue' + dv_counter + '" ></td>';
    cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
    newRow.append(cols);
    $content.find("#tblCodedValues").append(newRow);
    
    dv_counter++;
  };
  $content.find("#addCodedValue").on("click", function () {
    addCodeValue('','');
  });
  $content.find("#tblCodedValues").on("click", ".ibtnDel", function (event) {
    $(this).closest("tr").remove();       
    dv_counter -= 1
  });
  
  if(me.field.domain && me.field.domain.type=='codedValues'){
    for(var i=0;me.field.domain.items && i< me.field.domain.items.length;i++){
        addCodeValue(me.field.domain.items[i].code,me.field.domain.items[i].value);
    }
    if(me.field.type=='varchar'){
      $content.find('#multipleChoiceCodedValues').prop('checked', me.field.domain.multipleChoice?true:false);
      $content.find('#editableCodedValues').prop('checked', me.field.domain.editable?true:false);
    }else{
      $content.find('#multipleChoiceCodedValues').prop('checked', false);
      $content.find('#editableCodedValues').prop('checked', false);
    }
    //$content.find('#domainTypePanel_'+ 'codedValues').show();
  }
  if(me.field.domain && me.field.domain.type=='range'){
    $content.find("#minValue").val(me.field.domain.minValue);
    $content.find("#maxValue").val(me.field.domain.maxValue);
   // $content.find('#domainTypePanel_'+ 'range').show();
  }
  if(me.field.domain && me.field.domain.type){
    $content.find('#domain').val(me.field.domain.type);
    $content.find('#domain').trigger('change');
  }
 }
EditFieldDlg.prototype.updateUI=function(){
  var me= this;
  var $content= this.body;
  var $type= $content.find('#type');
  var selType=$type.val();
  $content.find('#typeTip').html(me.fieldTypeTips[selType]);
  var isNew =false;
  if(this.field && this.field._action && this.field._action.isNew){
    isNew=true;
  }

var isNumber=false;
var isInteger=false;
var isText=false
if(selType=='smallint' || selType=='integer' || selType=='bigint' || selType=='numeric' || selType=='real' || selType=='double precision'){
  isNumber=true;
}
if(selType=='smallint' || selType=='integer' || selType=='bigint' ){
  isNumber=true;
  isInteger=true;
}
 if(selType=='varchar'){
   isText=true;
 }
  if(selType=='varchar'|| selType=='numeric')
  {
     // $content.find('.form-group:has(#length)').show();
     $content.find('.form-group').has('#length').show();
  }else{
    //$content.find('.form-group:has(#length)').hide();
    $content.find('.form-group').has('#length').hide();
  }
  if(selType=='numeric')
    {
        //$content.find('.form-group:has(#scale)').show();
        $content.find('.form-group').has('#scale').show();
    }else{
      //$content.find('.form-group:has(#scale)').hide();
      $content.find('.form-group').has('#scale').hide();
    }
    if(selType=='_filelink'){
      $content.find('#_filelink_defaultMimeType').show();
    }else{
      $content.find('#_filelink_defaultMimeType').hide();
    }
    if((this.field && this.field.isExpression)){
      $content.find('.form-group').has('#expression').show();
      $content.find('.form-group').has('#default').hide();
      $content.find('.form-group').has('#type').hide();
      $content.find('.form-group').has('#typeTip').hide();
      $content.find('.form-group').has('#length').hide();

      
    }else // if (isNew)
    {
      if(isNew && isNumber){
        $content.find('.form-group').has('#expression').show();
      }else{
        $content.find('.form-group').has('#expression').hide();
      }
      $content.find('.form-group').has('#default').show();
      $content.find('.form-group').has('#type').show();
      $content.find('.form-group').has('#typeTip').show();
     // $content.find('.form-group').has('#length').show();
    }
    // else //if (isNew)
    // {
    //   $content.find('.form-group').has('#expression').hide();
    //   $content.find('.form-group').has('#default').show();
    //   $content.find('.form-group').has('#type').show();
    //   $content.find('.form-group').has('#typeTip').show();
    //  // $content.find('.form-group').has('#length').show();
    // }
    if(isNumber || isText){
      $content.find('.form-group').has('#domain').show();
      $content.find('#domain').trigger('change');
      if(isText){
        $content.find('#multipleChoiceCodedValuesPanel').show();
        $content.find('#editableCodedValuesPanel').show();
      }else{
        $content.find('#multipleChoiceCodedValuesPanel').hide();
        $content.find('#editableCodedValuesPanel').hide();
      }
    }else{
      $content.find('.form-group').has('#domain').hide();
      $content.find('#domainTypePanel_codedValues').hide();
      $content.find('#domainTypePanel_range').hide();
      
    }
 }
EditFieldDlg.prototype.create=function(){
 

 this.changesApplied=false
}
EditFieldDlg.prototype.apply=function(){
 var me=this;
  $.validator.unobtrusive.parse(document);
  me.body.find('#errors').hide();
  var $form=this.body.find('#frmField');
  $form.validate();
  if(! $form.valid())
    return false;
   
    var $type= $form.find('#type');
  var selType=$type.val();
  var _scale=$form.find('#scale').val();
  try{
    _scale=parseInt(_scale);
    if(isNaN(_scale))
      _scale=undefined;
  }catch(ex){}
 var _length=$form.find('#length').val();
 try{
  _length=parseInt(_length);
  if(isNaN(_length))
    _length=undefined;
}catch(ex){}

  var editField={
    name:$form.find('#name').val(),
    //alias: $form.find('#alias').val(),
    type:selType,
    //length: _length,
    //scale:_scale,
    //default: $form.find('#default').val(),
    hint: me.field.hint,
    group:me.field.group,
    hidden:me.field.hidden,

    notNull:me.field.notNull
    ,isExpression:me.field.isExpression
  };  
  if($form.find('#alias').val())
    editField.alias=$form.find('#alias').val();
  if($form.find('#description').val())
    editField.description=$form.find('#description').val();   
  
  if($form.find('#hint').length){
    editField.hint=$form.find('#hint').val();   
  }
  
  if($form.find('#group').length){
    editField.group=$form.find('#group').val();   
  }
  
  if($form.find('#hidden').length){
    editField.hidden=$form.find('#hidden').prop('checked');   
  }

  if($form.find('#_filelink_defaultMimeType').length){
    editField.defaultMimeType=$form.find('#defaultMimeType').val();   
  }
  if(_length)
    editField.length=_length;
  if(_scale)
    editField.scale=_scale;    
  if($form.find('#default').val())
    editField.default=$form.find('#default').val();

  if(!(selType=='varchar'|| selType=='numeric'))
    editField.length='';
  
  editField.expression=$form.find('#expression').val();
  
  var domainType= $form.find('#domain').val();
  if(domainType==='range'){
    editField.domain={
      type:'range',
      minValue:$form.find('#minValue').val(),
      maxValue:$form.find('#maxValue').val()
    }
  }
  if(domainType==='codedValues'){
    editField.domain={
      type:'codedValues',
      items:[]
    };
    var totalCodesLen=0;
    var maxLen=0;
    $form.find('#tblCodedValues > tbody > tr').each(function() {
      var codedValues_domainCode=$(this).find('.codedValues_domainCode').val();
      var codedValues_domainValue=$(this).find('.codedValues_domainValue').val();
      if(codedValues_domainCode && (codedValues_domainCode+'').indexOf(';')){
        codedValues_domainCode= codedValues_domainCode.replace(new RegExp(';', 'g'), ' ');
      }
      totalCodesLen+= codedValues_domainCode.length+1;
      
      if(maxLen < codedValues_domainCode.length ){
        maxLen=codedValues_domainCode.length;
      }

      editField.domain.items.push({
        code:codedValues_domainCode,
        value:codedValues_domainValue
      })
    });
    if(editField.type=='varchar'){
      editField.domain.multipleChoice= $form.find('#multipleChoiceCodedValues').prop("checked");
      editField.domain.editable= $form.find('#editableCodedValues').prop("checked");
      if(editField.domain.multipleChoice){
        maxLen= totalCodesLen;
      }
      if(editField.length ){
        if(editField.length < maxLen){
          editField.length=maxLen;
        }
      }
      
      if(editField.length  && editField.domain.editable ){
        if(editField.length < (2*maxLen)){
          editField.length= (2*maxLen);
        }
      }
    }

  }
 

  if(this.onValidate)
  {
    var arg={
      valid:true,
      message:'',
      field:editField
    }
    this.onValidate(arg);
    if(!arg.valid){
      me.body.find('#errors').html('<div>'+ arg.message+ '</div>' ).show();
      
      return false;
    }
  }

  if(this.onSuccess ){
    this.onSuccess({field:editField});
  }
 return true;
}
EditFieldDlg.prototype.cancelSettings=function(){

  
 return true;
}
EditFieldDlg.prototype.show=function(){
 this.create();
 this.dlg.open();
}