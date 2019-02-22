'use strict';
//var forceRebuildDatabase = false; // replaced with process.env.DB_REBUILD
//var forceRebuildDatabase_seedTestData = false;// replaced with process.env.DB_SEED

//#region require  
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
//var uploadFolder = multer({ dest: 'uploads/' });
 var uploadFolder = multer.diskStorage({
     destination: function (req, file, cb) {
        var folder  ;
         if(req._uploadId)
            folder= req._uploadId;
         else{
            
            req._uploadId =folder=uuidv4();  
         }
        var uploadDirectory = path.join(__dirname, 'uploads/');
        var saveDirectory = path.join(__dirname, 'uploads/'+ folder+'/');
        try{
            fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory);// ensure  upload directory exists
            fs.existsSync(saveDirectory) || fs.mkdirSync(saveDirectory);// ensure  saveDirectory exists
        }catch(ex){
            logger.log({
                level: 'error',
                message: ex.message,
                date: new Date()
            });
        }   
        cb(null, 'uploads/'+ folder+'/')
     }
      ,
      filename: function (req, file, cb) {
         cb(null,  file.originalname)
     },
  
   });
// Load environment variables from .env file
dotenv.load();
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
});
// var postgresWorkspace= new PostgresWorkspace({
//       'host': '127.0.0.1',
//        'database': 'postgis_24_sample',
//        'user': 'postgres',
//        'password': 'postgres'
// })

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

    res.locals.identity = {
        name: 'anonymous'
    };
    res.locals.user = req.user ? req.user : null;
    res.locals.displayOptions = res.locals.displayOptions || {};
    
    
    if (res.locals.user) {
        res.locals.identity.name = res.locals.user.userName;
        res.locals.identity.id=res.locals.user.id;
        //user.isAdministrator = await user.isInGroupAsync('administrators'); // used for menu renderering
        var roles = res.locals.user.BelongsToGroups.map(v => {
            return v.name;
        });
        res.locals.identity.roles = roles;

        //res.locals.user.isAdministrator = (res.locals.user.BelongsToGroups.find((v) => {
        //    return v.name == 'administrators';
        //}) != null);
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
app.get('/contact',
    // [Authenticated, authorize({
        
    //     role: 'administrators',//or 👇
    //   //  anyOfRoles: 'dataManagers,dataAnalysts',//or 👇
    //  //   allRoles: 'dataManagers,dataAnalysts',//or 👇
    //     check: async user => {
    //         //return await req.user.checkPermissionAsync(models, { permissionName: 'Edit', contentType: 'Users' });

    //         if (await user.isInGroupAsync('dataManagers')
    //             || await user.isInGroupAsync('dataAnalysts')
    //         ) {
    //             return true;
    //         }
    //     }

    //  })],
    handleErrors(contactController.contactGet));
app.post('/contact',handleErrors( contactController.contactPost));
app.get('/account',
    [Authenticated],
    handleErrors( accountController.accountGet));
app.put('/account',
    [Authenticated],
    handleErrors(accountController.accountPut));
app.get('/account/:id/avatar', validateController.noCache,handleErrors( accountController.avatarGet));    
app.post('/account/avatar',
    [Authenticated],
    multer({ storage: memorystorage,limits: { fileSize: 1024*1024*10 } }).single('avatar'),
    handleErrors( accountController.avatarPost));
app.delete('/account/avatar',
    [Authenticated],
    handleErrors(accountController.avatarDelete));    
app.delete('/account',
    [Authenticated],
    handleErrors(accountController.accountDelete));
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
app.get('/unlink/:provider',
    [Authenticated],
    handleErrors(accountController.unlink));
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
//app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnToUrl || '/');
    delete req.session.returnToUrl;
}); 


app.get('/users',
    [Authenticated],
    handleErrors(adminController.allUsersGet));    
    

app.get('/admin/users',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.usersGet));



app.put('/admin/user/:id/setpassword',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.resetUserPasswordPut));
app.delete('/admin/user/:id/delete',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.deleteUserDelete));

