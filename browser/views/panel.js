define('views/panel', [
  'jquery', 'backbone', 'underscore', 'marionette', 'backbone.modelbinder', 'vent', 'reqres', 'models',
  'jquery-simple-color',
  'utils/colors',
  'map',
  'hbs!templates/markerPanel',
  'hbs!templates/polygonPanel',
  'hbs!templates/linePanel',
  'hbs!templates/objectsPanel'
], function ($, backbone, _, marionette, ModelBinder, vent, reqres, models, jsc, Colors, map, markerPanelTemplate, polygonPanelTemplate, linePanelTemplate, objectsPanelTemplate) {
  $.fn.highlight = function () {
    $(this).each(function () {
      var el = $(this);
      $("<div/>")
        .width(el.outerWidth())
        .height(el.outerHeight())
        .css({
          "position": "absolute",
          "left": el.offset().left,
          "top": el.offset().top,
          "background-color": "#ffff99",
          "opacity": ".7",
          "z-index": "9999999"
        }).appendTo('body').fadeOut(250).queue(function () {
          $(this).remove();
        });
    });
  }

  var colorName2Hex = Colors.colorName2Hex;
  var hex2ColorName = Colors.hex2ColorName;
  var colors = Colors.colors;


  var colorConverter = function (direction, value, attribute, model, els) {
    if (direction === "ModelToView") {
      return colorName2Hex[value];
    }
    if (direction === "ViewToModel") {
      return hex2ColorName[value];
    }
  };

  var PanelView = marionette.ItemView.extend({
    initJSC: function () {
      var sel = this.$el.find('input[name=\'color\']');
      if (!sel) {
        return
      }
      sel.simpleColor({
        columns: 4,
        boxWidth: 16,
        boxHeight: 16,
        colors: colors,
        cellWidth: 16,
        cellHeight: 16,
        chooserCSS: {
          'border': '1px solid #000',
          'margin': '5px 0 0 0',
          'top': -22,
          'left': -75,
          'position': 'absolute'
        },
        displayCSS: {
          'border': '1px solid #444',
          'border-radius': '3px',
          'vertical-align': 'middle',
          'display': 'inline-block'
        }
      });

      this.model.on('change:color', function (model, colorName) {
        var hexColor = colorName2Hex[colorName];
        sel.setColor(hexColor);
      });
    },
    onBeforeClose: function(){
      var sel = this.$el.find('input[name=\'color\']');
      sel.closeChooser();
    }
  });

  var MarkerView = PanelView.extend({
    template: markerPanelTemplate,
    className: 'markerPanel',
    model: models.Marker,
    ui: {
      circle: '.circle'
    },
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
      var _this = this;
      this.listenTo(this.model, 'highlight', function () {
        if (_this.blockHighlight){
          return
        }
        _this.$el.find('input[name=\'name\']').highlight();
      });
      this.listenTo(this.model, 'change:color', function () {
        _this.ui.circle.attr('src', 'img/circle/' + this.model.get('color') + '.png');
      });
      _this.ui.circle.attr('src', 'img/circle/' + this.model.get('color') + '.png');

      _this.ui.circle.on('click', function(){
        _this.blockHighlight = true;
        _this.model.trigger('highlight');
        delete _this.blockHighlight;
      });
      this.initJSC();
    }
  });


  var PolygonView = PanelView.extend({
    template: polygonPanelTemplate,
    className: 'polygonPanel',
    model: models.Polygon,
    draw: false,
    bindings: {
      name: '[name=name]',
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
      vent.trigger('edit:polygon', this.model.id);
    },

    onShow: function () {
      this.modelBinder = new ModelBinder();
      this.modelBinder.bind(this.model, this.el, this.bindings);
      this.initJSC();
    }
  });

  var LineView = PanelView.extend({
    template: linePanelTemplate,
    className: 'polygonPanel',
    model: models.Line,
    ui: {
      icon: '.icon',
      'diaginalLine': '.diagonal-line'
    },
    bindings: {
      name: '[name=name]',
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
      vent.trigger('edit:line', this.model.id);
    },

    onShow: function () {
      this.modelBinder = new ModelBinder();
      this.modelBinder.bind(this.model, this.el, this.bindings);

      var _this = this;
      this.listenTo(this.model, 'highlight', function () {
        if (_this.blockHighlight){
          return
        }
        _this.$el.find('input[name=\'name\']').highlight();
      });
      this.listenTo(this.model, 'change:color', function () {
        _this.ui.diaginalLine.css('background-color', colorName2Hex[this.model.get('color')]);
      });
      _this.ui.diaginalLine.css('background-color', colorName2Hex[this.model.get('color')]);


      _this.ui.icon.on('click', function(){
        _this.blockHighlight = true;
        _this.model.trigger('highlight');
        delete _this.blockHighlight;
      });

      this.initJSC();
    }
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
    ui: {
      cords: '.cords'
    },
    events: {
      'click .addMarker': 'onAddMarker',
      'click .addLine': 'addLine'
    },
    onAddMarker: function () {
      vent.trigger('add:marker');
    },
    addLine: function () {
      vent.trigger('add:line');
    },
    onRender: function () {
      var _this = this;
      map.events.add('actiontick', function (ev) {
        var tick = ev.originalEvent.tick;
        var cords = map.options.get('projection').fromGlobalPixels(tick.globalPixelCenter, tick.zoom);
        var normCords = [cords[0].toFixed(4), cords[1].toFixed(4)].join(', ');
        _this.ui.cords.val(normCords);
      });

      var cords = map.getCenter();
      var normCords = [cords[0].toFixed(4), cords[1].toFixed(4)].join(', ');
      _this.ui.cords.val(normCords);

      _this.ui.cords.on('change', function (ev) {
        var cordsStr = ev.target.value;
        var cords;
        try {
          cords = cordsStr.split(',');
          cords = [parseFloat(cords[0]), parseFloat(cords[1])]
        } catch (TypeError) {
          return
        }
        map.setCenter(cords);
      })
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