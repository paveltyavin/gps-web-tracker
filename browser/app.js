define('app', [
  'jquery', 'backbone', 'marionette', 'socket.io-client',
  'map', 'vent', 'reqres', 'models', 'views', 'config'
], function ($, backbone, marionette, io, map, vent, reqres, models, views, config) {

  var App = Marionette.Application.extend({
    initData: function () {
      this.geoObjectsCollection = new models.GeoObjectsCollection();
    },
    initEvents: function () {
      var socket = reqres.request('socket');
      var _this = this;
      vent.on('add:marker', function (originalData) {
        var markerId = (Math.random() + 1).toString(36).substring(7);
        var cords = map.getCenter();
        var data = _.extend({
          lat: cords[0],
          lng: cords[1]
        }, originalData, {
          id: markerId
        });
        _this.geoObjectsCollection.add(new models.Marker(data));
        socket.emit('add:marker', data);
      });

      vent.on('add:polygon', function (originalData) {
        var polygonId = (Math.random() + 1).toString(36).substring(7);
        var cords = map.getCenter();
        var bounds = map.getBounds();
        var dx = (bounds[0][0] - bounds[1][0])*0.1;
        var dy = (bounds[0][1] - bounds[1][1])*0.02;
        var data = _.extend({
          coordinates: [[
            [cords[0] + dx, cords[1] - dy],
            [cords[0] + dx, cords[1] + dy],
            [cords[0] - dx, cords[1] + dy],
            [cords[0] - dx, cords[1] - dy]
          ],[]]
        }, originalData, {
          id: polygonId
        });
        _this.geoObjectsCollection.add(new models.Polygon(data));
        socket.emit('add:polygon', data);
      });
    },
    initSocket: function () {
      var socket = io.connect(config.serverUrl + ':' + config.browserPort);
      reqres.setHandler('socket', function () {
        return socket;
      });
    },

    initRegions: function () {
      var _this = this;
      this.addRegions({
        panelRegion: "#panel"
      });
      var socket = reqres.request('socket');
      socket.on('connect', function () {
        var view = new views.GeoObjectsView({
          collection: _this.geoObjectsCollection
        });
        _this.panelRegion.show(view);
      });
      socket.on('disconnect', function () {
        _this.panelRegion.empty();
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



