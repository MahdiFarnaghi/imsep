/*! imsep 2021-01-09 */

$(function(){pageTask.init()});var pageTask={init:function(){var e=this;this.filterExpression="",this.applyMapExtent=!1,this.mapExtent={minx:-180,miny:-90,maxx:180,maxy:90};var t=$("#items").val();this.items=[],this.data={},this.pagination={};try{this.data=JSON.parse(t),this.items=this.data.items,this.pagination=this.data.pagination}catch(t){}$("#tblItems_search").on("keyup",function(t){if(13==t.which){var a=$(this).val().toLowerCase();e.filterExpression=a,e.applyFilters()}}),$("#text_search_btn").on("click",function(){var t=$("#tblItems_search").val().toLowerCase();e.filterExpression=t,e.applyFilters()}),$("#applyMapExtent").prop("checked",!!e.applyMapExtent),$("#applyMapExtent").change(function(){e.applyMapExtent=$(this).prop("checked"),e.applyMapExtent?$(".extent-map-panel").addClass("has-active-filter"):$(".extent-map-panel").removeClass("has-active-filter"),e.applyFilters()}),$("#pnlExtentMap").addClass("collapse"),$("#pnlExtentMapCmd").addClass("collapsed"),this.fillUI();var a=e.getFiltersUrl();e.last_url=a,history.pushState({url:a},document.title,a),window.addEventListener("popstate",function(t){t.state&&t.state.url&&e.getFromUrl(t.state.url,!0)})},showWaiting:function(){$("#tblItems").html('<div class="col-xs-18 col-sm-12 col-md-12 "> <div class="thumbnail waitbar_h" style="height:30px"  ></div> </div>')},deleteItem:function(a){var e=this,i=$('#tblItems .item-container[data-id="'+a+'"]');i.addClass("selected");(new ConfirmDialog).show("Are you sure you want to delete selected data layer?",function(t){i.removeClass("selected"),t&&e.deleteItemForReal(a)},{dialogSize:"m",alertType:"danger"})},deleteItemForReal:function(t){var a=this,e="/datalayer/"+t+"/delete?_method=DELETE";$.ajax(e,{type:"POST"}).done(function(t){a.last_url&&a.getFromUrl(a.last_url)})},fillItems:function(t){var a=this,e=$("#tblItems"),i="";i+=this.get_pagination(this.pagination);for(var s=0;s<t.length;s++){var l=t[s];if(i+='<div class="col-xs-18 col-sm-12 col-md-12 listItem"',i+='              data-subtype="'+l.subtype+'"',i+='              data-datatype="'+l.fileType+'"',i+='              data-keywords="'+l.keywords+'"',i+='              data-ext_north="'+l.ext_north+'"',i+='              data-ext_east="'+l.ext_east+'"',i+='              data-ext_west="'+l.ext_west+'"',i+='              data-ext_south="'+l.ext_south+'"',i+=">",i+=' <div class="item-container" data-id="'+l.id+'" >',i+='   <div class="thumbnail">',i+='     <div class="caption">',i+='       <a href="/map/preview?layers='+l.id+'" >',l.thumbnail?i+='       <img class="avatar" src="'+l.thumbnail+'" />':i+='       <i class="avatar fa fa-map-o"> </i>',i+="         <h4>","MultiPolygon"==l.subType&&(i+='         <i class="layerSubtype">▭</i>'),"MultiLineString"==l.subType&&(i+='         <i class="layerSubtype">▬</i>'),"Point"==l.subType&&(i+='       <i class="layerSubtype">◈</i>'),"raster"==l.dataType&&(i+='       <i class="layerSubtype">▦</i>'),i+="       "+l.name,i+="         </h4>",i+="       </a>",i+='     <p class="item-description" >'+(l.description||"").replace(/(?:\r\n|\r|\n)/g,"<br />")+"</p>",i+='     <ul class="list-inline">',l.updatedAt){var r=l.updatedAt+"",n=new Date(r),o=n.toString();o=n.toLocaleString(),i+="       <li>",i+='         <i class="fa fa-calendar fa-calendar-o"></i><span class="convertTolocalDateTime__" title="Definition modified at '+(" ("+n.toLocaleString("en",{timeZone:"UTC"})+" GMT)")+'" >'+o+"</span>",i+="       </li>"}i+="       <li>",i+='           <i class="fa fa-user" title="Owner" ></i>',app.identity.id==l.OwnerUser.id?i+='           <b> <span title="Owner" >'+l.OwnerUser.userName+"</span></b>":i+='           <span title="Owner">'+l.OwnerUser.userName+"</span>",i+="       </li>",(app.identity.isAdministrator||app.identity.id==l.OwnerUser.id||(app.identity.isPowerUser||app.identity.isDataManager||app.identity.isDataAnalyst)&&l._userHasPermission_EditSchema)&&(i+="       <li>",i+='          <a href="/datalayer/'+l.id+"?dataType="+l.dataType+'"><i class="glyphicon glyphicon-edit"></i></a>',i+="       </li>"),i+="       <li>",(app.identity.isAdministrator||app.identity.id==l.OwnerUser.id||l.OwnerUser.parent==app.identity.id)&&(i+='         <button title="Delete" type="button" style="color:red" class="delete-item btn-link  glyphicon glyphicon-remove" data-id="'+l.id+'" > </button>'),i+="       </li>",i+="      </ul>",i+="     </div>",i+="   </div>",i+=" </div>",i+="</div>"}e.html(i),e.find(".page-link").click(function(){if(!$(this).parent().hasClass("disabled")){var t=$(this).data("url");t&&a.getFromUrl(t)}}),e.find(".delete-item").click(function(){var t=$(this).data("id");t&&a.deleteItem(t)})},fillUI:function(){if(this.fillingUI=!0,this.fillStatistics(this.data.statistics,this.data.pagination),$("#tblItems_search").val(this.pagination.filterExpression),this.pagination.extent){var t=this.pagination.extent.split(",");this.mapExtent={minx:t[0],miny:t[1],maxx:t[2],maxy:t[3]},this.applyMapExtent=!0}this.fillItems(this.items),this.fillOrderByList(this.data.pagination),this.fillingUI=!1,$(".panel-group").has(".list-group-item").removeClass("has-active-filter"),$(".panel-group").has(".list-group-item.active").addClass("has-active-filter")},get_pagination:function(t){var a=this,e="";if(!t)return e;if(!t.limit)return e;if(!t.totalItems)return'<div class="panel-heading"><legend>No item found</legend></div>';t.start||(t.start=1);var i=Math.ceil(t.totalItems/t.limit),s=Math.floor((t.start-1)/t.limit)+1;i<s&&(s=i);var l=t.limit,r=i,n=s-1,o=s+1;n<1&&(n=1),r<o&&(o=r);return e+='<div class="col-xs-18 col-sm-12 col-md-12"> <ul style="margin-top: 0;margin-bottom: 0;" class="pagination  pagination-sm">',e+='   <li class="page-item first-item '+(1==s?"disabled":"")+'">',e+='     <span class="page-link" href="#" data-url="'+a.getFiltersUrl({start:0*l+1})+'"><<</span>',e+="   </li>",e+='   <li class="page-item previous-item '+(n==s?"disabled":"")+'">',e+='     <span  class="page-link" href="#" data-url="'+a.getFiltersUrl({start:(n-1)*l+1})+'"><</span>',e+="   </li>",e+='   <li class="page-item next-item ">',e+='     <span  class="page-link" href="#" data-url=""'+a.getFiltersUrl({start:(s-1)*l+1})+'">Page '+s+"/"+i+" of "+t.totalItems+" itmes </span>",e+="   </li>",e+='   <li class="page-item next-item '+(o==s?"disabled":"")+'">',e+='     <span  class="page-link" href="#" data-url="'+a.getFiltersUrl({start:(o-1)*l+1})+'">></span>',e+="   </li>",e+='   <li class="page-item last-item '+(r==s?"disabled":"")+'">',e+='     <span  class="page-link" href="#" data-url="'+a.getFiltersUrl({start:(r-1)*l+1})+'">>></span>',e+="   </li>",e+="</ul></div>"},fillStatistics:function(t,a){this.fillStatistics_authors(t,a),this.fillStatistics_datasettypes(t,a),this.fillStatistics_keywords(t,a)},fillStatistics_authors:function(t,a){var e=this,i="";if(t&&t.authors){for(var s=t.authors,l=0;l<s.length;l++){var r=s[l];i+="<li>",i+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+r.name+'" >'+r.name+'<span class="badge pull-right">'+r.total+"</span></span>",i+="</li>"}if($("#authors").html(i),$("#authors .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()}),a&&a.authors)for(l=0;l<a.authors.length;l++){$("#authors .list-group-item[data-filter='"+a.authors[l]+"']");$('#authors .list-group-item[data-filter="'+a.authors[l]+'"]').addClass("active")}}},fillStatistics_datasettypes:function(t,a){var e=this,i="";if(t&&t.datasetTypes){for(var s=t.datasetTypes,l=0;l<s.length;l++){var r=s[l];i+="<li>",i+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+r.name+'" >'+r.name+'<span class="badge pull-right">'+r.total+"</span></span>",i+="</li>"}if($("#datasetTypes").html(i),$("#datasetTypes .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()}),a&&a.datasetTypes)for(l=0;l<a.datasetTypes.length;l++)$('#datasetTypes .list-group-item[data-filter="'+a.datasetTypes[l]+'"]').addClass("active")}},fillStatistics_keywords:function(t,a){var e=this,i="";if(t&&t.keywords){for(var s=t.keywords,l=0;l<s.length;l++){var r=s[l];i+="<li>",i+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+r.name+'" >'+r.name+'<span class="badge pull-right">'+r.total+"</span></span>",i+="</li>"}if($("#keywords").html(i),$("#keywords .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()}),a&&a.keywords)for(l=0;l<a.keywords.length;l++)$('#keywords .list-group-item[data-filter="'+a.keywords[l]+'"]').addClass("active")}},fillOrderByList:function(t){var e=this;if("<li>",'     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="name" > Name</span>','     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="updatedAt" > Date</span>',"</li>",$("#orderbys").html('<li>     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="name" > Name</span>     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="updatedAt" > Date</span></li>'),$("#orderbys .list-group-item").click(function(){var t=$(this).hasClass("active");$("#orderbys .list-group-item").removeClass("active"),$(this).addClass("active");var a=$(this).data("filter");a&&t&&(0==a.indexOf("-")?(a=a.substring(1),$(this).removeClass("glyphicon-sort-by-attributes-alt"),$(this).addClass("glyphicon-sort-by-attributes")):(a="-"+a,$(this).removeClass("glyphicon-sort-by-attributes"),$(this).addClass("glyphicon-sort-by-attributes-alt")),$(this).data("filter",a)),e.applyFilters()}),t&&t.orderby){var a=t.orderby,i=a,s=!1;0==a.indexOf("-")&&(i=a.substring(1),s=!0);var l=$('#orderbys .list-group-item[data-filter="'+i+'"]');l.addClass("active"),s&&(l.removeClass("glyphicon-sort-by-attributes"),l.addClass("glyphicon-sort-by-attributes-alt")),l.data("filter",a)}},createExtMap:function(){var s=this;(this.map=new ol.Map({target:"extMap",layers:[new ol.layer.Tile({title:"OSM",source:new ol.source.OSM})],controls:ol.control.defaults({attribution:!1}),view:new ol.View({center:ol.proj.fromLonLat([app.initMap_Lon||0,app.initMap_Lat||0]),zoom:app.initMap_Zoom||4,extent:ol.extent.applyTransform([-180,-90,180,90],ol.proj.getTransform("EPSG:4326","EPSG:3857"))})})).on("moveend",function(t){var a=t.map,e=a.getView().getProjection().getCode(),i=a.getView().calculateExtent(a.getSize());i=ol.extent.applyTransform(i,ol.proj.getTransform(e,"EPSG:4326")),s.mapExtent={minx:i[0],miny:i[1],maxx:i[2],maxy:i[3]},s.applyMapExtent&&s.applyFilters()})},applyFilters_local:function(){var t=this,a=t.mapExtent,e=t.filterExpression;$("#tblItems .listItem").filter(function(){t.checkFilterExpression(this,e)&&t.checkFilterExtent(this,a)?$(this).toggle(!0):$(this).toggle(!1)})},checkFilterExpression:function(t,a){return!t||(!a||(a=(a+"").toLowerCase(),-1<$(t).text().toLowerCase().indexOf(a)))},checkFilterExtent:function(t,a){if(!this.applyMapExtent)return!0;if(!t)return!0;if(!a)return!0;var e=$(t).data("ext_west"),i=$(t).data("ext_east"),s=$(t).data("ext_south"),l=$(t).data("ext_north");try{return e=parseFloat(e),s=parseFloat(s),i=parseFloat(i),l=parseFloat(l),!(e>a.maxx||i<a.minx||s>a.maxy||l<a.miny)}catch(t){return!0}},applyFilters:function(){if(!this.fillingUI){var t=this.getFiltersUrl();this.getFromUrl(t)}},getFiltersUrl:function(t){t=t||{};var a,e=this.mapExtent,i=this.filterExpression;t.filterExpression&&(i=t.filterExpression),this.applyMapExtent&&e&&(a=e.minx+","+e.miny+","+e.maxx+","+e.maxy),t.extent&&(a=t.extent);var s,l=[],r=1;return t.start?r=t.start:this.pagination&&(r=this.pagination.start),l.push("start="+r),t.limit?s=t.limit:this.pagination&&(s=this.pagination.limit),l.push("limit="+s),a&&l.push("extent="+a),i&&l.push("filterExpression="+encodeURIComponent(i)),$(".list-group-item.active").each(function(){var t=$(this).data("filtertype");if(t){var a=$(this).data("filter");l.push(t+"="+encodeURIComponent(a))}}),"?"+l.join("&")},getFromUrl:function(a,e){var i=this;i.last_url=a,i.showWaiting(),$.ajax({url:"/datalayers"+a+"&format=json",dataType:"json",success:function(t){e||history.pushState({url:a},document.title,a),t&&(i.data=t,i.items=t.items,i.pagination=t.pagination,i.fillUI())},error:function(t,a,e){var i=e||a||"Failed";t&&t.responseJSON&&t.responseJSON.error&&(i=t.responseJSON.error),$.notify({message:i},{type:"danger",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}})}};