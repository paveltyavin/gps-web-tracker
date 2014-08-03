define('views', [
  'jquery', 'backbone', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color',
  'hbs!templates/markerPanel'
], function ($, backbone, marionette, ModelBinder, vent, reqres, models,jsc, markerPanelTemplate) {


  var colorConverter = function(direction, value, attribute, model, els){
    if (direction === "ModelToView"){

    }
    if (direction === "ViewToModel"){
      debugger;
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
      this.modelBinder.bind(this.model, this.el, this.bindings);
      this.$el.find('input[name=\'color\']').simpleColor({
        columns:4,
        boxWidth:12,
        colors:['0000ff', 'ff0000', '00ff00', '00ffff', 'ffff00', 'ff00ff'],
        cellWidth: 12,
        cellHeight: 12
      });
    }
  });

  var TestView = marionette.View.extend({
    template: markerPanelTemplate
  });

  return {
    MarkerView: MarkerView,
    TestView: TestView
  }
});