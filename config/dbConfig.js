module.exports = {
    "development": {
        operatorsAliases: false, 
        logging: false,

        "dialect": "postgres",
        "host": "127.0.0.1",
        "database": "iMSEP",
        "username": "postgres",
        "password": "postgres"

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
        "host": "127.0.0.1",
        "database": "iMSEP",
        "username": "postgres",
        "password": "postgres"

        //"username": "root",
        //"password": null,
        //"database": "database_production",
        //"host": "127.0.0.1",
     
        // "storage": "production-db.sqlite3",
        // "dialect": "sqlite"

        

    }
};
