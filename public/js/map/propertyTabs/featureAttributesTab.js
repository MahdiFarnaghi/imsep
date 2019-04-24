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
    setTimeout(function() {
    
    }, 1000);
    
     $form.find('input,textarea,select').change(function(){
        $(this).addClass('attribute-value-changed');
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
        if(fldType=='varchar'){
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
          htm+='    <textarea data-fild-name="'+fld.name+'" '+ autofocus +' name="'+fldKey+'" id="' +fldKey +'" rows="4" placeholder="'+placeholder+'" class="form-control" ';
      }else{
          htm+='    <input type="text" data-fild-name="'+fld.name+'" '+ autofocus +' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
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
      htm+='    <input type="text" data-fild-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
      
      if(isRequired){
        validate=true;
        htm+=' data-val-required="'+caption +' is required"';
      }
     
      if(validate){
        htm+=' data-val="true"';
      }
      htm+='    />';
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
      htm+='    <input type="date" data-fild-name="'+fld.name+'" '+ autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
      
      if(isRequired){
        validate=true;
        htm+=' data-val-required="'+caption +' is required"';
      }
      
      if(validate){
        htm+=' data-val="true"';
      }
      htm+='    />';
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
      htm+='    <input type="number" data-fild-name="'+fld.name+'" '+ autofocus+' name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
      
      validate=true;
      htm+=' data-val-integer="Input an integer" ';
      if(isRequired){
        validate=true;
        htm+=' data-val-required="'+caption +' is required"';
      }
      if(fldType=='smallint'){
        validate=true;
        htm+=' data-val-range="Input a number  from -32768 to +32767" data-val-range-min="-32768" data-val-range-max="32767" ';
      }else if(fldType=='integer'){
        validate=true;
        htm+=' data-val-range="Input a number  from -2147483648 to +2147483647" data-val-range-min="-2147483648" data-val-range-max="2147483647" ';
      }else if(fldType=='bigint'){
        validate=true;
        htm+=' data-val-range="Input a number  from -9223372036854775808 to +9223372036854775807" data-val-range-min="-9223372036854775808" data-val-range-max="9223372036854775807" ';
      }

      if(validate){
        htm+=' data-val="true"';
      }
      htm+='    />';
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
      htm+='    <input type="number" data-fild-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value="'+value+'" placeholder="'+placeholder+'" class="form-control" ';
      
     
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

      if(validate){
        htm+=' data-val="true"';
      }
      htm+='    />';
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
      htm+='    <input type="checkbox" data-fild-name="'+fld.name+'" '+autofocus+'  name="'+fldKey+'" id="' +fldKey +'" value=""  class="" ';
      if(value){
        htm+='    checked="checked"';
      }
      htm+=' />';
      htm+= caption ;
      htm+='    </label>';
    }else{
  
        htm+='    <label class="" for="'+ fldKey+'">'+ caption+ '</label>';
        htm+='    <select data-fild-name="'+fld.name+'" '+autofocus+' name="'+fldKey+'" id="' +fldKey +'"  class="form-control" >';
        htm+='    <option value="1" '+ ((value) ? 'selected="selected"' : '' ) +' >True</option>';
        htm+='    <option value="0" '+ ((value) ? '':'selected="selected"' ) +' >False</option>';
        htm+='    <option value="" '+ ((value=='Null') ? 'selected="selected"':'' ) +' >Null</option>';
        htm+='    </select>';
    } 
     
      htm+='  </div>';

      return htm;
  }

  