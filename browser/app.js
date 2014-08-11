define('app', [
  'jquery', 'backbone', 'marionette', 'socket.io-client',
  'map', 'vent', 'reqres', 'models', 'views/panel', 'views/map', 'config'
], function ($, backbone, marionette, io, map, vent, reqres, models, panelViews, mapViews, config) {

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
        var model = new models.Polygon(data);
        _this.geoObjectsCollection.add(model);
        _this.mapObjectsView.children.findByModel(model).geoObject.editor.startEditing();
        socket.emit('add:polygon', data);
      });

      vent.on('add:line', function (originalData) {
        var lineId = (Math.random() + 1).toString(36).substring(7);
        var cords = map.getCenter();
        var bounds = map.getBounds();
        var dx = (bounds[0][0] - bounds[1][0])*0.1;
        var dy = (bounds[0][1] - bounds[1][1])*0.02;
        var data = _.extend({
          coordinates: [
            [cords[0] + dx, cords[1] - dy],
            [cords[0] + dx, cords[1] + dy],
            [cords[0] - dx, cords[1] - dy],
            [cords[0] - dx, cords[1] + dy]
          ]
        }, originalData, {
          id: lineId
        });
        var model = new models.Line(data);
        _this.geoObjectsCollection.add(model);
        _this.mapObjectsView.children.findByModel(model).geoObject.editor.startEditing();
        socket.emit('add:line', data);
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
        _this.panelObjectsView = new panelViews.PanelObjectsView({
          collection: _this.geoObjectsCollection
        });
        _this.panelRegion.show(_this.panelObjectsView);
        _this.mapObjectsView = new mapViews.MapObjectsView({
          collection: _this.geoObjectsCollection
        });
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



