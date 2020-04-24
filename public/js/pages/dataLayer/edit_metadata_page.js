$(function () {
  
  pageTask.init();
  
  var keywordArray= $('#keywordArray').val();
  var keywords=[];
  if(keywordArray){
    keywords=keywordArray.split(';');
  }
  $('#subject').select2({
    data: keywords,
    dir: app.layout,
    tags: true,tokenSeparators: [';', '؛']
 });
 
 $('#theme').select2({
   
  dir: app.layout,
  tags: false,tokenSeparators: [';', '؛']
  });
});
var pageTask={
  init:function(){
    var me= this;
        
    this.fillUI();
    var initLanguage=$('#language').data('initvalue');
    if(!initLanguage){
      initLanguage='English';
    }
    $('#language').val( initLanguage);
    $('#cmdSave').click(function(){
      me.submit();
    })
  },
  fillUI:function(){
   
  },
    
  submit:function(){
    var self= this;
    $.validator.unobtrusive.parse(document);
    
    var $form= $('#mainForm');
    $form.validate();

    //var $frmDetail= $('#frmDetail');
    //$frmDetail.validate();

    var v1=true;
    //var v1=$frmDetail.valid();
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
    waitingDialog.show('Saving', { progressType: ''});

   
   // $form.find('#details').val( JSON.stringify( this.details));

    $.ajax({
        type: $form.attr('method'),
        url: $form.attr('action'),
        data: $form.serialize(),
        success: function (data) {
            var layerId=data.id;
            waitingDialog.hide();

          var clean_uri = location.protocol + '//' + location.host + location.pathname;
          var savedPathName='/datalayer/'+ data.id+ '/editmetadata';
          if(savedPathName !=location.pathname){ 
                var new_uri = location.protocol + '//' + location.host + savedPathName;
                window.history.replaceState({}, document.title, new_uri);
          }
          
          if(data.status){
            $.notify({
                message: "Metadata saved"
            },{
                type:'success',
                delay:2000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
            // if(data.item && data.item.details){
            //   try{
            //     self.fillUI(JSON.parse(data.item.details));
            //   }catch(ex){}
            // }
            
            if(data.datasetType){
              window.location.href=location.protocol + '//' + location.host + '/datalayer/'+  data.id +'?dataType='+ data.datasetType ;
            }else{
              window.location.href=location.protocol + '//' + location.host + '/datalayers';
            }
          }else{
            $.notify({
                message:data.errors || data.error|| data.message || "Failed to save metadata"
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
                message: "Error in saving metadata"
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

