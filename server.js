'use strict';
//var forceRebuildDatabase = false; // replaced with process.env.DB_REBUILD

//#region require  
var pjson = require('./package.json');
var uglify_ = require('./Grunt_Uglify.js');
//console.log(pjson.version);
var dotenv = require('dotenv');
var uuidv4 = require('uuid/v4');
var debug = require('debug');
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var fs = require('fs');
var rfs = require('rotating-file-stream');
var httpLogger = require('morgan');
var logger = require('./config/winston');

var vash= require('vash');

var compression = require('compression');
var methodOverride = require('method-override');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('express-flash');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var passport = require('passport');

var multer  = require('multer')
var memorystorage = multer.memoryStorage()
//var upload = multer({ storage: storage,limits: { fileSize: 1024 } })
//var uploadFolder = multer({ dest: 'app_data/uploads/' });
 var uploadFolder = multer.diskStorage({
     destination: function (req, file, cb) {
        var folder  ;
         if(req._uploadId)
            folder= req._uploadId;
         else{
            
            req._uploadId =folder=uuidv4();  
         }
        var app_dataDirectory = path.join(__dirname, 'app_data/');
        var uploadDirectory = path.join(app_dataDirectory, 'uploads/');
        var saveDirectory = path.join(app_dataDirectory, 'uploads/'+ folder+'/');
        try{
            fs.existsSync(app_dataDirectory) || fs.mkdirSync(app_dataDirectory);// ensure  app_data directory exists
            fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory);// ensure  upload directory exists
            fs.existsSync(saveDirectory) || fs.mkdirSync(saveDirectory);// ensure  saveDirectory exists
        }catch(ex){
            logger.log({
                level: 'error',
                message: ex.message,
                date: new Date()
            });
        }   
        cb(null, 'app_data/uploads/'+ folder+'/')
     }
      ,
      filename: function (req, file, cb) {
         cb(null,  file.originalname)
     },
  
   });
// Load environment variables from .env file
dotenv.load();
process.env.PACKAGE_VERSION=pjson.version;
global.__basedir = __dirname;

var models = require('./models/index');
// Passport OAuth strategies
var passportConfig= require('./config/passport')(passport);


//#endregion require 
//#region Controllers 

var postgresWorkspace= require('./scripts/workspaces/postgresWorkspace')({
    psqlBinPath_win:process.env.PSQL_BIN_PATH_WIN,
    psqlBinPath_linux:process.env.PSQL_BIN_PATH_LINUX,
     "host": process.env.GDB_HOSTNAME?process.env.GDB_HOSTNAME:"127.0.0.1",
     "port":process.env.GDB_PORT?process.env.GDB_PORT:"5432",
     "database": process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb",
     "user": process.env.GDB_USERNAME?process.env.GDB_USERNAME:"postgres",
     "password": process.env.GDB_PASSWORD?process.env.GDB_PASSWORD: "postgres"
},{
    //readonly connection
     "host": process.env.GDB_HOSTNAME?process.env.GDB_HOSTNAME:"127.0.0.1",
     "port":process.env.GDB_PORT?process.env.GDB_PORT:"5432",
     "database": process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb",
     "user": process.env.GDB_READONLY_USERNAME?process.env.GDB_READONLY_USERNAME:"imsep_gdb_reader",
     "password": process.env.GDB_READONLY_USERNAME_PASSWORD?process.env.GDB_READONLY_USERNAME_PASSWORD:"imsep_gdb_reader_pass"
}
);


const handleErrors=require('./controllers/util').handleErrors;
var captchaController = require('./controllers/captchaController');
var homeController = require('./controllers/homeController')();
var contactController = require('./controllers/contactController');

var validateController = require('./controllers/validateController')();
var accountController = require('./controllers/accountController')(passportConfig);
var adminController = require('./controllers/adminController')();

var mapController = require('./controllers/mapController')();
var dataLayerController = require('./controllers/dataLayerController')(postgresWorkspace);

//#endregion Controllers 
var Authenticated = accountController.ensureAuthenticated;
var authorize = accountController.makeAuthorizeMiddleware;




var app = express();

