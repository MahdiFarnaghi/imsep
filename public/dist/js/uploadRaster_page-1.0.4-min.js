/*! imsep 2020-02-01 */

$(function(){$("#file").fileinput({uploadUrl:"/datalayer/uploadraster",uploadExtraData:function(){return{projection:$("#projection").val()}},uploadAsync:!1,previewFileType:"any",allowedFileExtensions:["zip","tiff","tif","tfw","tifw","tiffw","aux.xml","tab","jpg","jgw","png","pgw"],allowedPreviewTypes:["image","html","text"],maxFileCount:40,maxFileSize:app.UPLOAD_RASTER_MAX_SIZE_MB?1024*app.UPLOAD_RASTER_MAX_SIZE_MB:1e5}).on("filebatchuploadsuccess",function(e,a,t,i){if(a&&a.response&&a.response.flash)for(var n=0;n<a.response.flash.length;n++){var l=a.response.flash[n];l.notify&&$.notify({message:l.msg},{type:l.type||"info",delay:l.delay,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}$("#file").fileinput("clear")})});