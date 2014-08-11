define('views/map', [
  'jquery', 'backbone', 'underscore', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color',
  'map'
], function ($, backbone, _, marionette, ModelBinder, vent, reqres, models, jsc, map) {

  var MapObjectView = marionette.ItemView.extend({
    removeGeoObject: function () {
      if (this.geoObject) {
        map.geoObjects.remove(this.geoObject);
        delete this.geoObject;
      }
    }
  });

  var MarkerMapView = MapObjectView.extend({
    someMethod: function () {
      var model = this.model;
      var _this = this;
      model.on('change:lat, change:lng', function () {
        var lat = model.get('lat');
        var lng = model.get('lng');
        _this.geoObject.geometry.setCoordinates([lat, lng])
      });

      model.on('change:name', function () {
        var name = model.get('name');
        _this.geoObject.properties.set('iconContent', name);
      });

      model.on('change:color', function () {
        var color = model.get('color');
        _this.geoObject.options.set('preset', 'islands#' + color + 'StretchyIcon');
      });
    },
    render: function () {
      var model = this.model;
      var geoObject = new ymaps.GeoObject({
        geometry: {
          type: "Point",
          coordinates: [model.get('lat'), model.get('lng')]
        },
        properties: {
          iconContent: model.get('name')
        }
      }, {
        preset: 'islands#' + model.get('color') + 'StretchyIcon',
        draggable: true
      });
      geoObject.events.add('dragend', function () {
        var coordinates = geoObject.geometry.getCoordinates();
        model.set({
          lat: coordinates[0],
          lng: coordinates[1]
        });
      });
      geoObject.events.add('dblclick', function (ev) {
        ev.preventDefault();
        model.remove();
      });
      geoObject.events.add('click', function (ev) {
        vent.trigger('click:marker', model);
      });

      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
    }
  });

  var PolygonMapView = MapObjectView.extend({
    modelBindingFunction: function () {
      var _this = this;
      this.on('change:coordinates', function (model) {
        this.geoObject.geometry.setCoordinates(model.get('coordinates'));
      });

      this.on('change:name', function () {
        var name = this.get('name');
        this.geoObject.properties.set('hintContent', name);
      });

      this.on('change:color', function () {
        var color = this.get('color');
        this.geoObject.options.set('preset', 'islands#' + color + 'StretchyIcon');
      });
    },
    render: function () {
      var model = this.model;
      if (model.geoObject) {
        return;
      }
      var geoObject = new ymaps.GeoObject({
        geometry: {
          type: "Polygon",

          coordinates: model.get('coordinates'),
          draggable: true
        }
      }, {
        fillColor: null,
        strokeColor: '#000000',
        opacity: 0.6,
        strokeWidth: 2
      });

      geoObject.events.add('editorstatechange', function () {
        var coordinates = geoObject.geometry.getCoordinates();
        model.set('coordinates', coordinates);
      });
      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
    }
  });

  var LineMapView = MapObjectView.extend({
    render: function () {

    }
  });

  var MapObjectsView = marionette.CollectionView.extend({
    getChildView: function (model) {
      if (model.modelType == 'marker') {
        return MarkerMapView;
      }
      if (model.modelType == 'polygon') {
        return PolygonMapView;
      }
      if (model.modelType == 'line') {
        return LineMapView;
      }
    },
    render: function () {

    }
  });

  return {
    MapObjectsView: MapObjectsView
  }
})
;