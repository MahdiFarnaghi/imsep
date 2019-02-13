
function DlgWCS(mapContainer,obj,options) {
  options.showOKButton=false;
  options.cancelButtonTitle='Close';
  DlgTaskBase.call(this, 'DlgWCS'
      ,(options.title || 'WCS Service')
      ,  mapContainer,obj,options);   

}
DlgWCS.prototype = Object.create(DlgTaskBase.prototype);


DlgWCS.prototype.createUI=function(){
  var self=this;
  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  //htm+='  <p>';
  //htm+='Create new GeoJSON layer ';
  //htm+='  </p>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="url">WCS url:</label>';
  htm+='    <input type="text" name="url" id="url" value="'+'https://download.data.grandlyon.com/wcs/rdata'+'" placeholder="WCS  address" autocomplete="on" class="form-control" data-val="true" data-val-required="Service url is required" />'
  htm+='    <span class="field-validation-valid" data-valmsg-for="url" data-valmsg-replace="true"></span>';
  htm+='  </div>';

  htm+='<div class="form-group">';
  htm+='  <label class="col-sm-3" for="version">Version:</label>';
  htm+='    <select class="form-control " id="version" >';
  htm+='                          <option value="2.0.1" selected="selected">2.0.1</option>';
  htm+='                          <option value="1.1.1" >1.1.1</option>';
  
  htm+='    </select>';
  htm+=' </div>';
  htm+='<div class="form-group">';
  htm += '<button type="button" class="btn btn-primary" id="GetCapabilities" ><i class="fa fa-download"></i> Get Capabilities</button>';
  htm+='</div>';
  htm+='    <div id="capabilities_Content" class="panel-body">';
    
  htm+='    </div>';

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  self.content=content;
  content.find('#GetCapabilities').click(function(){
    var $form = $(content.find('#'+self.id +'_form'));
    $form.on('submit', function(event){
      // prevents refreshing page while pressing enter key in input box
      event.preventDefault();
    });
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      //evt.cancel= true;
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
    }else{
      self.GetCapabilities();
    }

  });

  
  
  this.beforeApplyHandlers.push(function(evt){
   
  });

  this.applyHandlers.push(function(evt){
      
  });

  this.changesApplied=false
}
DlgWCS.prototype.GetCapabilities=function(){
  var self=this;
  var wcsUrl=self.content.find('#url').val();
  var version=self.content.find('#version').val() || '2.0.1';
  self.content.find('#capabilities_Content').html('<div class="wait-icon alert alert-info">Loading service\'s capabilities ...</div>');
  var url= '/proxy/?url='+ encodeURIComponent(wcsUrl +'?SERVICE=WCS&REQUEST=GetCapabilities&VERSION='+version);
  $.ajax(url, {
    type: 'GET',
     dataType: 'xml',
    success: function (data) {
      var info;
        if (data) {
          var prefix='';
          if(data.documentElement){
            if(version==='2.0.1'){
              info=self.GetCapabilities_process_2_0_1(wcsUrl,data);
            }else if(version==='1.1.1'){
              info=self.GetCapabilities_process_1_1_1(wcsUrl,data);
            }
            
          }
        }
        if(!info){
          self.content.find('#capabilities_Content').html('<div class="alert alert-danger">Loading failed. Check url address and try again.</div>');
        }else
        {
          self.displayCapabilities(info);
        }

    },
    error: function (xhr, textStatus, errorThrown) {
      self.content.find('#capabilities_Content').html('<div class="alert alert-danger">Loading failed. Check url address and try again.</div>');
    }
  });
}
DlgWCS.prototype.GetCapabilities_process_1_1_1=function(wcsUrl,doc){
  var info={
    wcsUrl:wcsUrl,
    version:'1.1.1',
    coverageSummaries:[]
  }

  var prefix='';
  prefix= doc.documentElement.prefix;
  if(!prefix){
      prefix='';
  }
  try{
    info.Title =$( 'ows\\:ServiceIdentification',doc).find('ows\\:Title').first().text();
  }catch(ex){}
  try{
    info.Abstract=$( 'ows\\:ServiceIdentification',doc).find('ows\\:Abstract').first().text();
  }catch(ex){}

  
  try{
    info.ProviderName =$( 'ows\\:ServiceProvider',doc).find('ows\\:ProviderName').first().text();
  }catch(ex){}
  

  var coverageSummaries= $( 'Contents',doc).find('CoverageSummary');
  if(coverageSummaries.length>0){
  
    for(var j=0;j< coverageSummaries.length;j++)
    {
       
      var elemnt_Name= $(coverageSummaries[j]).text();
      var CoverageId =$(coverageSummaries[j]).find('Identifier').text();
      var CoverageTitle = $(coverageSummaries[j]).find('ows\\:Title').text();
      var WGS84BoundingBox= $(coverageSummaries[j]).find('ows\\:WGS84BoundingBox');
      var wGS84BoundingBox=undefined;
      if(WGS84BoundingBox.length){
        var north,south,east,west;
        
        var LowerCorner= WGS84BoundingBox.first().find('ows\\:LowerCorner');
        var UpperCorner= WGS84BoundingBox.first().find('ows\\:UpperCorner');
      
        try{
          if(LowerCorner.length){
            var vLowerCorner= LowerCorner.text();
            vLowerCorner=vLowerCorner.split(' ');
            west= parseFloat(vLowerCorner[0]);
            south= parseFloat(vLowerCorner[1]);
          }
          if(UpperCorner.length){
            var vUpperCorner= UpperCorner.text();
            vUpperCorner= vUpperCorner.split(' ');
            east= parseFloat(vUpperCorner[0]);
            north= parseFloat(vUpperCorner[1]);
          }
          if(typeof north !=='undefined' &&
            typeof west !=='undefined' &&
            typeof east !=='undefined' &&
            typeof south !=='undefined'  ){
              wGS84BoundingBox={
                north:north,
                west:west,
                east:east,
                south:south
              };
          }
        }catch(ex){}
      }
      var SupportedFormat=$(coverageSummaries[j]).find('SupportedFormat').text();
      if(CoverageId ){
        info.coverageSummaries.push({
          coverageId:CoverageId,
          coverageTitle:CoverageTitle,
          wGS84BoundingBox:wGS84BoundingBox,
          supportedFormat:SupportedFormat
        })
      }
      
    }

  }
  return info;
}
DlgWCS.prototype.GetCapabilities_process_2_0_1=function(wcsUrl,doc){
  var info={
    wcsUrl:wcsUrl,
    version:'2.0.1',
    coverageSummaries:[]
  }
  var prefix='';
  prefix= doc.documentElement.prefix;
  if(!prefix){
      prefix='';
  }
  try{
    info.Title =$( 'ows\\:ServiceIdentification',doc).find('ows\\:Title').first().text();
  }catch(ex){}
  try{
    info.Abstract=$( 'ows\\:ServiceIdentification',doc).find('ows\\:Abstract').first().text();
  }catch(ex){}

  try{
    info.ProviderName =$( 'ows\\:ServiceProvider',doc).find('ows\\:ProviderName').first().text();
  }catch(ex){}
  var coverageSummaries= $( prefix+ '\\:Contents',doc).find(prefix +'\\:CoverageSummary');
  if(coverageSummaries.length>0){
  
    for(var j=0;j< coverageSummaries.length;j++)
    {
       
      var elemnt_Name= $(coverageSummaries[j]).text();
      var CoverageId =$(coverageSummaries[j]).find(prefix+'\\:CoverageId').text();
      var CoverageSubtype =$(coverageSummaries[j]).find(prefix+ '\\:CoverageSubtype').text();
      var WGS84BoundingBox= $(coverageSummaries[j]).find('ows\\:WGS84BoundingBox');
      var wGS84BoundingBox=undefined;
      if(WGS84BoundingBox.length){
        var north,south,east,west;
        
        var LowerCorner= WGS84BoundingBox.first().find('ows\\:LowerCorner');
        var UpperCorner= WGS84BoundingBox.first().find('ows\\:UpperCorner');
      
        try{
          if(LowerCorner.length){
            var vLowerCorner= LowerCorner.text();
            vLowerCorner=vLowerCorner.split(' ');
            west= parseFloat(vLowerCorner[0]);
            south= parseFloat(vLowerCorner[1]);
          }
          if(UpperCorner.length){
            var vUpperCorner= UpperCorner.text();
            vUpperCorner= vUpperCorner.split(' ');
            east= parseFloat(vUpperCorner[0]);
            north= parseFloat(vUpperCorner[1]);
          }
          if(typeof north !=='undefined' &&
            typeof west !=='undefined' &&
            typeof east !=='undefined' &&
            typeof south !=='undefined'  ){
              wGS84BoundingBox={
                north:north,
                west:west,
                east:east,
                south:south
              };
          }
        }catch(ex){}
      }
      if(CoverageId && CoverageSubtype){
        info.coverageSummaries.push({
          coverageId:CoverageId,
          coverageSubtype:CoverageSubtype,
          wGS84BoundingBox:wGS84BoundingBox
        })
      }
      
    }
  }
  return info;
}
DlgWCS.prototype.DescribeCoverage_process_2_0_1=function(wcsUrl,coverageId,containerElement,doc){
  containerElement.html('');
  var info={
    wcsUrl:wcsUrl,
    version:'2.0.1',
    coverageId:coverageId
  }
  var prefix='';
  prefix= doc.documentElement.prefix;
  if(!prefix){
      prefix='';
  }
  
  var ServiceParameters= $( prefix+ '\\:CoverageDescription',doc).find(prefix +'\\:ServiceParameters');
  info.CoverageSubtype= ServiceParameters.find(prefix+'\\:CoverageSubtype').text();
  info.nativeFormat= ServiceParameters.find(prefix+'\\:nativeFormat').first().text();

  var Envelopes=$( prefix+ '\\:CoverageDescription',doc).find('gml\\:boundedBy gml\\:Envelope');
  for(j=0;j<Envelopes.length;j++){
    var boundingBox=undefined;
    var Envelope =Envelopes[j];
    var srsName=Envelope.attr('srsName');

    var north,south,east,west;
        
        var LowerCorner= Envelope.find('gml\\:lowerCorner');
        var UpperCorner= Envelope.find('gml\\:upperCorner');
        try{
          if(LowerCorner.length){
            var vLowerCorner= LowerCorner.text();
            vLowerCorner=vLowerCorner.split(' ');
            west= parseFloat(vLowerCorner[0]);
            south= parseFloat(vLowerCorner[1]);
          }
          if(UpperCorner.length){
            var vUpperCorner= UpperCorner.text();
            vUpperCorner= vUpperCorner.split(' ');
            east= parseFloat(vUpperCorner[0]);
            north= parseFloat(vUpperCorner[1]);
          }
          if(typeof north !=='undefined' &&
            typeof west !=='undefined' &&
            typeof east !=='undefined' &&
            typeof south !=='undefined'  ){
              boundingBox={
                north:north,
                west:west,
                east:east,
                south:south
              };
          }
        }catch(ex){}
      if(boundingBox){
        boundingBox.srsName=srsName;
      }
  }
  
  if(false){

  
    for(var j=0;j< coverageSummaries.length;j++)
    {
       
      var elemnt_Name= $(coverageSummaries[j]).text();
      var CoverageId =$(coverageSummaries[j]).find(prefix+'\\:CoverageId').text();
      var CoverageSubtype =$(coverageSummaries[j]).find(prefix+ '\\:CoverageSubtype').text();
      var WGS84BoundingBox= $(coverageSummaries[j]).find('ows\\:WGS84BoundingBox');
      var wGS84BoundingBox=undefined;
      if(WGS84BoundingBox.length){
        var north,south,east,west;
        
        var LowerCorner= WGS84BoundingBox.first().find('ows\\:LowerCorner');
        var UpperCorner= WGS84BoundingBox.first().find('ows\\:UpperCorner');
      
        try{
          if(LowerCorner.length){
            var vLowerCorner= LowerCorner.text();
            vLowerCorner=vLowerCorner.split(' ');
            west= parseFloat(vLowerCorner[0]);
            south= parseFloat(vLowerCorner[1]);
          }
          if(UpperCorner.length){
            var vUpperCorner= UpperCorner.text();
            vUpperCorner= vUpperCorner.split(' ');
            east= parseFloat(vUpperCorner[0]);
            north= parseFloat(vUpperCorner[1]);
          }
          if(typeof north !=='undefined' &&
            typeof west !=='undefined' &&
            typeof east !=='undefined' &&
            typeof south !=='undefined'  ){
              wGS84BoundingBox={
                north:north,
                west:west,
                east:east,
                south:south
              };
          }
        }catch(ex){}
      }
      if(CoverageId && CoverageSubtype){
        info.coverageSummaries.push({
          coverageId:CoverageId,
          coverageSubtype:CoverageSubtype,
          wGS84BoundingBox:wGS84BoundingBox
        })
      }
      
    }
  }
  return info;
}
DlgWCS.prototype.displayCapabilities=function(info){
var self=this;
var panel=self.content.find('#capabilities_Content');
panel.html('');
if(!info){
  return;
}
var htm='';
if(info.Title){
  htm+='<div class="form-group row">';
  htm+='  <label class="col-sm-3">Title:</label>';
  htm+='  <label class="col-sm-9">'+ info.Title+'</label>';
  htm+=' </div>';
}
if(info.Abstract){
  htm+='<div class="form-group row">';
  htm+='  <label class="col-sm-3">Abstract:</label>';
  htm+='  <label class="col-sm-9">'+ info.Abstract+'</label>';
  htm+=' </div>';
}
htm+='<div class="panel">';
htm+='  <div class="panel-body">';
htm+='    <div class="form-horizontal">';
htm+='      <legend>Coverages:</legend>'
for(var i=0;i< info.coverageSummaries.length;i++){
  var coverageSummary= info.coverageSummaries[i];
  if(coverageSummary.coverageId){
    htm+='<div id="' + coverageSummary.coverageId +'" data-version="'+info.version+'" class="form-group">';
    htm+='<div class="form-group row">';
    htm+='  <label class="col-sm-3">ID:</label>';
    htm+='  <label class="col-sm-9">'+ coverageSummary.coverageId+'</label>';
    htm+=' </div>';
    if(coverageSummary.coverageTitle){
      htm+='<div class="form-group row">';
      htm+='  <label class="col-sm-3">Title:</label>';
      htm+='  <label class="col-sm-9">'+ coverageSummary.coverageTitle+'</label>';
      htm+=' </div>';
      
    }
    if(coverageSummary.coverageSubtype){
      htm+='<div class="form-group row">';
      htm+='  <label class="col-sm-3">Subtype:</label>';
      htm+='  <label class="col-sm-9">'+ coverageSummary.coverageSubtype+'</label>';
      htm+=' </div>';
      
    }
    if(coverageSummary.wGS84BoundingBox && coverageSummary.supportedFormat && coverageSummary.supportedFormat==='image/tiff'){
      var bbox=coverageSummary.wGS84BoundingBox.west+','+coverageSummary.wGS84BoundingBox.south+','+coverageSummary.wGS84BoundingBox.east+','+coverageSummary.wGS84BoundingBox.north;
      bbox+=',urn:ogc:def:crs:EPSG::4326';
      var SUBSET1='x,http://www.opengis.net/def/crs/EPSG/0/4326('+coverageSummary.wGS84BoundingBox.west+','+coverageSummary.wGS84BoundingBox.east+')';
      var SUBSET2='y,http://www.opengis.net/def/crs/EPSG/0/4326('+coverageSummary.wGS84BoundingBox.south+','+coverageSummary.wGS84BoundingBox.north+')';
      
      var mapExt=this.mapContainer.getCurrentGeoExtent();
      var bbox_map=mapExt.minx+','+mapExt.miny+','+mapExt.maxx+','+mapExt.maxy;
      bbox_map+=',urn:ogc:def:crs:EPSG::4326';
      var SUBSET1_map='x,http://www.opengis.net/def/crs/EPSG/0/4326('+mapExt.minx+','+mapExt.maxx+')';
      var SUBSET2_map='y,http://www.opengis.net/def/crs/EPSG/0/4326('+mapExt.miny+','+mapExt.maxy+')';
      
      
      var v= info.version;
      v='2.0.1';
      var url=info.wcsUrl + '?SERVICE=WCS&VERSION='+v+ '&REQUEST=GetCoverage';
      url+='&FORMAT=' + coverageSummary.supportedFormat;
      var url_map= url;
      if(v=='1.1.1'){
        url+='&COVERAGE='+coverageSummary.coverageId ;
        url_map=url;
        url+='&BoundingBox='+ bbox;
        url_map+='&BoundingBox='+ bbox_map;

      }else{
        url+='&COVERAGEID='+coverageSummary.coverageId ;
        url_map=url;
        url+='&SUBSET='+ SUBSET1;
        url_map+='&SUBSET='+ SUBSET1_map;
        url+='&SUBSET='+ SUBSET2;
        url_map+='&SUBSET='+ SUBSET2_map;
        var map_size=this.mapContainer.map.getSize();
        url_map+='&SCALESIZE=x('+map_size[0]+'),y('+map_size[1]+')';
      }
      htm+=' <a href="'+ url+'" target="_blank" >Download</a>';
      htm+=' <a href="'+ url_map+'" target="_blank" >Download (current map view)</a>';

    }else{
      htm+='<div  class="form-group row">';
      htm+=' <button type="button" class="DescribeCoverage " style="margin-left:15px" data-version="'+info.version+'" data-cid="'+coverageSummary.coverageId+'" >Details</button>';
      htm+='</div>';
      htm+='<div id="descripe_Content" style="display:none" class="form-group row">';
      htm+='</div>';
    }
    htm+=' </div>';
  }
  htm+='<hr />';
}
htm+='    </div>';
htm+='  </div>';
htm+=' </div>';
panel.html(htm);
panel.find('.DescribeCoverage').click(function(){
  var wcsUrl= info.wcsUrl;
  var coverageId= $(this).data('cid');
  var version=$(this).data('version');
  var containerElement= $(this).parent().parent().find('#descripe_Content');
  self.DescribeCoverage(wcsUrl,version,coverageId,containerElement);
})
};

