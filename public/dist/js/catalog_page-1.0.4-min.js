/*! imsep 2020-09-28 */

$(function(){pageTask.init()});var pageTask={init:function(){var a=this;this.filterExpression="",this.applyMapExtent=!1,this.mapExtent={minx:-180,miny:-90,maxx:180,maxy:90},this.items=[],this.data={},this.pagination={};try{this.items=this.data.items||[],this.pagination=this.data.pagination||{}}catch(t){}$("#cmbCswProvider").change(function(){var t=$(this).val(),e=t;-1<e.indexOf("?")?e+="&Service=CSW&Request=GetCapabilities":e+="?Service=CSW&Request=GetCapabilities",$("#cmdCheckCapabilies").attr("href",e),$("#CheckCapabiliesUrl").val(e),a.showWaiting(),a.getUniqueValues(t,function(){a.applyFilters()},function(){a.applyFilters()})}),$("#CopyCapabiliesUrl").click(function(){var t=document.getElementById("CheckCapabiliesUrl");t.select(),t.setSelectionRange(0,99999),document.execCommand("copy"),$.notify({message:"Copied to clipboard"},{type:"info",delay:1e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}),$("#tblItems_search").on("keyup",function(t){if(13==t.which){$(this).val().toLowerCase();a.applyFilters()}}),$("#text_search_btn").on("click",function(){$("#tblItems_search").val().toLowerCase();a.applyFilters()}),$("#applyMapExtent").prop("checked",!!a.applyMapExtent),$("#applyMapExtent").change(function(){a.applyMapExtent=$(this).prop("checked"),a.applyMapExtent?$(".extent-map-panel").addClass("has-active-filter"):$(".extent-map-panel").removeClass("has-active-filter"),a.applyFilters()}),this.createExtMap(),$("#pnlExtentMap").addClass("collapse"),$("#pnlExtentMapCmd").addClass("collapsed"),this.fillUI(),this.fillOrderByList(this.data.pagination);var t=a.getCswUrl();a.getUniqueValues(t,function(){a.applyFilters()},function(){a.applyFilters()}),a.last_url=t,a.pageUrl="/catalog",history.pushState({url:a.pageUrl},document.title,a.pageUrl),window.addEventListener("popstate",function(t){t.state&&t.state.url&&a.getFromUrl(t.state.url,!0)})},showWaiting:function(){$("#tblItems").html('<div class="col-xs-18 col-sm-12 col-md-12 "> <div class="thumbnail waitbar_h" style="height:30px"  ></div> </div>')},fillItems:function(t){var a=this,e=$("#tblItems"),i="";i+=this.get_pageToolbar(this.pagination);for(var r=0;r<t.length;r++){var s=t[r];if(i+='<div class="col-xs-18 col-sm-12 col-md-12 listItem"',i+='              data-id="'+s.id+'"',i+='              data-type="'+s.type+'"',i+='              data-subject="'+s.subject+'"',i+=">",i+=' <div class="item-container" data-id="'+s.id+'" >',i+='   <div class="thumbnail" data-id="'+s.id+'">',i+='     <div class="caption">',i+='       <a  data-toggle="collapse" style="cursor:pointer;" data-target="#details_'+s.id+'" >',s.thumbnail?i+='       <img class="avatar" src="'+s.thumbnail+'" />':i+='       <i class="avatar fa fa-map-o"> </i>',i+="         <h4>","MultiPolygon"==s.subType?i+='<i class="layerSubtype">▭</i>':"MultiLineString"==s.subType?i+='<i class="layerSubtype">▬</i>':"Point"==s.subType?i+='<i class="layerSubtype">◈</i>':s.format,"raster"==s.format&&(i+='<i class="layerSubtype">▦</i>'),i+=""+s.name,i+="</h4>",i+="       </a>",i+='     <p class="item-description" >'+(s.description||"").replace(/(?:\r\n|\r|\n)/g,"<br />")+"</p>",i+='<div id="details_'+s.id+'" class="item-details collapse">',s.subject&&(i+="<label>Subject and keywords:</label> <span>"+s.subject+"</span><br/>"),s.date&&(i+="<label>Creation Date:</label> <span>"+s.date+"</span><br/>"),s.modified&&(i+="<label>Revision Date:</label> <span>"+s.modified+"</span><br/>"),s.creator&&(i+="<label>Creator:</label> <span>"+s.creator+"</span><br/>"),s.publisher&&(i+="<label>Publisher:</label> <span>"+s.publisher+"</span><br/>"),s.contributor&&(i+="<label>Contributor:</label> <span>"+s.contributor+"</span><br/>"),s.type&&(i+="<label>Resource Type:</label> <span>"+s.type+"</span><br/>"),s.format&&(i+="<label>Format:</label> <span>"+s.format+"</span><br/>"),s.spatial&&(i+="<label>Spatial Reference:</label> <span>"+s.spatial+"</span><br/>"),s.language&&(i+="<label>Language:</label> <span>"+s.language+"</span><br/>"),s.source&&(i+='<label>Source:</label> <span class="item-description"  >'+s.source+"</span><br/>"),s.relation&&(i+='<label>Relation to other resources:</label> <span class="item-description"  >'+s.relation+"</span><br/>"),s.wms||s.wmts||s.wfs){if(i+="<label>Published Service(s):</label><br/>",i+='     <ul class="">',s.wfs){var l={layerType:"WFS",url:s.wfs,title:s.name,shapetype:s.wfs_shapetype||"",typename:s.wfs_typename||"",bbox:s.bbox};i+="<li>WFS",i+=' <div class="form-horizontal">',i+='   <div class="form-group ">',i+='                   <span class="col-sm-12" >Service Url:</span>',i+='                   <div class="col-sm-12">',i+='                      <input type="text" name="" id="" value="'+s.wfs+'"  readonly class="form-control"  />',i+='                       <button  title="Copy Url" class="btn btn-xs btn-info  copy-service-url "><span class="fa fa-copy"></span> Copy</button>',i+='                       <a target="_blank" href="'+s.wfs+'" title="Check Url" class="btn btn-xs btn-link   "><span class="fa fa-check"></span> Check</a>',i+="                   </div> ",i+="   </div>",i+='   <div class="form-group "><div class="col-sm-12">',i+='     <a target="_blank" class="btn btn-xs btn-info" href="/map/preview?options='+encodeURIComponent(JSON.stringify(l))+'" ><span class="glyphicon glyphicon-globe"></span> View service in a map</a>',i+="   </div></div>",i+=" </div>",i+="</li>"}if(s.wms){l={layerType:"WMS",url:s.wms,title:s.name,layers:s.wms_layers||"",bbox:s.bbox};i+="<li>WMS",i+=' <div class="form-horizontal">',i+='   <div class="form-group ">',i+='                   <span class="col-sm-12" >Service Url:</span>',i+='                   <div class="col-sm-12">',i+='                      <input type="text" name="" id="" value="'+s.wms+'"  readonly class="form-control"  />',i+='                       <button  title="Copy Url" class="btn btn-xs btn-info  copy-service-url "><span class="fa fa-copy"></span> Copy</button>',i+='                       <a target="_blank" href="'+s.wms+'" title="Check Url" class="btn btn-xs btn-link   "><span class="fa fa-check"></span> Check</a>',i+="                   </div> ",i+="   </div>",i+='   <div class="form-group "><div class="col-sm-12">',i+='     <a target="_blank" class="btn btn-xs btn-info" href="/map/preview?options='+encodeURIComponent(JSON.stringify(l))+'" ><span class="glyphicon glyphicon-globe"></span> View service in a map</a>',i+="   </div></div>",i+=" </div>",i+="</li>"}s.wmts,0,i+="     </ul>"}if(i+='<a target="_blank" title="View source of metadata" class="btn btn-xs btn-primary" href="'+s.metaDataLink+'" >View Metadata</a>',i+="</div>",i+='     <ul class="list-inline">',s.updatedAt){var o=s.updatedAt+"",n=new Date(o),c=n.toString();if(c=n.toLocaleString(),"fa"==app.language)try{var p=n.toLocaleTimeString("en",{hour12:!1});c=new window.jdate.default(n).format("YYYY/MM/DD")+" "+p}catch(t){}i+="       <li>",i+='         <i class="fa fa-calendar fa-calendar-o"></i><span class="convertTolocalDateTime__" title="Definition modified at '+(" ("+n.toLocaleString("en",{timeZone:"UTC"})+" GMT)")+'" >'+c+"</span>",i+="       </li>"}var d=s.contributor;d||s.OwnerUser&&s.OwnerUser.userName&&(d=s.OwnerUser.userName),d&&(i+="       <li>",i+='           <i class="fa fa-user" ></i><span title="Contributor">'+s.OwnerUser.userName+"</span>",i+="       </li>"),i+="      </ul>",i+="     </div>",i+="   </div>",i+=" </div>",i+="</div>"}e.html(i),e.find(".page-link").click(function(){if(!$(this).parent().hasClass("disabled")){var t=$(this).data("url"),e=$(this).data("start");t&&a.getFromUrl(t,void 0,{start:e})}}),e.find(".delete-item").click(function(){var t=$(this).data("id");t&&a.deleteItem(t)}),e.find(".copy-service-url").click(function(){var t,e=$(this).siblings("input");0<e.length&&(t=e[0]),t&&(t.select(),t.setSelectionRange(0,99999),document.execCommand("copy"),$.notify({message:"Copied to clipboard"},{type:"info",delay:1e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}}))})},fillUI:function(){if(this.fillingUI=!0,this.pagination.extent){var t=this.pagination.extent.split(",");this.mapExtent={minx:t[0],miny:t[1],maxx:t[2],maxy:t[3]},this.applyMapExtent=!0}this.fillItems(this.items),this.fillingUI=!1,$(".panel-group").has(".list-group-item").removeClass("has-active-filter"),$(".panel-group").has(".list-group-item.active").addClass("has-active-filter"),$(".panel-group").has(".filter-input").removeClass("has-active-filter"),$(".panel-group").has(".filter-input.active").addClass("has-active-filter")},get_pageToolbar:function(t){var e='<div class="col-xs-18 col-sm-12 col-md-12">';return e+=this.get_pagination(t),e+=this.get_pageCommandbar(t),e+="</div>"},get_pageCommandbar:function(t){return""},get_pagination:function(t){var e=this,a="";if(!t)return a;if(!t.limit)return a;if(!t.totalItems)return'<div class="panel-heading"><legend>No item found</legend></div>';t.start||(t.start=1);var i=Math.ceil(t.totalItems/t.limit),r=Math.floor((t.start-1)/t.limit)+1;i<r&&(r=i);var s=t.limit,l=i,o=r-1,n=r+1;o<1&&(o=1),l<n&&(n=l);return a+='<ul style="margin-top: 0;;" class="pagination  pagination-sm ">',a+='   <li class="page-item first-item '+(1==r?"disabled":"")+'">',a+='     <span class="page-link" href="#" data-start="'+(0*s+1)+'" data-url="'+e.getCswUrl({start:0*s+1})+'"><<</span>',a+="   </li>",a+='   <li class="page-item previous-item '+(o==r?"disabled":"")+'">',a+='     <span  class="page-link" href="#"  data-start="'+((o-1)*s+1)+'" data-url="'+e.getCswUrl({start:(o-1)*s+1})+'"><</span>',a+="   </li>",a+='   <li class="page-item next-item ">',a+='     <span  class="page-link" href="#"  data-start="'+((r-1)*s+1)+'" data-url=""'+e.getCswUrl({start:(r-1)*s+1})+'">Page '+r+"/"+i+" of "+t.totalItems+" itmes </span>",a+="   </li>",a+='   <li class="page-item next-item '+(n==r?"disabled":"")+'">',a+='     <span  class="page-link" href="#"  data-start="'+((n-1)*s+1)+'" data-url="'+e.getCswUrl({start:(n-1)*s+1})+'">></span>',a+="   </li>",a+='   <li class="page-item last-item '+(l==r?"disabled":"")+'">',a+='     <span  class="page-link" href="#"  data-start="'+((l-1)*s+1)+'" data-url="'+e.getCswUrl({start:(l-1)*s+1})+'">>></span>',a+="   </li>",a+="</ul>"},createSideFilters:function(t){var e=this;this.createSideFilters_topics(t),this.createSideFilters_authors(t),this.createSideFilters_datasettypes(t),this.createSideFilters_keywords(t),$("#fromDate").change(function(){$(this).val()?$(this).addClass("active"):$(this).removeClass("active"),e.applyFilters()}),$("#toDate").change(function(){$(this).val()?$(this).addClass("active"):$(this).removeClass("active"),e.applyFilters()}),$("#c_fromDate").change(function(){$(this).val()?$(this).addClass("active"):$(this).removeClass("active"),e.applyFilters()}),$("#c_toDate").change(function(){$(this).val()?$(this).addClass("active"):$(this).removeClass("active"),e.applyFilters()})},createSideFilters_authors:function(t){var e=this,a="";if(t&&t["dc:contributor"]){for(var i=t["dc:contributor"],r=0;r<i.length;r++){var s=i[r];a+="<li>",s.total?a+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+s.value+'" >'+s.value+'<span class="badge pull-right">'+s.total+"</span></span>":a+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+s.value+'" >'+s.value+"</span>",a+="</li>"}$("#authors").html(a),$("#authors .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()})}},createSideFilters_datasettypes:function(t){var e=this,a="";if(t&&t["dc:format"]){for(var i=t["dc:format"],r=0;r<i.length;r++){var s=i[r];a+="<li>",s.total?a+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+s.value+'" >'+s.value+'<span class="badge pull-right">'+s.total+"</span></span>":a+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+s.value+'" >'+s.value+"</span>",a+="</li>"}$("#datasetTypes").html(a),$("#datasetTypes .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()})}},createSideFilters_keywords:function(t){var e=this,a="";if(t&&t["dc:subject"]){for(var i=t["dc:subject"],r=0;r<i.length;r++){var s=i[r];a+="<li>",s.total?a+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+s.value+'" >'+s.value+'<span class="badge pull-right">'+s.total+"</span></span>":a+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+s.value+'" >'+s.value+"</span>",a+="</li>"}$("#keywords").html(a),$("#keywords .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()})}},createSideFilters_topics:function(t){var e=this,a="";if(t&&t.theme){for(var i=t.theme,r=0;r<i.length;r++){var s=i[r];a+="<li>",s.total?a+='     <span  class="list-group-item" data-filtertype="topic" data-filter="'+s.value+'" >'+s.value+'<span class="badge pull-right">'+s.total+"</span></span>":a+='     <span  class="list-group-item" data-filtertype="topic" data-filter="'+s.value+'" >'+s.value+"</span>",a+="</li>"}$("#topics").html(a),$("#topics .list-group-item").click(function(){$(this).toggleClass("active"),e.applyFilters()}),0==i.length?$("#pnlTopicFilter").hide():$("#pnlTopicFilter").show()}},fillOrderByList:function(t){var a=this;if("<li>",'     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="title" > Title</span>','     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="created" > Creation date</span>','     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="modified" > Revision date</span>',"</li>",$("#orderbys").html('<li>     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="title" > Title</span>     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="created" > Creation date</span>     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="modified" > Revision date</span></li>'),$("#orderbys .list-group-item").click(function(){var t=$(this).hasClass("active");$("#orderbys .list-group-item").removeClass("active"),$(this).addClass("active");var e=$(this).data("filter");e&&t&&(0==e.indexOf("-")?(e=e.substring(1),$(this).removeClass("glyphicon-sort-by-attributes-alt"),$(this).addClass("glyphicon-sort-by-attributes")):(e="-"+e,$(this).removeClass("glyphicon-sort-by-attributes"),$(this).addClass("glyphicon-sort-by-attributes-alt")),$(this).data("filter",e)),a.applyFilters()}),t&&t.orderby){var e=t.orderby,i=e,r=!1;0==e.indexOf("-")&&(i=e.substring(1),r=!0);var s=$('#orderbys .list-group-item[data-filter="'+i+'"]');s.addClass("active"),r&&(s.removeClass("glyphicon-sort-by-attributes"),s.addClass("glyphicon-sort-by-attributes-alt")),s.data("filter",e)}},createExtMap:function(){var r=this;(this.map=new ol.Map({target:"extMap",layers:[new ol.layer.Tile({title:"OSM",source:new ol.source.OSM})],view:new ol.View({extent:ol.extent.applyTransform([-180,-90,180,90],ol.proj.getTransform("EPSG:4326","EPSG:3857")),center:ol.proj.fromLonLat([0,0]),zoom:0})})).on("moveend",function(t){var e=t.map,a=e.getView().getProjection().getCode(),i=e.getView().calculateExtent(e.getSize());i=ol.extent.applyTransform(i,ol.proj.getTransform(a,"EPSG:4326")),r.mapExtent={minx:i[0],miny:i[1],maxx:i[2],maxy:i[3]},180<r.mapExtent.minx&&(r.mapExtent.minx=r.mapExtent.minx%360-360,r.mapExtent.maxx=r.mapExtent.minx+(i[3]-i[0])),r.applyMapExtent&&r.applyFilters()})},applyFilters_local:function(){var t=this,e=t.mapExtent,a=t.filterExpression;$("#tblItems .listItem").filter(function(){t.checkFilterExpression(this,a)&&t.checkFilterExtent(this,e)?$(this).toggle(!0):$(this).toggle(!1)})},checkFilterExpression:function(t,e){return!t||(!e||(e=(e+"").toLowerCase(),-1<$(t).text().toLowerCase().indexOf(e)))},checkFilterExtent:function(t,e){if(!this.applyMapExtent)return!0;if(!t)return!0;if(!e)return!0;var a=$(t).data("ext_west"),i=$(t).data("ext_east"),r=$(t).data("ext_south"),s=$(t).data("ext_north");try{return a=parseFloat(a),r=parseFloat(r),i=parseFloat(i),s=parseFloat(s),!(a>e.maxx||i<e.minx||r>e.maxy||s<e.miny)}catch(t){return!0}},applyFilters:function(){if(!this.fillingUI){this.filterExpression=$("#tblItems_search").val();var t=this.getCswUrl();this.getFromUrl(t)}},getCswUrl:function(t){return $("#cmbCswProvider").val()},getQueryXml:function(t){t=t||{};var e,a=this.mapExtent,i=this.filterExpression;t.filterExpression&&(i=t.filterExpression),this.applyMapExtent&&a&&(e=a.minx+","+a.miny+","+a.maxx+","+a.maxy),t.extent&&(e=t.extent);var r="",s=!1;r+="<ogc:Filter>",r+=" <ogc:And>",i&&(s=!0,r+='<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="">',r+="  <ogc:PropertyName>AnyText</ogc:PropertyName>",r+="  <ogc:Literal>%"+i+"%</ogc:Literal>",r+="</ogc:PropertyIsLike>");var l="";$("#datasetTypes .list-group-item.active ").each(function(){var t=$(this).data("filter")+"";l+="<ogc:PropertyIsEqualTo>",l+="  <ogc:PropertyName>format</ogc:PropertyName>",l+="  <ogc:Literal>"+t+"</ogc:Literal>",l+="</ogc:PropertyIsEqualTo>"}),l&&(s=!0,r+="<ogc:Or>"+l+"</ogc:Or>");var o="";$("#topics .list-group-item.active ").each(function(){var t=$(this).data("filter")+"";o+='<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="">',o+="  <ogc:PropertyName>theme</ogc:PropertyName>",o+="  <ogc:Literal>%"+t+"%</ogc:Literal>",o+="</ogc:PropertyIsLike>"}),$("#keywords .list-group-item.active ").each(function(){var t=$(this).data("filter")+"";o+='<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="">',o+="  <ogc:PropertyName>subject</ogc:PropertyName>",o+="  <ogc:Literal>%"+t+"%</ogc:Literal>",o+="</ogc:PropertyIsLike>"}),o&&(s=!0,r+="<ogc:Or>"+o+"</ogc:Or>");var n=$("#fromDate").val(),c=$("#toDate").val();n&&(s=!0,r+="<ogc:PropertyIsGreaterThanOrEqualTo>",r+="  <ogc:PropertyName>modified</ogc:PropertyName>",r+="  <ogc:Literal>"+n+"</ogc:Literal>",r+="</ogc:PropertyIsGreaterThanOrEqualTo>"),c&&(s=!0,r+="<ogc:PropertyIsLessThanOrEqualTo>",r+="  <ogc:PropertyName>modified</ogc:PropertyName>",r+="  <ogc:Literal>"+c+"</ogc:Literal>",r+="</ogc:PropertyIsLessThanOrEqualTo>");var p=$("#c_fromDate").val(),d=$("#c_toDate").val();p&&(s=!0,r+="<ogc:PropertyIsGreaterThanOrEqualTo>",r+="  <ogc:PropertyName>created</ogc:PropertyName>",r+="  <ogc:Literal>"+p+"</ogc:Literal>",r+="</ogc:PropertyIsGreaterThanOrEqualTo>"),d&&(s=!0,r+="<ogc:PropertyIsLessThanOrEqualTo>",r+="  <ogc:PropertyName>created</ogc:PropertyName>",r+="  <ogc:Literal>"+d+"</ogc:Literal>",r+="</ogc:PropertyIsLessThanOrEqualTo>");var m="";if($("#authors .list-group-item.active ").each(function(){var t=$(this).data("filter")+"";m+="<ogc:PropertyIsEqualTo>",m+="  <ogc:PropertyName>contributor</ogc:PropertyName>",m+="  <ogc:Literal>"+t+"</ogc:Literal>",m+="</ogc:PropertyIsEqualTo>"}),m&&(s=!0,r+="<ogc:Or>"+m+"</ogc:Or>"),e){var u=(e+"").split(",");4==u.length&&(s=!0,r+="<ogc:BBOX>",r+=" <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>",r+=" <gml:Envelope>",r+="     <gml:lowerCorner>"+u[0]+" "+u[1]+"</gml:lowerCorner>",r+="     <gml:upperCorner>"+u[2]+" "+u[3]+"</gml:upperCorner>",r+=" </gml:Envelope>",r+="</ogc:BBOX>")}r+=" </ogc:And>",r+="</ogc:Filter>";var g="";$("#orderbys .list-group-item.active ").each(function(){if($(this).data("filtertype")){var t=$(this).data("filter")+"",e="ASC";0==t.indexOf("-")&&(t=t.substring(1),e="DESC"),g+="<ogc:SortBy>",g+="<ogc:SortProperty>",g+="<ogc:PropertyName>"+t+"</ogc:PropertyName>",g+="<ogc:SortOrder>"+e+"</ogc:SortOrder>",g+="</ogc:SortProperty>",g+="</ogc:SortBy>"}});var h="";return h+='<Query typeNames="Record">',h+="  <ElementSetName>full</ElementSetName>",s&&(h+='  <Constraint version="1.1.0">',h+=r,h+="</Constraint>"),h+=g,h+="</Query>"},getFromUrl:function(y,v,t){var b=this;b.last_url=y;var x,w=1;(t=t||{}).start?w=t.start:this.pagination,t.limit?x=t.limit:this.pagination&&(x=this.pagination.limit),x||(x=20);var e='<?xml version="1.0" encoding="ISO-8859-1"?>';e+="<GetRecords ",e+=' service="CSW"',e+=' version="2.0.2"',e+=' maxRecords="'+x+'"',e+=' startPosition="'+w+'"',e+=' resultType="results"',e+=' outputFormat="application/xml"',e+=' outputSchema="http://www.opengis.net/cat/csw/2.0.2"',e+=' xmlns="http://www.opengis.net/cat/csw/2.0.2"',e+=' xmlns:ogc="http://www.opengis.net/ogc"',e+=' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',e+=' xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2',e+=' ../../../csw/2.0.2/CSW-discovery.xsd">',e+=b.getQueryXml(t),e+="</GetRecords>",b.showWaiting();var a=y;app.url_needs_proxy(y)&&(a=app.get_proxy_url(y)),$.ajax({url:a,type:"POST",contentType:"text/xml",dataType:"xml",data:e,success:function(t){v||history.pushState({url:b.pageUrl},document.title,b.pageUrl);var e=[],a={};if(t&&t.documentElement){var i,r=$("csw\\:SearchResults",t),s=$(r).attr("numberOfRecordsMatched"),l=$(r).attr("numberOfRecordsReturned"),o=$(r).attr("nextRecord"),n=$(r).attr("elementSet");try{s=parseInt(s)}catch(t){}try{l=parseInt(l)}catch(t){}try{s=parseInt(s)}catch(t){}try{o=parseInt(o)}catch(t){}if(a={limit:x,totalItems:s,start:w},(i="brief"==n?$("csw\\:BriefRecord",r):"summary"==n?$("csw\\:SummaryRecord",r):$("csw\\:Record",r))&&i.length)for(var c=0;c<i.length;c++){var p=i[c],d={};d.id=$("dc\\:identifier",p).text(),d.metaDataLink=y+"?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&id="+d.id,d.name=d.title=$("dc\\:title",p).text(),d.type=$("dc\\:type",p).text(),d.subject=$("dct\\:subject",p).map(function(t,e){return $(e).text()}).toArray().join(", "),d.relation=$("dc\\:relation",p).text(),d.modified=$("dct\\:modified",p).text(),d.description=d.abstract=$("dct\\:abstract",p).text(),d.format=$("dc\\:format",p).text(),d.contributor=$("dc\\:contributor",p).text(),d.publisher=$("dc\\:publisher",p).text(),d.creator=$("dc\\:creator",p).text(),d.date=$("dc\\:date",p).text(),d.language=$("dc\\:language",p).text(),d.rights=$("dc\\:rights",p).text(),d.spatial=$("dct\\:spatial",p).text(),d.source=$("dc\\:source",p).text(),d.thumbnail=$("dct\\:references[scheme=THUMBNAIL]",p).text();var m=$("dct\\:references[scheme=OGC\\:WMS]",p);0<m.length&&(d.wms=$(m).text(),d.wms_layers=$(m).attr("wms_layers")),d.wmts=$("dct\\:references[scheme=OGC\\:WMTS]",p).text();var u=$("dct\\:references[scheme=OGC\\:WFS]",p);0<u.length&&(d.wfs=$(u).text(),d.wfs_typename=$(u).attr("wfs_typename"),d.wfs_shapetype=$(u).attr("wfs_shapetype"),d.subType=d.wfs_shapetype);var g=$("ows\\:WGS84BoundingBox",p);if(g.length){var h=$("ows\\:LowerCorner",g).text(),f=$("ows\\:UpperCorner",g).text();if(h&&f)try{d.bbox=[parseFloat(h.split(" ")[0]),parseFloat(h.split(" ")[1]),parseFloat(f.split(" ")[0]),parseFloat(f.split(" ")[1])]}catch(t){}}d.updatedAt=d.modified,d.OwnerUser={userName:d.contributor},e.push(d)}}b.data={items:e,pagination:a},b.pagination=b.data.pagination,b.items=b.data.items,b.fillUI()},error:function(t,e,a){if(b.data={items:[],pagination:{}},b.pagination=b.data.pagination,b.items=b.data.items,b.fillUI(),t.responseText)try{var i=JSON.parse(t.responseText);i&&i.error&&(a=i.error)}catch(t){}var r=a||e||"Error";t&&t.responseJSON&&t.responseJSON.error&&(r=t.responseJSON.error),$.notify({message:"Failed to connect to catalog service: "+r},{type:"danger",delay:2e3,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"}})}})},getUniqueValues:function(t,p,i){var d=this,e=t;app.url_needs_proxy(t)&&(e=app.get_proxy_url(t)),$.ajax({url:e,type:"GET",dataType:"xml",data:{service:"CSW",version:"2.0.2",request:"GetDomain",propertyname:"dc:format,theme,dc:subject,dc:contributor,dc:date,dct:modified"},success:function(t){var e={};if(t&&t.documentElement)for(var a=$("csw\\:DomainValues",t),i=0;i<a.length;i++){for(var r=a[i],s=$("csw\\:PropertyName",r).text(),l=[],o=$("csw\\:ListOfValues  csw\\:Value",r),n=0;n<o.length;n++){var c;c=$(o[n]).attr("total"),l.push({value:$(o[n]).text(),total:c})}e[s]=l}d.createSideFilters(e),p&&p()},error:function(t,e,a){d.createSideFilters({});t&&t.responseJSON&&t.responseJSON.error&&t.responseJSON.error,i&&i()}})}};