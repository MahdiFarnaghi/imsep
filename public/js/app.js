//chrome.exe --remote-debugging-port=9222
var app = {
    name: 'untitled',
    layout:'ltr',
    language:'en',
    version: '1.0.0',
    identity: undefined,
    pageData:{},
    eventHandlers:[],
    snapInteractions:[],
    // init map extent settings are filled in layout.vash from env settings
    initMap_Lon:37.41,
    initMap_Lat:9,
    initMap_Zoom:4,

    DROPDOWN_NULL:'[Not filled]',
    
    OSM_REQUEST_TIMEOUT:20000,//ms
    OSM_FEATURE_COUNT_LIMIT1:100000,//confirm zone
    OSM_FEATURE_COUNT_LIMIT2:500000,

    MAx_TABLE_VIEW_RECORDS:1000,
    get_uploadattachments_url:function(){
        return '/dataset/uploadattachments';
     },
     get_attachment_url:function(datasetId,attachmentId,thumbnail){
         if(thumbnail){
             return "/dataset/"+datasetId+"/attachment/"+attachmentId+"?thumbnail=true";
             
         }else{
             return "/dataset/"+datasetId+"/attachment/"+attachmentId;
         }
     },
    //openrouteservice
    routeServiceTokens:[],
    //overpassApiServer:'https://overpass-api.de/api/interpreter',
    overpassApiServer:'//overpass-api.de/api/interpreter',
    //overpassApiServer:'//overpass.openstreetmap.fr/api/interpreter',
    
    setIdentity: function (identityJsonStr) {
        this.identity = JSON.parse(identityJsonStr);
        //alert(JSON.stringify(identity));
       // alert(this.identity.name);
    },
    set_UPLOAD_RASTER_MAX_SIZE_MB:function(v){
        this.UPLOAD_RASTER_MAX_SIZE_MB=v;
    },
    set_UPLOAD_SHAPEFILE_MAX_SIZE_MB: function(v){
        this.UPLOAD_SHAPEFILE_MAX_SIZE_MB=v;
    },
    set_UPLOAD_FILE_MAX_SIZE_MB:function(v){
        this.UPLOAD_FILE_MAX_SIZE_MB=v;
    },
    set_ROUTE_SERVICE_TOKENS: function(v){
        if(v){
         this.routeServiceTokens= v.split(',');   
        }
    },
    render:function(template,model){
        if (!model){
            model=this;
        }
        if(typeof vash !=='undefined'){
            var tpl = vash.compile( template );
            return tpl(model);
        }else{
            return 'vash engine is not loaded';
        }
    },
    htmlEncode:function(value){
        //return $('<div/>').text(value).html();
        if(!value){
            return value;
        }
        var buf = [];
			
			for (var i=value.length-1;i>=0;i--) {
				buf.unshift(['&#', value[i].charCodeAt(), ';'].join(''));
			}
			
			return buf.join('');
      },
      
    htmlDecode:function(value){
        
      //  return $('<div/>').html(value).text();
      value=value+'';
      return value.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
       });
    },
    test: function (str) {
        alert(str);
    },isMobile:function(){
        var isMobile_ = false; //initiate as false
        // device detection
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
            isMobile_ = true;
        }
        return isMobile_
    },
    registerEventhandler:function (type,handler) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        }
        handlers.push(handler);
    },
    unRegisterEventhandler:function (type,handler) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        }
        var index= handlers.findIndex(function (handler_) {
            if(handler && (handler== handler_)){
                return true;
            }
            return false;
        });
        if(index>-1){
            handlers.splice(index,1);
        }
    },
    dispatchEvent: function (type,eventArgs) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        } 
        var ii=handlers.length;
        for (var i = 0; i < ii; i++) {

            if (handlers[i] && (handlers[i].call(this, eventArgs) === false || (eventArgs && eventArgs.propagationStopped))) {
              break;
            }
          } 
          
    },
    registerSnapInteraction:function(interaction){
        this.snapInteractions.push(interaction);

    },
    addSnapInteractions:function(map){
        if(!map){
            return;
        }
        for(var i=0;i<this.snapInteractions.length;i++){
            map.removeInteraction(this.snapInteractions[i]);
            if(this.snapInteractions[i].getActive()){
                map.addInteraction(this.snapInteractions[i]);
            }
        }
    },
    removeSnapInteractions:function(map){
        if(!map){
            return;
        }
        for(var i=0;i<this.snapInteractions.length;i++){
            map.removeInteraction(this.snapInteractions[i]);
        }
    },
    url_needs_proxy:function(url){
        var result=false;
        if(!url){
            return result;
        }
        url=(url +'').toLowerCase();
        if(url.indexOf('/')==0){
            return result;
        }
        var pageUrl = window.location.href;
        var arr = pageUrl.split("/");
        var pageBase =arr[0] + "//" + arr[2];
        pageBase=pageBase.toLowerCase();
        
        if(url.indexOf(pageBase)==0){
            result=false;
        }else{
            result=true;
        }
        return result;

    }

};

