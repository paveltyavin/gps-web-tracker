define('map', [
  'reqres',
  'vent'
], function (reqres, vent) {

  if (!ymaps) {
    throw 'Yandex maps error';
  }

  var mapCenter = [55.74954, 37.621587];

  var map = new ymaps.Map('map', {
    center: mapCenter,
    zoom: 10,
    controls: ['rulerControl', 'zoomControl']
  });
  map.controls.add(new ymaps.control.TypeSelector(), {
      float: 'left'
    }
  );

  return map
});