define('views/panel', [
  'jquery', 'backbone', 'underscore', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color',
  'utils/colors',
  'hbs!templates/markerPanel',
  'hbs!templates/polygonPanel',
  'hbs!templates/objectsPanel'
], function ($, backbone, _, marionette, ModelBinder, vent, reqres, models, jsc, Colors, markerPanelTemplate, polygonPanelTemplate, objectsPanelTemplate) {


  var colorName2Hex = Colors.colorName2Hex;
  var hex2ColorName = Colors.hex2ColorName;
  var colors = _.map(_.keys(hex2ColorName), function(x){return x.replace('#', '');});

  var colorConverter = function (direction, value, attribute, model, els) {
    if (direction === "ModelToView") {
      return colorName2Hex[value];
    }
    if (direction === "ViewToModel") {
      return hex2ColorName[value];
    }
  };

  var MarkerView = marionette.ItemView.extend({
    template: markerPanelTemplate,
    className: 'markerPanel',
    model: models.Marker,
    bindings: {
      name: '[name=name]',
      color: {
        selector: '[name=color]',
        converter: colorConverter
      }
    },
    events: {
      'click .delete': 'onDelete'
    },
    onDelete: function () {
      this.model.destroy();
    },

    onShow: function () {
      this.modelBinder = new ModelBinder();
      this.modelBinder.bind(this.model, this.el, this.bindings);
      this.$el.find('input[name=\'color\']').simpleColor({
        columns: 4,
        boxWidth: 16,
        boxHeight: 16,
        colors: colors,
        cellWidth: 16,
        cellHeight: 16,
        chooserCSS: {
          'border': '1px solid #000',
          'margin': '5px 0 0 0',
          'top': +16,
          'left': -56,
          'position': 'absolute'
        },
        displayCSS: {
          'border': '1px solid #444',
          'border-radius': '3px',
          'vertical-align': 'middle',
          'display': 'inline-block'
        }
      });
    }
  });


  var PolygonView = marionette.ItemView.extend({
    template: polygonPanelTemplate,
    className: 'polygonPanel',
    model: models.Polygon,
    draw: false,
    bindings: {
      color: {
        selector: '[name=color]',
        converter: colorConverter
      }
    },
    events: {
      'click .delete': 'onDelete',
      'click .draw': 'onDraw'
    },
    onDelete: function () {
      this.model.destroy();
    },
    onDraw: function () {
      if (this.draw) {
        this.draw = false;
        vent.trigger('stop:edit:polygon', this.model.id);
      } else {
        this.draw = true;
        vent.trigger('start:edit:polygon', this.model.id);
      }
    },

    onShow: function () {
      this.modelBinder = new ModelBinder();
      this.modelBinder.bind(this.model, this.el, this.bindings);
      this.$el.find('input[name=\'color\']').simpleColor({
        columns: 4,
        boxWidth: 16,
        boxHeight: 16,
        colors: colors,
        cellWidth: 16,
        cellHeight: 16,
        chooserCSS: {
          'border': '1px solid #000',
          'margin': '5px 0 0 0',
          'top': +16,
          'left': -56,
          'position': 'absolute'
        },
        displayCSS: {
          'border': '1px solid #444',
          'border-radius': '3px',
          'vertical-align': 'middle',
          'display': 'inline-block'
        }
      });
    }
  });
  var LineView = marionette.ItemView.extend({
    template: markerPanelTemplate
  });

  var PanelObjectsView = marionette.CompositeView.extend({
    getChildView: function (model) {
      if (model.modelType == 'marker') {
        return MarkerView;
      }
      if (model.modelType == 'polygon') {
        return PolygonView;
      }
      if (model.modelType == 'line') {
        return LineView;
      }
    },
    childViewContainer: ".pannelInner",
    template: objectsPanelTemplate,
    events: {
      'click .addMarker': 'onAddMarker',
      'click .addPolygon': 'addPolygon'
    },
    onAddMarker: function () {
      vent.trigger('add:marker');
    },
    addPolygon: function () {
      vent.trigger('add:polygon');
    }
  });

  var TestView = marionette.View.extend({
    template: markerPanelTemplate
  });

  return {
    PanelObjectsView: PanelObjectsView,
    TestView: TestView
  }
});