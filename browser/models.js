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
      if (window.debug) console.log('sync', method);
      socket.emit(method + ':' + model.modelType, model.toJSON());
    },
    initialize: function () {
      var socket = reqres.request('socket');
      var _this = this;

      socket.on('update:' + _this.modelType, function (data) {
        if (data.id === _this.id) {
          if (window.debug) console.log('update' + _this.modelType);
          _this.syncBlock = true;
          _this.set(data);
          delete _this.syncBlock;
        }
      });

      socket.on('highlight:' + _this.modelType, function (objectId) {
        if (objectId === _this.id) {
          if (window.debug) console.log('highlight' + _this.modelType);
          _this.syncBlock = true;
          _this.trigger('highlight');
          delete _this.syncBlock;
        }
      });

      socket.on('delete:' + _this.modelType, function (objectId) {
        if (objectId === _this.id) {
          if (window.debug) console.log('delete' + _this.modelType);
          _this.syncBlock = true;
          _this.destroy();
          delete _this.syncBlock;
        }
      });

      _this.on('highlight', function(){
        if (!_this.syncBlock){
          socket.emit('highlight:' + _this.modelType, _this.id)
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
    setLng: function(){
      debugger
    },
    setLat: function(){
      debugger
    }
  });


  var Polygon = GeoModel.extend({
    modelType: 'polygon',
    defaults: {
      color: 'black'
    }
  });

  var Line = GeoModel.extend({
    modelType: 'line',
    defaults: {
      color: 'black'
    }
  });

  var getModel = function(modelType){
    if (modelType == 'polygon') return Polygon;
    if (modelType == 'marker') return Marker;
    if (modelType == 'line') return Line;
  };

  var getSetFunction = function(modelType, collection){
    var Model = getModel(modelType);
    return function(data){
      collection.every(function (model) {
        if (model.modelType == modelType) {
          model.destroy();
        }
      });
      _.each(data, function (item) {
        collection.add(new Model(item));
      });
    }
  };
  var getAddFunction = function(modelType, view){
    var Model = getModel(modelType);
    return function(data){
      view.add(new Model(data));
    }
  };

  var GeoObjectsCollection = backbone.Collection.extend({
    initialize: function () {
      var socket = reqres.request('socket');
      var _this = this;
      socket.on('add:marker',getAddFunction('marker', _this));
      socket.on('add:polygon',getAddFunction('polygon', _this));
      socket.on('add:line',getAddFunction('line', _this));

      socket.on('set:markers', getSetFunction('marker', _this));
      socket.on('set:polygons', getSetFunction('polygon', _this));
      socket.on('set:lines', getSetFunction('line', _this));
    }
  });

  return {
    Marker: Marker,
    Polygon: Polygon,
    Line: Line,
    GeoObjectsCollection: GeoObjectsCollection
  }
});