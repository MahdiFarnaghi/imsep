/*! imsep 2019-05-31 */

$(function(){$("#file").fileinput({uploadUrl:"/datalayer/uploadshapefile",uploadExtraData:function(){return{projection:$("#projection").val(),encoding:$("#encoding").val()}},uploadAsync:!1,previewFileType:"any",allowedFileExtensions:["zip","shp","dbf","shx","sbx","sbn","prj","cpg","png","jpg","xml"],allowedPreviewTypes:["image","html","text"],maxFileCount:40,maxFileSize:app.UPLOAD_SHAPEFILE_MAX_SIZE_MB?1024*app.UPLOAD_SHAPEFILE_MAX_SIZE_MB:3e4}).on("filebatchuploadsuccess",function(e,a,n,i){if(a&&a.response&&a.response.flash)for(var l=0;l<a.response.flash.length;l++){var p=a.response.flash[l];p.notify&&$.notify({message:p.msg},{type:p.type||"info",delay:p.delay,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}$("#file").fileinput("clear")})});