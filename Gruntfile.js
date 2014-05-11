module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          baseUrl: "./browser",
          mainConfigFile: "./browser/require.config.js",
          out: "build/app-min.js",
//          optimize:'none',
          name: "../bower_components/almond/almond",
          include: ['app']
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'build/style.css': 'browser/style.css'
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'build/index.html': 'browser/index.html'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-processhtml');

  grunt.registerTask('default', ['requirejs', 'cssmin', 'processhtml']);

};
