$(function () {
  $("#file").fileinput({
    uploadUrl: "/datalayer/uploadshapefile",
    uploadExtraData:function(){
      return {
        projection: $('#projection').val(),
        encoding: $('#encoding').val()
      };
    },

    //   'showUpload':false,
    uploadAsync: false,
    'previewFileType': 'any',
    'allowedFileExtensions': ['zip', 'shp', 'dbf', 'shx', 'sbx', 'sbn', 'prj', 'cpg', 'png', 'jpg','xml'],
    'allowedPreviewTypes': ['image', 'html', 'text'],
    maxFileCount: 40,
    //'maxFileSize': 30000 //kb
    'maxFileSize': app.UPLOAD_SHAPEFILE_MAX_SIZE_MB? (app.UPLOAD_SHAPEFILE_MAX_SIZE_MB*1024): 30000 //kb
    // previewFileType: "text",
    //         allowedFileExtensions: ["txt", "md", "ini", "text"],
    //         previewClass: "bg-warning"
    //maxFileCount: 10,
    //allowedFileExtensions: ["jpg", "gif", "png", "txt"]
  }).on('filebatchuploadsuccess', function (event, data, id, index) {
    if (data && data.response && data.response.flash) {
      for (var i = 0; i < data.response.flash.length; i++) {
        var n = data.response.flash[i];
        if (n.notify) {
          $.notify({
            message: n.msg
          }, {
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

    $("#file").fileinput('clear');
    
  });



});