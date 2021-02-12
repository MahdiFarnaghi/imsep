

function GtmSourceTab() {
     var self=this;  
     this.tabId='tabGtmSourceTab';  
      
  }
  GtmSourceTab.prototype.init=function(parentDialog){
    this.parentDialog=parentDialog;
  }
  GtmSourceTab.prototype.activate=function(){
    $('.nav-tabs a[href="#' + this.tabId + '"]').tab('show');
  }
  GtmSourceTab.prototype.applied=function(obj){
    if(obj && obj.get('custom') && obj.get('custom').format=='GTM')
      return true;
    else
      return false;
  }
  GtmSourceTab.prototype.create=function(obj,isActive){
    var self=this;
    this.layer=obj;
    var mapContainer= this.parentDialog.mapContainer;
    var map = mapContainer.map;
    var view = map.getView();
    var mapProjectionCode = view.getProjection().getCode();

    var layerCustom= obj.get('custom');
    var active='';
    if(isActive)
      active ='active';
    var sourceType='';    
    
    var tabHeader=$('<li class="'+active+'"><a href="#' +self.tabId+'" data-toggle="tab"><i class="fa fa-database"></i> Source</a> </li>').appendTo(this.parentDialog.tabPanelNav);
   this.tab=$('<div class="tab-pane '+ active +'" id="' +self.tabId+'"></div>').appendTo(this.parentDialog.tabPanelContent);
    var htm='<div><form id="'+self.tabId+'_form" class="modal-body form-horizontal">';  
    
    // htm+='  <div class="form-group">';
    // htm+='    <label class="" for="name">Name</label>';
    // htm+='    <input type="text" name="name" id="name" value="" placeholder="Name" class="form-control" data-val="true" data-val-required="Layer name is required" />'
    // htm+='    <span class="field-validation-valid" data-valmsg-for="name" data-valmsg-replace="true"></span>';
    // htm+='  </div>';
    htm+='';
    htm+='';
    htm+='';
    htm+='';
   
    var task_id=-1;
   
    if(layerCustom.dataObj && layerCustom.format=='GTM'){
      sourceType='GTM';
      var details= LayerHelper.getDetails(self.layer);
      if(details){
        task_id= details.task_id || -1;
        var filter=details.filter ||{};
        var topicWords= filter.topicWords ||[];
        var date_time_min= filter.date_time_min || '';
        var date_time_max= filter.date_time_max || '';
        if(date_time_min){
          date_time_min= new Date(date_time_min);
          date_time_min= date_time_min.toLocaleString();
        }
        if(date_time_max){
          date_time_max= new Date(date_time_max);
          date_time_max= date_time_max.toLocaleString();
        }
        
        htm+='  <div class="form-group">';
        htm+='    <label class="" for="">Twitter event layer</label>';
        htm+='<a title="Help" class="close" style=" float: right; margin-right: .5em;" target="_blank" href="/help#source_gtm">?</a>'  ;
        htm+='  </div>';
        
        // htm+='  <div class="form-group">';
        // htm+='  <label class="" for="task">Task:</label>';                                                          
        // htm+='  <select id="task" class="form-control"  style="width: 100%" >';
        // htm+='  </select>';
        // htm+='  </div>';

        htm+='  <div class="form-group">';
        htm+='  <label class="" for="topicwords">Topic words:</label>';   
                                                                 
        htm+='  <select id="topicwords" class="select2Multiple form-control"  style="width: 100%" name="topicwords[]" multiple="multiple" ';
        
        htm+='   data-tags="true" ';        
        htm+='   data-allow-clear="true" ';
        htm+='   data-placeholder="Words" ';
        htm+='  >';

        
        for(var j=0;j<topicWords.length;j++){
          var value=topicWords[j];
          var value_str=value;
          htm+='    <option value="'+value+'" selected="selected" >'+  value_str +'</option>';  
        }
        htm+='  </select>';
        htm+='  <span id="topicwords_validation" class="field-validation-valid" data-valmsg-for="topicwords" data-valmsg-replace="true"> <span class="topicwords-error">Define 3 topic words at least</span></span>';
        htm+='</div>';

        htm+='<div class="form-group col-xs-10 col-sm-5 col-md-5 col-lg-5">';
        htm+='  <label class="" for="date_time_min">From:</label>'; 
        htm+='  <div class="input-group date" id="date_time_min_picker">';
        htm+='           <input id="date_time_min" type="text" class="form-control" value="'+date_time_min+'" />';
        htm+='           <span class="input-group-addon">';
        htm+='              <span class="glyphicon glyphicon-calendar"></span>';
        htm+='            </span>';
        htm+='  </div>';
        htm+='</div>';
        htm+='<div class="form-group col-xs-10 col-sm-5 col-md-5 col-lg-5">';
        htm+='  <label class="" for="date_time_max">To:</label>'; 
        htm+='  <div class="input-group date" id="date_time_max_picker">';
        htm+='           <input id="date_time_max" type="text" class="form-control" value="'+date_time_max+'" />';
        htm+='           <span class="input-group-addon">';
        htm+='              <span class="glyphicon glyphicon-calendar"></span>';
        htm+='            </span>';
        htm+='  </div>';
        htm+='</div>';
        
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadGeoJSON" ><i class="fa fa-download"></i> Download GeoJSON</button>';
      htm+='</div>';
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary" id="downloadShapefile" ><i class="fa fa-download"></i> Download Shapefile</button>';
      htm+='</div>';
      htm+='<div class="form-group">';
      htm += '<button type="button" class="btn btn-primary btn-xs_" id="createLayerFromGeoJSON" ><i class="fa fa-copoy"></i> Copy features to a new data layer</button>';
      htm+='</div>';
      }
    }
    
    htm+='</form></div>';
    
    var content=$(htm).appendTo( this.tab); 
    content.find('#name').val(this.layer.get('title'));
   
    content.find('#date_time_min_picker').datetimepicker();
    content.find('#date_time_max_picker').datetimepicker({
              useCurrent: false //Important! See issue #1075
    });
    content.find("#date_time_min_picker").on("dp.change", function (e) {
      content.find('#date_time_max_picker').data("DateTimePicker").minDate(e.date);
    });
    content.find("#date_time_max_picker").on("dp.change", function (e) {
      content.find('#date_time_min_picker').data("DateTimePicker").maxDate(e.date);
    });
   
    if(sourceType=='GTM'){
      content.find('#shapeType').val(layerCustom.shapeType);
      var source= self.layer.getSource();
      var features = source.getFeatures();
      if(!features.length){
       content.find('#downloadGeoJSON').hide();
       content.find('#createLayerFromGeoJSON').hide();
      }
     
      content.find('#downloadGeoJSON').click(function(){
        var source= self.layer.getSource();
       var features = source.getFeatures();
        var fileName= self.layer.get('title')|| details.shapefileName || details.tableName ;
        var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
        var json = format.writeFeatures(features);
        var blob = new Blob([json], {type: "text/json;charset=utf-8"});
        saveAs(blob, fileName +".json");
    });

  }
  if(sourceType=='GTM' || sourceType=='GeoJSON'){
      content.find('#createLayerFromGeoJSON').click(function(){
      
        mapContainer.duplicateLayer(self.layer,{
          newName:undefined,
          exportSelectionIfAny:false,
          srid:4326
      });
      

    });

    content.find('#downloadShapefile').click(function(){
      var source= self.layer.getSource();
    var features = source.getFeatures();
      var fileName= self.layer.get('title')|| details.shapefileName || details.tableName ;
      var format = new ol.format.GeoJSON({ featureProjection:mapProjectionCode,  dataProjection: 'EPSG:4326'});
      var json = format.writeFeatures(features);
      var blob = new Blob([json], {type: "text/json;charset=utf-8"});
      var details= LayerHelper.getDetails(self.layer);
      var layerInfo= JSON.parse(JSON.stringify(details));
      delete layerInfo.filter;
      delete layerInfo.datasetName;
      delete layerInfo.params;
      delete layerInfo.url;
      layerInfo.fileName=fileName +'-Copy';
      layerInfo.spatialReference = {
        name: 'EPSG:4326',
        srid: 4326
      };

      var formdata = new FormData();
      formdata.append("file", blob,'geojson.json');
      formdata.append('layerInfo',JSON.stringify(layerInfo));

      var processNotify= $.notify({
        message: '<i class="wait-icon-with-padding">The processing is running in the background</i><br /> Creating Shapefile...'
        },{
          z_index:50000,
            type:'info',
            delay:0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });

      $.ajax({
        url: '/datalayer/toShapefile',
        type: "POST",
        data: formdata,
        processData: false,
        contentType: false,
        
        xhrFields: {
          responseType: 'blob'
        },
        success:function(response, status, xhr) {
          var filename = "";
          var disposition = xhr.getResponseHeader('Content-Disposition');
          if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
          }
          if(!filename){
              filename='shapefile.zip';
          }
          var type = xhr.getResponseHeader('Content-Type');
          var blob = new Blob([response], { type: type });
          saveAs(blob, filename);
        }
        })        
        .done(function(data){
          processNotify.close();
              
        }).fail(function( jqXHR, textStatus, errorThrown) {
              $.notify({
                message: ""+ errorThrown+"<br/>Failed to complete task"
            },{
              z_index:50000,
                type:'danger',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            }); 

            processNotify.close();
        });


  });


 }
    
    if(sourceType=='WMS' || sourceType=='WFS'){
      var updateLink=function(){
        var url= content.find('#url').val();
        if(!url){
          content.find('#cmdGetCapabilities').removeAttr('href');
          content.find('#cmdGetCapabilities').addClass('disabled');

        }else{
          content.find('#cmdGetCapabilities').attr("href",url+ '?SERVICE='+ sourceType+ '&REQUEST=GetCapabilities');
          content.find('#cmdGetCapabilities').removeClass('disabled');
        }
      }
      content.find('#url').change(function(){
        updateLink();
      });

      updateLink();
    }
   var $form = $(content.find('#'+self.tabId+'_form'));
    
     
    this.parentDialog.beforeApplyHandlers.push(function(evt){
         
          var orIgnore= $.validator.defaults.ignore;
          $.validator.setDefaults({ ignore:'' });
          $.validator.unobtrusive.parse($form);
          $.validator.setDefaults({ ignore:orIgnore });

          $form.validate();

          var topicWords= $form.find('#topicwords').val();
          var preValid=true;
          if(!topicWords || (topicWords && topicWords.length<3)){
              preValid=false;
              $form.find('#topicwords_validation').removeClass("field-validation-valid");
              $form.find('#topicwords_validation').addClass("field-validation-error");
          }

          if(!preValid || ! $form.valid()){
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

            $form.find('#topicwords_validation').addClass("field-validation-valid");
              $form.find('#topicwords_validation').removeClass("field-validation-error");
          }
    });

    this.parentDialog.cancelHandlers.push(function(evt){
      
    });
    this.parentDialog.applyHandlers.push(function(evt){
      
      if(sourceType=='GTM'){
        var details= LayerHelper.getDetails(self.layer)||{};
        var filter= details.filter || {};
        details.filter= filter;
        details.task_id=content.find('#task').val();
        details.filter.topicWords= content.find('#topicwords').val();
        details.filter.date_time_min= content.find('#date_time_min').val();
        details.filter.date_time_max= content.find('#date_time_max').val();
        if(details.filter.date_time_min){
          details.filter.date_time_min= (new Date(details.filter.date_time_min)).toISOString();
        }
        if(details.filter.date_time_max){
          details.filter.date_time_max= (new Date(details.filter.date_time_max)).toISOString();
        }
        LayerHelper.setDetails(self.layer,details);

        self.layer.getSource().refresh();
          
      }
    });
    
    
  //   $.ajax( {    url: '/gtm/taskslist', dataType: 'json', success: function (data) {
  //     if(data){
  //         var mappedData=$.map(data, function (item) {
  //                 return {
  //                     id: item.task_id,
  //                     text: item.task_name,
  //                     data:item
  //                 };
  //         });
  //         var taskEl=content.find('#task');
  //         // taskEl.select2({
  //         //     data: mappedData
  //         // });
  //         for(var i=0; mappedData && i< mappedData.length;i++){
  //           taskEl.append("<option value='"+mappedData[i]['id']+"'>"+mappedData[i]['text'] +"</option>");
  //         }
  //         content.find('#task option[value="'+ task_id  +'"]').attr("selected", "selected");
  //     }
  // }});

  var mappedData=[];

  var select2Elm=content.find('#topicwords');
        var tags= select2Elm.data('tags');
        var allowClear= select2Elm.data('allow-clear');
       var placeholder=select2Elm.data('placeholder');
       select2Elm.select2({
          theme: "bootstrap",
         // dropdownParent: $(this).parent().parent().parent().parent().parent(),
          data:mappedData,
          tags:tags,
          placeholder: placeholder,
          allowClear:allowClear// (allowClear=='true' || allowClear )?true:false
        }).on('change',function(){

          var topicWords= select2Elm.val();
        
          if(!topicWords || (topicWords && topicWords.length<3)){
              content.find('#topicwords_validation').removeClass("field-validation-valid");
              content.find('#topicwords_validation').addClass("field-validation-error");
          }else{
            content.find('#topicwords_validation').removeClass("field-validation-error");
              content.find('#topicwords_validation').addClass("field-validation-valid");
          }

        });

  $.ajax( {    url: '/gtm/topicwords', dataType: 'json', success: function (data) {
    if(data){
        var mappedData=$.map(data, function (item) {
                return {
                    id: item.text,
                    text: item.text
                };
        });
        var select2Elm=content.find('#topicwords');
        var tags= select2Elm.data('tags');
        var allowClear= select2Elm.data('allow-clear');
       var placeholder=select2Elm.data('placeholder');
       select2Elm.select2({
          theme: "bootstrap",
         // dropdownParent: $(this).parent().parent().parent().parent().parent(),
          data:mappedData,
          tags:tags,
          placeholder: placeholder,
          allowClear:allowClear// (allowClear=='true' || allowClear )?true:false
        });
    }
  }});

  }
 
  
  