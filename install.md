# iMSEP
## Visual Studio Code installing
1. install Visual Studio Code
2. install follwing extensions
    * Debugger for Chrome
    * Vash syntax
    * vscode-icons
    * Bracket Pair Colorizer

3. Clone GIT Repository 
## Executing's Parameters
* All the usable executing/environment parameters are in [.env](.env) file
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





