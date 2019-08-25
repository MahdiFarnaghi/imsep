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
    var dataStr=$('#items').val();
    this.items= [];
    this.data={};
    this.pagination={};
    try{
      this.data= JSON.parse(dataStr);
      this.items=this.data.items;
      this.pagination=this.data.pagination;
    }catch(ex){}
    
    // $("#tblItems_search").on("keyup change", function () {
    //   var value = $(this).val().toLowerCase();
    //   self.filterExpression= value;
    //   self.applyFilters();
    // });
   
   
    $("#tblItems_search").on("keyup", function (evt) {
      if (evt.which == 13) {
        var value = $(this).val().toLowerCase();
        self.filterExpression= value;
        self.applyFilters();
      }
    });
  
    $("#text_search_btn").on("click", function () {
      var value = $("#tblItems_search").val().toLowerCase();
      self.filterExpression= value;
      self.applyFilters();
    });
   
    $('#applyMapExtent').prop("checked",self.applyMapExtent?true:false);
    $('#applyMapExtent').change(function(){
      self.applyMapExtent= $(this).prop("checked");
      self.applyFilters();
    })
    
    //this.createExtMap();
   
    $('#pnlExtentMap').addClass('collapse');
    $('#pnlExtentMapCmd').addClass('collapsed');
    //$('#pnlExtentMap').css('visibility', 'visible');
    //this.fillStatistics(this.data.statistics,this.data.pagination);
    this.fillUI();
    
    //this.fillOrderByList(this.data.pagination);
    //this.applyFilters();
    
    var url=self.getFiltersUrl();
    self.last_url=url;
    history.pushState({url:url}, document.title, url);
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
  deleteItem:function(itemId){
    var self=this;
    var container= $('#tblItems .item-container[data-id="'+itemId+'"]');
    container.addClass('selected');
    
    var msg='Are you sure you want to delete selected map?';
    var confirmDlg= new ConfirmDialog();
    confirmDlg.show(msg, function (confirm) {
      container.removeClass('selected');
        if (confirm) {
            self.deleteItemForReal(itemId);
        }else{
          
        }
    },
        {
            dialogSize: 'm',
            alertType: 'danger'
        }
    );
},
deleteItemForReal:function(itemId){
  var self=this;
  var url = '/map/' + itemId + '/delete?_method=DELETE';
  $.ajax(url, {
      type: 'POST'
  }).done(function (response) {
      //  processNotify.close();
      if(self.last_url){
        self.getFromUrl(self.last_url);
      }
  });
},
  fillItems:function(items){
    var self=this;
    var detailsContainer= $('#tblItems');
    var html='';
    html+= this.get_pagination(this.pagination);
    for(var i=0;i<items.length;i++){
      var item= items[i];
      html+='<div class="col-xs-18 col-sm-12 col-md-12 listItem"';
      html+='              data-keywords="'+item.keywords+'"';
      html+='              data-ext_north="'+item.ext_north+'"';
      html+='              data-ext_east="'+item.ext_east+'"';
      html+='              data-ext_west="'+item.ext_west+'"';
      html+='              data-ext_south="'+item.ext_south+'"';
      html+='>';//1
      html+=' <div class="item-container" data-id="' + item.id+'" >';//2
      html+='   <div class="thumbnail">';//3
      html+='     <div class="caption">';//4
      html+='       <a href="/map/'+item.id+'" >';
      if(item.thumbnail){
        html+='       <img class="avatar" src="'+item.thumbnail+'" />';  
      }else{
        html+='       <i class="avatar fa fa-map" > </i>';
      }
      html+='         <h4>';
      
      html+='       '+item.name;
      html+='         </h4>';
      html+='       </a>';
      
      html+='     <p class="item-description" >'+ (item.description || '').replace(/(?:\r\n|\r|\n)/g, '<br />') +'</p>';
      html+='     <ul class="list-inline">';
      
      if(item.updatedAt){
        var val=item.updatedAt +''
        var date = new Date(val);
        var str=date.toString();
        str=date.toLocaleString();
       // var timeOnly= date.toLocaleTimeString('fa',{hour12:true});
       
       
       //str=date.toLocaleString('en', { timeZone: 'UTC' });
      //str=date.toLocaleString('en', { timeZone: 'Asia/Tehran' });
      //str=date.toLocaleString('en', { timeZone: 'Europe/Stockholm' });
      //str=date.toLocaleString('en', { timeZone: 'Asia/Bishkek' });
        var title= ' ('+date.toLocaleString('en', { timeZone: 'UTC' })+' GMT)';
        
         html+='       <li>';
         html+='         <i class="fa fa-calendar fa-calendar-o"></i><span class="convertTolocalDateTime__" title="Definition modified at '+ title +'" >'+str+'</span>';
         html+='       </li>';
        }
      
      html+='       <li>';
      html+='           <i class="fa fa-user" title="Owner" ></i>';
      if(app.identity.id==item.OwnerUser.id){
        html+='           <b> <span title="Owner" >'+item.OwnerUser.userName+'</span></b>';
      }else{
        html+='           <span title="Owner">'+item.OwnerUser.userName+'</span>';
      }
      html+='       </li>';
      
       html+='       <li>';
       if(
          app.identity.isAdministrator || ( app.identity.id==item.OwnerUser.id)
       || (item.OwnerUser.parent== app.identity.id )
        ){
          // html+='       <form method="POST" action="/map/'+item.id+'/delete?_method=DELETE">';
          // html+='         <button title="Delete" type="submit" style="color:red" class="btn-link  glyphicon glyphicon-remove" onclick="return confirm(\'Confirm deletion?\');"> </button>';
          // html+='       </form>';
          html+='         <button title="Delete" type="button" style="color:red" class="delete-item btn-link  glyphicon glyphicon-remove" data-id="'+ item.id+'" > </button>';
        }
       html+='       </li>';
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
          if(url){
            self.getFromUrl(url);
          }
      }
   });
   detailsContainer.find('.delete-item').click(function(){
    var itemId= $(this).data('id');
    if(itemId){
      self.deleteItem(itemId);
    }
   });
  }
 , 
 fillUI:function(){
    var self=this;
    this.fillingUI=true;
    this.fillStatistics(this.data.statistics,this.data.pagination);
    $("#tblItems_search").val(this.pagination.filterExpression);
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
    this.fillOrderByList(this.data.pagination);
    this.fillingUI=false;
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
    html+='<div class="col-xs-18 col-sm-12 col-md-12"> <ul style="margin-top: 0;margin-bottom: 0;" class="pagination  pagination-sm">';
    html+='   <li class="page-item first-item '+ ((firstPage==currentPage)?'disabled':'')+'">';
    html+='     <span class="page-link" href="#" data-url="'+self.getFiltersUrl({start:((firstPage-1)*limit +1)}) +'">'+ '<<' +'</span>';
    //html+='     <button type="button"  class="page-link" href="?limit='+limit+ '&start='+((firstPage-1)*limit +1)+'&' + filter +'">'+ '<<' +'</a>';
    html+='   </li>';
    html+='   <li class="page-item previous-item '+ ((prevPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#" data-url="'+self.getFiltersUrl({start:((prevPage-1)*limit +1)}) +'">'+ '<' +'</span>';
    html+='   </li>';
    html+='   <li class="page-item next-item ">';
    html+='     <span  class="page-link" href="#" data-url=""'+self.getFiltersUrl({start:((currentPage-1)*limit +1)}) +'">'+ 'Page '+ currentPage + '/' +totalPages +' of '+pagination.totalItems+ ' itmes </span>';
    html+='   </li>';
    html+='   <li class="page-item next-item '+ ((nextPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#" data-url="'+self.getFiltersUrl({start:((nextPage-1)*limit +1)}) +'">'+ '>' +'</span>';
    html+='   </li>';
    html+='   <li class="page-item last-item '+ ((lastPage==currentPage)?'disabled':'')+'">';
    html+='     <span  class="page-link" href="#" data-url="'+self.getFiltersUrl({start:((lastPage-1)*limit +1)})+'">'+ '>>' +'</span>';
    html+='   </li>';
    html+='</ul></div>';

    return html;
  },
  fillStatistics:function(statistics,pagination){
    this.fillStatistics_authors(statistics,pagination);
    this.fillStatistics_keywords(statistics,pagination);
  },
  fillStatistics_authors:function(statistics,pagination){
    var self=this;
    var html='';
    if(!statistics)
    return;
    if(!statistics.authors)
    return;
    var items= statistics.authors;

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
      html+='     <span  class="list-group-item" data-filtertype="author" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      html+= '</li>';
    }
    $("#authors").html(html);
    $("#authors .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
    if(pagination && pagination.authors){
      for(var i=0;i<pagination.authors.length;i++){
        var cc=$("#authors .list-group-item[data-filter='" +pagination.authors[i]+"']");
        $('#authors .list-group-item[data-filter="' +pagination.authors[i]+'"]').addClass('active');
      }
    }
  },
  fillStatistics_keywords:function(statistics,pagination){
    var self=this;
    var html='';
    if(!statistics)
    return;
    if(!statistics.keywords)
    return;
    var items= statistics.keywords;

    for(var i=0;i< items.length /*&& i<10*/;i++){
      var item=items[i];
      html+= '<li>';
      html+='     <span  class="list-group-item" data-filtertype="keyword" data-filter="'+ item.name+'" >'+ item.name + '<span class="badge pull-right">'+ item.total+ '</span></span>';
      html+= '</li>';
    }
    $("#keywords").html(html);
    $("#keywords .list-group-item").click(function(){
      $(this).toggleClass('active');
      self.applyFilters();
    });
    if(pagination && pagination.keywords){
      for(var i=0;i<pagination.keywords.length;i++){
        
        $('#keywords .list-group-item[data-filter="' +pagination.keywords[i]+'"]').addClass('active');
      }
    }
  },
  fillOrderByList:function(pagination){
    var self=this;
    var html='';
   
      html+= '<li>';
      html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="name" > Name</span>';
      
      html+='     <span  class="list-group-item glyphicon glyphicon-sort-by-attributes" data-filtertype="orderby" data-filter="updatedAt" > Date</span>';
      
      html+= '</li>';
   
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
          center: ol.proj.fromLonLat([(app.initMap_Lon|| 0), (app.initMap_Lat ||0)])
          //center: ol.proj.fromLonLat([53,32])
          //,zoom:1
          ,zoom: app.initMap_Zoom || 4
          //,extent:ol.proj.get("EPSG:3857").getExtent()
          //,extent: ol.proj.transform([-180,-90,180,90],'EPSG:4326', 'EPSG:3857')
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
    var url=self.getFiltersUrl();
   // window.location=url;
    self.getFromUrl(url);
  
  },
  getFiltersUrl:function(options){
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
    var args=[];
    var start= 1;
    if(options.start){
      start= options.start;
    }else if(this.pagination)
    {
      start=this.pagination.start;
    }
    args.push('start='+ start);

    var limit;
    if(options.limit){
      limit= options.limit;
    }else if(this.pagination)
    {
      limit=this.pagination.limit;
    }
    args.push('limit='+ limit);

    if(extent){
      args.push('extent='+ extent);
    }
    if(filterExpression){
      args.push('filterExpression='+ encodeURIComponent(filterExpression));
    }

    


    $(".list-group-item.active").each(function(){
      var filterType= $(this).data('filtertype');
      if(filterType){
        var filterValue= $(this).data('filter');
        args.push(filterType+'='+encodeURIComponent(filterValue));
      }
    })
    var url= '?'+ args.join('&');
   // window.location=url;
    return url;
  
  },
  getFromUrl:function(url,skipPushState){
    var self= this;
    self.last_url=url;
    self.showWaiting();
    $.ajax( {    url: '/maps'+url+'&format=json', dataType: 'json', success: function (data) {
      if(!skipPushState){
        history.pushState({url:url}, document.title, url);
      }
        if(data){
          self.data= data;
          self.items=data.items;
          self.pagination=data.pagination;   
          self.fillUI();
        }
      },error: function (xhr, textStatus, errorThrown) {
        var msg=errorThrown ||textStatus  ||"Failed";
        if(xhr && xhr.responseJSON && xhr.responseJSON.error){
          msg=xhr.responseJSON.error;
        } 
        $.notify({
          message:  msg
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
  
  
};

