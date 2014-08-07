define('models', [
  'jquery', 'backbone', 'marionette',
  'map', 'vent', 'reqres'
], function ($, backbone, marionette, map, vent, reqres) {

  var Marker = backbone.Model.extend({
    name: 'marker',
    sync: function (method, model, options) {
      var socket = reqres.request('socket');
      if (model.syncBlock) {
        return
      }
      console.log('sync ', method);
      socket.emit(method + ':' + model.name, model.toJSON());
    },
    defaults:{
      color: 'black'
    },
    initialize: function () {
      var _this = this;
      _this.on('change', function () {
        _this.save();
      });
      var socket = reqres.request('socket');
      socket.on('update:' + _this.name, function (data) {
        if (data.id === _this.id) {
          console.log('update' + _this.name);
          _this.syncBlock = true;
          _this.set(data);
          delete _this.syncBlock;
        }
      });

      this.on('change:lat, change:lng', function () {
        var lat = this.get('lat');
        var lng = this.get('lng');
        this.geoObject.geometry.setCoordinates([lat, lng])
      });

      this.on('change:name', function () {
        var name = this.get('name');
        this.geoObject.properties.set('iconContent', name);
      });

      this.on('change:color', function () {
        var color = this.get('color');
        this.geoObject.options.set('preset', 'islands#' + color + 'StretchyIcon');
      });

      this.on('destroy', function () {
        _this.removeGeoObject();
      });
      this.on('add', function () {
        _this.addGeoObject();
      });
    },
    removeGeoObject: function () {
      if (this.geoObject) {
        map.geoObjects.remove(this.geoObject);
        delete this.geoObject;
      }
    },
    addGeoObject: function () {
      var model = this;
      if (model.geoObject) {
        return;
      }
      var geoObject = new ymaps.GeoObject({
        geometry: {
          type: "Point",
          coordinates: [model.get('lat'), model.get('lng')]
        },
        properties: {
          iconContent: model.get('name')
        }
      }, {
        preset: 'islands#'+ model.get('color') + 'StretchyIcon',
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

  var MarkerCollection = backbone.Collection.extend({
    model: Marker,
    initialize: function () {
      var socket = reqres.request('socket');
      var _this = this;
      socket.on('add:marker', function (data) {
        _this.set(data);
      });
      socket.on('add:markers', function (data) {
        _this.set(data);
      });
    }
  });


  var PointCollection = backbone.Collection.extend({
  });
  var PolygonCollection = backbone.Collection.extend({});

  return {
    Marker: Marker,
    MarkerCollection: MarkerCollection,
    PointCollection: PointCollection,
    PolygonCollection: PolygonCollection
  }
});