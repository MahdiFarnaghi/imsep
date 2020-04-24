$(function () {
  
  pageTask.init();
 
 
});
var pageTask={
  init:function(){
    var self= this;

    this.filterExpression='';
    this.applyMapExtent=false;
    this.mapExtent={
      minx: -180,
      miny: -90,
      maxx: 180,
      maxy: 90
    }
    
    this.items= [];
    this.data={};
    this.pagination={};
    try{
    //  this.data= JSON.parse(dataStr);
      this.items=this.data.items||[];
      this.pagination=this.data.pagination ||{};
    }catch(ex){}
    
    // $("#tblItems_search").on("keyup change", function () {
    //   var value = $(this).val().toLowerCase();
    //   self.filterExpression= value;
    //   self.applyFilters();
    // });
    $('#cmbCswProvider').change(function(){
        var url=$(this).val();

        var checkUrl=url;
        if(checkUrl.indexOf('?')>-1){
          checkUrl += '&Service=CSW&Request=GetCapabilities'; 
        }else{
          checkUrl += '?Service=CSW&Request=GetCapabilities' ;
        }
        $('#cmdCheckCapabilies').attr("href", checkUrl);
        $('#CheckCapabiliesUrl').val(checkUrl);
        self.showWaiting();
        self.getUniqueValues(url,function(){
          self.applyFilters();
        },function(){
          self.applyFilters();
        });
    });
    $('#CopyCapabiliesUrl').click(function(){
      /* Get the text field */
      var copyText = document.getElementById("CheckCapabiliesUrl");

      /* Select the text field */
      copyText.select();
      copyText.setSelectionRange(0, 99999); /*For mobile devices*/

      /* Copy the text inside the text field */
      document.execCommand("copy");
      $.notify({
        message: "Copied to clipboard"
      },{
          type:'info',
          delay:1000,
          animate: {
              enter: 'animated fadeInDown',
              exit: 'animated fadeOutUp'
          }
      });
    });
   
    $("#tblItems_search").on("keyup", function (evt) {
      if (evt.which == 13) {
        var value = $(this).val().toLowerCase();
       // self.filterExpression= value;
        self.applyFilters();
      }
    });
  
    $("#text_search_btn").on("click", function () {
      var value = $("#tblItems_search").val().toLowerCase();
      //self.filterExpression= value;
      self.applyFilters();
    });
   
    $('#applyMapExtent').prop("checked",self.applyMapExtent?true:false);
    $('#applyMapExtent').change(function(){
      self.applyMapExtent= $(this).prop("checked");
      if(self.applyMapExtent){
        $('.extent-map-panel').addClass('has-active-filter');
      }else{
        $('.extent-map-panel').removeClass('has-active-filter');
      }
      self.applyFilters();
    })

    //$('#pnlExtentMap').css('visibility', 'hidden');
    this.createExtMap();
   
    $('#pnlExtentMap').addClass('collapse');
    $('#pnlExtentMapCmd').addClass('collapsed');
    //$('#pnlExtentMap').css('visibility', 'visible');
    //this.createSideFilters(this.data.statistics,this.data.pagination);
    this.fillUI();
    
    this.fillOrderByList(this.data.pagination);

    //this.applyFilters();
    
    var url=self.getCswUrl();
    
    self.getUniqueValues(url,function(){
      self.applyFilters();
    },function(){
      self.applyFilters();
    });
    self.last_url=url;
    self.pageUrl='/catalog';
    history.pushState({url:self.pageUrl}, document.title, self.pageUrl);
    window.addEventListener('popstate', function(e){
      if(e.state && e.state.url)
        self.getFromUrl(e.state.url,true);
   }); 
    
  },
   
  showWaiting:function(){
    var self=this;
    var detailsContainer= $('#tblItems');
    var html='<div class="col-xs-18 col-sm-12 col-md-12 "> <div class="thumbnail waitbar_h" style="height:30px"  ></div> </div>';
    detailsContainer.html(html);
  },
  
  fillItems:function(items){
    var self=this;
    var detailsContainer= $('#tblItems');
    
    var html='';
    html+= this.get_pageToolbar(this.pagination);
    for(var i=0;i<items.length;i++){
      var item= items[i];
      html+='<div class="col-xs-18 col-sm-12 col-md-12 listItem"';
      html+='              data-id="'+item.id+'"';
      
      html+='              data-type="'+item.type+'"';
      html+='              data-subject="'+item.subject+'"';
    
      // html+='              data-ext_north="'+item.ext_north+'"';
      // html+='              data-ext_east="'+item.ext_east+'"';
      // html+='              data-ext_west="'+item.ext_west+'"';
      // html+='              data-ext_south="'+item.ext_south+'"';
      html+='>';//1
   //   html+='     <div class="listItem-select-box"><button type="button" class="btn btn-default btn-sm"> <span data-id="' + item.id+'" class="glyphicon glyphicon-unchecked"></span></button></div>';
      html+=' <div class="item-container" data-id="' + item.id+'" >';//2
      html+='   <div class="thumbnail" data-id="' + item.id+'">';//3
      html+='     <div class="caption">';//4
      html+='       <a  data-toggle="collapse" style="cursor:pointer;" data-target="#details_'+item.id+'" >';
      if(item.thumbnail){
        html+='       <img class="avatar" src="'+item.thumbnail+'" />';  
      }else{
        html+='       <i class="avatar fa fa-map-o"> </i>';
      }
      html+='         <h4>';
      if(item.subType=='MultiPolygon'){
        html+='<i class="layerSubtype">▭</i>';
      }else if(item.subType=='MultiLineString'){
        html+='<i class="layerSubtype">▬</i>';
      }else if(item.subType=='Point'){
        html+='<i class="layerSubtype">◈</i>';
      }else if(item.format=='vector') {
        //html+='<i class="layerSubtype"></i>';
      }
      if(item.format=='raster'){
        html+='<i class="layerSubtype">▦</i>';
      }
      html+=''+item.name;
      html+='</h4>';
      html+='       </a>';
      
      html+='     <p class="item-description" >'+ (item.description || '').replace(/(?:\r\n|\r|\n)/g, '<br />') +'</p>';
      html+= '<div id="details_'+item.id+'" class="item-details collapse">';
      if(item.subject){
        html+='<label>Subject and keywords:</label> <span>'+item.subject+'</span><br/>';
      }
     
      if(item.date){
        html+='<label>Creation Date:</label> <span>'+item.date+'</span><br/>';
      }
      if(item.modified){
        html+='<label>Revision Date:</label> <span>'+item.modified+'</span><br/>';
      }
      if(item.creator){
        html+='<label>Creator:</label> <span>'+item.creator+'</span><br/>';
      }
      if(item.publisher){
        html+='<label>Publisher:</label> <span>'+item.publisher+'</span><br/>';
      }
      if(item.contributor){
        html+='<label>Contributor:</label> <span>'+item.contributor+'</span><br/>';
      }
      if(item.type){
        html+='<label>Resource Type:</label> <span>'+item.type+'</span><br/>';
      }
      if(item.format){
        html+='<label>Format:</label> <span>'+item.format+'</span><br/>';
      }
      if(item.spatial){
        html+='<label>Spatial Reference:</label> <span>'+item.spatial+'</span><br/>';
      }
      if(item.language){
        html+='<label>Language:</label> <span>'+item.language+'</span><br/>';
      }
      if(item.source){
        html+='<label>Source:</label> <span class="item-description"  >'+item.source+'</span><br/>';
      }
      if(item.relation){
        html+='<label>Relation to other resources:</label> <span class="item-description"  >'+item.relation+'</span><br/>';
      }
      
      if(item.wms ||item.wmts ||item.wfs){
        html+='<label>Published Service(s):</label><br/>';
      
        html+='     <ul class="">';
        if(item.wfs){
          var viewOptions={
            layerType:'WFS',
            url:item.wfs,
            title:item.name,
            shapetype: item.wfs_shapetype || '',
            typename:item.wfs_typename ||'',
            bbox:item.bbox
          };
          html+='<li>WFS';
          html+=' <div class="form-horizontal">';
          html+='   <div class="form-group ">'
          
          html+='                   <span class="col-sm-12" >Service Url:</span>';
          html+='                   <div class="col-sm-12">';
          html+='                      <input type="text" name="" id="" value="'+item.wfs+ '"  readonly class="form-control"  />';
          html+='                       <button  title="Copy Url" class="btn btn-xs btn-info  copy-service-url "><span class="fa fa-copy"></span> Copy</button>';
          html+='                       <a target="_blank" href="'+item.wfs+'" title="Check Url" class="btn btn-xs btn-link   "><span class="fa fa-check"></span> Check</a>';
          html+='                   </div> ';   
          
          html+='   </div>';
          
          html+='   <div class="form-group "><div class="col-sm-12">';
          html+='     <a target="_blank" class="btn btn-xs btn-info" href="/map/preview?options='+encodeURIComponent(JSON.stringify(viewOptions)) +'" ><span class="glyphicon glyphicon-globe"></span> View service in a map</a>';
          html+='   </div></div>';
          html+=' </div>';
          html+='</li>';
        }
        if(item.wms){
          var viewOptions={
            layerType:'WMS',
            url:item.wms,
            title:item.name,
            layers: item.wms_layers|| '',
            bbox:item.bbox
          };

          

          html+='<li>WMS';
          html+=' <div class="form-horizontal">';
          html+='   <div class="form-group ">'
          
          html+='                   <span class="col-sm-12" >Service Url:</span>';
          html+='                   <div class="col-sm-12">';
          html+='                      <input type="text" name="" id="" value="'+item.wms+ '"  readonly class="form-control"  />';
          html+='                       <button  title="Copy Url" class="btn btn-xs btn-info  copy-service-url "><span class="fa fa-copy"></span> Copy</button>';
          html+='                       <a target="_blank" href="'+item.wms+'" title="Check Url" class="btn btn-xs btn-link   "><span class="fa fa-check"></span> Check</a>';
          html+='                   </div> ';   
          
          html+='   </div>';
          
          html+='   <div class="form-group "><div class="col-sm-12">';
          html+='     <a target="_blank" class="btn btn-xs btn-info" href="/map/preview?options='+encodeURIComponent(JSON.stringify(viewOptions)) +'" ><span class="glyphicon glyphicon-globe"></span> View service in a map</a>';
          html+='   </div></div>';
          html+=' </div>';
          html+='</li>';
        }
        if(item.wmts && false){
          
          html+='<li>WMTS';
          html+=' <div class="form-horizontal">';
          html+='   <div class="form-group ">'
          
          html+='                   <span class="col-sm-12" >Service Url:</span>';
          html+='                   <div class="col-sm-12">';
          html+='                      <input type="text" name="" id="" value="'+item.wmts+ '"  readonly class="form-control"  />';
          html+='                       <button  title="Copy Url" class="btn btn-xs btn-info  copy-service-url "><span class="fa fa-copy"></span> Copy</button>';
          html+='                       <a target="_blank" href="'+item.wmts+'" title="Check Url" class="btn btn-xs btn-link   "><span class="fa fa-check"></span> Check</a>';
          html+='                   </div> ';   
          
          html+='   </div>';
          
          html+=' </div>';
          html+='</li>';
        }
        
        html+='     </ul>';
      }
      //html+='<label>Downlad:</label> <a target="_blank"  href="'+item.metaDataLink+'" >Metadata</a>';
      html+='<a target="_blank" title="View source of metadata" class="btn btn-xs btn-primary" href="'+item.metaDataLink+'" >View Metadata</a>';

      html+= '</div>';
      html+='     <ul class="list-inline">';
      
      if(item.updatedAt){
        var val=item.updatedAt +''
        var date = new Date(val);
        var str=date.toString();
        str=date.toLocaleString();
       // var timeOnly= date.toLocaleTimeString('fa',{hour12:true});
       if (app.language=='fa'){
          try{
            var timeOnly= date.toLocaleTimeString('en',{hour12:false});
            var jdate = new window['jdate'].default(date);
            //str= jdate.format('dddd DD MMMM YYYY') + ' '+ timeOnly; // => پنج‌شنبه 12 شهریور 1394
            str= jdate.format('YYYY/MM/DD') + ' '+ timeOnly; // => پنج‌شنبه 12 شهریور 1394
          }catch(exx){}
       }
        //str=date.toLocaleString('en', { timeZone: 'UTC' });
      //str=date.toLocaleString('en', { timeZone: 'Asia/Tehran' });
      //str=date.toLocaleString('en', { timeZone: 'Europe/Stockholm' });
      //str=date.toLocaleString('en', { timeZone: 'Asia/Bishkek' });
        var title= ' ('+date.toLocaleString('en', { timeZone: 'UTC' })+' GMT)';
        
         html+='       <li>';
         html+='         <i class="fa fa-calendar fa-calendar-o"></i><span class="convertTolocalDateTime__" title="Definition modified at '+ title +'" >'+str+'</span>';
         html+='       </li>';
        }
      
      var userName= item.contributor;
      if(!userName){
        if(item.OwnerUser && item.OwnerUser.userName){
          userName=item.OwnerUser.userName;
        }
      } 
      if(userName){
        html+='       <li>';
        html+='           <i class="fa fa-user" ></i><span title="Contributor">'+item.OwnerUser.userName+'</span>';
        html+='       </li>';
      }
      
     
      html+='      </ul>';
      html+='     </div>';//4

      

      html+='   </div>';//3
      html+=' </div>';//2
      html+='</div>';//1
    }
   
   
    
     detailsContainer.html(html);
     detailsContainer.find('.page-link').click(function(){
      if(!$(this).parent().hasClass('disabled')){
        var url= $(this).data('url');
        var start= $(this).data('start');
        if(url){
          self.getFromUrl(url,undefined,{start:start});
        }
       }
    });

    detailsContainer.find('.delete-item').click(function(){
      var itemId= $(this).data('id');
      if(itemId){
        self.deleteItem(itemId);
      }
    });

    detailsContainer.find('.copy-service-url').click(function(){
      var input =$(this).siblings('input');
      var copyText;
      if(input.length>0){
        copyText=input[0];
      }
      if(!copyText){
        return;
      }
      //var copyText = document.getElementById("CheckCapabiliesUrl");
      copyText.select();
      copyText.setSelectionRange(0, 99999); /*For mobile devices*/
      document.execCommand("copy");
      $.notify({
        message: "Copied to clipboard"
      },{
          type:'info',
          delay:1000,
          animate: {
              enter: 'animated fadeInDown',
              exit: 'animated fadeOutUp'
          }
      });
    });
    
  },

  fillUI:function(){
    var self=this;
    this.fillingUI=true;
   // 
    //$("#tblItems_search").val(this.pagination.filterExpression);
    if(this.pagination.extent){
      var extent= this.pagination.extent.split(',');
      self.mapExtent={
        minx: extent[0],
        miny: extent[1],
        maxx: extent[2],
        maxy: extent[3]
      }
      self.applyMapExtent=true;
    }
    this.fillItems(this.items);
   // this.fillOrderByList(this.data.pagination);
    this.fillingUI=false;
    $('.panel-group').has('.list-group-item').removeClass('has-active-filter');
    $('.panel-group').has('.list-group-item.active').addClass('has-active-filter');

    $('.panel-group').has('.filter-input').removeClass('has-active-filter');
    $('.panel-group').has('.filter-input.active').addClass('has-active-filter');
  },
  get_pageToolbar:function(pagination){
    var self=this;
    var html='<div class="col-xs-18 col-sm-12 col-md-12">';
    
    html+=this.get_pagination(pagination);
    html+=this.get_pageCommandbar(pagination);
    html+='</div>'
    return html;
  },
  get_pageCommandbar:function(pagination){
    var self=this;
    var html='';
    // if(!pagination){
    //   return html;
    // }
    // if(!pagination.limit)
    //   return html;
    // if(!pagination.totalItems)
    //   return html;    
    
    // html+='<ul style="margin-top: 0;" class="pagination  pagination-sm pull-left">';
    // html+='   <li class="page-item ">';
    // html+='     <div class="listItem-select-all-box"><button type="button" class="btn btn-default btn-sm"> <span class="glyphicon glyphicon-unchecked"></span></button></div>';
    // html+='   </li>';
    
    // html+='</ul>';

    return html;
  },
  get_pagination:function(pagination){
    var self=this;
    var html='';
    if(!pagination){
      return html;
    }
    if(!pagination.limit)
      return html;
    if(!pagination.totalItems)
      return '<div class="panel-heading"><legend>No item found</legend></div>';    
    if(!pagination.start)
      pagination.start=1;
    
    var totalPages = Math.ceil(pagination.totalItems / pagination.limit);  
    var currentPage = Math.floor((pagination.start-1) / pagination.limit)+1;  
    if (currentPage>totalPages){
      currentPage=totalPages;
    }
    var limit= pagination.limit;
    var firstPage=1;
    var lastPage=totalPages;
    var prevPage= currentPage-1;
    var nextPage= currentPage+1;
    if(prevPage<firstPage)prevPage=firstPage;
    if(nextPage>lastPage)nextPage=lastPage;
    var filter='';
    html+='<ul style="margin-top: 0;;" class="pagination  pagination-sm ">';
    html+='   <li class="page-item first-item '+ ((firstPage==currentPage)?'disabled':'')+'">';
    html+='     <span class="page-link" href="#" data-start="'+((firstPage-1)*limit +1)+'" data-url="'+self.getCswUrl({start:((firstPage-1)*limit +1)}) +'">'+ '<<' +'</span>';
    //html+='     <button type="button"  class="page-link" href="?limit='+limit+ '&start='+((firstPage-1)*limit +1)+'&' + filter +'">'+ '<<' +'</a>';
    html+='   </li>';
    html+='   <li class="page-item previous-item '+ ((prevPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#"  data-start="'+((prevPage-1)*limit +1)+'" data-url="'+self.getCswUrl({start:((prevPage-1)*limit +1)}) +'">'+ '<' +'</span>';
    html+='   </li>';
    html+='   <li class="page-item next-item ">';
    html+='     <span  class="page-link" href="#"  data-start="'+((currentPage-1)*limit +1)+'" data-url=""'+self.getCswUrl({start:((currentPage-1)*limit +1)}) +'">'+ 'Page '+ currentPage + '/' +totalPages +' of '+pagination.totalItems+ ' itmes </span>';
    html+='   </li>';
    html+='   <li class="page-item next-item '+ ((nextPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#"  data-start="'+((nextPage-1)*limit +1)+'" data-url="'+self.getCswUrl({start:((nextPage-1)*limit +1)}) +'">'+ '>' +'</span>';
    html+='   </li>';
    html+='   <li class="page-item last-item '+ ((lastPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#"  data-start="'+((lastPage-1)*limit +1)+'" data-url="'+self.getCswUrl({start:((lastPage-1)*limit +1)})+'">'+ '>>' +'</span>';
    html+='   </li>';
    html+='</ul>';

    return html;
  },
  createSideFilters:function(uniqueValues){
    var self=this;
    this.createSideFilters_topics(uniqueValues);
    this.createSideFilters_authors(uniqueValues);
    this.createSideFilters_datasettypes(uniqueValues);
    this.createSideFilters_keywords(uniqueValues);

    $("#fromDate").change(function(){
      var val=$(this).val();
      if(val){
        $(this).addClass('active');
      }else{
        $(this).removeClass('active');
      }
      self.applyFilters();
    });
    $("#toDate").change(function(){
      var val=$(this).val();
      if(val){
        $(this).addClass('active');
      }else{
        $(this).removeClass('active');
      }
      self.applyFilters();
    });
    $("#c_fromDate").change(function(){
      var val=$(this).val();
      if(val){
        $(this).addClass('active');
      }else{
        $(this).removeClass('active');
      }
      self.applyFilters();
    });
    $("#c_toDate").change(function(){
      var val=$(this).val();
      if(val){
        $(this).addClass('active');
      }else{
        $(this).removeClass('active');
      }
      self.applyFilters();
    });
  },
  
  createSideFilters_authors:function(uniqueValues){
    var self=this;
    var html='';
    if(!uniqueValues)
    return;
    if(!uniqueValues['dc:contributor'])
    return;
    var items= uniqueValues['dc:contributor'];

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
      //html+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      if(item.total){
        html+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+ item['value']+'" >'+ item['value'] + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      }else{
        html+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+ item['value']+'" >'+ item['value'] + '</span>';
      }
      html+= '</li>';
    }
    $("#authors").html(html);
    $("#authors .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
   
  },
  createSideFilters_datasettypes:function(uniqueValues){
    var self=this;
    var html='';
    if(!uniqueValues)
    return;
    if(!uniqueValues['dc:format'])
    return;
    var items= uniqueValues['dc:format'];

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
     // html+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
     // html+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+ item+'" >'+ item + '</span>';
      if(item.total){
        html+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+ item['value']+'" >'+ item['value'] + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      }else{
        html+='     <span  class="list-group-item" data-filtertype="datasetType" data-filter="'+ item['value']+'" >'+ item['value'] + '</span>';
      }
      html+= '</li>';
    }
    $("#datasetTypes").html(html);
    $("#datasetTypes .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
  
  },
  createSideFilters_keywords:function(uniqueValues){
    var self=this;
    var html='';
    if(!uniqueValues)
    return;
    if(!uniqueValues['dc:subject'])
    return;
    var items= uniqueValues['dc:subject'];

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
     // html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
     //html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item+'" >'+ item + '</span>';
     if(item.total){
        html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item['value']+'" >'+ item['value'] + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      }else{
        html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item['value']+'" >'+ item['value'] + '</span>';
      }
      html+= '</li>';
    }
    $("#keywords").html(html);
    $("#keywords .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
    
  },
  createSideFilters_topics:function(uniqueValues){
    var self=this;
    var html='';
    if(!uniqueValues)
    return;
    if(!uniqueValues['theme'])
    return;
    var items= uniqueValues['theme'];

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
     // html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
     //html+='     <span  class="list-group-item" data-filtertype="topic" data-filter="'+ item+'" >'+ item + '</span>';
     if(item.total){
      html+='     <span  class="list-group-item" data-filtertype="topic" data-filter="'+ item['value']+'" >'+ item['value'] + '<span class="badge pull-right">'+ item.total+ '</span></span>';
    }else{
      html+='     <span  class="list-group-item" data-filtertype="topic" data-filter="'+ item['value']+'" >'+ item['value'] + '</span>';
    }
      html+= '</li>';
    }
    $("#topics").html(html);
    $("#topics .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
    if(items.length==0){
      $('#pnlTopicFilter').hide();
    }else{
      $('#pnlTopicFilter').show();
    }
  },
  fillOrderByList:function(pagination){
    var self=this;
    var html='';
   
      html+= '<li>';
      html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="title" > Title</span>';
      //html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes-alt" data-filtertype="orderby" data-filter="-name" > نـــام</span>';
     // html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="size" > انــدازه</span>';
      //html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes-alt" data-filtertype="orderby" data-filter="-size" > انــدازه</span>';
      html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="created" > Creation date</span>';
      html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="modified" > Revision date</span>';
      //html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes-alt" data-filtertype="orderby" data-filter="-updatedAt" > تــاریخ</span>';
      html+= '</li>';
   
    //$("#orderbys").html(app.render(html));
    $("#orderbys").html(html);
    $("#orderbys .list-group-item").click(function(){
      var alreadyIsActive=$(this).hasClass('active');
      $("#orderbys .list-group-item").removeClass('active');
      $(this).addClass('active');
      var filter= $(this).data('filter');
      if(filter && alreadyIsActive){ // switch order
        if (filter.indexOf('-')==0){
          filter=filter.substring(1);
          $(this).removeClass('glyphicon-sort-by-attributes-alt');
          $(this).addClass('glyphicon-sort-by-attributes');
        }else
        {
          filter='-'+filter;
          $(this).removeClass('glyphicon-sort-by-attributes');
          $(this).addClass('glyphicon-sort-by-attributes-alt');
          
        }
        $(this).data('filter',filter);
      }
      self.applyFilters();
    });

      if(pagination && pagination.orderby){
        
        var filter=pagination.orderby;
        var key=filter;
        var reverse=false;
        if (filter.indexOf('-')==0){
          key=filter.substring(1);
          reverse=true;
        }
        var elem=$('#orderbys .list-group-item[data-filter="' +key+'"]');
        elem.addClass('active');
        if(reverse){
          elem.removeClass('glyphicon-sort-by-attributes');
          elem.addClass('glyphicon-sort-by-attributes-alt');
        }
        elem.data('filter',filter);
      
    }
  },
  
  
  createExtMap:function(){
    var self=this;
    var map = this.map = new ol.Map({
      target:  'extMap',
      layers: [
                new ol.layer.Tile({
                title: "OSM",
                source: new ol.source.OSM()
                
            })
      ],
      view: new ol.View({
         // center: ol.proj.fromLonLat([(app.initMap_Lon|| 0), (app.initMap_Lat ||0)])
          //center: ol.proj.fromLonLat([53,32])
          //,zoom:1
         // ,zoom: app.initMap_Zoom || 4
         // extent:ol.proj.get("EPSG:3857").getExtent(),
          extent: ol.extent.applyTransform([-180,-90,180,90], ol.proj.getTransform("EPSG:4326","EPSG:3857")),
          center: ol.proj.fromLonLat([0,0]),
          zoom: 0
      })
    });
    map.on('moveend', function(evt) {

      var map = evt.map;
      var view = map.getView();
      var mapProjectionCode = view.getProjection().getCode();
      var extent = map.getView().calculateExtent(map.getSize());
      extent = ol.extent.applyTransform(extent, ol.proj.getTransform(mapProjectionCode, "EPSG:4326"));
      self.mapExtent={
        minx: extent[0],
        miny: extent[1],
        maxx: extent[2],
        maxy: extent[3]
      }
      if(self.mapExtent.minx>180){
        self.mapExtent.minx= (self.mapExtent.minx%360)-360;
        self.mapExtent.maxx= self.mapExtent.minx+ (extent[3]-extent[0])
      }
      if(self.applyMapExtent){
        self.applyFilters();
      }
     // 
    });
  },
  applyFilters_local:function(){
    var self=this;
    var mapExtent=self.mapExtent;
    var expr= self.filterExpression;

   
    $("#tblItems .listItem").filter(function () {
      if(self.checkFilterExpression(this,expr)
        && self.checkFilterExtent(this,mapExtent )
      ){
        $(this).toggle(true);
      }else{
        $(this).toggle(false);
      }
   });
  },
  checkFilterExpression:function(item, expr){
   
    if(!item )
     return true;
    if(!expr){
      return true;
    } 
    expr= (expr+'').toLowerCase();
    return $(item).text().toLowerCase().indexOf(expr) > -1
  },
  checkFilterExtent:function(item, extent){
    if(!this.applyMapExtent){
      return true;
    }
    if(!item )
     return true;
    if(!extent){
      return true;
    } 
    var minx= $(item).data('ext_west');
    var maxx= $(item).data('ext_east');
    var miny= $(item).data('ext_south');
    var maxy= $(item).data('ext_north');
      try{
        minx= parseFloat(minx);miny= parseFloat(miny);
        maxx= parseFloat(maxx);maxy= parseFloat(maxy);

        if(minx> extent.maxx|| maxx< extent.minx || miny>extent.maxy || maxy<extent.miny ){
            return false;
          }else{
            return true
          }
      }catch(ex){
        return true
      }
  }
  ,
  applyFilters:function(){
    
    var self=this;
    if(this.fillingUI){
      return;
    }
    this.filterExpression =$("#tblItems_search").val();
    var url=self.getCswUrl();
   // window.location=url;
    self.getFromUrl(url);
  
  },
  getCswUrl:function(options){
   
   //return '/ows/csw';
   var url= $('#cmbCswProvider').val();

   return url;
   
  
  },
  getQueryXml:function(options){
    options= options ||{};
    var self=this;
    
    var mapExtent=self.mapExtent;
    var filterExpression= self.filterExpression;
    if(options.filterExpression ){
      filterExpression=options.filterExpression;
    }
    var extent;
    if(this.applyMapExtent && mapExtent){
      extent= mapExtent.minx+','+mapExtent.miny+','+mapExtent.maxx+','+mapExtent.maxy;
    }
    if(options.extent ){
      extent=options.extent;
    }
    var filter='';
    var hasFilter=false;
    filter+='<ogc:Filter>';
    filter+= ' <ogc:And>';
    if(filterExpression){
      hasFilter=true;
      filter+= '<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\">';
      filter+= '  <ogc:PropertyName>AnyText</ogc:PropertyName>';
      filter+= '  <ogc:Literal>%'+ filterExpression+'%</ogc:Literal>';
      filter+= '</ogc:PropertyIsLike>';
    }
    var datasetTypesFilter='';
    $("#datasetTypes .list-group-item.active ").each(function(){
        var filterValue= $(this).data('filter')+'';
        datasetTypesFilter+= '<ogc:PropertyIsEqualTo>';
        datasetTypesFilter+= '  <ogc:PropertyName>format</ogc:PropertyName>';
        datasetTypesFilter+= '  <ogc:Literal>'+ filterValue+'</ogc:Literal>';
        datasetTypesFilter+= '</ogc:PropertyIsEqualTo>';
    });
    if(datasetTypesFilter){
      hasFilter=true;
      filter+= '<ogc:Or>'+datasetTypesFilter+'</ogc:Or>';
    }

    var subjectFilter=''
    $("#topics .list-group-item.active ").each(function(){
         
        var filterValue= $(this).data('filter')+'';
        subjectFilter+= '<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\">';
        subjectFilter+= '  <ogc:PropertyName>theme</ogc:PropertyName>';
        subjectFilter+= '  <ogc:Literal>%'+ filterValue+'%</ogc:Literal>';
        subjectFilter+= '</ogc:PropertyIsLike>';
    });
    $("#keywords .list-group-item.active ").each(function(){
         
      var filterValue= $(this).data('filter')+'';
      subjectFilter+= '<ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\">';
      subjectFilter+= '  <ogc:PropertyName>subject</ogc:PropertyName>';
      subjectFilter+= '  <ogc:Literal>%'+ filterValue+'%</ogc:Literal>';
      subjectFilter+= '</ogc:PropertyIsLike>';
  });
    if(subjectFilter){
      hasFilter=true;
      filter+= '<ogc:Or>'+subjectFilter+'</ogc:Or>';
    }

    var fromDate=$('#fromDate').val();
    var toDate=$('#toDate').val();
    if(fromDate){
      hasFilter=true;
      filter+= '<ogc:PropertyIsGreaterThanOrEqualTo>';
      filter+= '  <ogc:PropertyName>modified</ogc:PropertyName>';
      filter+= '  <ogc:Literal>'+ fromDate+'</ogc:Literal>';
      filter+= '</ogc:PropertyIsGreaterThanOrEqualTo>';
    }
    if(toDate){
      hasFilter=true;
      filter+= '<ogc:PropertyIsLessThanOrEqualTo>';
      filter+= '  <ogc:PropertyName>modified</ogc:PropertyName>';
      filter+= '  <ogc:Literal>'+ toDate+'</ogc:Literal>';
      filter+= '</ogc:PropertyIsLessThanOrEqualTo>';
    }
    
    var c_fromDate=$('#c_fromDate').val();
    var c_toDate=$('#c_toDate').val();
    if(c_fromDate){
      hasFilter=true;
      filter+= '<ogc:PropertyIsGreaterThanOrEqualTo>';
      filter+= '  <ogc:PropertyName>created</ogc:PropertyName>';
      filter+= '  <ogc:Literal>'+ c_fromDate+'</ogc:Literal>';
      filter+= '</ogc:PropertyIsGreaterThanOrEqualTo>';
    }
    if(c_toDate){
      hasFilter=true;
      filter+= '<ogc:PropertyIsLessThanOrEqualTo>';
      filter+= '  <ogc:PropertyName>created</ogc:PropertyName>';
      filter+= '  <ogc:Literal>'+ c_toDate+'</ogc:Literal>';
      filter+= '</ogc:PropertyIsLessThanOrEqualTo>';
    }
    var authorsFilter='';
    $("#authors .list-group-item.active ").each(function(){
        var filterValue= $(this).data('filter')+'';
        authorsFilter+= '<ogc:PropertyIsEqualTo>';
        authorsFilter+= '  <ogc:PropertyName>contributor</ogc:PropertyName>';
        authorsFilter+= '  <ogc:Literal>'+ filterValue+'</ogc:Literal>';
        authorsFilter+= '</ogc:PropertyIsEqualTo>';
    });
    if(authorsFilter){
      hasFilter=true;
      filter+= '<ogc:Or>'+authorsFilter+'</ogc:Or>';
    }

    if(extent){
      var coords= (extent+'').split(',');
      if(coords.length ==4 ){
        hasFilter=true;
        filter+= '<ogc:BBOX>';
        filter+= ' <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>';
        filter+= ' <gml:Envelope>';
        filter+= '     <gml:lowerCorner>'+coords[0]+' '+coords[1]+'</gml:lowerCorner>';
        filter+= '     <gml:upperCorner>'+coords[2]+' '+coords[3]+'</gml:upperCorner>';
        filter+= ' </gml:Envelope>';
        filter+= '</ogc:BBOX>';
      }
    }
    filter+= ' </ogc:And>';
    filter+= '</ogc:Filter>';
    var sortby='';

    $("#orderbys .list-group-item.active ").each(function(){
      var filterType= $(this).data('filtertype');
      if(filterType){
        var filterValue= $(this).data('filter')+'';
        var SortOrder='ASC';
        if (filterValue.indexOf('-')==0){
          filterValue=filterValue.substring(1);
          SortOrder='DESC';
        }
   
      sortby+='<ogc:SortBy>';
      sortby+='<ogc:SortProperty>';
      sortby+='<ogc:PropertyName>'+ filterValue+'</ogc:PropertyName>';
      sortby+='<ogc:SortOrder>'+ SortOrder+'</ogc:SortOrder>';
      sortby+='</ogc:SortProperty>';
      sortby+='</ogc:SortBy>';
      }
    });

    var query='';
   
    query+= '<Query typeNames="Record">';
    query+= '  <ElementSetName>full</ElementSetName>';
    if(hasFilter){
      query+= '  <Constraint version="1.1.0">';
      query+= filter;
      query+='</Constraint>';
    }
    query+=sortby;
    query+='</Query>';
  

    return query;
  },
  getFromUrl:function(url,skipPushState,options){
    
        var self= this;
    self.last_url=url;
    options= options ||{};
    var start= 1;
    if(options.start){
      start= options.start;
    }else if(this.pagination)
    {
     // start=this.pagination.start;
    }
    var limit;
    if(options.limit){
      limit= options.limit;
    }else if(this.pagination)
    {
      limit=this.pagination.limit;
    }
    if(!limit){
      limit=20;
    }
    //limit=2;
    var xmlTemplate='<?xml version="1.0" encoding="ISO-8859-1"?>';
 xmlTemplate+='<GetRecords ';
 xmlTemplate+=' service="CSW"';
 xmlTemplate+=' version="2.0.2"';
 xmlTemplate+=' maxRecords="'+limit+'"';
 xmlTemplate+=' startPosition="'+start+'"';
 xmlTemplate+=' resultType="results"';
 xmlTemplate+=' outputFormat="application/xml"';
 xmlTemplate+=' outputSchema="http://www.opengis.net/cat/csw/2.0.2"';
 xmlTemplate+=' xmlns="http://www.opengis.net/cat/csw/2.0.2"';
 xmlTemplate+=' xmlns:ogc="http://www.opengis.net/ogc"';
 xmlTemplate+=' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
 xmlTemplate+=' xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2';
 xmlTemplate+=' ../../../csw/2.0.2/CSW-discovery.xsd">';
 //xmlTemplate+=' <ResponseHandler>ftp://www.myserver.com/pub/MyQuery_Resp.xml</ResponseHandler>';;
 xmlTemplate+= self.getQueryXml(options);
 xmlTemplate+='</GetRecords>';
    
    
    
    
    
    self.showWaiting();
    var url_=url;
    if(app.url_needs_proxy(url)){
      url_= app.get_proxy_url(url);
    }
    $.ajax( {    url: url_, type: 'POST',contentType:'text/xml',  dataType: 'xml',data:xmlTemplate
     , success: function (data) {
        if(!skipPushState){
          history.pushState({url:self.pageUrl}, document.title, self.pageUrl);
        }
        var items=[];
        var pagination={};
        if(data && data.documentElement){
          var SearchResults =$('csw\\:SearchResults', data);
          var numberOfRecordsMatched=$(SearchResults).attr('numberOfRecordsMatched');
          var numberOfRecordsReturned=$(SearchResults).attr('numberOfRecordsReturned');
          var nextRecord=$(SearchResults).attr('nextRecord');
          var elementSet=$(SearchResults).attr('elementSet');
          try{
            numberOfRecordsMatched=parseInt(numberOfRecordsMatched);
          }catch(ex){}
          try{
            numberOfRecordsReturned=parseInt(numberOfRecordsReturned);
          }catch(ex){}
          try{
            numberOfRecordsMatched=parseInt(numberOfRecordsMatched);
          }catch(ex){}
        //  var start=1;
          try{
            nextRecord=parseInt(nextRecord);
          //  start= nextRecord-numberOfRecordsReturned;
          //  if(start<=0){
           //   start=1;
          //  }
          }catch(ex){}

          pagination={
            limit: limit,//numberOfRecordsReturned,
            totalItems: numberOfRecordsMatched,
            start:start
          }
          var records;
          if( elementSet=='brief'){
            records=  $( 'csw\\:BriefRecord',SearchResults) 
          }else if( elementSet=='summary'){
            records=  $( 'csw\\:SummaryRecord',SearchResults) 
          }else{
            records=  $( 'csw\\:Record',SearchResults) 
          }
          if(records && records.length){
            for(var i=0;i< records.length;i++){
              var record=records[i];
              var item={};
              item.id=$( 'dc\\:identifier',record).text();
              item.metaDataLink= url+ '?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&id='+item.id;
              item.name= item.title=$( 'dc\\:title',record).text();
              item.type=$( 'dc\\:type',record).text();

              item.subject=$( 'dct\\:subject',record).map(function(i, item) {
                return $(item).text();
              }).toArray().join(', ');

              item.relation=$( 'dc\\:relation',record).text();

              item.modified=$( 'dct\\:modified',record).text();
              item.description= item.abstract=$( 'dct\\:abstract',record).text();

              item.format=$( 'dc\\:format',record).text();
              item.contributor=$( 'dc\\:contributor',record).text();
              item.publisher=$( 'dc\\:publisher',record).text();
              item.creator=$( 'dc\\:creator',record).text();
              item.date=$( 'dc\\:date',record).text();
              item.language=$( 'dc\\:language',record).text();
              item.rights=$( 'dc\\:rights',record).text();
              item.spatial=$( 'dct\\:spatial',record).text();
              item.source=$( 'dc\\:source',record).text();

              item.thumbnail=$( 'dct\\:references[scheme=THUMBNAIL]',record).text();
              var wms= $( 'dct\\:references[scheme=OGC\\:WMS]',record);
              if(wms.length>0){
                item.wms=$(wms ).text();
                item.wms_layers=$(wms).attr('wms_layers');

              }
              item.wmts=$( 'dct\\:references[scheme=OGC\\:WMTS]',record).text();
               var wfs=$( 'dct\\:references[scheme=OGC\\:WFS]',record);
               if(wfs.length>0){
                 item.wfs=$(wfs).text();
                 item.wfs_typename=$(wfs).attr('wfs_typename');
                 item.wfs_shapetype=$(wfs).attr('wfs_shapetype');
                 item.subType=item.wfs_shapetype;
               }
              
              var WGS84BoundingBox=$( 'ows\\:WGS84BoundingBox',record);
              if(WGS84BoundingBox.length){
                var LowerCorner =$('ows\\:LowerCorner',WGS84BoundingBox).text();
                var UpperCorner =$('ows\\:UpperCorner',WGS84BoundingBox).text();
                if(LowerCorner && UpperCorner){
                  try{
                  item.bbox=[
                    parseFloat(LowerCorner.split(' ')[0]), parseFloat( LowerCorner.split(' ')[1]),
                    parseFloat(UpperCorner.split(' ')[0]),parseFloat(UpperCorner.split(' ')[1]),
                  ]
                  }catch(ex){}
                }
              }

              item.updatedAt=item.modified;

              item.OwnerUser={
                userName:item.contributor
              }
              items.push(item);
              
            }
          }
        }
        self.data={
          items:items,
          pagination:pagination
        }
        self.pagination=self.data.pagination;
        self.items=self.data.items;
        self.fillUI();
      },
      error: function (xhr, textStatus, errorThrown) {
        self.data={
          items:[],
          pagination:{}
        }
        self.pagination=self.data.pagination;
        self.items=self.data.items;
        self.fillUI();
        if(xhr.responseText){
          try{
            var responseTextJson = JSON.parse(xhr.responseText);
            if(responseTextJson && responseTextJson.error){
              errorThrown=responseTextJson.error;
            }
          }catch(ex){}
        }
        var msg=errorThrown ||textStatus  ||"Error";
        if(xhr && xhr.responseJSON && xhr.responseJSON.error){
          msg=xhr.responseJSON.error;
        } 
        $.notify({
          message: "Failed to connect to catalog service: "+ msg
        },{
            type:'danger',
            delay:2000,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            }
        });
      }
     });
  }
  ,
  getUniqueValues:function(url,successCB,errorCB){
    var self=this;
    var url_=url;
    if(app.url_needs_proxy(url)){
      url_= app.get_proxy_url(url);
    }
    $.ajax( {    url: url_,type:'GET',
      //contentType: "text/xml",
      dataType:'xml',
      data:{
        service:'CSW',
        version:'2.0.2',
        request:'GetDomain',
        propertyname:'dc:format,theme,dc:subject,dc:contributor,dc:date,dct:modified'
      },
       success: function (data) {
         var uniqueValues={};
        if(data && data.documentElement){
          var domainValues=$('csw\\:DomainValues', data);
          for(var i=0;i< domainValues.length;i++){
            var domainValues_i=domainValues[i];
            var propertyName=$( 'csw\\:PropertyName',domainValues_i).text();
            var values=[];
            var ListOfValues=$( 'csw\\:ListOfValues  csw\\:Value',domainValues_i);
            for(var v=0;v<ListOfValues.length;v++){
              var total=-1;
              total=$(ListOfValues[v]).attr('total');
              values.push({
                value:$(ListOfValues[v]).text(),
                total:total
               });
            }
            uniqueValues[propertyName]=values;
          }
        }
        self.createSideFilters(uniqueValues);
        if(successCB){
          successCB();
        }
      },error: function (xhr, textStatus, errorThrown) {
        self.createSideFilters({});
        var msg=errorThrown ||textStatus  ||"Failed";
        if(xhr && xhr.responseJSON && xhr.responseJSON.error){
          msg=xhr.responseJSON.error;
        } 
        if(errorCB){
          errorCB();
        }
        // $.notify({
        //   message:  msg
        // },{
        //     type:'danger',
        //     delay:2000,
        //     animate: {
        //         enter: 'animated fadeInDown',
        //         exit: 'animated fadeOutUp'
        //     }
        // });
      }
     });
  }
  
  
};

