//chrome.exe --remote-debugging-port=9222
var app = {
    name: 'untitled',
    layout:'ltr',
    language:'en',
    version: '1.0.0',
    identity: undefined,
    pageData:{},

    // init map extent settings are filled in layout.vash from env settings
    initMap_Lon:37.41,
    initMap_Lat:9,
    initMap_Zoom:4,

    OSM_REQUEST_TIMEOUT:20000,//ms
    OSM_FEATURE_COUNT_LIMIT1:100000,//confirm zone
    OSM_FEATURE_COUNT_LIMIT2:500000,

    MAx_TABLE_VIEW_RECORDS:1000,

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
    set_ROUTE_SERVICE_TOKENS: function(v){
        if(v){
         this.routeServiceTokens= v.split(',');   
        }
    },
    test: function (str) {
        alert(str);
    }

};

