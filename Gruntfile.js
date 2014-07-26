module.exports = function (grunt) {

  var revision = grunt.option('revision') || '12345';
  var now = new Date;
  var cssminFiles = {};
  cssminFiles['build/style-' + revision + '.css'] = ['browser/style.css'];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          baseUrl: "./browser",
          mainConfigFile: "./browser/require.config.js",
          out: "build/app-"+revision+".js",
//          optimize:'none',
          name: "../bower_components/almond/almond",
          include: [
            'app',
            '../bower_components/raven-js/dist/raven'
          ]
        }
      }
    },
    cssmin: {
      combine: {
        files: cssminFiles
      }
    },
    processhtml: {
      options: {
        data: {
          revision: revision,
          modified: now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(),
          now: now
        }
      },
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
