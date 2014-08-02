define('view',[
  'jquery',
  'hbs!templates/markerPanel',
  'hbs!templates/panelControl'
],
  function ($, markerPanelTemplate, panelControlTemplate) {
    // Создаем собственный класс.
    var PanelControlClass = function (options) {
      PanelControlClass.superclass.constructor.call(this, options);
      this._$content = null;
      this._geocoderDeferred = null;
    };

    ymaps.util.augment(PanelControlClass, ymaps.collection.Item, {
      onAddToMap: function (map) {
        PanelControlClass.superclass.onAddToMap.call(this, map);
        this._lastCenter = null;
        this.getParent().getChildElement(this).then(this._onGetChildElement, this);
      },

      onRemoveFromMap: function (oldMap) {
        this._lastCenter = null;
        if (this._$content) {
          this._$content.remove();
          this._mapEventGroup.removeAll();
        }
        PanelControlClass.superclass.onRemoveFromMap.call(this, oldMap);
      },

      _onGetChildElement: function (parentDomContainer) {
        this._$content = $(panelControlTemplate());
        this._$content.appendTo(parentDomContainer);
        this.$panel = this._$content.find('.panel');
        this._mapEventGroup = this.getMap().events.group();
        this._mapEventGroup.add('boundschange', this._createRequest, this);
        this._mapEventGroup.add('boundschange', this._showCords, this);
        this._mapEventGroup.add('drag', this._createRequest, this);
        this._mapEventGroup.add('click:marker', this._clickMarker, this);

        this._createRequest();
        this._showCords();
      },
      _empty: function () {

      },
      _clickMarker: function (ev) {
        var map = this.getMap();
        var marker = ev.originalEvent.marker;
        var data = {
          name: marker.properties.get('iconContent'),
          cords: marker.geometry.getCoordinates()
        };
        var html = markerPanelTemplate(data);

        this.$panel.html(html);
        this.$panel.find('input').on('change', function (ev) {
          var name = ev.target.value;
          marker.properties.set('iconContent', name);
          var data = {
            id: marker.marker_id,
            name: name
          };
          map.events.fire('update:marker', data);
        });
      },
      _showCords: function () {
        var cords = this.getMap().getCenter();
        var lat = cords[0].toFixed(4);
        var lng = cords[1].toFixed(4);
        this.$cords.text([lat, lng].join(', '));
      },

      _createRequest: function () {
        var lastCenter = this._lastCenter = this.getMap().getCenter().join(',');

        ymaps.geocode(this._lastCenter, {
          json: true,
          results: 1
        }).then(function (result) {
            if (lastCenter == this._lastCenter) {
              this._onServerResponse(result);
            }
          }, this);
      },

      _onServerResponse: function (result) {
        var members = result.GeoObjectCollection.featureMember, geoObjectData = (members && members.length) ?
          members[0].GeoObject : null;
        if (geoObjectData) {
          this.$address.text(geoObjectData.name);
        }
      }
    });

    var view = {
      init: function (map) {
        this.map = map;
        this.renderBox();
        this.renderPanel();
      },

      removeMarker: function (marker) {
        view.map.geoObjects.remove(marker);
      },

      updateMarker: function (marker, data) {
        if ((data.lat)&&(data.lng)){
          marker.geometry.setCoordinates([data.lat, data.lng]);
        }
        if (data.name){
          marker.properties.set('iconContent', data.name);
        }
      },

      addMarker: function (data) {
        var marker = new ymaps.GeoObject({
          geometry: {
            type: "Point",
            coordinates: [data.lat, data.lng]
          },
          properties: {
            iconContent: data.name
          }
        }, {
          preset: 'islands#blackStretchyIcon',
          draggable: true
        });
        marker.marker_id = data.id;
        marker.events.add('dragend', function () {
          var coordinates = marker.geometry.getCoordinates();
          var data = {
            id: marker.marker_id,
            lat: coordinates[0],
            lng: coordinates[1]
          };
          view.map.events.fire('update:marker', data);
        });
        marker.events.add('dblclick', function (ev) {
          ev.preventDefault();
          var data = {
            id: marker.marker_id
          };
          view.map.events.fire('remove:marker', data);
        });
        marker.events.add('click', function (ev) {
          var data = {
            marker: marker
          };
          view.map.events.fire('click:marker', data);
        });

        view.map.geoObjects.add(marker);
        return marker;
      },

      addPoint: function (data) {
        var point = new ymaps.Placemark([data.lat, data.lng], {
          iconContent: data.id
        });
        view.map.geoObjects.add(point);
        return point
      },

      // Загрузка всех точек
      addPoints: function (points) {
        for (var pointId in points) {
          view.addPoint(points[pointId]);
        }
      },

      // Загрузка всех маркеров
      addMarkers: function (markers) {
        for (var markerId in markers) {
          view.addMarker(markers[markerId]);
        }
      },

      updatePoint: function (point, data) {
        point.geometry.setCoordinates([data.lat, data.lng]);
      },

      renderBox: function () {
        var pointItem = new ymaps.control.ListBoxItem({
          data: {
            content: 'Точка'
          },
          options: {
            selectOnClick: false
          }
        });
        pointItem.events.add('click', function (ev) {
          ev.preventDefault();
          addBox.collapse();
          var coordinates = view.map.getCenter();
          view.map.events.fire('add:marker', {
            lat: coordinates[0],
            lng: coordinates[1]
          });
        });

        var addBox = new ymaps.control.ListBox({
          data: {
            content: 'Добавить'
          },
          items: [
            pointItem
          ]
        });

        view.map.controls.add(addBox, {
          float: 'right'
        });
      },

      renderPanel: function () {
        var panelControl = new PanelControlClass();
        view.map.controls.add(panelControl, {
          float: 'right',
          position: {
            'top': 50,
            'right': 10
          }
        });
      }
    };
    return view;
  });

