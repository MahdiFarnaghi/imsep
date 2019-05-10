var uglify_ = require('./Grunt_Uglify.js');
module.exports = function(grunt) {

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      concat: {
        options: {
          separator: ';'
        },
        app: {
          src: ['public/js/main.js',
          
                'public/js/app.js'
                ],
          dest: 'public/dist/js/app-<%= pkg.version %>-.js'
        }
      },
      uglify: uglify_
      
    });
  
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
  
    
    grunt.registerTask('default', ['concat', 'uglify']);
}