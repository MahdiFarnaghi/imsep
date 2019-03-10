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
                    if ( item.name && ( !request.term || matcher.test(item.name) ) ){
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
                $.getJSON(_autoSearchUrl, request, function (data, status, xhr) {
                    // cache[term] = data;
                    
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
                        if ( item.name && ( !request.term || matcher.test(item.name) ) ){
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
                        if ( item.name && ( !request.term || matcher.test(item.name) ) ){
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
}
