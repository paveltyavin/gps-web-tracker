define('app', [
  'jquery', 'backbone', 'marionette', 'socket.io-client',
  'map', 'vent', 'reqres', 'models', 'views/panel', 'views/map', 'config', 'utils/isMobile'
], function ($, backbone, marionette, io, map, vent, reqres, models, panelViews, mapViews, config, isMobile) {

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

        if (isMobile.any && false) {
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

      _this.wakeObjectsView = new mapViews.WakeObjectsView({});

      $('#wakeOn').on('click', function(){
        $('#wakeOn').toggleClass('active');
        if ($('#wakeOn').hasClass('active')){
          _this.wakeObjectsView.render()
        } else {
          _this.wakeObjectsView.destroy();
        }
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



