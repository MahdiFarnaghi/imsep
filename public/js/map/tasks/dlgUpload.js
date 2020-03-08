
function DlgUpload(mapContainer,obj,options) {
  options=options||{};
  options.showOKButton=false;
  options.cancelButtonTitle='Cancel';
  options.rtl=(app.layout=='rtl');
  DlgTaskBase.call(this, 'DlgUpload'
      ,(options.title || 'Upload')
      ,  mapContainer,obj,options);   

      var settings= this.obj ||{};
      this.uploadUrl= settings.uploadUrl || "/dataset/uploadattachments";
  this.onUpload= settings.onUpload || function(){};    
  this.allowedFileExtensions= settings.allowedFileExtensions;
  this.maxFileSize= settings.maxFileSize || (app.UPLOAD_FILE_MAX_SIZE_MB? (app.UPLOAD_FILE_MAX_SIZE_MB*1024): 30000);
  
 
}
DlgUpload.prototype = Object.create(DlgTaskBase.prototype);


DlgUpload.prototype.createUI=function(){
  var self=this;
 


 

 if(self.activeTemplate){
  thumbnail=self.activeTemplate.thumbnail;
  thumbnail_alt=self.activeTemplate.name;
  resolution= self.activeTemplate.resolution;
}
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <div class="form-group">';
  htm+='    <div class="file-loading">';
  htm+='            <input id="file" name="file" type="file" multiple>';
  htm+='    </div>';
  htm+='  </div>';

  htm += '</form>';
  htm+='  </div>';
  
  var content=$(htm).appendTo( this.mainPanel); 
  content.find('#file').change(function(){
    
  });
  // $.fn.fileinputLocales['fa'].browseLabel='انتخاب...';
  // $.fn.fileinputLocales['fa'].msgPlaceholder='فایل ها را انتخاب کنید';
  // $.fn.fileinputLocales['fa'].msgSelected= '{n} فایل انتخاب شده است';

  content.find("#file").fileinput({
    uploadUrl: self.uploadUrl,
    uploadExtraData:function(){
      return {
      //   projection: $('#projection').val(),
      //  encoding: $('#encoding').val()
      };
    },
   // language:'fa',
    rtl:false,
    //   'showUpload':false,
    uploadAsync: false,
    'previewFileType': 'any',
    'allowedFileExtensions':self.allowedFileExtensions,
    'allowedPreviewTypes': ['image', 'html', 'text'],
    maxFileCount: 40,
    //'maxFileSize': 30000 //kb
    'maxFileSize': self.maxFileSize //kb
    // previewFileType: "text",
    //         allowedFileExtensions: ["txt", "md", "ini", "text"],
    //         previewClass: "bg-warning"
    //maxFileCount: 10,
    //allowedFileExtensions: ["jpg", "gif", "png", "txt"]
  }).on('filebatchuploadsuccess', function (event, data, id, index) {
    if (data && data.response ) {
      if(data.response.results && data.response.results.length){
        self.onUpload(self,data.response.results);  
      }
      for (var i = 0; i < data.response.flash.length; i++) {
        var n = data.response.flash[i];
      
        if (n.notify) {
          $.notify({
            message: n.msg
          }, {
              z_index:50000,
              type: n.type || 'info',
              delay: n.delay,
              animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
              }
            });
        }
      }
    }

    content.find("#file").fileinput('clear');
    
  });
  
  
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
   
    
      
  });

  this.changesApplied=false
}
