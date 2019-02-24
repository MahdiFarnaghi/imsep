$(function () {
  
  pageTask.init();

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
            data: mappedData
        });
        $('#usersWhoCanEditData').select2({
          data: mappedData
       });
    }
}
});

$.ajax( {    url: '/groups', dataType: 'json', success: function (data) {
  if(data){
      var mappedData=$.map(data, function (item) {
              return {
                id: item.id,
                text: item.name,
                data:item
              };
      });
      $('#groupsWhoCanViewData').select2({
          data: mappedData
      });
      $('#groupsWhoCanEditData').select2({
        data: mappedData
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
      'timestamp with time zone':'DateTime'
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
    if(details.shapeType)
      shapeType.val(details.shapeType);
    if(!details.isNew)  {
      shapeType.prop('disabled', true);
    }
    this.fillFieldList();
  },
   fillFieldList:function(){
    var details= this.details; 
    var fields= this.fields;

    var fieldsContainer= $('#fieldsContainer');
   
   

    var html='<div class="table-responsive col-sm-12">';
    html+=' <table class="table table-condensed"><thead><tr>';
    html+=' <th>Name</th>';    
    html+=' <th class="hidden-xs hidden-sm">Alias</th>';
    html+=' <th class="hidden-xs hidden-sm">Type</th>';
    html+=' <th class="hidden-xs ">Length</th>';
    html+=' <th class="hidden-xs ">Default value</th>';
    html+=' <th> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:pageTask.editField(-1);"><span class="glyphicon glyphicon-plus"></span> Add</button></th>'; 
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
      html+=' <td>'+fld.name+ '</td>';    
      html+=' <td class="hidden-xs hidden-sm" >'+(fld.alias?fld.alias:'')+ '</td>';    
      html+=' <td class="hidden-xs hidden-sm">'+fieldTypeCaption +'</td>';    
      html+=' <td class="hidden-xs ">'+((typeof fld.length!=='undefined')?fld.length:'')+'</td>';    
      html+=' <td class="hidden-xs ">'+((typeof fld.default!=='undefined')?fld.default:'')+ '</td>';    
      if(!fld._action.delete){
        html+=' <td> <button type="button" class="btn btn-xs btn-info	" onclick="javascript:pageTask.editField('+i+');"><span class="glyphicon glyphicon-edit"></span> Edit</button></td>'; 
      }else{
        html+=' <td> <button type="button" class="btn btn-xs btn-info disabled	" disabled onclick="javascript:"><span class="glyphicon glyphicon-edit"></span> Edit</button></td>'; 
      }
      if(fld._action.delete){
        html+=' <td><button type="button" class="btn btn-xs btn-danger	" title="Undelete" style=" text-decoration: line-through;" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+i+');"><span class="glyphicon glyphicon-remove"></span> Undelete</button>'+'</td>';    
      }else
        html+=' <td><button type="button" class="btn btn-xs btn-danger	"  title="Delete"  style="" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+i+');"><span class="glyphicon glyphicon-remove"></span> Delete</button>'+'</td>';    
      html+=' </tr>';
    }
    if(fields.length>0){
      html+=' <tr>';    
      html+=' <td></td>';    
      html+=' <td class="hidden-xs hidden-sm"></td>';
      html+=' <td class="hidden-xs hidden-sm"></td>';
      html+=' <td class="hidden-xs "></td>';
      html+=' <td class="hidden-xs "></td>';
      html+=' <td> <button type="button" class="btn btn-xs btn-primary	" onclick="javascript:pageTask.editField(-1);"><span class="glyphicon glyphicon-plus"></span> Add</button></td>'; 
      html+=' <td></td>';
      html+=' </tr>';
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
  editField:function (index){
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
          alias:field.alias,
          type: field.type,
          length:field.length,
          default:field.default,
          notNull:field.notNull
        }
      }
    }
    field._action.index=index;
    var editFieldDlg= new EditFieldDlg({
      field:field,
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
          field.type=evt.field.type;
          field.length= evt.field.length;
          field.scale= evt.field.scale;
          field.default= evt.field.default;
          field.notNull=evt.field.notNull;
          if(field._action.origField){
            if(field.name === field._action.origField.name
              && field.alias == field._action.origField.alias
              && field.type === field._action.origField.type
              && field.length == field._action.origField.length
              && field.scale == field._action.origField.scale
              && field.default == field._action.origField.default
              && field.notNull == field._action.origField.notNull
              ){
                field._action.modified=false;
              }
          }
          if(addField){
            fields.push (field);          
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
    waitingDialog.show('Saving Datalayer', { progressType: ''});
    var datasetName= this.details.datasetName;
    if(this.details.isNew){
      
      this.details.shapeType=$('#shapeType').val();
    }
    if(!datasetName){
      datasetName='';
    }
    
  
    $form.find('#details').val( JSON.stringify( this.details));

    $.ajax({
        type: $form.attr('method'),
        url: $form.attr('action'),
        data: $form.serialize(),
        success: function (data) {
            var layerId=data.id;
            waitingDialog.hide();

          var clean_uri = location.protocol + '//' + location.host + location.pathname;
          var savedPathName='/datalayer/'+ data.id;
          if(savedPathName !=location.pathname){ 
                var new_uri = location.protocol + '//' + location.host + savedPathName;
                window.history.replaceState({}, document.title, new_uri);
          }
          
          if(data.status){
            $.notify({
                message: "Data Layer saved successfully"
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
            window.location.href=location.protocol + '//' + location.host + '/datalayers';
          }else{
            var msg=data.errors || data.error|| data.message || "Failed to save Data Layer";
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
                message: "Failed to save Data Layer"
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
    'bytea':'BLOB, Binary Large OBject'
  }    

    this.options = options || {};
   this.field= this.options.field;
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
    var $type= $content.find('#type');
  $type.val(typeof me.field.type==='undefined'?'varchar':me.field.type);
  var selType=$type.val();
  $content.find('#typeTip').html(me.fieldTypeTips[selType]);
  
  $content.find('#length').val(typeof me.field.length==='undefined'?'':me.field.length);
  $content.find('#scale').val(typeof me.field.scale==='undefined'?'':me.field.scale);
  //$content.find('#default').val(typeof me.field.default==='undefined'?'':me.field.default);
  $content.find('#default').val(me.field.default);
  
 }
EditFieldDlg.prototype.updateUI=function(){
  var me= this;
  var $content= this.body;
  var $type= $content.find('#type');
  var selType=$type.val();
  $content.find('#typeTip').html(me.fieldTypeTips[selType]);
  
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
    notNull:me.field.notNull
  };  
  if($form.find('#alias').val())
    editField.alias=$form.find('#alias').val();
  if(_length)
    editField.length=_length;
  if(_scale)
    editField.scale=_scale;    
  if($form.find('#default').val())
    editField.default=$form.find('#default').val();

  if(!(selType=='varchar'|| selType=='numeric'))
    editField.length='';
  
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