//#region LOG Settings 
var logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);// ensure log directory exists
// create a rotating write stream
var accessLogStream = rfs('http.log', {
    interval: '1d', // rotate daily
    path: logDirectory
});
if (app.get('env') === 'production') {
    app.use(httpLogger('common', {
        skip: function (req, res) { return res.statusCode < 400; }
        , stream: accessLogStream
    }));
} else {
    //app.use(httpLogger('combined', { stream: logger.stream }));
    app.use(httpLogger('dev', { stream: accessLogStream }));
    
}
//#endregion LOG 

//#region  view engine setup 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'vash');
vash.helpers.equals = function (e1, e2) {
    return e1 === e2;
};
vash.helpers.getBase64 = function (jsonObject) {
var str=new Buffer(JSON.stringify(jsonObject)).toString('base64');
//var str= btoa(JSON.stringify(jsonObject));
//var str0=atob(str);
    return str; 
};
    
//#endregion  view engine 

//#region app.use 

app.use(compression());
////app.use(compression({ threshold: 0 }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/favicon.ico', express.static('/public/favicon.ico'));
app.use('/earth48.png', express.static('/public/earth48.png'));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'})); //https://stackoverflow.com/questions/19917401/error-request-entity-too-large
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


app.use(expressValidator());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
//app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));

// customizing after authentication
app.use(async function (req, res, next) { 
    res.locals.uglify=uglify_;
    res.locals.identity = {
        name: 'anonymous'
    };
    res.locals.user = req.user ? req.user : null;
    res.locals.displayOptions = res.locals.displayOptions || {};
   // res.locals.displayOptions.uglify=uglify_;
    
    if (res.locals.user) {
        res.locals.identity.name = res.locals.user.userName;
        res.locals.identity.firstName = res.locals.user.firstName;
        res.locals.identity.lastName = res.locals.user.lastName;
        res.locals.identity.email = res.locals.user.email;
        res.locals.identity.id=res.locals.user.id;
        
        var roles = res.locals.user.BelongsToGroups.map(v => {
            return v.name;
        });
        res.locals.identity.roles = roles;

        
        if( res.locals.identity.name.toLowerCase() ==='admin'
           || res.locals.identity.name.toLowerCase() ==='superadmin'
        ){
            res.locals.identity.isAdministrator=true;    
            if( res.locals.identity.name.toLowerCase() ==='superadmin'){
                res.locals.identity.isSuperAdministrator=true;    
            }
        }else{
            res.locals.identity.isAdministrator = roles.includes('administrators');
        }
        res.locals.identity.isPowerUser = roles.includes('powerUsers');
        res.locals.identity.isDataManager = roles.includes('dataManagers');
        res.locals.identity.isDataAnalyst = roles.includes('dataAnalysts');

        res.locals.displayOptions.showMaps = true;
        
        if (await res.locals.user.checkPermissionAsync(models, { permissionName: 'Edit', contentType: 'Users' })) {
            res.locals.displayOptions.showUsers = true;
            res.locals.displayOptions.showManagement = true;
        }
        if (await res.locals.user.checkPermissionAsync(models, { permissionName: 'Edit', contentType: 'Groups' })) {
            res.locals.displayOptions.editUsers = true;
            
        }
    }
    next();
});
//app.use(express.static(path.join(__dirname, 'public')));been moved upper to prenvent midlewares multiple calls

//#endregion app.use 

//#region Routes  
app.get('/captcha', captchaController.index);
app.get('/proxy',
    [Authenticated],
    handleErrors( homeController.proxyGet));
app.post('/proxy',
    [Authenticated],
    handleErrors( homeController.proxyPost));

app.get('/', handleErrors(homeController.index));
app.get('/help', handleErrors(homeController.help));
app.get('/contact',  handleErrors(contactController.contactGet));
app.post('/contact',handleErrors( contactController.contactPost));
app.get('/account',   [Authenticated],  handleErrors( accountController.accountGet));
app.put('/account',   [Authenticated],    handleErrors(accountController.accountPut));
app.get('/account/:id/avatar', validateController.noCache,handleErrors( accountController.avatarGet));    
app.post('/account/avatar',  [Authenticated],
    multer({ storage: memorystorage,limits: { fileSize: 1024*1024*10 } }).single('avatar'),
    handleErrors( accountController.avatarPost));
