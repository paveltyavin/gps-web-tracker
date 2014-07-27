define('app', [
  'socket.io-client', 'config'
], function (io, config) {
  if (!ymaps) {
    throw 'Yandex maps error';
  }

  var controller = {
    initMap: function () {
      var map = new ymaps.Map('map', {
        center: [55.74954, 37.621587],
        zoom: 10,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'rulerControl']
      });
      this.map = map;
      window.map = map;
    },

    checkPoint: function () {
      var _this = this;
      var beforeNow = new Date(new Date - config.pointTTL);
      _this.map.geoObjects.each(function (placemark) {
        if ((placemark.point_id) && (placemark.modified) && (placemark.modified < beforeNow)) {
          _this.map.geoObjects.remove(placemark);
        }
      });
    },

    initSocket: function () {
      var _this = this;
      var socket = io.connect(config.serverUrl + ':' + config.browserPort);
      socket.on('disconnect', function () {
        _this.map.geoObjects.each(function (placemark) {
          if (placemark.id) {
            _this.map.geoObjects.remove(placemark);
          }
        });
      });
      socket.on('connect', function () {
      });
      socket.on('point', function (data) {

        if (data) {
          var placemark = null;
          _this.map.geoObjects.each(function (p) {
            if (p.point_id == data.id) {
              placemark = p;
            }
          });
          if (!placemark) {
            placemark = new ymaps.Placemark([0, 0], {
              iconContent: data.id
            });
            placemark.point_id = data.id;
          }

          placemark.geometry.setCoordinates([data.lat, data.lng]);
          placemark.modified = new Date;
          _this.map.geoObjects.add(placemark);
        }
      });
    },

    start: function () {
      this.initMap();
      this.initSocket();

      setInterval(function () {
        controller.checkPoint.call(controller)
      }, config.pointCheckTime);
    }
  };

  return controller;
});



