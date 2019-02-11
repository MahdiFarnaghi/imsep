var pg = require('pg');

module.exports.init_db = function(callback) {
    var dbName = 'db_name',
        username = 'postgres',
        password = 'password',
        host = 'localhost'

    var conStringPri = 'postgres://' + username + ':' + password + '@' + host + '/postgres';
    var conStringPost = 'postgres://' + username + ':' + password + '@' + host + '/' + dbName;

    // connect to postgres db
    pg.connect(conStringPri, function(err, client, done) { 
        // create the db and ignore any errors, for example if it already exists.
        client.query('CREATE DATABASE ' + dbName, function(err) {
            //db should exist now, initialize Sequelize
            var sequelize = new Sequelize(conStringPost);
            callback(sequelize);
            client.end(); // close the connection
        });
    });
};