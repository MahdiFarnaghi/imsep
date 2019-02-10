module.exports = {
    "development": {
        operatorsAliases: false, 
        logging: false,

        "dialect": "postgres",
        "host": process.env.DB_HOSTNAME?process.env.DB_HOSTNAME:"127.0.0.1",
        "port":process.env.DB_PORT?process.env.DB_PORT:"5432",
        "database": process.env.DB_DATABASE?process.env.DB_DATABASE:"iMSEP",
        "username": process.env.DB_USERNAME?process.env.DB_USERNAME:"postgres",
        "password": process.env.DB_PASSWORD?process.env.DB_PASSWORD: "postgres"

        //"username": "root",
        //"password": null,
        //"database": "database_development",
        //"host": "127.0.0.1",

        // "dialect": "mssql",
        // "host": "127.0.0.1",
        // "database": "iMSEP",
        // "username": "sa",
        // "password":"123"

        


        // "storage": "dev-db.sqlite3",
        // "dialect": "sqlite"
    },
    "test": {
        operatorsAliases: false,
       //"username": "root",
        //"password": null,
        //"database": "database_test",
        //"host": "127.0.0.1",
        "storage": "test-db.sqlite3",
        "dialect": "sqlite"
    },
    "production": {
        operatorsAliases: false,
        logging: false,
        "dialect": "postgres",
        "host": process.env.DB_HOSTNAME?process.env.DB_HOSTNAME:"127.0.0.1",
        "port":process.env.DB_PORT?process.env.DB_PORT:"5432",
        "database": process.env.DB_DATABASE?process.env.DB_DATABASE:"iMSEP",
        "username": process.env.DB_USERNAME?process.env.DB_USERNAME:"postgres",
        "password": process.env.DB_PASSWORD?process.env.DB_PASSWORD: "postgres"


        //"username": "root",
        //"password": null,
        //"database": "database_production",
        //"host": "127.0.0.1",
     
        // "storage": "production-db.sqlite3",
        // "dialect": "sqlite"

        

    }
};
