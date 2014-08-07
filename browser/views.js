define('views', [
  'jquery', 'backbone', 'underscore', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color',
  'hbs!templates/markerPanel',
  'hbs!templates/objectsPanel'
], function ($, backbone, _, marionette, ModelBinder, vent, reqres, models, jsc, markerPanelTemplate, objectsPanelTemplate) {


  var colorName2Hex = {
    'green': '56db40',
    'blue': '1e98ff',
    'darkBlue': '177bc9',
    'black': '595959',
    'brown': '793d0e',
    'yellow': 'ffd21e',
    'darkGreen': '1bad03',
    'violet': 'b51eff',
    'red': 'ed4543',
    'pink': 'f371d1',
    'orange': 'ff931e',
    'olive': '97a100',
    'night': '0e4779',
    'lightBlue': '82cdff',
    'darkOrange': 'e6761b',
    'gray': 'b3b3b3'
  };
  var hex2ColorName = {
  };

  for (var prop in colorName2Hex) {
    if (colorName2Hex.hasOwnProperty(prop)) {
      hex2ColorName[colorName2Hex[prop]] = prop;
    }
  }

  var circleConverter = function (direction, value, attribute, model, els) {
    if (direction === "ModelToView") {
      return colorName2Hex[value];
    }
  };
  var colorConverter = function (direction, value, attribute, model, els) {
    if (direction === "ModelToView") {
      return '#'+colorName2Hex[value];
    }
    if (direction === "ViewToModel") {
      value = value.replace('#', '');
      return hex2ColorName[value];
    }
  };

  var MarkerView = marionette.ItemView.extend({
    template: markerPanelTemplate,
    model: models.Marker,
    bindings: {
      name: '[name=name]',
      color: {
        selector: '[name=color]',
        converter: colorConverter
      }
    },

    onShow: function () {
      this.modelBinder = new ModelBinder();
      var hexColor = colorName2Hex[this.model.get('color')];
      this.modelBinder.bind(this.model, this.el, this.bindings);
      this.$el.find('input[name=\'color\']').simpleColor({
        columns: 4,
        boxWidth: 16,
        boxHeight: 16,
        colors: _.keys(hex2ColorName),
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

  var MarkersView = marionette.CompositeView.extend({
    childView: MarkerView,
    childViewContainer: ".pannelInner",
    template: objectsPanelTemplate,
    events:{
      'click .addMarker':'onAddMarker'
    },
    onAddMarker: function(){
      vent.trigger('add:marker');
    }
  });

  var TestView = marionette.View.extend({
    template: markerPanelTemplate
  });

  return {
    MarkerView: MarkerView,
    MarkersView: MarkersView,
    TestView: TestView
  }
});