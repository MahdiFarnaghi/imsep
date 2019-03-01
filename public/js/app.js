//chrome.exe --remote-debugging-port=9222
var app = {
    name: 'untitled',
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
    routeServiceTokens:[
            '5b3ce3597851110001cf6248534f1763f9fd495086cc8333c25725fd',
            '5b3ce3597851110001cf624870554ac82bc24e83bca4b3c26ed4ad00',
            '5b3ce3597851110001cf6248cc2f42bbe67643b4aa56d6cd9eec9075'
    ],
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
    test: function (str) {
        alert(str);
    }

};

