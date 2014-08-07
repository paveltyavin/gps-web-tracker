define('map', [
  'reqres',
  'vent',
  'marionette',
  'hbs!templates/panelControl'
], function(reqres, vent, marionette, panelControlTemplate){

  if (!ymaps) {
    throw 'Yandex maps error';
  }

  var mapCenter = [55.74954, 37.621587];

  var map = new ymaps.Map('map', {
    center: mapCenter,
    zoom: 10,
    controls: ['rulerControl']
  });
  map.controls.add(new ymaps.control.TypeSelector(),{
      float:'left'
    }
  );

  var PanelControlClass = function (options) {
    PanelControlClass.superclass.constructor.call(this, options);
  };

  ymaps.util.augment(PanelControlClass, ymaps.collection.Item, {
    onAddToMap: function (map) {
      PanelControlClass.superclass.onAddToMap.call(this, map);
      this.getParent().getChildElement(this).then(this._onGetChildElement, this);
    },

    _onGetChildElement: function (parentDomContainer) {
      $(parentDomContainer).append(panelControlTemplate());
      vent.trigger('panel:ready');
    }
  });

  var panelControl = new PanelControlClass();

  map.controls.add(panelControl, {
    float: 'right',
    position: {
      'top': 10,
      'right': 10
    }
  });

  return map
});