app.delete('/account/avatar',   [Authenticated],   handleErrors(accountController.avatarDelete));    
app.delete('/account', [Authenticated],   handleErrors(accountController.accountDelete));
app.get('/signup', handleErrors(accountController.signupGet));
app.post('/signup',handleErrors( accountController.signupPost));

app.get('/login', handleErrors(accountController.loginGet));
app.post('/login',handleErrors( accountController.loginPost));
app.get('/forgot',handleErrors( accountController.forgotGet));
app.post('/forgot',handleErrors( accountController.forgotPost));
app.get('/reset/:token', handleErrors(accountController.resetGet));
app.post('/reset/:token',handleErrors( accountController.resetPost));

app.get('/verifyemail/:token', handleErrors(accountController.verifyemailGet));
app.get('/verifyemail/', [Authenticated], handleErrors(accountController.verifyemail_requestGet));



app.get('/logout', handleErrors(accountController.logout));
app.get('/unlink/:provider',   [Authenticated],    handleErrors(accountController.unlink));
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
//app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnToUrl || '/');
    delete req.session.returnToUrl;
}); 


app.get('/users',   [Authenticated],  handleErrors(adminController.allUsersGet));    
app.get('/admin/users',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.usersGet));



app.put('/admin/user/:id/setpassword',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.resetUserPasswordPut));
app.delete('/admin/user/:id/delete',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.deleteUserDelete));