app.get('/admin/user/:id',
    
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.userGet));
app.post('/admin/user/:id',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Users'
    })],
    handleErrors(adminController.userPost));


    app.get('/groups',
    [Authenticated],
    handleErrors(adminController.allGroupsGet));   

    app.get('/admin/groups',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupsGet));
    
    app.get('/admin/group/:id',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupGet));

    app.post('/admin/group/:id',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupPost));

    app.post('/admin/group/:id/members',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.groupMembersPost));

    app.delete('/admin/group/:id/delete',
    [Authenticated, authorize({
        users: 'superadmin,admin', //or 👇
        role: 'administrators', //or 👇
        permissionName: 'Edit', contentType: 'Groups'
    })],
    handleErrors(adminController.deleteGroupDelete));

    app.get('/maps',
    [Authenticated ],
    handleErrors(mapController.mapsGet));

    app.get('/map/:id',
    // authorize(),
    [Authenticated
    //     , authorize({
    //     role: 'administrators',//or 👇
    //     anyOfRoles: 'dataManagers,dataAnalysts'//,//or 👇
    //  //   allRoles: 'dataManagers,dataAnalysts',//or 👇
    //     // check: async user => {
    //     //     //return await req.user.checkPermissionAsync(models, { permissionName: 'Edit', contentType: 'Users' });

    //     //     if (await user.isInGroupAsync('dataManagers')
    //     //         || await user.isInGroupAsync('dataAnalysts')
    //     //     ) {
    //     //         return true;
    //     //     }
    //     // }
    //  })
    ],
    handleErrors(mapController.mapGet));
    
    app.post('/map/:id',
    [Authenticated   ],
    handleErrors(mapController.mapPost));
    app.delete('/map/:id/delete',
    [Authenticated   ],
    handleErrors(mapController.mapDelete));

    app.get('/map/:id/thumbnail', validateController.noCache, handleErrors(mapController.thumbnailGet));  
    app.post('/map/:id/thumbnail',
        [Authenticated ],
        multer({ storage: memorystorage,limits: { fileSize: 1024*1024*10 } }).single('file'),
        handleErrors(mapController.thumbnailPost));  

    app.get('/datalayers',
    [Authenticated ],
    handleErrors(dataLayerController.dataLayersGet));

    app.get('/datalayer/uploadshapefile',
    [Authenticated, authorize({
        anyOfRoles: 'administrators,dataManagers'
    })],
     handleErrors(dataLayerController.uplaodShapefileGet));  

   // var uploadFiles= multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*30 } }).array('file');
    app.post('/datalayer/uploadshapefile',
    [Authenticated, authorize({
        anyOfRoles: 'administrators,dataManagers'
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

    app.post('/datalayer/createfromgeojson',
    [Authenticated, authorize({
        anyOfRoles: 'administrators,dataManagers'
    })],
    multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*(parseFloat(process.env.UPLOAD_GEOJSON_MAX_SIZE_MB) || 10 ) } }).single('file'),
    handleErrors(dataLayerController.createFromGeoJSONPost));

    
    app.post('/datalayer/toShapefile',
    [Authenticated, authorize({
        anyOfRoles: 'administrators,dataManagers'
    })],
    multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*(parseFloat(process.env.UPLOAD_GEOJSON_MAX_SIZE_MB) || 10 ) } }).single('file'),
    handleErrors(dataLayerController.geoJsonToShapefilePost));

    app.get('/datalayer/uploadraster',
    [Authenticated, authorize({
        anyOfRoles: 'administrators,dataManagers'
    })],
    handleErrors(dataLayerController.uplaodRasterGet));  

  // var uploadFiles= multer({ storage: uploadFolder,limits: { fileSize: 1024*1024*30 } }).array('file');
   app.post('/datalayer/uploadraster',
   [Authenticated, authorize({
    anyOfRoles: 'administrators,dataManagers'
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


    app.get('/datalayer/:id',
//    [Authenticated, authorize({anyOfRoles: 'administrators,dataManagers'})],
    [Authenticated],
    handleErrors(dataLayerController.dataLayerGet));
    app.post('/datalayer/:id',
    //[Authenticated, authorize({anyOfRoles: 'administrators,dataManagers'})],
    [Authenticated],
    handleErrors(dataLayerController.dataLayerPost));
    app.get('/datalayer/:id/info',
    [Authenticated], //Todo: check data permission
    handleErrors(dataLayerController.dataLayerInfoGet));
    
    app.delete('/datalayer/:id/delete',
    //[Authenticated, authorize({anyOfRoles: 'administrators,dataManagers'})],
    [Authenticated],
    handleErrors(dataLayerController.dataLayerDelete));
    

    app.get('/datalayer/:id/geojson',
    [Authenticated], //Todo: check data permission
    handleErrors(dataLayerController.geojsonGet));

    
    app.get('/datalayer/:id/vectorextent',
    [Authenticated], //Todo: check data permission
    handleErrors(dataLayerController.vectorextentGet));

    app.get('/datalayer/:id/raster',
    [Authenticated], //Todo: check data permission
    handleErrors(dataLayerController.rasterGet));
    
    app.get('/datalayer/:id/analysis',
    [Authenticated, authorize({anyOfRoles: 'administrators,dataAnalysts'})],
    handleErrors(dataLayerController.analysisGet));

    app.post('/datalayer/:id/geojson/:row',
    [Authenticated, authorize({anyOfRoles: 'administrators,dataManagers'})],
    handleErrors(dataLayerController.geojsonRowPost));

    
    
    app.get('/datalayer/:id/thumbnail', validateController.noCache, handleErrors(dataLayerController.thumbnailGet));  
    app.post('/datalayer/:id/thumbnail',
    [Authenticated, authorize({anyOfRoles: 'administrators,dataManagers'})],
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
    var forceRebuildDatabase_seedTestData=process.env.DB_SEED? (process.env.DB_SEED=='true'):flase;
    
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
                
            await initGDB();
        } catch (ex) {
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
        if(forceRebuildDatabase_seedTestData){
            try {
                await initTestDataAsync();
            } catch (ex) {
                var a = 1;
            }
            try {
                await testDataAsync();
            } catch (ex) {
                var b = 1;
            }
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
    var superAdmin = await models.User.create({ userName: 'superadmin', password: '8001msep#', parent: null });
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
async function initTestDataAsync() {
    var superAdmin = await models.User.findOne({ where: { userName: 'superadmin' } });
    var admin = await models.User.findOne({ where: { userName: 'admin' } });
    var administrators = await models.Group.findOne({ where: { name: 'administrators' } });
    var allUsers = await models.Group.findOne({ where: { name: 'users' } });
    var powerUsers = await models.Group.findOne({ where: { name: 'powerUsers' } });
    var dataManagers = await models.Group.findOne({ where: { name: 'dataManagers' } });
    var dataAnalysts = await models.Group.findOne({ where: { name: 'dataAnalysts' } });
    

    var admin2 = await models.User.create({ userName: 'admin2', password: 'admin2', parent: superAdmin.id });

    var pU1 = await models.User.create({ userName: 'pU1', password: '1234', email:'pu1@test.com', parent: admin.id });
    var pU2 = await models.User.create({ userName: 'pU2', password: '1234', email: 'pu2@test.com', parent: admin.id });

    var U1 = await models.User.create({ userName: 'U1', password: '1234', email: 'u1@test.com', parent: pU1.id });
    var U2 = await models.User.create({ userName: 'U2', password: '1234', email: 'u2@test.com', parent: pU1.id });
    var U3 = await models.User.create({ userName: 'U3', password: '1234', email: 'u3@test.com', parent: pU2.id });
    var U4 = await models.User.create({ userName: 'U4', password: '1234', email: 'u4@test.com', parent: pU2.id });

    await administrators.setUsers([superAdmin, admin, admin2]);
    await allUsers.setUsers([superAdmin, admin, admin2,pU1,pU2,U1,U2,U3,U4]);
   
    dataManagers.setUsers([pU1]);
    dataManagers.setUsers([ U1]);
    dataAnalysts.setUsers([pU2,U3])

    powerUsers.setUsers([pU1, pU2]);
    var pU1_G1;
    await models.Group.create({ name: 'pU1_G1', ownerUser: pU1.id }).
        then((g) => {
            pU1_G1 = g;
            g.setUsers(
                [
                    U1,
                    U2
                ]
            );
        });

    var pU1_G2 = await models.Group.create({ name: 'pU1_G2', ownerUser: pU1.id });
    pU1_G2.setUsers([
        U2
    ]);
    var pU2_G1 = await models.Group.create({ name: 'pU2_G1', ownerUser: pU2.id });
    pU2_G1.setUsers(
        [U3]
    );

    var sharp= require('sharp');
    const thumbnail = await sharp(path.join(__dirname, '/public/images/testMap.png'))
    .resize(96)
    .png()
    .toBuffer();

    var adminlayer1 = await models.DataLayer.create({ name: 'parcels_webmercator', dataType: 'vector',description:'Parcels with web mercator projection ....', ownerUser: admin.id,thumbnail:thumbnail, 
        details:JSON.stringify({
            datasetName:'parcels_webmercator',
            workspace:'postgres',
            datasetType:'vector',
            shapeType:'MultiPolygon',

            fields:undefined,
            styles:[],
            defaultField:'',
            shapeField:'geom',
            oidField:'gid',
            spatialReference:{name:'EPSG:3857'}
        })
    });

    var u1layer1 = await models.DataLayer.create({ name: 'parcels_geo', dataType: 'vector',description:'parcels in geographical coordinate system ....', ownerUser: U1.id,thumbnail:thumbnail, 
    details:JSON.stringify({
        datasetName:'parcels_geo',
        workspace:'postgres',
        datasetType:'vector',
        shapeType:'MultiPolygon',

        fields:undefined,
        styles:[],
        defaultField:'',
        shapeField:'geom',
        oidField:'gid',
        spatialReference:{name:'EPSG:4326'}
    })
});
    var layer2 = await models.DataLayer.create({ name: 'circuit', dataType: 'vector',description:'Descriptions of Circuit ....', ownerUser: U1.id, 
    details:JSON.stringify({
        datasetName:'circuit',
        workspace:'postgres',
        datasetType:'vector',
        shapeType:'MultiLineString',

        fields:undefined,
        styles:[],
        defaultField:'',
        shapeField:'geom',
        oidField:'gid',
        spatialReference:{name:'EPSG:4326'}
    })
});
    var u2layer1 = await models.DataLayer.create({ name: 'tower', dataType: 'vector', ownerUser: U2.id,thumbnail:thumbnail,
    details:JSON.stringify({
        datasetName:'tower',
        workspace:'postgres',
        datasetType:'vector',
        shapeType:'Point',

        fields:undefined,
        styles:[],
        defaultField:'',
        shapeField:'geom',
        oidField:'gid',
        spatialReference:{name:'EPSG:4326'}
    })
});
    var layer3 = await models.DataLayer.create({ name: "' drop schema public cascade; -- ",description:'This is a test for sql injection test', dataType: 'vector', ownerUser: U2.id });

    var adminlayer2 = await models.DataLayer.create({ name: 'parcels utm40', dataType: 'vector',description:'parcels utm40 descriptions ....', ownerUser: admin.id,thumbnail:thumbnail, 
    details:JSON.stringify({
        datasetName:'parcels_utm40',
        workspace:'postgres',
        datasetType:'vector',
        shapeType:'MultiPolygon',

        fields:undefined,
        styles:[],
        defaultField:'',
        shapeField:'geom',
        oidField:'gid',
        spatialReference:{name:'EPSG:32640',proj4:'+proj=utm +zone=40 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'}
    })
});
   
    var adminMap1 = await models.Map.create({
             name: 'map1',
             description:'Map1 Description',
             ext_north:40,
             ext_east:64.1,
             ext_south:25.2,
             ext_west:43,
              ownerUser: admin.id,thumbnail:thumbnail });
    var adminMap2 = await models.Map.create({ name: 'map2',  ownerUser: admin.id });

    var u1map1 = await models.Map.create({ name: 'map1',  ownerUser: U1.id });
    var u1map2 = await models.Map.create({ name: 'map2',  ownerUser: U1.id });
    

    //todo: administrators can Edit U1's Users
   
      await models.Permission.create(
        {
            contentType: 'Users',
            contentId: null,
            permissionName: 'Edit',
            grantToType: 'user',
            grantToId: pU1.id,
            insertedByUserId: admin.id
        });
     
     
     await models.Permission.create(
        {
            contentType: 'Users',
            contentId: null,
            permissionName: 'Edit',
            grantToType: 'user',
            grantToId: U1.id,
            insertedByUserId: admin.id
        });

        await models.Permission.create(
            {
                contentType: 'Groups',
                contentId: null,
                permissionName: 'Edit',
                grantToType: 'user',
                grantToId: pU1.id,
                insertedByUserId: admin.id
            });
            await models.Permission.create(
                {
                    contentType: 'Groups',
                    contentId: null,
                    permissionName: 'Edit',
                    grantToType: 'user',
                    grantToId: pU2.id,
                    insertedByUserId: admin.id
                });
    

    //todo: U2 can Edit U1's layer2
    var p2 = await models.Permission.create(
        {
            contentType: 'DataLayer',
            contentId: layer2.id,
            permissionName: 'Edit',
            grantToType: 'group',
            grantToId: pU1_G1.id,
            insertedByUserId: U1.id
        });
        var p2_shareEditWithAllUsers = await models.Permission.create(
            {
                contentType: 'DataLayer',
                contentId: u1layer1.id,
                permissionName: 'Edit',
                grantToType: 'group',
                grantToId: allUsers.id,
                insertedByUserId: U1.id
            });        
        var p3_shareViewWithAllUsers = await models.Permission.create(
            {
                contentType: 'DataLayer',
                contentId: layer2.id,
                permissionName: 'View',
                grantToType: 'group',
                grantToId: allUsers.id,
                insertedByUserId: U1.id
            }); 
            var p2_shareEditWithAllUsers = await models.Permission.create(
                {
                    contentType: 'DataLayer',
                    contentId: adminlayer2.id,
                    permissionName: 'test',
                    grantToType: 'user',
                    grantToId: U3.id,
                    insertedByUserId: U1.id
                });         
    var p3 = await models.Permission.create(
        {
            contentType: 'DataLayer',
            contentId: layer2.id,
            permissionName: 'View',
            grantToType: 'group',
            grantToId: pU1_G2.id,
            insertedByUserId: U1.id
        });
    var p4 = await models.Permission.create(
        {
            contentType: 'DataLayer',
            contentId: layer2.id,
            permissionName: 'View',
            grantToType: 'user',
            grantToId: U4.id,
            insertedByUserId: U1.id
        });
    ////console.log(
    ////    await admin.isInGroupAsync(administrators)
    ////);
    ////console.log(
    ////    await admin.isInGroupAsync('administrators')
    ////);
    ////console.log(
    ////    await admin.isInGroupByNameAsync('administrators')
    ////);
    ////console.log(
    ////    await U1.isInGroupByNameAsync('administrators')
    ////);
}
async function testDataAsync() {
    var superAdmin = await models.User.findOne({ where: { userName: 'superadmin' } });

    var checkPassword = await superAdmin.comparePassword('aaa');
    var checkPassword2 = await superAdmin.comparePassword('superadmin');

    var admin = await models.User.findOne({ where: { userName: 'admin' } });

    var admin2 = await models.User.findOne({ where: { userName: 'admin2' } });

    var pU1 = await models.User.findOne({ where: { userName: 'pU1'.toLowerCase() } });

    var pU2 = await models.User.findOne({ where: { userName: 'pU2'.toLowerCase() } });
    var U1 = await models.User.findOne({ where: { userName: 'U1'.toLowerCase() } });



    var administrators = await models.Group.findOne({ where: { name: 'administrators' } });

    var powerUsers = await models.Group.findOne({ where: { name: 'powerUsers' }, include: [{ model: models.User, as: 'Users' }, { model: models.User, as: 'OwnerUser' }] });

    var pU1_Permissions1 = await models.Permission.findAll({
        where: {
            contentType: 'Users',
            permissionName: 'Edit',
            grantToType: 'group'
        },
        include: [
            {
                model: models.Group, as: 'assignedToGroup',
                required: true,
                include: [
                    {
                        model: models.User, as: 'Users',
                        required: true,
                        where: {
                            id: pU1.id
                        }
                    }
                    ]
            }
            ]
    }
    );
    var pU1_Permissions2 = await models.Permission.findAll({
        where: {
            contentType: 'Users',
            permissionName: 'Edit',
            grantToType: 'user'
        },
        include: [
            {
                model: models.User, as: 'assignedToUser',
                required: true,
                where: {
                    id: pU1.id
                }
            }
        ]
    }
    );

    //console.log(powerUsers);

    var layer2 = await models.DataLayer.findOne({ where: { name: 'layer2' } });

    var layer2_full = await models.DataLayer.findOne({ where: { name: 'layer2' }, include: [{ model: models.Permission, as: 'Permissions' }] });

    var permission1 = await models.Permission.findOne({ where: { contentType: 'DataLayer' }, include: [{ model: models.DataLayer, as: 'forDataLayer' }] });


    console.log(
        'admin.isInGroupAsync(administrators)'+ await admin.isInGroupAsync(administrators)
    );
    console.log(
        'admin.isInGroupAsync(\'administrators\')' + await admin.isInGroupAsync('administrators')
    );
    console.log(
        `admin.isInGroupByNameAsync('administrators')` +await admin.isInGroupByNameAsync('administrators')
    );
    console.log(
        `U1.isInGroupByNameAsync('administrators')` + await U1.isInGroupByNameAsync('administrators')
    );
}

async function testShapefile(){
    //https://github.com/mapbox/node-srs   projection
    // Note:
    //  node-pre-gyp WARN Using request for node-pre-gyp https download
    //[gdal] Success: "D:\Works\iMSEP\src\Repos\iMSEP\node_modules\gdal\lib\binding\node-v57-win32-x64\gdal.node" is installed via remote

    var shapefile = require("shapefile");
    var srs = require('srs');
    var fs = require('fs');

    var shpfilePath="D:\\Works\\Data\\Export_Output1.shp";
    var prjfilePath="D:\\Works\\Data\\Export_Output1.prj";
    var esri_srs = fs.readFileSync(prjfilePath).toString();
    var esri_result = srs.parse('ESRI::'+esri_srs);
//shapefile.open("d:/testShp/lines.shp")
shapefile.open(shpfilePath)
  .then(source => source.read()
    .then(function log(result) {
      if (result.done) return;
      console.log(result.value);
      return source.read().then(log);
    }))
  .catch(error => console.error(error.stack));

  postgresWorkspace.query({
    text:'SELECT NOW()'
  }).then(results =>{

    var a=1;
  });

  var q=`SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(feature)
  )
  FROM (
    SELECT jsonb_build_object(
      'type',       'Feature',
      'id',         gid,
      'geometry',   ST_AsGeoJSON(geom)::jsonb,
      'properties', to_jsonb(inputs) - 'gid' - 'geom'
    ) AS feature
    FROM (
      SELECT * FROM parcels_geo
    ) inputs
  ) features;`
  postgresWorkspace.query({
    text:q
  }).then(results =>{
  console.log(results.rows[0]['jsonb_build_object']);
    var a=1;
  });
}