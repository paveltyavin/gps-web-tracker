define('controller', [
  'socket.io-client', 'config', 'view'
], function (io, config, view) {
  if (!ymaps) {
    throw 'Yandex maps error';
  }

  var mapCenter = [55.74954, 37.621587];

  var controller = {
    initMap: function () {
      var map = new ymaps.Map('map', {
        center: mapCenter,
        zoom: 10,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'rulerControl']
      });
      controller.map = map;
    },

    initData: function () {
      this.points = {};
      this.markers = {};
      this.polygons = {};
    },

    initSocket: function () {
      var socket = io.connect(config.serverUrl + ':' + config.browserPort);
      controller.socket = socket;
      socket.on('disconnect', controller.removePoints);
      socket.on('add:point', controller.addPoint);
      socket.on('add:points', controller.addPoints);
      socket.on('add:markers', controller.addMarkers);
      socket.on('add:marker', controller.addMarker);
      socket.on('remove:marker', controller.removeMarker);
    },

    addPoint: function (data) {
      var point = controller.points[data.id];
      if (point) {
        view.updatePoint(point, data)
      } else {
        point = view.addPoint(data);
        controller.points[data.id] = point;
      }
    },
    addPoints: function () {

    },

    removePoints: function () {

    },
    addMarkers: function (data) {
      var i;
      for (i in controller.markers){
        view.removeMarker(i);
      }

      controller.markers = {};
      for (i in data){
        var d = data[i];
        controller.markers[d.id] = view.addMarker(d);
      }
    },
    addMarker: function (data) {
      var marker = controller.markers[data.id];
      if (marker) {
        view.updateMarker(marker, data);
      } else {
        marker = view.addMarker(data);
        controller.markers[data.id] = marker;
      }
    },
    removeMarker: function (markerId) {
      var marker = controller.markers[markerId];
      view.removeMarker(marker)
    },


    initEvents: function () {
      controller.map.events.add('add:marker', function (ev) {
        var markerId = (Math.random() + 1).toString(36).substring(7);
        var data = {
          id: markerId,
          lat: ev.originalEvent.lat,
          lng: ev.originalEvent.lng
        };
        controller.socket.emit('add:marker', data);
        view.addMarker(data)
      });

      controller.map.events.add('update:marker', function (ev) {
        var data = {
          id: ev.originalEvent.id,
          lat: ev.originalEvent.lat,
          lng: ev.originalEvent.lng
        };
        controller.socket.emit('add:marker', data);
      });

      controller.map.events.add('remove:marker', function (ev) {
        var markerId = ev.originalEvent.id;
        var marker = controller.markers[markerId];
        view.removeMarker(marker);
        controller.socket.emit('remove:marker', markerId);
      })
    },

    initControls: function () {
      view.renderBox();
    },

    start: function () {
      this.initData();
      this.initSocket();
      this.initMap();
      this.initEvents();

      view.init(controller.map);
      this.initControls();
    }
  };

  return controller;
});



