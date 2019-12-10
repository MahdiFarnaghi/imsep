$(document).ready(function() {
    $("#sidebarCollapse").on("click", function() {
      $("#sidebar").toggleClass("active",
        {
            duration :100,
            complete: function(){
                app.mapContainer.map.updateSize();
                setTimeout(function(){
                    app.mapContainer.map.updateSize();
                },500);
             }
       }
      );
      // $(this).toggleClass("active");
    });
 
    $("#sidebar").swipe({allowPageScroll:"auto",
        excludedElements: ".ol-layerswitcher,input, select, textarea,.input-group-addon" // Here your list of excluded elements ...
    ,
        swipeStatus:function(event, phase, direction, distance, duration, fingers)
            {
                // if ( phase == "move" || phase == "start" ) {
                //     var $target = event.target.nodeName;
                //     if( $target.toLowerCase() === 'input' ) {
                //         return true;
                //     }else{
                //         //$('input').blur();
                //     }
                // }
                if (phase=="move" && direction =="right") {
                    
                       $("#sidebar").removeClass("active",
                       {
                           duration :300,
                           complete: function(){
                               app.mapContainer.map.updateSize();
                               setTimeout(function(){
                                   app.mapContainer.map.updateSize();
                               },500);
                           }
                         }
                   );
                     return false;
                }
                if (phase=="move" && direction =="left") {
                     
                     $("#sidebar").addClass("active",
                        {
                            duration :300,
                            complete: function(){
                                app.mapContainer.map.updateSize();
                                setTimeout(function(){
                                    app.mapContainer.map.updateSize();
                                },500);
                            }
                    }
                    );
                     return false;
                }
                return true;
            }
    });

    
    $.ajax( {    url: '/users', dataType: 'json', success: function (data) {
                if(data){
                    var mappedData=$.map(data, function (item) {
                            return {
                                id: item.id,
                                text: item.userName,
                                data:item
                            };
                    });
                    $('#usersWhoCanViewMap').select2({
                        data: mappedData
                    });
                }
            }
        }
    );

    $.ajax( {    url: '/groups', dataType: 'json', success: function (data) {
        if(data){
            var mappedData=$.map(data, function (item) {
                    return {
                        id: item.id,
                        text: item.name,
                        data:item
                    };
            });
            $('#groupsWhoCanViewMap').select2({
                data: mappedData
            });
        }
        }
    });

  });
  
$(function () {
  
    
      $(window).on("resize", function(){
        if(app && app.mapContainer && app.mapContainer.map){
         //   app.mapContainer.map.updateSize();
        }
        pageTask.setMapHeight();
     
    });
    $( window ).on( "orientationchange", function( event ) {
        pageTask.setMapHeight();
      //  alert('a')
      });
  

     
     

    pageTask.init();
    pageTask.setMapHeight();

  
  });
