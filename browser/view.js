define('view', [], function () {
  var view = {
    init: function (map) {
      this.map = map;
    },

    removeMarker: function (marker) {
      view.map.geoObjects.remove(marker);
    },

    updateMarker: function (marker, data) {
      marker.geometry.setCoordinates([data.lat, data.lng]);
      marker.properties.set('iconContent', data.name);
    },

    addMarker: function (data) {
      var marker = new ymaps.GeoObject({
        geometry: {
          type: "Point",
          coordinates: [data.lat, data.lng]
        },
        properties: {
          iconContent: data.name
        }
      }, {
        preset: 'islands#blackStretchyIcon',
        draggable: true
      });
      marker.marker_id = data.id;
      marker.events.add('dragend', function () {
        var coordinates = marker.geometry.getCoordinates();
        var data = {
          id: marker.marker_id,
          lat: coordinates[0],
          lng: coordinates[1]
        };
        view.map.events.fire('update:marker', data);
      });
      marker.events.add('dblclick', function (ev) {
        ev.preventDefault();
        var data = {
          id:marker.marker_id
        }
        view.map.events.fire('remove:marker', data);
      });
      view.map.geoObjects.add(marker);
      return marker;
    },

    addPoint: function (data) {
      var point = new ymaps.Placemark([data.lat, data.lng], {
        iconContent: data.id
      });
      view.map.geoObjects.add(point);
      return point
    },

    // Загрузка всех точек
    addPoints: function (points) {
      for (var pointId in points) {
        view.addPoint(points[pointId]);
      }
    },

    // Загрузка всех маркеров
    addMarkers: function (markers) {
      for (var markerId in markers) {
        view.addMarker(markers[markerId]);
      }
    },

    updatePoint: function (point, data) {
      point.geometry.setCoordinates([data.lat, data.lng]);
    },

    renderBox: function () {
      var pointItem = new ymaps.control.ListBoxItem({
        data: {
          content: 'Точка'
        },
        options: {
          selectOnClick: false
        }
      });
      pointItem.events.add('click', function (ev) {
        ev.preventDefault();
        addBox.collapse();
        var coordinates = view.map.getCenter();
        view.map.events.fire('add:marker', {
          lat: coordinates[0],
          lng: coordinates[1]
        });
      });

      var addBox = new ymaps.control.ListBox({
        data: {
          content: 'Добавить'
        },
        items: [
          pointItem
        ]
      });

      view.map.controls.add(addBox, {
        float: 'right'
      });
    }
  };
  return view;
});