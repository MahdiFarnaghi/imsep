# iMSEP
## Visual Studio Code installing
1. Install Node.js v8.15.0 (tested)
2. Install Visual Studio Code
3. Install follwing extensions
    * Debugger for Chrome
    * Vash syntax
    * vscode-icons (Optional)
    * Bracket Pair Colorizer (Optional)
## Executing's Parameters
* All usable executing/environment parameters are in [.env](.env) file
## Debug
* Use "Server/Chrome" configuration in [launch.json](.vscode/launch.json)
## Docker
* To build image:

    `docker build -t imsep .`

* Using Docker Compose:
    
    `docker-compose  -f docker-compose.yml up --build`

     `docker-compose  -f docker-compose_local.yml up --build`

* Debug: 

    Create containters with the following command:

     `docker-compose  -f docker-compose_local.debug.yml up`

     then start debuging  with the "Docker/Chrome1338" configuration


# Manual backup of DB
docker exec -t -i -e PGPASSWORD=d747db4520c046ccb5db14f39a014746 imsep_postgis  pg_dumpall -c -h 127.0.0.1 -U postgres > dumpall_result.sql

docker exec -t -i -e PGPASSWORD=d747db4520c046ccb5db14f39a014746 imsep_postgis  pg_dump -h 127.0.0.1 imsep -U postgres > dump_imsep.sql

docker exec -t -i -e PGPASSWORD=d747db4520c046ccb5db14f39a014746 imsep_postgis  pg_dump -h 127.0.0.1 imsep_gdb -U postgres > dump_imsep_gdb.sql

docker exec -t -i -e PGPASSWORD=d747db4520c046ccb5db14f39a014746 imsep_postgis  pg_dump -F c -h 127.0.0.1 imsep -U postgres > dump_imsep.tar

docker exec -t -i -e PGPASSWORD=d747db4520c046ccb5db14f39a014746 imsep_postgis  pg_dump -F c -h 127.0.0.1 imsep_gdb -U postgres > dump_imsep_gdb.tar 





