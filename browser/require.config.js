require.config({
  paths: {
    backbone: '../bower_components/backbone/backbone',
    'backbone.wreqr': '../bower_components/backbone.wreqr/lib/backbone.wreqr',
    'backbone.modelbinder': '../bower_components/backbone.modelbinder/Backbone.Modelbinder',
    jquery: '../bower_components/jquery/dist/jquery',
    'jquery-simple-color': '../bower_components/jquery-simple-color/src/jquery.simple-color',
    'hbs': '../bower_components/hbs/hbs',
    'hbs/handlebars': '../bower_components/hbs/hbs/handlebars',
    'marionette':'../bower_components/marionette/lib/backbone.marionette',
    underscore: '../bower_components/underscore/underscore',
    'socket.io-client': '../bower_components/socket.io-client/socket.io'
  },
  hbs: {
    disableI18n: true
  },
  shim:{
    'jquery-simple-color':{
      deps:['jquery'],
      exports:'$.fn.simpleColor'
    }
  }
});
