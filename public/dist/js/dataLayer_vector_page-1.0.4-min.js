/*! imsep 2021-01-09 */

$(function(){pageTask.init();var e=$("#keywordArray").val(),i=[];e&&(i=e.split(";")),$("#keywords").select2({data:i,dir:app.layout,tags:!0,tokenSeparators:[";","؛"]}),$.ajax({url:"/users",dataType:"json",success:function(e){if(e){var i=$.map(e,function(e){return{id:e.id,text:e.userName,data:e}});$("#usersWhoCanViewData").select2({data:i,dir:app.layout}),$("#usersWhoCanEditData").select2({data:i,dir:app.layout})}}}),$.ajax({url:"/groups",dataType:"json",success:function(e){if(e){var i=$.map(e,function(e){return{id:e.id,text:e.caption||e.name,data:e}});$("#groupsWhoCanViewData").select2({data:i,dir:app.layout}),$("#groupsWhoCanEditData").select2({data:i,dir:app.layout})}}})});var pageTask={init:function(){var e=this;this.fieldTypeCaptions={varchar:"Text",smallint:"Small Integer",integer:"Integer",bigint:"Big Integer",real:"Real","double precision":"Double",numeric:"Numeric",boolean:"Boolean",bytea:"BLOB",date:"Date","timestamp with time zone":"DateTime",_filelink:"File",_documentslink:"Link to documents",nill:"None"};var i=$("#details").val(),a={};try{a=JSON.parse(i)}catch(e){}this.fillUI(a),$("#cmdSave").click(function(){e.submit()})},fillUI:function(e){e.fields||(e.fields=[]);var i=e.fields;this.details=e,this.fields=i;var a=$("#shapeType");a&&a.length?this.isFeatureClass=!0:this.isFeatureClass=!1,this.isFeatureClass&&(e.shapeType&&a.val(e.shapeType),e.isNew||a.prop("disabled",!0));var t="";this.isFeatureClass&&e.spatialReference&&(t+='  <label class="col-sm-12" for="">Spatial reference:</label>',e.spatialReference.srid&&!e.spatialReference.alias&&(3857!=e.spatialReference.srid&&"3857"!=e.spatialReference.srid||(e.spatialReference.alias="Google Maps Global Mercator"),4326!=e.spatialReference.srid&&"4326"!=e.spatialReference.srid||(e.spatialReference.alias="WGS 84")),e.spatialReference.name&&(t+='<div class="row">',t+='  <label class="col-sm-offset-1 col-sm-3" >Name:</label>',e.spatialReference.alias?t+='  <label class="col-sm-8" >'+e.spatialReference.name+" ("+e.spatialReference.alias+") </label>":t+='  <label class="col-sm-8" >'+e.spatialReference.name+" </label>",t+="</div>"),e.spatialReference.srid&&(t+='<div class="row">',t+='  <label class="col-sm-offset-1 col-sm-3" >SRID:</label>',t+='  <label class="col-sm-8" >'+e.spatialReference.srid+" </label>",t+="</div>")),this.isFeatureClass&&$("#spatialreferenceInfo").html(t),this.fillFieldList()},fillJSON_details:function(){var a=this;try{var e=JSON.stringify(this.details),i=JSON.parse(e);if(i.fields)for(var t=0;t<i.fields.length;t++);var n=JSON.stringify(i.fields,null,"\t");$("#detailsJSON").val(n),$("#cmdSaveJSON").unbind().click(function(){var e=$("#detailsJSON").val();try{var i=JSON.parse(e)}catch(e){return void alert("Error in parsing JSON")}a.details.fields=i,a.fillUI(a.details)}),$("#cmdSaveJSON_").unbind().click(function(){var e=$("#detailsJSON").val();try{var i=JSON.parse(e)}catch(e){return void alert("Error in parsing JSON")}if(i){var a=i.filebaseName||i.name;if(a){var t={name:a,overwrite_file:"true",data:e};$.ajax({url:"/jsonfile",type:"POST",dataType:"json",data:JSON.stringify(t),contentType:"application/json; charset=utf-8",cache:!1}).done(function(e){e.status?$.notify({message:"Saved successfully"},{type:"info",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}}):$.notify({message:e.message||"Failed to save Template."},{type:"danger",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}).fail(function(e,i,a){$.notify({message:"Failed to save Template"},{type:"danger",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})})}else alert("No name specified in JSON")}else alert("Error in parsing JSON")})}catch(e){}},fillFieldList:function(){this.details;var e=this.fields;this.fillJSON_details();var i=$("#fieldsContainer"),a='<div class="table-responsive col-sm-12">';a+=' <table class="table table-condensed"><thead><tr>',a+=" <th>Name</th>",a+=' <th class="hidden-xs hidden-sm">Alias</th>',a+=' <th class="hidden-xs hidden-sm">Type</th>',a+=' <th class="hidden-xs ">Length</th>',a+=' <th class="hidden-xs ">Default value</th>',a+=' <th> <button type="button" class="btn btn-xs btn-primary\t" onclick="javascript:pageTask.editField(-1,-1);"><span class="glyphicon glyphicon-plus"></span> Add</button></th>',a+=" <th></th>",a+=" </tr></thead>",a+=' <tbody id="tblItems">';for(var t=0;t<e.length;t++){var n=e[t];n._action||(n._action={});var l="";n._action.isNew?l="info":n._action.delete?l="danger":n._action.modified&&(l="warning");var d=this.fieldTypeCaptions[n.type.toLowerCase()];a+=' <tr class="'+l+'" >',a+=" <td>"+DOMPurify.sanitize(n.name,{SAFE_FOR_JQUERY:!0})+"</td>",a+=' <td class="hidden-xs hidden-sm" >'+DOMPurify.sanitize(n.alias?n.alias:"",{SAFE_FOR_JQUERY:!0})+"</td>",a+=' <td class="hidden-xs hidden-sm">'+d+"</td>",a+=' <td class="hidden-xs ">'+DOMPurify.sanitize(void 0!==n.length?n.length:"",{SAFE_FOR_JQUERY:!0})+"</td>",a+=' <td class="hidden-xs ">'+DOMPurify.sanitize(void 0!==n.default?n.default:"",{SAFE_FOR_JQUERY:!0})+"</td>",a+=" <td>",n._action.delete?a+='<button type="button" class="btn btn-xs btn-info disabled\t" disabled onclick="javascript:"><span class="glyphicon glyphicon-edit"></span> Edit</button>':a+='<button type="button" class="btn btn-xs btn-info\t" onclick="javascript:pageTask.editField('+t+');"><span class="glyphicon glyphicon-edit"></span> Edit</button>',a+=' <button type="button" class="btn btn-xs btn-primary\t" onclick="javascript:pageTask.editField(-1,'+t+');"><span class="glyphicon glyphicon-plus"></span> Add</button></th>',a+=" </td>",n._action.delete?a+=' <td><button type="button" class="btn btn-xs btn-danger\t" title="Undelete" style=" text-decoration: line-through;" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+t+');"><span class="glyphicon glyphicon-remove"></span> Undelete</button></td>':a+=' <td><button type="button" class="btn btn-xs btn-danger\t"  title="Delete"  style="" class="btn-link  glyphicon glyphicon-remove" onclick="javascript:pageTask.deleteField('+t+');"><span class="glyphicon glyphicon-remove"></span> Delete</button></td>',a+=" </tr>"}e.length,a+=" </tbody>",a+=" </table>",a+=" </div>",i.html(a)},deleteField:function(e){var i=this.fields,a=i[e];a._action||(a._action={}),a._action.isNew?0<=e&&e<i.length&&i.splice(e,1):a._action.delete?delete a._action.delete:a._action.delete=!0,this.fillFieldList()},editField:function(t,i){var a,n=this,l=this.fields,d=!1;if(t<0){if(a={_action:{isNew:d=!0}},void 0!==i){var e=l[i];e&&(a.group=e.group)}}else t<l.length&&(a=l[t]);if(a){a._action||(a._action={}),a._action.isNew||a._action.origField||(a._action.origField={name:a.name,description:a.description,hint:a.hint,hidden:a.hidden,group:a.group,alias:a.alias,type:a.type,length:a.length,default:a.default,notNull:a.notNull,isExpression:a.isExpression,expression:a.expression}),a._action.index=t;var o=$("#shapeType").val();new EditFieldDlg({field:a,shapeType:o,details:n.details,onValidate:function(e){for(var i=!1,a=0;a<l.length;a++)if(t!=a&&e.field.name.toLowerCase()==(l[a].name+"").toLowerCase()){i=!0;break}if(i)return e.valid=!1,void(e.message=e.field.name+" already exists!")},onSuccess:function(e){a._action.modified=!0,a.name=e.field.name,a.alias=e.field.alias,a.description=e.field.description,a.hint=e.field.hint,a.hidden=e.field.hidden,a.group=e.field.group,a.type=e.field.type,a.length=e.field.length,a.scale=e.field.scale,a.default=e.field.default,a.notNull=e.field.notNull,a.isExpression=e.field.isExpression,a.expression=e.field.expression,"_filelink"==a.type?a.defaultMimeType=e.field.defaultMimeType:delete a.defaultMimeType,a.domain=e.field.domain,a._action.origField&&a.name===a._action.origField.name&&a.alias==a._action.origField.alias&&a.type===a._action.origField.type&&a.length==a._action.origField.length&&a.scale==a._action.origField.scale&&a.default==a._action.origField.default&&a.notNull==a._action.origField.notNull&&a.expression==a._action.origField.expression&&(a._action.modified=!1),d&&(a.expression&&(a.isExpression=!0),void 0!==i?-1==i?l.unshift(a):l.splice(i+1,0,a):l.push(a)),n.fillFieldList()}}).show()}},submit:function(){var d=this;$.validator.unobtrusive.parse(document);var e=$("#mainForm");e.validate();var i=$("#frmDetail");i.validate();var a=i.valid(),t=e.valid();if(a&&t){waitingDialog.show("Saving Dataset",{progressType:""});var o=this.details.datasetName;this.isFeatureClass&&this.details.isNew&&(this.details.shapeType=$("#shapeType").val()),o||(o=""),e.find("#details").val(JSON.stringify(this.details)),$.ajax({type:e.attr("method"),url:e.attr("action"),data:e.serialize(),success:function(e){waitingDialog.hide();location.protocol,location.host,location.pathname;var i="/datalayer/"+e.id;if(i!=location.pathname){var a=location.protocol+"//"+location.host+i;window.history.replaceState({},document.title,a)}if(e.status){if($.notify({message:"Dataset saved successfully"},{type:"success",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}}),e.item&&e.item.details)try{d.fillUI(JSON.parse(e.item.details))}catch(e){}var t="/datalayer/"+e.id+"/geojson"+"?settings="+encodeURIComponent(JSON.stringify({filter:{},validate:!0})),n=$.notify({message:'<i class="wait-icon-with-padding">Validating ...</i><br />'},{type:"info",delay:0,z_index:5e4,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}});$.ajax(t,{type:"GET",dataType:"json",success:function(e){e&&(e.status?($.notify({message:e.rowCount+" row(s) are returned successfully."},{type:"success",delay:3e3,z_index:5e4,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}}),setTimeout(function(){window.location.href=location.protocol+"//"+location.host+"/datalayers"},2e3)):$.notify({message:"Validation failed <br />Error:"+e.message+"<br/> Check fields' expressions"},{type:"danger",delay:5e3,z_index:5e4,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})),n.close()},error:function(e,i,a){$.notify({message:a+"<br/>Failed to complete task"},{type:"danger",delay:3e3,z_index:5e4,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}}),n.close()}}).done(function(e){n.close()})}else{var l=e.errors||e.error||e.message||"Failed to save Dataset";l=(l+="").replace(new RegExp(o,"g"),""),$.notify({message:l},{type:"danger",delay:1e4,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}},error:function(e,i,a){waitingDialog.hide(),console.log("An error occurred."),$.notify({message:"Failed to save Dataset"},{type:"danger",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}})}else{var n=$(".input-validation-error").first();n&&$("html, body").animate({scrollTop:n.offset().top-20},1e3)}}};function EditFieldDlg(e){var a=this;this.fieldTypeTips={varchar:"variable-length character string, up to defined Length",boolean:"Boolean values like;true|false,yes|no,1|0",smallint:"2 bytes small integer, range:\t-32768 to +32767",integer:"4 bytes typical choice for integer, range: -2147483648 to +2147483647",bigint:"8 bytes large integer, rage: -9223372036854775808 to +9223372036854775807",numeric:"variable\tnumber with user-specified precision. <br /> Example, A numeric field with Length=5 and Scale=2 can store -999.99 to 999.99 ",real:"4 bytes\tvariable-precision, inexact\t6 decimal digits precision","double precision":"8 bytes\tvariable-precision, inexact\t15 decimal digits precision",date:"4 bytes date (no time of day)","timestamp with time zone":'8 bytes\tboth date and time with time zone, example:2018-08-28 12:22:01.673<span class="label label-info">+04:30</span>',bytea:"BLOB, Binary Large OBject",_filelink:"Keeps a link to an uploaded file",_documentslink:"Keeps links to uploaded document files",nill:"Dummy field used for adding descriptions to attribute form"},this.options=e||{},this.field=this.options.field,this.parent_shapeType=this.options.shapeType,this.parent_details=this.options.details||{},void 0===this.field.type&&(this.field.type="varchar",this.field.length=20),this.onSuccess=this.options.onSuccess,this.onValidate=this.options.onValidate,this.body=$("#fieldDlgTemplate").clone(),this.dlg=new BootstrapDialog({title:"Field properties",message:function(e){var i=a.body;a.initFrom();i.find("#type").change(function(){a.updateUI()});return a.updateUI(),i},draggable:!0,closable:!0,closeByBackdrop:!0,closeByKeyboard:!0,buttons:[{label:"OK",cssClass:"btn-primary",action:function(e){a.apply()&&(a.changesApplied=!0,e.close())}},{label:"Cancel",action:function(e){e.close()}}],onshow:function(e){},onshown:function(e){},onhide:function(e){},onhidden:function(e){a.changesApplied||a.cancelSettings()}})}EditFieldDlg.prototype.initFrom=function(){var e=this,n=this.body;if(e.field){n.find("#name").val(void 0===e.field.name?"":e.field.name),n.find("#alias").val(void 0===e.field.alias?"":e.field.alias),n.find("#description").val(void 0===e.field.description?"":e.field.description),n.find("#hint").val(void 0===e.field.hint?"":e.field.hint),n.find("#group").val(void 0===e.field.group?"":e.field.group),n.find("#hidden").prop("checked",!!e.field.hidden),n.find("#defaultMimeType").val(void 0===e.field.defaultMimeType?"":e.field.defaultMimeType);var i=n.find("#type");i.val(void 0===e.field.type?"varchar":e.field.type);var a,t=i.val();n.find("#typeTip").html(e.fieldTypeTips[t]),n.find("#length").val(void 0===e.field.length?"":e.field.length),n.find("#scale").val(void 0===e.field.scale?"":e.field.scale),n.find("#default").val(e.field.default),n.find("#notNull").prop("checked",!!e.field.notNull),e.parent_details&&e.parent_details.spatialReference&&(a=e.parent_details.spatialReference.srid);var l="";e.parent_shapeType&&("MultiPolygon"!=e.parent_shapeType&&"Polygon"!=e.parent_shapeType||(4326==a?(l+='<option value="ST_Area(geom::geography)" > Area</option>',l+='<option value="ST_Perimeter(geom::geography)" > Perimeter</option>'):(l+='<option value="ST_Area(geom)" > Area</option>',l+='<option value="ST_Perimeter(geom)" > Perimeter</option>'),l+='<option value="ST_X(ST_Centroid(geom))" > Centroid.X</option>',l+='<option value="ST_Y(ST_Centroid(geom))" > Centroid.Y</option>'),"MultiLineString"!=e.parent_shapeType&&"LineString"!=e.parent_shapeType||(l+=4326==a?'<option value="ST_Length(geom::geography)" > Length</option>':'<option value="ST_Length(geom)" > Length</option>',l+='<option value="ST_X(ST_Centroid(geom))" > Centroid.X</option>',l+='<option value="ST_Y(ST_Centroid(geom))" > Centroid.Y</option>'),"Point"==e.parent_shapeType&&(l+='<option value="ST_X(geom)" > X</option>',l+='<option value="ST_Y(geom)" > Y</option>',4326!==a&&(l+='<option value="ROUND(ST_X(ST_Transform(geom,4326))::numeric,4)" > Longitude</option>',l+='<option value="ROUND(ST_Y(ST_Transform(geom,4326))::numeric,4)" > Latitude</option>'))),l&&(n.find("#expression").append(l),n.find("#expression").val(e.field.expression),n.find("#expression").change(function(){n.find("#type").val("real")})),n.find("#domain").change(function(){var e=$(this).val();n.find(".domainTypePanel").hide(),n.find("#domainTypePanel_"+e).removeClass("hidden"),n.find("#domainTypePanel_"+e).show()});var d=0;if(n.find("#addCodedValue").on("click",function(){s("","")}),n.find("#tblCodedValues").on("click",".ibtnDel",function(e){$(this).closest("tr").remove(),d-=1}),e.field.domain&&"codedValues"==e.field.domain.type){for(var o=0;e.field.domain.items&&o<e.field.domain.items.length;o++)s(e.field.domain.items[o].code,e.field.domain.items[o].value);"varchar"==e.field.type?(n.find("#multipleChoiceCodedValues").prop("checked",!!e.field.domain.multipleChoice),n.find("#editableCodedValues").prop("checked",!!e.field.domain.editable)):(n.find("#multipleChoiceCodedValues").prop("checked",!1),n.find("#editableCodedValues").prop("checked",!1))}e.field.domain&&"range"==e.field.domain.type&&(n.find("#minValue").val(e.field.domain.minValue),n.find("#maxValue").val(e.field.domain.maxValue)),e.field.domain&&e.field.domain.type&&(n.find("#domain").val(e.field.domain.type),n.find("#domain").trigger("change"))}function s(e,i){var a=$("<tr>"),t="";t+='<td><input type="text" class="form-control codedValues_domainCode  nospinner" value="'+e+'"  name="domainCode'+d+'"  data-val="true" data-val-required="Code value is required"/><span class="field-validation-valid" data-valmsg-for="domainCode'+d+'" data-valmsg-replace="true"></span></td>',t+='<td><input type="text" class="form-control codedValues_domainValue nospinner" value="'+i+'"  name="domainValue'+d+'" ></td>',t+=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger\t"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>',a.append(t),n.find("#tblCodedValues").append(a),d++}},EditFieldDlg.prototype.updateUI=function(){var e=this.body,i=e.find("#type").val();e.find("#typeTip").html(this.fieldTypeTips[i]);var a=!1;this.field&&this.field._action&&this.field._action.isNew&&(a=!0);var t=!1,n=!1;"smallint"!=i&&"integer"!=i&&"bigint"!=i&&"numeric"!=i&&"real"!=i&&"double precision"!=i||(t=!0),"smallint"!=i&&"integer"!=i&&"bigint"!=i||(t=!0),"varchar"==i&&(n=!0),"varchar"==i||"numeric"==i?e.find(".form-group").has("#length").show():e.find(".form-group").has("#length").hide(),"numeric"==i?e.find(".form-group").has("#scale").show():e.find(".form-group").has("#scale").hide(),"_filelink"==i?e.find("#_filelink_defaultMimeType").show():e.find("#_filelink_defaultMimeType").hide(),this.field&&this.field.isExpression?(e.find(".form-group").has("#expression").show(),e.find(".form-group").has("#default").hide(),e.find(".form-group").has("#type").hide(),e.find(".form-group").has("#typeTip").hide(),e.find(".form-group").has("#length").hide()):(a&&t?e.find(".form-group").has("#expression").show():e.find(".form-group").has("#expression").hide(),e.find(".form-group").has("#default").show(),e.find(".form-group").has("#type").show(),e.find(".form-group").has("#typeTip").show()),t||n?(e.find(".form-group").has("#domain").show(),e.find("#domain").trigger("change"),n?(e.find("#multipleChoiceCodedValuesPanel").show(),e.find("#editableCodedValuesPanel").show()):(e.find("#multipleChoiceCodedValuesPanel").hide(),e.find("#editableCodedValuesPanel").hide())):(e.find(".form-group").has("#domain").hide(),e.find("#domainTypePanel_codedValues").hide(),e.find("#domainTypePanel_range").hide())},EditFieldDlg.prototype.create=function(){this.changesApplied=!1},EditFieldDlg.prototype.apply=function(){var e=this;$.validator.unobtrusive.parse(document),e.body.find("#errors").hide();var i=this.body.find("#frmField");if(i.validate(),!i.valid())return!1;var a=i.find("#type").val(),t=i.find("#scale").val();try{t=parseInt(t),isNaN(t)&&(t=void 0)}catch(e){}var n=i.find("#length").val();try{n=parseInt(n),isNaN(n)&&(n=void 0)}catch(e){}var l={name:i.find("#name").val(),type:a,hint:e.field.hint,group:e.field.group,hidden:e.field.hidden,notNull:e.field.notNull,isExpression:e.field.isExpression};i.find("#alias").val()&&(l.alias=i.find("#alias").val()),i.find("#description").val()&&(l.description=i.find("#description").val()),i.find("#hint").length&&(l.hint=i.find("#hint").val()),i.find("#group").length&&(l.group=i.find("#group").val()),i.find("#hidden").length&&(l.hidden=i.find("#hidden").prop("checked")),i.find("#notNull").length&&(l.notNull=i.find("#notNull").prop("checked")),i.find("#_filelink_defaultMimeType").length&&(l.defaultMimeType=i.find("#defaultMimeType").val()),n&&(l.length=n),t&&(l.scale=t),i.find("#default").val()&&(l.default=i.find("#default").val()),"varchar"!=a&&"numeric"!=a&&(l.length=""),l.expression=i.find("#expression").val();var d=i.find("#domain").val();if("range"===d&&(l.domain={type:"range",minValue:i.find("#minValue").val(),maxValue:i.find("#maxValue").val()}),"codedValues"===d){l.domain={type:"codedValues",items:[]};var o=0,s=0;i.find("#tblCodedValues > tbody > tr").each(function(){var e=$(this).find(".codedValues_domainCode").val(),i=$(this).find(".codedValues_domainValue").val();e&&(e+"").indexOf(";")&&(e=e.replace(new RegExp(";","g")," ")),o+=e.length+1,s<e.length&&(s=e.length),l.domain.items.push({code:e,value:i})}),"varchar"==l.type&&(l.domain.multipleChoice=i.find("#multipleChoiceCodedValues").prop("checked"),l.domain.editable=i.find("#editableCodedValues").prop("checked"),l.domain.multipleChoice&&(s=o),l.length&&l.length<s&&(l.length=s),l.length&&l.domain.editable&&l.length<2*s&&(l.length=2*s))}if(this.onValidate){var r={valid:!0,message:"",field:l};if(this.onValidate(r),!r.valid)return e.body.find("#errors").html("<div>"+r.message+"</div>").show(),!1}return this.onSuccess&&this.onSuccess({field:l}),!0},EditFieldDlg.prototype.cancelSettings=function(){return!0},EditFieldDlg.prototype.show=function(){this.create(),this.dlg.open()};