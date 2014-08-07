define('app', [
  'jquery', 'backbone', 'marionette', 'socket.io-client',
  'map', 'vent', 'reqres', 'models', 'views', 'config'
], function ($, backbone, marionette, io, map, vent, reqres, models, views, config) {

  var App = Marionette.Application.extend({
    initData: function () {
      this.markerCollection = new models.MarkerCollection();
    },

    initEvents: function () {
      var _this = this;
      vent.on('add:marker', function (originalData) {
        var markerId = (Math.random() + 1).toString(36).substring(7);
        var cords = map.getCenter();
        var data = _.extend({
          lat: cords[0],
          lng: cords[1]
        } ,originalData, {
          id: markerId
        });
        _this.markerCollection.add(new models.Marker(data));
        var socket = reqres.request('socket');
        socket.emit('add:marker', data);
      });
      vent.on('panel:ready', function (model) {
        var markersView = new views.MarkersView({
          collection: _this.markerCollection
        });
        _this.panelRegion.show(markersView);
      });
    },
    initSocket: function () {
      var socket = io.connect(config.serverUrl + ':' + config.browserPort);
      reqres.setHandler('socket', function () {
        return socket;
      })
    },

    initRegions: function () {
      var _this = this;
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



