
function DlgDissolve(mapContainer,obj,options) {
  DlgTaskBase.call(this, 'DlgDissolve'
      ,(options.title || 'Dissolve')
      ,  mapContainer,obj,options);   

}
DlgDissolve.prototype = Object.create(DlgTaskBase.prototype);


DlgDissolve.prototype.createUI=function(){
  var self=this;
  var layer= this.obj;
  var layerCustom= layer.get('custom');
  var details= LayerHelper.getDetails(layer);
  
    var fields= details.fields;
    if(!fields){
      fields=[];
    }
    

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <p>';
  htm+='Dissolve features of ('+ layer.get('title') +') :';
  htm+='  </p>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="dissolveField">Group based on field:</label>';

  htm+='<select class="form-control  " id="dissolveField" name="dissolveField" data-val="true" data-val-required="Select dissolve field">';
  for(var i=0;i< fields.length;i++){
    var fld= fields[i];
    if(fld.type !=='bytea'){
      var fldName=fld.name;
      var fldCaption= fld.alias|| fldName;
      
      htm+=' <option value="'+ fldName+ '"  >' + fldCaption+ '</option>';
    }
  }
  htm+='    </select>';
  //htm+='    </div>';
  htm+='    <span class="field-validation-valid" data-valmsg-for="dissolveField" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  var counter=0;
    htm+='<hr />';
    htm+='<div class="form-group">';
    htm+=' <label class="col-sm-12">Statistics:</label>';
    htm+=' <table id="tblStatistics" class=" table order-list col-sm-12">';
    htm+='  <thead>';
    htm+='  <tr><td>Statistic</td><td>Field</td></tr>';
    htm+='  </thead>';
    htm+='  <tbody>';
   
    htm+='  </tbody>';
    htm+='  <tfoot>';
    htm+='         <tr>';
    htm+='   <td colspan="4" style="text-align: left;"><input type="button" class="btn btn-lg btn-block " id="addStatistic" value="Add Statistic" /></td>';
    htm+='  </tr>';
    htm+='  </tfoot>';
    htm+='  </table>';
    htm+='</div>';
 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  

  content.find("#addStatistic").on("click", function () {
      var newRow = $("<tr>");
      var cols = "";

      cols += '<td><select class="form-control dissolve-statistic" name="statistic_' + counter + '"  >';
      cols +='    <option value="COUNT"  >Count</option>';
      cols +='    <option value="SUM"  >Sum</option>';
      cols +='    <option value="MIN"  >Minimum</option>';
      cols +='    <option value="MAX"  >Maximum</option>';
      cols +='    <option value="AVG"  >Average</option>';
      cols += '</select></td>';
      

      cols+='<td><select class="form-control  dissolve-field " id="statisticField_'+ counter +'"  name="statisticField_'+ counter+'" >';
      for(var i=0;i< fields.length;i++){
        var fld= fields[i];
        if(fld.type !=='bytea'){
          var fldName=fld.name;
          var fldCaption= fld.alias|| fldName;
          
          cols+=' <option value="'+ fldName+ '"  >' + fldCaption+ '</option>';
        }
      }
      cols+='</select></td>';
      cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      newRow.append(cols);
      content.find("#tblStatistics").append(newRow);
      counter++;
  });
  content.find("#tblStatistics").on("click", ".ibtnDel", function (event) {
    $(this).closest("tr").remove();       
    counter -= 1
  });
  content.find("#tblStatistics").on("wheel", "input[type=number]", function (e) {
    $(this).blur();
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
   
      var dissolve={};
      dissolve.dissolveField=content.find('#dissolveField').val();

      dissolve.statistics=[];
      var keys={};
      content.find('#tblStatistics > tbody  > tr').each(function() {
        var field=$(this).find('.dissolve-field').val();
        var statistic=$(this).find('.dissolve-statistic').val();
        if(! keys[field+ ''+ statistic] ){
          dissolve.statistics.push({
            field:field,
            statistic: statistic
          }) ;
          keys[field+ ''+ statistic]=true;
        }
        

      });
      evt.data.dissolve=dissolve;
  });

  this.changesApplied=false
}
