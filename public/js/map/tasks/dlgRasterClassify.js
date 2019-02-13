

function DlgRasterClassify(mapContainer,obj,options) {
    DlgTaskBase.call(this, 'DlgRasterClassify'
        ,(options.title || 'Classify Raster')
        ,  mapContainer,obj,options);   
  
  }
  DlgRasterClassify.prototype = Object.create(DlgTaskBase.prototype);

 
  DlgRasterClassify.prototype.createUI=function(){
    var self=this;
    var layer= this.obj;
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    self.selBand= self.options.selBand || 1;

    var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
    htm +='  <div class="form-group">';
    htm +='    <label class="" for="">Raster data layer</label>';
    htm +='    <div>'+layerCustom.dataObj.name+'</div>' ;
    htm +=' </div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-3" for="bands">Band:</label>';
    htm+='    <select class="form-control " id="bands"  >';
    for(var i=0;i< details.bands.length;i++){
      if((i+1)==self.selBand){
        htm+='        <option value="'+ (i+1)+'" selected="selected"  >'+ (i+1) +' </option>';  
      }else
      {
        htm+='        <option value="'+ (i+1)+'"  >'+ (i+1) +' </option>';  
      }
    }
    htm+='    </select>';
    htm+='  </div>';
    
    htm+='    <div id="childContent" class="panel-body">';
    
    htm+='    </div>';

    htm += '</form>';
    htm+='  </div>';
    var content=$(htm).appendTo( this.mainPanel); 
    self.childContent=content.find('#childContent');
    content.find('#bands').change(function(){
      self.selBand=$(this).val();
      self.populateChildPanel();
    });
    self.populateChildPanel();
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
      var band= details.bands[self.selBand-1];
      var reclass=band.reclass;
      if(!reclass)
        {
          reclass={
            ranges:[],
            expression:'',
            noDataValue:band.noDataValue,
            dataType:band.dataType
          }
          band.reclass=reclass;
          if(band.dataType=='Byte'
          || band.dataType=='Int16'
          || band.dataType=='Int32'
          || band.dataType=='UInt16'
          || band.dataType=='UInt32'
          ){
            reclass.dataType='Int32';
          }else{
            reclass.dataType='Float32';
          }
        }
        var ranges= reclass.ranges;
        if(!ranges){
          ranges=[];
          
        } 
        band.reclass.expression=content.find('#reclass').val();
        reclass.dataType= content.find('#dataType').val();
        evt.data.band=band.id;
        evt.data.reclass=reclass;

        ranges=[];
        content.find('#tblRanges > tbody  > tr').each(function() {
          ranges.push({
            from:$(this).find('.range-from').val(),
            to:$(this).find('.range-to').val(),
            newFrom:$(this).find('.range-newFrom').val(),
            newTo:$(this).find('.range-newTo').val()
          }) 

        });

        reclass.ranges=ranges;
        var expression='';
        var expressions=[];
        if(ranges.length){
          for(var i=0;i< ranges.length;i++){
            var range= ranges[i];
            var from= range.from;
            var to= range.to;
            if(to=='')
            {
              to=from;
            }
            var newFrom= range.newFrom;
            var newTo= range.newTo;
            var expr='['+ from+'-'+to+'):'+ newFrom+ ((newTo!=='')? ('-'+newTo):'');
            expressions.push(expr);
          }
        }
        expression= expressions.join(',');
        band.reclass.expression=expression;
    });

    this.changesApplied=false
  }
  DlgRasterClassify.prototype.populateChildPanel=function(){
    var self=this;
    var layer= this.obj;
    var layerCustom= layer.get('custom');
    var details= LayerHelper.getDetails(layer);
    var band= details.bands[self.selBand-1];
    var reclass=band.reclass;
    if(!reclass)
      {
        reclass={
          ranges:[],
          expression:'',
          noDataValue:band.noDataValue,
          dataType:band.dataType
        }
        band.reclass=reclass;
        if(band.dataType=='Byte'
          || band.dataType=='Int16'
          || band.dataType=='Int32'
          || band.dataType=='UInt16'
          || band.dataType=='UInt32'
        ){
          reclass.dataType='Int32';
        }else{
          reclass.dataType='Float32';
        }
      }
     var ranges= reclass.ranges;
     if(!ranges){
       ranges=[];
       reclass.ranges=ranges;
     } 
    var htm='';
    this.childContent.html('');
    htm+='<div class="row">';
    htm+='  <label class="col-sm-3" >Data type:</label>';  
    htm+='  <label class="col-sm-3" >'+ band.dataType +' </label>';  
    htm+='  <label class=" col-sm-3" >No-data value:</label>';  
    htm+='  <label class="col-sm-3" >'+band.noDataValue+' </label>';  
    htm+='</div>';
    htm+='<div class="row">';
    htm+='  <label class=" col-sm-3" >Min value:</label>';  
    htm+='  <label class="col-sm-3" >'+band.minimum+' </label>';  
    htm+='  <label class=" col-sm-3" >Max value:</label>';  
    htm+='  <label class="col-sm-3" >'+band.maximum+' </label>';  
    htm+='</div>';

   
    if(band.statistics){
      htm+='<div class="row">';
      htm+='  <label class=" col-sm-3" >Mean value:</label>';  
      htm+='  <label class="col-sm-3" >'+band.statistics.mean+' </label>';  
      if(typeof band.statistics.std_dev !=='undefined'){
        htm+='  <label class=" col-sm-3" >Std-dev:</label>';  
        htm+='  <label class="col-sm-3" >'+band.statistics.std_dev +' </label>';  
      }else if(typeof band.statistics.stddev !=='undefined'){
        htm+='  <label class=" col-sm-3" >Std-dev:</label>';  
        htm+='  <label class="col-sm-3" >'+band.statistics.stddev +' </label>';  
      }
      htm+='</div>';
    }
    var counter=0;
    htm+='<hr />';
    htm+='<div class="form-group">';
    htm+=' <label class="col-sm-12">Class ranges:</label>';
    htm+=' <table id="tblRanges" class=" table order-list col-sm-12">';
    htm+='  <thead>';
    htm+='  <tr><td colspan="2">Values:</td><td colspan="2">Convert to:</td></tr>';
    htm+='  <tr><td>From</td><td>To</td> <td>From</td><td>To</td></tr>';
    htm+='  </thead>';
    htm+='  <tbody>';
    if(ranges.length==0){
      htm+='  <tr>';
      var cols = "";

      cols += '<td><input type="number" class="form-control range-from nospinner" value=""  name="from' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="from'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-to nospinner" value=""  name="to' + counter + '"/></td>';
      cols += '<td><input type="number" class="form-control range-newFrom nospinner" value=""  name="newFrom' + counter + '"  data-val="true" data-val-required="New value is required" /><span class="field-validation-valid" data-valmsg-for="newFrom'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-newTo nospinner" value=""  name="newTo' + counter + '"/></td>';

      htm+=cols;
      htm+='  </tr>';
      counter++;
    }else{
    for(var i=0;i<ranges.length;i++){
      var range= ranges[i];
      htm+='  <tr>';
      var cols = "";

      cols += '<td><input type="number" class="form-control range-from nospinner" value="'+range.from+'"  name="from' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="from'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-to nospinner" value="'+range.to+'"  name="to' + counter + '"/></td>';
      cols += '<td><input type="number" class="form-control range-newFrom nospinner" value="'+range.newFrom+'"  name="newFrom' + counter + '"  data-val="true" data-val-required="New value is required" /><span class="field-validation-valid" data-valmsg-for="newFrom'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-newTo nospinner" value="'+range.newTo+'"  name="newTo' + counter + '"/></td>';
      if(i>0){
        cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      }
      htm+=cols;
      htm+='  </tr>';
      counter++;
    }
  }
    htm+='  </tbody>';
    htm+='  <tfoot>';
    htm+='         <tr>';
    htm+='   <td colspan="4" style="text-align: left;"><input type="button" class="btn btn-lg btn-block " id="addRange" value="Add Range" /></td>';
    htm+='  </tr>';
    htm+='  </tfoot>';
    htm+='  </table>';
    htm+='</div>';

    htm+='<div class="form-group">';
    htm+='  <label class="col-sm-4" for="dataType">Output data type:</label>';
    htm+='    <select class="form-control " id="dataType"  >';
      if( reclass.dataType=='Int32'){
        htm+='        <option value="Int32" selected="selected"  >Integer</option>';  
      }else
      {
        htm+='        <option value="Int32"  >Integer</option>';  
      }
      if( reclass.dataType=='Float32'){
        htm+='        <option value="Float32" selected="selected"  >Float</option>';  
      }else
      {
        htm+='        <option value="Float32"  >Float</option>';  
      }
    
    htm+='    </select>';
    htm+='  </div>';

   

    // htm+='<div class="form-group">';
    // htm+='    <label class="col-sm-12" for="reclass">Classification Expresssion:</label>';
    // htm+='       <div class="col-sm-12">';
    // htm+='          <textarea type="text" name="reclass" rows="3" id="reclass" autofocus placeholder="Expression" class="form-control" data-val="true" data-val-required="Expression is required"  >'+ (band.reclass.expression?band.reclass.expression:'')+ '</textarea>';
    // htm+='           <span class="field-validation-valid" data-valmsg-for="reclass" data-valmsg-replace="true"></span>';
    
    // htm+='           <span class="help-block">Classification expression consisting of comma delimited range:map_range mappings. <br/> To define mapping that defines how to map old band values to new band values. \'(\' means >, \')\' means less than, \']\' < or equal, \'[\' means > or equal<br/>';

    // htm+='           1. [a-b] = a <= x <= b<br/>';

    // htm+='           2. (a-b] = a < x <= b<br/>';

    // htm+='           3. [a-b) = a <= x < b<br/>';

    // htm+='           4. (a-b) = a < x < b<br/><br/>';
    // htm+='           example:<br/>';
    // htm+='           [a-b):M,[b-c):N-O,[c-d):P-Q,[d-e):R,[e-f]:Q<br/>';
    // htm+='           [-100--50):0,[-50-0):1-50,[0-100):51-100,[100-1000):0<br/></span>';

    // htm+='       </div>';
    // htm+='</div>';
    this.childContent.html(htm);

    this.childContent.find("#addRange").on("click", function () {
      var newRow = $("<tr>");
      var cols = "";

      cols += '<td><input type="number" class="form-control range-from nospinner" name="from' + counter + '"  data-val="true" data-val-required="Value is required"/><span class="field-validation-valid" data-valmsg-for="from'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-to nospinner" name="to' + counter + '"/></td>';
      cols += '<td><input type="number" class="form-control range-newFrom nospinner" name="newFrom' + counter + '"  data-val="true" data-val-required="New value is required" /><span class="field-validation-valid" data-valmsg-for="newFrom'+counter+'" data-valmsg-replace="true"></span></td>';
      cols += '<td><input type="number" class="form-control range-newTo nospinner" name="newTo' + counter + '"/></td>';
      cols +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
      newRow.append(cols);
      self.childContent.find("#tblRanges").append(newRow);
      counter++;
  });
  this.childContent.find("#tblRanges").on("click", ".ibtnDel", function (event) {
    $(this).closest("tr").remove();       
    counter -= 1
  });
  this.childContent.find("#tblRanges").on("wheel", "input[type=number]", function (e) {
    $(this).blur();
});
  }