define('models', [
  'jquery', 'backbone', 'marionette',
  'map', 'vent', 'reqres'
], function ($, backbone, marionette, map, vent, reqres) {

  var GeoModel = backbone.Model.extend({
    sync: function (method, model, options) {
      var socket = reqres.request('socket');
      if (model.syncBlock) {
        return
      }
      console.log('sync ', method);
      socket.emit(method + ':' + model.modelType, model.toJSON());
    },
    initSync: function () {
      var socket = reqres.request('socket');
      var _this = this;

      socket.on('update:' + _this.modelType, function (data) {
        if (data.id === _this.id) {
          console.log('update' + _this.modelType);
          _this.syncBlock = true;
          _this.set(data);
          delete _this.syncBlock;
        }
      });
      socket.on('delete:' + _this.modelType, function (objectId) {
        if (objectId === _this.id) {
          console.log('delete' + _this.modelType);
          _this.syncBlock = true;
          _this.destroy();
          delete _this.syncBlock;
        }
      });

      _this.on('change', function () {
        _this.save();
      });
    },
    removeGeoObject: function () {
      if (this.geoObject) {
        map.geoObjects.remove(this.geoObject);
        delete this.geoObject;
      }
    }
  });

  var Marker = GeoModel.extend({
    modelType: 'marker',
    defaults: {
      color: 'black'
    },
    initialize: function () {
      this.initSync();
      var _this = this;

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


  var Polygon = GeoModel.extend({
    modelType: 'polygon',
    defaults: {
      color: 'black'
    },
    initialize: function () {
      this.initSync();
      var _this = this;
      this.on('change:coordinates', function (model) {
        if (model.changeBlock) return
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

      this.on('destroy', function () {
        _this.removeGeoObject();
      });
      this.on('add', function () {
        _this.addGeoObject();
      });
    },
    addGeoObject: function () {
      var model = this;
      if (model.geoObject) {
        return;
      }
      var cords = map.getCenter();
      var bounds = map.getBounds();
      var dx = (bounds[0][0] - bounds[1][0])*0.1;
      var dy = (bounds[0][1] - bounds[1][1])*0.02;

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
        model.changeBlock = true;
        model.set('coordinates', coordinates);
        delete model.changeBlock;
      });
      map.geoObjects.add(geoObject);
      this.geoObject = geoObject;
    }
  });

  var Line = GeoModel.extend({
    modelType: 'line'
  });

  var getModel = function(modelName){
    if (modelName == 'polygon') return Polygon;
    if (modelName == 'marker') return Marker;
    if (modelName == 'line') return Line;
  };

  var getSetFunction = function(modelName, view, socket){
    var Model = getModel(modelName);
    return function(data){
      view.every(function (model) {
        if (model.modelType == 'marker') {
          model.destroy();
        }
      });
      _.each(data, function (item) {
        console.log(modelName);
        view.add(new Model(item));
      });
    }
  };
  var getAddFunction = function(modelName, view, socket){
    var Model = getModel(modelName);
    return function(data){
      view.add(new Model(data));
    }
  };

  var GeoObjectsCollection = backbone.Collection.extend({
    initialize: function () {
      var socket = reqres.request('socket');
      var _this = this;
      socket.on('add:marker',getAddFunction('marker', _this, socket));
      socket.on('add:polygon',getAddFunction('polygon', _this, socket));
      socket.on('add:line',getAddFunction('line', _this, socket));

      socket.on('set:markers', getSetFunction('marker', _this, socket));
      socket.on('set:polygons', getSetFunction('polygon', _this, socket));
      socket.on('set:lines', getSetFunction('line', _this, socket));
    }
  });

  return {
    Marker: Marker,
    Polygon: Polygon,
    GeoObjectsCollection: GeoObjectsCollection
  }
});