DlgWCS.prototype.DescribeCoverage=function(wcsUrl,version,coverageId,containerElement){
  var self=this;
  
  containerElement.html('<div class="wait-icon alert alert-info">Loading details ...</div>');
  containerElement.show();
  var url= '/proxy/?url=';
  if(version==='1.1.1'){
    url+= encodeURIComponent(wcsUrl +'?SERVICE=WCS&REQUEST=DescribeCoverage&VERSION='+version+'&COVERAGE=' +coverageId);
  }else{
    url+= encodeURIComponent(wcsUrl +'?SERVICE=WCS&REQUEST=DescribeCoverage&VERSION='+version+'&COVERAGEID=' +coverageId);
  }
  $.ajax(url, {
    type: 'GET',
     dataType: 'xml',
    success: function (data) {
      var info;
        if (data) {
          var prefix='';
          if(data.documentElement){
            if(version==='2.0.1'){
              info=self.DescribeCoverage_process_2_0_1(wcsUrl,coverageId,containerElement,data);
            }else if(version==='1.1.1'){
            //  info=self.DescribeCoverage_process_1_1_1(wcsUrl,coverageId,containerElement,data);
            }
            
          }
        }
        if(!info){
          containerElement.html( '<div class="alert alert-danger">Loading failed.</div>');
        }else
        {
         // self.displayCapabilities(info);
        }

    },
    error: function (xhr, textStatus, errorThrown) {
      containerElement.html('<div class="alert alert-danger">Loading failed. </div>');
    }
  });
}
