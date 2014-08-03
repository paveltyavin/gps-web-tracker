define('app', [
  'jquery', 'backbone', 'marionette', 'socket.io-client',
  'map', 'vent','reqres', 'models','views', 'config'
], function ($, backbone, marionette, io,  map, vent, reqres, models, views, config) {

  var App = Marionette.Application.extend({
    initData: function () {
      this.markerCollection = new models.MarkerCollection();
    },

    initEvents: function () {
      var _this = this;
      vent.on('add:marker', function (originalData) {
        var markerId = (Math.random() + 1).toString(36).substring(7);
        var data = {
          id: markerId,
          lat: originalData.lat,
          lng: originalData.lng
        };
//        _this.markerCollection.add(new Marker(data));
//        socket.emit('add:marker', data);
      });
      vent.on('click:marker', function (model) {
        var markerView = new views.MarkerView({
          model: model
        });
        _this.panelRegion.show(markerView);
      });
    },
    initSocket: function(){
      var socket = io.connect(config.serverUrl + ':' + config.browserPort);
      reqres.setHandler('socket', function(){
        return socket;
      })
    },

    initRegions: function(){
      this.addRegions({
        panelRegion: ".panel"
      });
    },

    onStart: function () {
      this.initSocket();
      this.initData();
      this.initEvents();
      this.initRegions();
    }
  });

  return new App;
});