app.get('/admin/user/:id',   [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.userGet));
app.post('/admin/user/:id',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.userPost));


    app.get('/groups',  [Authenticated], handleErrors(adminController.allGroupsGet));   

    app.get('/admin/groups',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupsGet));
    
    app.get('/admin/group/:id',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupGet));

    app.post('/admin/group/:id',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupPost));

    app.post('/admin/group/:id/members',  [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupMembersPost));

    app.delete('/admin/group/:id/delete', [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.deleteGroupDelete));

    app.get('/maps',   [Authenticated ],  handleErrors(mapController.mapsGet));

    app.get('/map/:id',   [Authenticated  ],  handleErrors(mapController.mapGet));
    
    app.post('/map/:id',   [Authenticated   ],    handleErrors(mapController.mapPost));
    app.delete('/map/:id/delete',    [Authenticated   ],    handleErrors(mapController.mapDelete));

    app.get('/map/:id/thumbnail', validateController.noCache, handleErrors(mapController.thumbnailGet));  
    app.post('/map/:id/thumbnail',    [Authenticated ],
        multer({ storage: memorystorage,limits: { fileSize: 1024*1024*10 } }).single('file'),
        handleErrors(mapController.thumbnailPost));  

    app.get('/datalayers',   [Authenticated ],   handleErrors(dataLayerController.dataLayersGet));

    app.get('/datalayer/uploadshapefile',  [Authenticated, authorize({
        anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
     handleErrors(dataLayerController.uplaodShapefileGet));  

   // var uploadFiles= multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*30 } }).array('file');
    app.post('/datalayer/uploadshapefile', [Authenticated, authorize({
        anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
     multer({ storage: uploadFolder,limits: { fileSize: 1024*1024* (parseFloat(process.env.UPLOAD_SHAPEFILE_MAX_SIZE_MB) || 30 ) } }).array('file'),

    //  function (req, res,next) {
    //      uploadFiles(req, res, function (err) {
    //     if (err) {
    //       console.log(err.message);
    //       // An error occurred when uploading
    //       return
    //     }
    //     console.log('Everything went fine');
    //     // Everything went fine
    //     next();
    //   })
   
    // },
    handleErrors(dataLayerController.uplaodShapefilePost));

    app.post('/datalayer/createfromgeojson', [Authenticated, authorize({
        anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
    multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*(parseFloat(process.env.UPLOAD_GEOJSON_MAX_SIZE_MB) || 10 ) } }).single('file'),
    handleErrors(dataLayerController.createFromGeoJSONPost));

    
    app.post('/datalayer/toShapefile',  [Authenticated, authorize({
        anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
    multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*(parseFloat(process.env.UPLOAD_GEOJSON_MAX_SIZE_MB) || 10 ) } }).single('file'),
    handleErrors(dataLayerController.geoJsonToShapefilePost));

    app.get('/datalayer/uploadraster',   [Authenticated, authorize({
        anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
    handleErrors(dataLayerController.uplaodRasterGet));  

  // var uploadFiles= multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*30 } }).array('file');
   app.post('/datalayer/uploadraster',  [Authenticated, authorize({
    anyOfRoles: 'administrators,powerUsers,dataManagers,dataAnalysts'
    })],
 
   multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*(parseFloat(process.env.UPLOAD_RASTER_MAX_SIZE_MB) || 100 ) } }).array('file'),

   //  function (req, res,next) {
   //      uploadFiles(req, res, function (err) {
   //     if (err) {
   //       console.log(err.message);
   //       // An error occurred when uploading
   //       return
   //     }
   //     console.log('Everything went fine');
   //     // Everything went fine
   //     next();
   //   })
  
   // },
   handleErrors(dataLayerController.uplaodRasterPost));


    app.get('/datalayer/:id',  [Authenticated],  handleErrors(dataLayerController.dataLayerGet));
    app.post('/datalayer/:id',    [Authenticated],    handleErrors(dataLayerController.dataLayerPost));
    app.get('/datalayer/:id/info',   [Authenticated],   handleErrors(dataLayerController.dataLayerInfoGet));
    
    app.delete('/datalayer/:id/delete',   [Authenticated],   handleErrors(dataLayerController.dataLayerDelete));
    

    app.get('/datalayer/:id/geojson',  [Authenticated],   handleErrors(dataLayerController.geojsonGet));

    
    app.get('/datalayer/:id/vectorextent',   [Authenticated],   handleErrors(dataLayerController.vectorextentGet));

    app.get('/datalayer/:id/raster',   [Authenticated],  handleErrors(dataLayerController.rasterGet));
    app.get('/datalayer/:id/rastertile',   [Authenticated],  handleErrors(dataLayerController.rasterTileGet));
    
    app.get('/datalayer/:id/analysis',   [Authenticated, authorize({anyOfRoles: 'administrators,powerUsers,dataAnalysts'})],
    handleErrors(dataLayerController.analysisGet));

    app.post('/datalayer/:id/geojson/:row',    [Authenticated],   handleErrors(dataLayerController.geojsonRowPost));

    
    
    app.get('/datalayer/:id/thumbnail', validateController.noCache, handleErrors(dataLayerController.thumbnailGet));  
    app.post('/datalayer/:id/thumbnail',    [Authenticated, authorize({anyOfRoles: 'administrators,powerUsers,dataManagers'})],
    multer({ storage: memorystorage,limits: { fileSize: 1024*1024*4 } }).single('file'),
    handleErrors(dataLayerController.thumbnailPost));  

app.get('/validate/user/username', validateController.noCache, handleErrors(validateController.validateUserUsernameGet));
app.get('/validate/user/:id/email', validateController.noCache, handleErrors(validateController.validateUserEmailGet));

app.get('/validate/group/groupname', validateController.noCache, handleErrors(validateController.validateUserGroupnameGet));


//#endregion Routes 

//#region Error Handlers 
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    var error_id = uuidv4();
    err.error_id = error_id;
    // add this line to include winston logging
    logger.log(
        {
            level: 'error',
            error_id: error_id,
            status: err.status || 500,
            message: err.message,
            originalUrl: req.originalUrl,
            method: req.method,
            ip: req.ip,
            stack: err.stack
        });

    res.locals.error = req.app.get('env') === 'development' ? err : { error_id: error_id };
    res.status(err.status || 500);
    if (req.xhr) {
        res.status(500).send({ error:  err.message,details:res.locals.error });
      }else   // render the error page
      {
        res.render('error', {
        message: err.message,
        error: res.locals.error
    });
    }
});
//#endregion Error Handlers 

//#region SERVER 
app.set('port', process.env.PORT || 3000);

(async () => {
    logger.log({
        level: 'info',
        message: 'Application started',
        date: new Date()
    });
    var forceRebuildDatabase=process.env.DB_REBUILD? (process.env.DB_REBUILD=='true'):flase;
    
    
    if (true) {
        try {
            forceRebuildDatabase= await createDb();
            console.log((process.env.DB_DATABASE?process.env.DB_DATABASE:"imsep") +' is created' );
        } catch (ex) {
            var a = 1;
        }
        if(forceRebuildDatabase){
            try {
                
                await createGDB();
                console.log((process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb") +' is created' );
            } catch (ex) {
                var a = 1;
            }
        }
        try {
                
            await createGDBreadonlyUser();
        } catch (ex) {
            //continue
            var a = 1;
        }
        
        try {
                
            await initGDB();
        } catch (ex) {
            //continue
            var a = 1;
        }
    }
  
    
    
    await models.sequelize.sync({ force: forceRebuildDatabase });
    if (forceRebuildDatabase) {
        try {
            await initDataAsync();
        } catch (ex) {
            var a = 1;
        }
    }
    
    try {
     //   await testShapefile();
    } catch (ex) {
        var b = 1;
    }
    var server = app.listen(app.get('port'), function () {
        //debug('Express server listening on port ' + server.address().port);
        //console.log()
      //  console.log('\x1b[47m\x1b[30m%s\x1b[0m', 'Server listening on port ' + server.address().port);  
       
      console.log('\x1b[42m\x1b[42m%s\x1b[32m', 'iMSEP is running on local port:' + server.address().port);  
    });
    server.timeout = 60000*10;// 10 minutes

})();
//#endregion SERVER 
async function createDb(){
    const { Client } = require('pg')
    const dbName=process.env.DB_DATABASE?process.env.DB_DATABASE:"imsep";
    var params={
        "host": process.env.DB_HOSTNAME?process.env.DB_HOSTNAME:"127.0.0.1",
        "port":process.env.DB_PORT?process.env.DB_PORT:"5432",
        //"database":dbName,
        "database":"postgres",
        "user": process.env.DB_USERNAME?process.env.DB_USERNAME:"postgres",
        "password": process.env.DB_PASSWORD?process.env.DB_PASSWORD: "postgres"
      };
    const client = new Client(params)
      
    try{
    await client.connect()
    }catch(ex){
        var a=1;
        return false
    }

    const res = await client.query('CREATE DATABASE ' + dbName)
    await client.end()
    return true;
}
async function createGDB(){
    const { Client } = require('pg')
    const dbName=process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb";
    var params={
        "host": process.env.GDB_HOSTNAME?process.env.GDB_HOSTNAME:"127.0.0.1",
        "port":process.env.GDB_PORT?process.env.GDB_PORT:"5432",
        //"database": process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb",
        "database":"postgres",
        "user": process.env.GDB_USERNAME?process.env.GDB_USERNAME:"postgres",
        "password": process.env.GDB_PASSWORD?process.env.GDB_PASSWORD: "postgres"
      }
    const client = new Client(params)
    
    try{
    await client.connect()
    }catch(ex){
        var a=1;
        return false;
    }
    
    const res = await client.query('CREATE DATABASE ' + dbName)
    await client.end()

  //const sleep = m => new Promise(r => setTimeout(r, m));
 //   await sleep (2000);

    params.database=dbName;
    const client2 = new Client(params)
    
    await client2.connect()
    
    const res2 = await client2.query('CREATE EXTENSION postgis')
    await client2.end()
   



    return true;
}
async function createGDBreadonlyUser(){

    //to remove role
   /*
   ALTER USER imsep_gdb_reader
	NOLOGIN
	NOINHERIT;
REASSIGN owned by imsep_gdb_reader to postgres;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM imsep_gdb_reader;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM imsep_gdb_reader;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM imsep_gdb_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES  from imsep_gdb_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES  from imsep_gdb_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON FUNCTIONS  from imsep_gdb_reader;
revoke USAGE ON SCHEMA public from imsep_gdb_reader;
revoke CONNECT ON DATABASE imsep_gdb  from  imsep_gdb_reader;
drop role imsep_gdb_reader;
   
   */


    const { Client } = require('pg')
    const dbName=process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb";
    const userName=process.env.GDB_READONLY_USERNAME?process.env.GDB_READONLY_USERNAME:"imsep_gdb_reader";
    const userPass=process.env.GDB_READONLY_USERNAME_PASSWORD?process.env.GDB_READONLY_USERNAME_PASSWORD:"imsep_gdb_reader_pass";
    var params={
        "host": process.env.GDB_HOSTNAME?process.env.GDB_HOSTNAME:"127.0.0.1",
        "port":process.env.GDB_PORT?process.env.GDB_PORT:"5432",
        //"database": process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb",
        "database":"postgres",
        "user": process.env.GDB_USERNAME?process.env.GDB_USERNAME:"postgres",
        "password": process.env.GDB_PASSWORD?process.env.GDB_PASSWORD: "postgres"
      }
    const client = new Client(params)
    
    try{
    await client.connect()
    }catch(ex){
        var a=1;
        return false;
    }
    var q=`CREATE ROLE ${userName} LOGIN PASSWORD '${userPass}'; `;
    try{
    const res = await client.query(q)
    }catch(eee){}
     q=` GRANT CONNECT ON DATABASE ${dbName}  to  ${userName}; `;
    try{
        const res = await client.query(q)
      }catch(eee){}
        
    await client.end()

    params.database=dbName;
    const client2 = new Client(params)
    
    await client2.connect()
    var q2=`
    GRANT USAGE ON SCHEMA public TO ${userName};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${userName};
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ${userName};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${userName};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO ${userName}; `;
    const res2 = await client2.query(q2)
    await client2.end()
   

    return true;
}
async function initGDB(){
    const { Client } = require('pg')
    const dbName=process.env.GDB_DATABASE?process.env.GDB_DATABASE:"imsep_gdb";
    var params={
        "host": process.env.GDB_HOSTNAME?process.env.GDB_HOSTNAME:"127.0.0.1",
        "port":process.env.GDB_PORT?process.env.GDB_PORT:"5432",
        "database": dbName,
        "database":"postgres",
        "user": process.env.GDB_USERNAME?process.env.GDB_USERNAME:"postgres",
        "password": process.env.GDB_PASSWORD?process.env.GDB_PASSWORD: "postgres"
      }
   
     const client2 = new Client(params)
    
    await client2.connect()
    
    const res2 = await client2.query(`ALTER DATABASE "${dbName}" SET postgis.gdal_enabled_drivers= 'ENABLE_ALL';`)
    await client2.end()
  
    return true;
}


async function initDataAsync() {
    var superAdmin = await models.User.create({ userName: 'superadmin', password: '8001msep#Aom1n', parent: null });
    var admin = await models.User.create({ userName: 'admin', password: process.env.INIT_ADMIN_PASSWORD?process.env.INIT_ADMIN_PASSWORD:'80fmsep#',  parent: superAdmin.id });
    
    var administrators = await models.Group.create({ name: 'administrators',type:'system', ownerUser: admin.id });
    await administrators.setUsers([superAdmin, admin]);
    var allUsers = await models.Group.create({ name: 'users',type:'hidden', ownerUser: admin.id });
    await allUsers.setUsers([superAdmin, admin]);

    var powerUsers = await models.Group.create({ name: 'powerUsers',type:'system', ownerUser: admin.id });
    var dataManagers = await models.Group.create({ name: 'dataManagers',type:'system', ownerUser: admin.id });
    var dataAnalysts = await models.Group.create({ name: 'dataAnalysts',type:'system', ownerUser: admin.id });

    var p1 = await models.Permission.create(
        {
            contentType: 'Users',
            contentId: null,
            permissionName: 'Edit',
            grantToType: 'group',
            grantToId: administrators.id,
            insertedByUserId: admin.id
        });
   var p2=  await models.Permission.create(
        {
            contentType: 'Users',
            contentId: null,
            permissionName: 'Edit',
            grantToType: 'group',
            grantToId: powerUsers.id,
            insertedByUserId: admin.id
        });
   
}
