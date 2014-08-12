define('views/map', [
  'jquery', 'backbone', 'underscore', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color', 'utils/colors',
  'map'
], function ($, backbone, _, marionette, ModelBinder, vent, reqres, models, jsc, Colors, map) {

  var colorName2Hex = Colors.colorName2Hex;
  var hex2ColorName = Colors.hex2ColorName;

  var MapObjectView = marionette.ItemView.extend({
    onBeforeDestroy: function () {
      if (this.geoObject) {
        map.geoObjects.remove(this.geoObject);
        delete this.geoObject;
      }
    }
  });

  var MarkerMapView = MapObjectView.extend({
    onRender: function () {
      var model = this.model;
      var geoObject = this.geoObject;
      var _this = this;

      this.listenTo(model, 'change:lat, change:lng', function () {
        var lat = model.get('lat');
        var lng = model.get('lng');
        _this.geoObject.geometry.setCoordinates([lat, lng])
      });

      this.listenTo(model, 'change:name', function () {
        var name = model.get('name');
        _this.geoObject.properties.set('iconContent', name);
      });

      this.listenTo(model, 'change:color', function () {
        var color = model.get('color');
        _this.geoObject.options.set('preset', 'islands#' + color + 'StretchyIcon');
      });

      geoObject.events.add('dragend', function () {
        var coordinates = geoObject.geometry.getCoordinates();
        model.set({
            lat: coordinates[0],
            lng: coordinates[1]
          }
        );
      });
    },
    _renderTemplate: function () {
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

      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
      return this;
    }
  });

  var PolygonMapView = MapObjectView.extend({
    onRender: function () {
      var model = this.model;
      var geoObject = this.geoObject;
      this.listenTo(model, 'change:coordinates', function (model) {
        this.geoObject.geometry.setCoordinates(model.get('coordinates'));
      });

      this.listenTo(model, 'change:name', function () {
        var name = model.get('name');
//        this.geoObject.properties.set('hintContent', name);
      });

      this.listenTo(model, 'change:color', function () {
        var color = model.get('color');
        var hexColor = colorName2Hex[color];
        this.geoObject.options.set('strokeColor', hexColor);
      });

      geoObject.events.add('editorstatechange', function () {
        var coordinates = geoObject.geometry.getCoordinates();
        model.set('coordinates', coordinates);
      });

      map.events.add('click', function () {
        geoObject.editor.stopEditing();
      });

      this.listenTo(vent, 'edit:polygon', function (modelId) {
        if (model.id == modelId) {
          if (geoObject.editor.state.get('editing')) {
            geoObject.editor.stopEditing();
          } else {
            geoObject.editor.startEditing();
          }
        }
      });
    },
    _renderTemplate: function () {
      var model = this.model;
      var color = model.get('color');
      var hexColor = colorName2Hex[color];
      var geoObject = new ymaps.GeoObject({
        geometry: {
          type: "Polygon",
          coordinates: model.get('coordinates'),
          draggable: true
        }
      }, {
        fillColor: null,
        strokeColor: hexColor,
        strokeWidth: 2,
        interactivityModel: 'default#transparent',
        editorMenuManager: function (items) {
          return [items[0]];
        }
      });

      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
    }
  });

  var LineMapView = MapObjectView.extend({
    onRender: function () {
      var model = this.model;
      var geoObject = this.geoObject;
      this.listenTo(model, 'change:coordinates', function (model) {
        this.geoObject.geometry.setCoordinates(model.get('coordinates'));
      });

      this.listenTo(model, 'change:name', function () {
        var name = model.get('name');
        this.geoObject.properties.set('hintContent', name);
      });

      this.listenTo(model, 'change:color', function () {
        var color = model.get('color');
        var hexColor = colorName2Hex[color];
        this.geoObject.options.set('strokeColor', hexColor);
      });

      geoObject.events.add('editorstatechange', function () {
        var coordinates = geoObject.geometry.getCoordinates();
        model.set('coordinates', coordinates);
      });

      map.events.add('click', function () {
        geoObject.editor.stopEditing();
      });

      this.listenTo(vent, 'edit:line', function (modelId) {
        if (model.id == modelId) {
          if (geoObject.editor.state.get('editing')) {
            geoObject.editor.stopEditing();
          } else {
            geoObject.editor.startEditing();
          }
        }
      });
    },
    _renderTemplate: function () {
      var model = this.model;
      var color = model.get('color');
      var hexColor = colorName2Hex[color];
      var geoObject = new ymaps.GeoObject({
        geometry: {
          type: "LineString",
          coordinates: model.get('coordinates'),
          draggable: true
        }
      }, {
        strokeColor: hexColor,
        hintContent: model.get('name'),
        strokeWidth: 2,
        editorMenuManager: function (items) {
          return [items[0]];
        }
      });

      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
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