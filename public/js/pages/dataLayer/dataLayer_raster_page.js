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
    
    this.fillDetails();
  },
  fillDetails:function(){
    var details= this.details; 
    

    var detailsContainer= $('#detailsContainer');
   
   
    var htm='';
    htm+='  <div class="form-group">';
    //htm += '  <li><i class="fa fa-user"></i> <span>' + layerCustom.dataObj.OwnerUser.userName + '</span></li>';
    // htm += '<li><i class="fa fa-calendar"></i><span>' +updatedAt + '</span></li>';
    //  htm += '</div>';
    htm+='  </div>';
    
    if(details){
     var bandCount=1;
     if(details.bands){
       bandCount= details.bands.length;
     }
      htm+='<div class="row">';
      htm+='  <label class="col-sm-3" >Raster type:</label>';  
      htm+='<div class="col-sm-4">';

      htm+='<select class="form-control "   name="rasterType" id="rasterType" >';
      if(bandCount==1){
        htm+='  <option value="SingleBand"' + ((details.rasterType=='SingleBand') ? 'selected="selected"' : '' ) +' >Single-band </option>';
        htm+='  <option value="SingleBand_Dem"' + ((details.rasterType=='SingleBand_Dem') ? 'selected="selected"' : '' ) +'>Single-band (DEM)</option>';
        htm+='  <option value="SingleBand_Image"' + ((details.rasterType=='SingleBand_Image') ? 'selected="selected"' : '' ) +'>Single-band (Image)</option>';
      }else{
        htm+='  <option value="MultiBand"' + ((details.rasterType=='MultiBand') ? 'selected="selected"' : '' ) +'>Multi-band</option>';
        htm+='  <option value="Image"' + ((details.rasterType=='Image') ? 'selected="selected"' : '' ) +'>Image</option>';
      }
      htm+='</select> '; 

      htm+='</div>';
      htm+='</div>';

      htm+='<div class="row">';
      htm+='  <label class="col-sm-3" >Image width:</label>';  
      htm+='  <label class="col-sm-3" >'+details.rasterWidth+' Pixels </label>';  
      htm+='</div>';
      htm+='<div class="row">';
      htm+='  <label class="col-sm-3" >Image height:</label>';  
      htm+='  <label class="col-sm-3" >'+details.rasterHeight+' Pixels </label>';  
      htm+='</div>';
      if(details.bands){
        htm+='<div class="form-group">';
        if(details.bands.length>1){
          htm+='  <label class="col-sm-12" for="">Bands:</label>';
        }else{
          htm+='  <label class="col-sm-12" for="">Band:</label>';
        }
        for(var i=0;i<details.bands.length;i++){
          var band=details.bands[i];

            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-1 col-sm-2" >Name:</label>';  
            //htm+='  <label class="col-sm-8" >'+(band.name)+' </label>';  
            htm+='  <div class="col-sm-3" >';
            htm+='  <input type="text" name="bandName_'+ i+'" id="bandName_'+i+'" value="' +(band.name)+ '"  class=" form-control" data-val="true" data-val-required="Band name is required"                               />';
            htm+='  <span class="field-validation-valid" data-valmsg-for="bandName_' + i+'" data-valmsg-replace="true"></span>';
            htm+='  </div>';
            htm+='</div>';

                      
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-3 col-sm-3" >ID:</label>';  
            htm+='  <label class="col-sm-6" >'+ band.id +' </label>';  
            htm+='</div>';
            

            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-3 col-sm-3" >Data type:</label>';  
            htm+='  <label class="col-sm-6" >'+ band.dataType +' </label>';  
            htm+='</div>';
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-3 col-sm-3" >Min value:</label>';  
            htm+='  <label class="col-sm-6" >'+band.minimum+' </label>';  
            htm+='</div>';
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-3 col-sm-3" >Max value:</label>';  
            htm+='  <label class="col-sm-6" >'+band.maximum+' </label>';  
            htm+='</div>';
            htm+='<div class="row">';
            htm+='  <label class="col-sm-offset-3 col-sm-3" >No-data value:</label>';  
            htm+='  <label class="col-sm-6" >'+band.noDataValue+' </label>';  
            htm+='</div>';
         
            htm+='<hr />';
        }


        htm+='</div>';
      }
      if(details.spatialReference){
        htm+='<div class="form-group">';
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
        
        htm+='</div>';
      }
    }
    
    detailsContainer.html(htm);
  },
  
  submit:function(){
    var self= this;
    $.validator.unobtrusive.parse(document);
    
    var $form= $('#mainForm');
    $form.validate();

    var $frmDetail= $('#frmDetail');
    $frmDetail.validate();

    //var v1=true;
    var v1=$frmDetail.valid();
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

    if(this.details.bands){
      for(var i=0;i<this.details.bands.length;i++){
        var bandNameElm=$frmDetail.find('#bandName_'+i);
        this.details.bands[i].name= bandNameElm.val();
      }
    }
    this.details.rasterType= $frmDetail.find('#rasterType').val();

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
          }else{
            $.notify({
                message:data.errors || data.error|| data.message || "Failed to save Data Layer"
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