var pageTask={
    setMapHeight:function(){
        var body = document.body,
        html = document.documentElement;
    
      var height = Math.max( body.scrollHeight, body.offsetHeight, 
                           html.clientHeight, html.scrollHeight, html.offsetHeight );
      height= html.clientHeight;                       
                     //      console.log('Height:'+height);
            var navBarHeight=$('#navbar_top').outerHeight();
            var footerHeight=$('#footer').outerHeight();
            var mousePosition=$('#mousePosition').outerHeight();
            var mapHeight= height-navBarHeight -footerHeight-mousePosition;
            $('#map').outerHeight(mapHeight-4);
            if(app.mapContainer &&   app.mapContainer.map){
                app.mapContainer.map.updateSize(); 
                setTimeout(function(){
                    app.mapContainer.map.updateSize();
                },3000);  
            }
            $('.tab-fixed-height').outerHeight(mapHeight+mousePosition-41);
    },
    init:function(){
        var self=this;
        app.mapContainer= new MapContainer(app,{targetEl:'map'});
        app.mapContainer.create();
        //app.mapContainer.loadFromJson(atob(app.pageData.mapData)); 
        app.mapContainer.loadFromJson(Base64.decode( app.pageData.mapData)); 
        this.hideTab('tabRoute');
        if(app.mapContainer.mapSettings.preview){
          this.activateTab ('tabLayers');
        }
        
        //convert collpsible panels to accordion
        $('#tabLayers_accordion').find( '[data-toggle="collapse"]').click(function() {
            $('#tabLayers_accordion').find('.collapse.in').collapse('hide');
        });
        //   BootstrapDialog.confirm({
        //     title: 'WARNING',
        //     message:$('#exTab1'),// 'Warning! Drop your banana?',
        //    // type: BootstrapDialog.TYPE_WARNING, // <-- Default value is BootstrapDialog.TYPE_PRIMARY
        //     closable: true, // <-- Default value is false
        //     draggable: true, // <-- Default value is false
        //     btnCancelLabel: 'Do not drop it!', // <-- Default value is 'Cancel',
        //     btnOKLabel: 'Drop it!', // <-- Default value is 'OK',
        //     btnOKClass: 'btn-warning', // <-- If you didn't specify it, dialog type will be used,
        //     callback: function(result) {
        //         // result will be true if button was click, while it will be false if users close the dialog directly.
        //         if(result) {
        //             alert('Yup.');
        //         }else {
        //             alert('Nope.');
        //         }
        //     }
        // });
        $('#cmdAddNewWMS').click(function(){
            app.mapContainer.addNewWMS();
            
         });
         $('#cmdAddNewWFS').click(function(){
            app.mapContainer.addNewWFS();
            
         });
         $('#cmdAddNewOSMXML').click(function(){
            app.mapContainer.addNewOSMXML();
            
         });
         
         $('#cmdAddGeoJSON').click(function(){
            app.mapContainer.addGeoJSON();
            
         });
         $('#cmdWCS').click(function(){
            app.mapContainer.downloadDataFromWCS();
            
         });
         
        this.create_Layer_AutoSearch();
        this.create_BaseLayer_AutoSearch();
        var frmMap = $('#frmMap');
      
        frmMap.find('#name').keypress(function(event) {
            if(event.which == 13) { // 13 is the 'Enter' key
                 event.preventDefault();
           }
        });
        frmMap.find('#name').change(function(event) {
            app.mapContainer.mapSettings.name=$(this).val();
        });
        frmMap.find('#description').change(function(event) {
            app.mapContainer.mapSettings.description=$(this).val();
        });
        $('#cmdSaveMap').click(function(){
            self.saveMap(frmMap,false);
            
         });
         $('#cmdSaveMapAs').click(function(){
            self.saveMap(frmMap,true);
            
         });
        //  frmMap.submit(function (e) {

        //     e.preventDefault();
        //     var $form = $(this);
        //     if(! $form.valid()) return false;
        //  });
        // frmMap.submit(function (e) {

        //         e.preventDefault();
        //         var $form = $(this);
        //         if(! $form.valid()) return false;

        //         waitingDialog.show('Saving map', { progressType: ''});


        //         var currentExtent=app.mapContainer.getCurrentGeoExtent();
                
        //         $form.find('#ext_north').val(currentExtent.maxy);
        //         $form.find('#ext_east').val(currentExtent.maxx);
        //         $form.find('#ext_south').val(currentExtent.miny);
        //         $form.find('#ext_west').val(currentExtent.minx);
        //         $form.find('#details').val(app.mapContainer.getMapDetailsJsonStr());

        //         $.ajax({
        //             type: $form.attr('method'),
        //             url: $form.attr('action'),
        //             data: $form.serialize(),
        //             success: function (data) {
        //                 var mapId=data.id;
        //                 if(!data.status){
        //                     waitingDialog.hide();
        //                     $.notify({
        //                         message:  data.message ||"Failed to save map."
        //                     },{
        //                         type:'danger',
        //                         delay:2000,
        //                         animate: {
        //                             enter: 'animated fadeInDown',
        //                             exit: 'animated fadeOutUp'
        //                         }
        //                     });
        //                     return;
        //                 }
        //                 //waitingDialog.hide();
        //                 //console.log('Submission was successful.');
        //             // console.log(data);
        //                 //app.mapContainer.exportPngBase64Str(function(pngBase64){
        //                 //    var a=1;
        //             // });

        //             var clean_uri = location.protocol + '//' + location.host + location.pathname;
        //             var savedMapPathName='/map/'+ data.id;
        //             if(savedMapPathName !=location.pathname){ 
        //                     var new_uri = location.protocol + '//' + location.host + savedMapPathName;
        //                     window.history.replaceState({}, document.title, new_uri);
        //             }
        //             frmMap.attr('action', savedMapPathName);
                    

        //             waitingDialog.show('Updating map\'s thumbnail', { progressType: 'info'});
        //             if(data.status){
        //                 $.notify({
        //                     message: "Map saved successfully"
        //                 },{
        //                     type:'success',
        //                     delay:2000,
        //                     animate: {
        //                         enter: 'animated fadeInDown',
        //                         exit: 'animated fadeOutUp'
        //                     }
        //                 });
        //             }
        //             app.mapContainer.exportPngBlob(function(blob){
        //                     //https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript
        //                     if(!blob){
        //                         waitingDialog.hide();
        //                         return;
        //                     }
        //                     var formdata = new FormData();
        //                     formdata.append("file", blob);
        //                     $.ajax({
        //                     url: '/map/' + mapId +'/thumbnail',
        //                     type: "POST",
        //                     data: formdata,
        //                     processData: false,
        //                     contentType: false,
        //                     }).done(function(respond){
        //                             waitingDialog.hide();
                                    
        //                             if(respond.status)  { 
        //                                 $.notify({
        //                                     message: "Map's thumbnail saved successfully"
        //                                 },{
        //                                     type:'info',
        //                                     delay:2000,
        //                                     animate: {
        //                                         enter: 'animated fadeInDown',
        //                                         exit: 'animated fadeOutUp'
        //                                     }
        //                                 });
        //                               }else{
        //                                   $.notify({
        //                                     message:  respond.message ||"Failed to save thumbnail."
        //                                 },{
        //                                     type:'danger',
        //                                     delay:2000,
        //                                     animate: {
        //                                         enter: 'animated fadeInDown',
        //                                         exit: 'animated fadeOutUp'
        //                                     }
        //                                 });
        //                               }
        //                     }).fail(function( jqXHR, textStatus, errorThrown) {
        //                         waitingDialog.hide();
        //                         $.notify({
        //                             message: "Failed to save thumbnail"
        //                         },{
        //                             type:'danger',
        //                             delay:2000,
        //                             animate: {
        //                                 enter: 'animated fadeInDown',
        //                                 exit: 'animated fadeOutUp'
        //                             }
        //                         });
        //                     });
                        
        //                 });
        //             },
        //             error: function ( jqXHR,  textStatus,  errorThrown) {
        //                 waitingDialog.hide();
        //                 console.log('An error occurred.');
        //                 $.notify({
        //                     message: "Failed to save Map"
        //                 },{
        //                     type:'danger',
        //                     delay:2000,
        //                     animate: {
        //                         enter: 'animated fadeInDown',
        //                         exit: 'animated fadeOutUp'
        //                     }
        //                 });
        //             },
        //         });
        //     });

    },
    saveMap:function(frmMap,isNew){
        var $form = $(frmMap);
        if(! $form.valid()) return false;

        waitingDialog.show('Saving map', { progressType: ''});


        var currentExtent=app.mapContainer.getCurrentGeoExtent();
        
        $form.find('#ext_north').val(currentExtent.maxy);
        $form.find('#ext_east').val(currentExtent.maxx);
        $form.find('#ext_south').val(currentExtent.miny);
        $form.find('#ext_west').val(currentExtent.minx);
        $form.find('#details').val(app.mapContainer.getMapDetailsJsonStr());
        var url=$form.attr('action');
        if(isNew){
            url='/map/-1';
        }
        $.ajax({
            type: $form.attr('method'),
            url: url,
            data: $form.serialize(),
            success: function (data) {
                var mapId=data.id;
                if(!data.status){
                    waitingDialog.hide();
                    $.notify({
                        message:  data.message ||"Failed to save map."
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    return;
                }
                //waitingDialog.hide();
                //console.log('Submission was successful.');
            // console.log(data);
                //app.mapContainer.exportPngBase64Str(function(pngBase64){
                //    var a=1;
            // });

            var clean_uri = location.protocol + '//' + location.host + location.pathname;
            var savedMapPathName='/map/'+ data.id;
            if(savedMapPathName !=location.pathname){ 
                    var new_uri = location.protocol + '//' + location.host + savedMapPathName;
                    window.history.replaceState({}, document.title, new_uri);
            }
            frmMap.attr('action', savedMapPathName);
            
            waitingDialog.hide();
            console.log('Updating map\'s thumbnail...');
            // waitingDialog.show('Updating map\'s thumbnail', { progressType: 'info'});
            // if(data.status){
            //     $.notify({
            //         message: "Map saved successfully"
            //     },{
            //         type:'success',
            //         delay:2000,
            //         animate: {
            //             enter: 'animated fadeInDown',
            //             exit: 'animated fadeOutUp'
            //         }
            //     });
            // }
            app.mapContainer.exportPngBlob(function(blob){
                    //https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript
                    if(!blob){
                        waitingDialog.hide();
                        return;
                    }
                    var formdata = new FormData();
                    formdata.append("file", blob);
                    $.ajax({
                    url: '/map/' + mapId +'/thumbnail',
                    type: "POST",
                    data: formdata,
                    processData: false,
                    contentType: false,
                    }).done(function(respond){
                           // waitingDialog.hide();
                            
                            if(respond.status)  { 
                                console.log('Map\'s thumbnail saved successfully');
                                // $.notify({
                                //     message: "Map's thumbnail saved successfully"
                                // },{
                                //     type:'info',
                                //     delay:2000,
                                //     animate: {
                                //         enter: 'animated fadeInDown',
                                //         exit: 'animated fadeOutUp'
                                //     }
                                // });
                              }else{
                                console.log(respond.message ||"Failed to save thumbnail.");

                                //   $.notify({
                                //     message:  respond.message ||"Failed to save thumbnail."
                                // },{
                                //     type:'danger',
                                //     delay:2000,
                                //     animate: {
                                //         enter: 'animated fadeInDown',
                                //         exit: 'animated fadeOutUp'
                                //     }
                                // });
                              }
                    }).fail(function( jqXHR, textStatus, errorThrown) {
                        console.log("Failed to save thumbnail");
                        // waitingDialog.hide();
                        // $.notify({
                        //     message: "Failed to save thumbnail"
                        // },{
                        //     type:'danger',
                        //     delay:2000,
                        //     animate: {
                        //         enter: 'animated fadeInDown',
                        //         exit: 'animated fadeOutUp'
                        //     }
                        // });
                    });
                
                },256);
            },
            error: function ( jqXHR,  textStatus,  errorThrown) {
                waitingDialog.hide();
                console.log('An error occurred.');
                $.notify({
                    message: "Failed to save Map"
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
    },
    activateTab: function(tabId){
        //$('.nav-tabs a[href="#' + tabId + '"]').tab('show');
        var tab=$('.nav-tabs a[href="#' + this.tabId + '"]');//'show');
        tab.parent('li').show();
        tab.tab('show');
   },
   hideTab:function(tab){
    var tab=$('.nav-tabs a[href="#' + tab + '"]');
    tab.parent('li').hide();
  }

};
pageTask.create_Layer_AutoSearch=function(){
    var _autoSearchUrl = "/datalayers/?format=json";
    var _lastSelectedItem;
    var cache =undefined;// {};
    var self=this;
    $('#autoSearchLayers').autocomplete({
        minLength: 0,
        source: function (request, response) {
            var term = request.term;
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
            var text = $( this ).text();
            //if (term in cache) {
           if (cache && self.downloding) {
                   //var data = cache[term];
                var data = cache;
                var mappedData=$.map(data, function (item) {
                    var description='';
                    if(item.description){
                      description= item.description;
                    }
                    if ( item.name && ( !request.term || matcher.test(item.name) || (description && matcher.test(description)) ) ){
                        return {
                            label: item.name,
                            value: item.name,
                            data:item
                        };
                  }
                })
                response(mappedData);
                return;
            }
            if(!self.downloding){
                self.downloding=true;
                $.getJSON(_autoSearchUrl, request, function (dataObj, status, xhr) {
                    // cache[term] = data;
                    var data=[];
                    if(dataObj && dataObj.items){
                      data= dataObj.items;
                    }
                    cache = data.sort(function(a,b){
                        if(a.OwnerUser.userName==b.OwnerUser.userName){
                            return a.updatedAt > b.updatedAt;  
                        }else if(a.OwnerUser.userName==app.identity.name){
                            return -1;  
                        }else if(b.OwnerUser.userName==app.identity.name){
                            return 1;  
                        }else
                        {
                            return (a.updatedAt + '-'+a.OwnerUser.userName) > (b.updatedAt + '-'+b.OwnerUser.userName);
                        }
                    });
                    // var mappedData=$.map(data, function (item) {
                    //     return {
                    //         label: item.name,
                    //         value: item.name,
                    //         data:item
                    //     };
                    // })
                    var mappedData=$.map(data, function (item) {
                        var description='';
                        if(item.description){
                          description= item.description;
                        }
                        if ( item.name && ( !request.term || matcher.test(item.name) || (description && matcher.test(description)) ) ){
                            return {
                                label: item.name,
                                value: item.name,
                                data:item
                            };
                          }
                    });
                
                    response(mappedData);
                    self.downloding=false;
                    $('#autoSearchLayers').removeClass('ui-autocomplete-loading');
                }). fail(function( jqXHR, textStatus, errorThrown) {
                    console.log( "error" );
                    $.notify({
                        message: "Failed to retrieve layer list"
                    },{
                        type:'danger',
                        delay:2000,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        }
                    });
                    self.downloding=false;
                    $('#autoSearchLayers').removeClass('ui-autocomplete-loading');
                });
            }
        },
        select: function (event, ui) {
            _lastSelectedItem = ui.item;
            $(this).val(ui.item.label);
            showResults(ui.item);
            // me.doSearch($(me._container).find('.L-mySearch-searchinput').val());
            
            return false;
        },
        focus: function (event, ui) {
            //commentes 2016/05/03
          //  $(this).val(ui.item.label);
            return false;
        },
        open: function() {
            $("ul.ui-menu").width($(this).innerWidth());
        }
    })
     .focus(function (event, ui) {

         //$(this).trigger('keydown.autocomplete');
         $(this).autocomplete("search");
        // showResults(ui.item);
     })
       
     .data("ui-autocomplete")._renderItem = function (ul, item) {
        if (item.data &&item.data.updatedAt && !item.data.updatedAt_obj) {
            try {
               
                item.data.updatedAt_obj = new Date(item.data.updatedAt);
            } catch (ex) {
            }
        }
         var label = item.label;
         var description = item.data.description || '';
         description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');
         var term = this.term;
       

         if (term) {
            label = String(label).replace( new RegExp(term, "gi"),
                 "<strong class='ui-state-highlight'>$&</strong>");
            description = String(description).replace( new RegExp(term, "gi"),
                "<strong class='ui-state-highlight'>$&</strong>");
         }
         var class_ = item.data.dataType ? 'autocomplete-custom-item icon-' + item.data.dataType : '';
         var htm = '';
         htm += '<div class="' + class_ + '" >';
         if (item.data.thumbnail) {
            htm += '<img class="avatar48" src="/datalayer/' + item.data.id + '/thumbnail" />';
         } else {
          //  htm += '<i class="avatar48 fa fa-map"> </i>';
         }
         htm += '<strong>'+label+'</strong>' ;
         htm += (item.data.description ? '<pre class="nostyle" style="display:inline;"><br/><small style="white-space: pre;">' + description + '</small></pre>' : '');
         //htm += '<div class="list-inline">';
        // if (item.data.OwnerUser.userName !== app.identity.name) {
        //    htm += '    <li><i class="fa fa-user"></i> <span>' + item.data.OwnerUser.userName + '</span></li>';
       //  }
       //  htm += '<li><i class="fa fa-calendar"></i><span>' + item.data.updatedAt.toUTCString() + '</span></li></div>';
       //  htm += '</div>';
         return $("<li></li>").append(htm).appendTo(ul);
        
     };

     function showResults(item){
         if(!item){
            $('#autoSearchLayers_results').html('');
            return;
         }
         var label = item.label;
         var description = item.data.description || '';
         description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');

         var class_ = item.data.dataType ? 'autocomplete-custom-item icon-' + item.data.dataType : '';
         var htm = '';
         htm += '<div class="' + class_ + '" >';
         if (item.data.thumbnail) {
            htm += '<img class="avatar48" src="/datalayer/' + item.data.id + '/thumbnail" />';
         } else {
            htm += '<i class="avatar48 fa fa-map"> </i>';
         }
         htm += '<a target="_blank" href="/datalayer/' + item.data.id +'?dataType=' + item.data.dataType+'">'+ label +'</a>'+ (item.data.description ? '<br/><small style="white-space: pre;">' + description + '</small>' : '');
         htm += '<div class="list-inline">';
         if (item.data.OwnerUser.userName !== app.identity.name) {
            htm += '    <li><i class="fa fa-user"></i> <span>' + item.data.OwnerUser.userName + '</span></li>';
         }
         //htm += '<li><i class="fa fa-calendar"></i><span>' + item.data.updatedAt.toUTCString() + '</span></li>';
        // htm += '<li><i class="fa fa-calendar"></i><span title="Last modified at">' + item.data.updatedAt.toString() + '</span></li>';
         htm +=' <li style="float: right;"><button id="cmdAddLayerToMap" title="Add this layer to map" class="btn-primary  "><span class="glyphicon glyphicon-plus"></span>Add</button></lin>';
         htm += ' </div>';
         htm += '</div>';
         $('#autoSearchLayers_results').html(htm);
         $('#autoSearchLayers_results').find("#cmdAddLayerToMap").click(function(){
            app.mapContainer.addData(item.data);
            $('#autoSearchLayers_results').html('');
            $('#autoSearchLayers').val('');
         });

     }
     $('#autoSearchLayers_clear').click(function(){
    
        var autoSearchEl=$('#autoSearchLayers') ;
        var autoSearchResultsEl=$('#autoSearchLayers_results') ;
        
        $(autoSearchResultsEl).html('');
        $(autoSearchResultsEl).val('');
        $(autoSearchEl).val('');
      });
}

  
pageTask.create_BaseLayer_AutoSearch=function(){
       
        var _lastSelectedItem;
        var cache = [
            // {
            //     name:'Google satellite',
            //     dataType:'baseLayer',
            //     type:'XYZ',
            //     params:{
            //           url:'http://mt{0-3}.google.com/vt/lyrs=s&hl=en&gl=en&x={x}&y={y}&z={z}&s=png'
            //     },
            //     baseLayer:true,
            //     description:'Google satellite Map',
            //     thumbnail:'https://www.google.com/images/branding/product/2x/maps_96in128dp.png',
            // details:{
            //     ext_west:-180,
            //     ext_east:180,
            //     ext_north:86,
            //     ext_south:-86
            // }
            // },
            // {
            //     name:'Google Map',
            //     dataType:'baseLayer',
            //     type:'XYZ',
            //     params:{
            //           url:'http://mt{0-3}.google.com/vt/lyrs=h&hl=en&gl=en&x={x}&y={y}&z={z}&s=png'
            //     },
            //     baseLayer:true,
            //     description:'Google Map',
            //     thumbnail:'https://www.google.com/images/branding/product/2x/maps_96in128dp.png',
                // details:{
            //     ext_west:-180,
            //     ext_east:180,
            //     ext_north:86,
            //     ext_south:-86
            // }
            // },
            // {
            //     name:'Google Hybrid',
            //     dataType:'baseLayer',
            //     type:'XYZ',
            //     params:{
            //           url:'http://mt{0-3}.google.com/vt/lyrs=s,h&hl=en&gl=en&x={x}&y={y}&z={z}&s=png'
            //     },
            //     baseLayer:true,
            //     description:'Google Hybrid Map',
            //     thumbnail:'https://www.google.com/images/branding/product/2x/maps_96in128dp.png',
                // details:{
            //     ext_west:-180,
            //     ext_east:180,
            //     ext_north:86,
            //     ext_south:-86
            // }
            // },
            {
                name:'OSM',
                dataType:'baseLayer',
                type:'OSM',
                baseLayer:true,
                description:'Open Street Map',
                thumbnail:'data:image/jpeg;base64,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',
                details:{
                    ext_west:-180,
                    ext_east:180,
                    ext_north:86,
                    ext_south:-86
                }
            },
            {
                name:'OpenTopoMap',
                dataType:'baseLayer',
                type:'XYZ',
                params:{
                      url:'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
                },
                baseLayer:true,
                description:'Topographic maps from OpenStreetMap',
                thumbnail:'data:image/png;base64,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',
                details:{
                    ext_west:-180,
                    ext_east:180,
                    ext_north:86,
                    ext_south:-86
                }
            },
            {
                name:'Aerial',
                dataType:'baseLayer',
                type:'BingMaps',
                baseLayer:true,
                imagerySet:'Aerial',
                key:app.BING_MAPS_KEY,
                
                description:'Bing Aerial Imagery',
                thumbnail:'data:image/jpeg;base64,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',
                details:{
                    ext_west:-180,
                    ext_east:180,
                    ext_north:86,
                    ext_south:-86
                }
            },
            {
                name:'Aerial with lables',
                dataType:'baseLayer',
                baseLayer:true,
                type:'BingMaps',
                imagerySet:'AerialWithLabels',
                key:app.BING_MAPS_KEY,
               
                description:'Bing Aerial Imagery with Lables',
                thumbnail:'data:image/jpeg;base64,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',
                details:{
                    ext_west:-180,
                    ext_east:180,
                    ext_north:86,
                    ext_south:-86
                }
            },
            {
                name:'Road',
                dataType:'baseLayer',
                baseLayer:true,
                type:'BingMaps',
                imagerySet:'RoadOnDemand',
                key:app.BING_MAPS_KEY,
                
                description:'Bing Road Map',
                thumbnail:'data:image/jpeg;base64,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',
                details:{
                    ext_west:-180,
                    ext_east:180,
                    ext_north:86,
                    ext_south:-86
                }
            }
        ];
        $('#autoSearchBaseLayers').autocomplete({
            minLength: 0,
            source: function (request, response) {
                var term = request.term;
                var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
                var text = $( this ).text();
                //if (term in cache) {
               if (cache) {
                       //var data = cache[term];
                    var data = cache;
                    var mappedData=$.map(data, function (item) {
                        var description='';
                        if(item.description){
                          description= item.description;
                        }
                        if ( item.name && ( !request.term || matcher.test(item.name) || (description && matcher.test(description)) ) ){
                            return {
                                label: item.name,
                                value: item.name,
                                data:item
                            };
                      }
                    })
                    response(mappedData);
                    return;
                }
                
            },
            select: function (event, ui) {
                _lastSelectedItem = ui.item;
                $(this).val(ui.item.label);
                showResults(ui.item);
                // me.doSearch($(me._container).find('.L-mySearch-searchinput').val());
                
                return false;
            },
            focus: function (event, ui) {
                //commentes 2016/05/03
              //  $(this).val(ui.item.label);
                return false;
            },
            open: function() {
                $("ul.ui-menu").width($(this).innerWidth());
            }
        })
         .focus(function (event, ui) {

             //$(this).trigger('keydown.autocomplete');
             $(this).autocomplete("search");
            // showResults(ui.item);
         })
           
         .data("ui-autocomplete")._renderItem = function (ul, item) {
             var label = item.label;
             var description = item.data.description || '';
             description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');
             var term = this.term;
           

             if (term) {
                label = String(label).replace( new RegExp(term, "gi"),
                     "<strong class='ui-state-highlight'>$&</strong>");
                description = String(description).replace( new RegExp(term, "gi"),
                    "<strong class='ui-state-highlight'>$&</strong>");
             }
             var class_ = item.data.type ? 'autocomplete-custom-item icon-' + item.data.type : '';
             var htm = '';
             htm += '<div class="' + class_ + '" >';
             if (item.data.thumbnail) {
                htm += '<img class="avatar48" src="' + item.data.thumbnail+ '" />';
             } else {
                htm += '<i class="avatar48 fa fa-map"> </i>';
             }
             htm += label + (item.data.description ? '<pre class="nostyle" style="display:inline;"><br/><small style="white-space: pre;">' + description + '</small></pre>' : '');
           //  htm += '<div class="list-inline">';
             
          //   htm += '</div>';
             return $("<li></li>").append(htm).appendTo(ul);
            
         };

         function showResults(item){
             if(!item){
                $('#autoSearchBaseLayers_results').html('');
                return;
             }
             var label = item.label;
             var description = item.data.description || '';
             description = description.replace(/(?:\r\n|\r|\n)/g, '<br />');

             var class_ = item.data.type ? 'autocomplete-custom-item icon-' + item.data.type : '';
             var htm = '';
             htm += '<div class="' + class_ + '" >';
             if (item.data.thumbnail) {
                htm += '<img class="avatar48" src="' + item.data.thumbnail+ '" />';
             } else {
                htm += '<i class="avatar48 fa fa-map"> </i>';
             }
             htm += label + (item.data.description ? '<br/><small style="white-space: pre;">' + description + '</small>' : '');
             htm += '<div style="min-height: 3em;" class="list-inline">';
             htm +=' <li style="float: right;"><button id="cmdAddBaseLayerToMap" title="Add this layer to map" class="btn-primary  "><span class="glyphicon glyphicon-plus"></span>Add</button></lin>';
             htm += ' </div>';
             htm += '</div>';
             $('#autoSearchBaseLayers_results').html(htm);
             $('#autoSearchBaseLayers_results').find("#cmdAddBaseLayerToMap").click(function(){
               
                app.mapContainer.addData(item.data);
                $('#autoSearchBaseLayers_results').html('');
                $('#autoSearchBaseLayers').val('');
             });
         }
         $('#autoSearchBaseLayers_clear').click(function(){
    
            var autoSearchEl=$('#autoSearchBaseLayers') ;
            var autoSearchResultsEl=$('#autoSearchBaseLayers_results') ;
            
            $(autoSearchResultsEl).html('');
            $(autoSearchResultsEl).val('');
            $(autoSearchEl).val('');
          });
}
