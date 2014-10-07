define('app', [
  'jquery', 'backbone', 'marionette', 'underscore',  'socket.io-client',
  'map', 'vent', 'reqres', 'models', 'views/panel', 'views/map', 'config', 'utils/isMobile', 'utils/rafModule'
], function ($, backbone, marionette, _, io, map, vent, reqres, models, panelViews, mapViews, config, isMobile) {

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

      vent.on('add:point', function () {
        var data = {
          id: _this.pointId,
          share: false
        };
        var point = new models.Point(data);
        if (_this.panelBottomView) {
          _this.panelBottomView.model = point;
        }
        _this.geoObjectsCollection.add(point);
        socket.emit('add:point', data);
      });

      vent.on('add:line', function (originalData) {
        var lineId = (Math.random() + 1).toString(36).substring(7);
        var cords = map.getCenter();
        var bounds = map.getBounds();
        var dx = (bounds[0][0] - bounds[1][0]) * 0.1;
        var dy = (bounds[0][1] - bounds[1][1]) * 0.02;
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
      var socket = reqres.request('socket');
      socket.on('connect', function () {
        if (!isMobile.any) {
          $('#panel').css('display', 'block');
          _this.addRegions({
            panelRegion: "#panel"
          });
          _this.panelObjectsView = new panelViews.PanelObjectsView({
            collection: _this.geoObjectsCollection
          });
          _this.panelRegion.show(_this.panelObjectsView);
        }

        if (isMobile.any || true){
          var pointId = localStorage.getItem("pointId");
          if (!pointId){
            pointId = '';
            pointId = (Math.random() + 1).toString(36).substring(7);
            localStorage.setItem("pointId", pointId);
          }
          _this.pointId = pointId;

          $('#panelBottom').css('display', 'block');
          _this.addRegions({
            panelBottomRegion: "#panelBottom"
          });
          _this.panelBottomView = new panelViews.PanelBottomView();
          _this.panelBottomRegion.show(_this.panelBottomView);
        }

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



