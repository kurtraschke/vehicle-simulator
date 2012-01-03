define(['jquery', 'async!http://maps.googleapis.com/maps/api/js' +
      '?v=3.7&sensor=false&libraries=geometry!callback',
        'map_layers_add', 'simulation_manager', 'timer', 'vehiclesPool', 'stationsPool'],
function(_jquery, _gmaps, map_layers, simulation_manager, timer, vehiclesPool, stationsPool) {


  function vehiclesForStation(vehicles, stopID) {
    var arriving = [];
    var atstation = [];

    $.each(vehicles, function(idx, vehicle) {
      if (vehicle.status.stopID && vehicle.status.stopID == stopID + '') {
        if (vehicle.status.status == 'inmotion') {
          arriving.push(vehicle);
        } else if (vehicle.status.status == 'atstation') {
          atstation.push(vehicle);
        }
      }

      var sortfunc = function(a, b) {
        return a.status.when - b.status.when;
      };
      arriving.sort(sortfunc);
      atstation.sort(sortfunc);

    });

    return [arriving, atstation];
  }

  function clickVehicle(vehicle) {
    return function(event) {
      event.preventDefault();
      google.maps.event.trigger(vehicle.marker, 'mouseover');
      /*if (vehicle.marker.status != "not on map") {
          map.panTo(vehicle.marker.position);
        }*/
    };
  }

  function updateStationPopup(stopID, name) {
    var div = $('<div id="station_popup"></div>');
    div.append($('<span class="station_name"></span>').append(name));

    var vehicle_info = vehiclesForStation(vehiclesPool, stopID);

    if ((vehicle_info[1].length + vehicle_info[0].length) > 0) {

      var table = $('<table><thead><tr>'
                  + '<th>Train</th><th>Direction</th>'
                  + '<th>Track</th><th>Status</th>'
                  + '</tr></thead><tbody></tbody></table>');
      var tbody = $('tbody', table);

      div.append(table);

      $.each(vehicle_info[1], function(idx, vehicle) {
        var seconds = vehicle.status.when - timer.getTime();
        tbody.append($('<tr></tr>').append(
            $('<td></td>').append($('<a href=""></a>').append(vehicle.name).click(clickVehicle(vehicle))),
            $('<td></td>').append(vehicle.direction),
            $('<td></td>').append(vehicle.status.track),
            $('<td></td>').append('Departing in ' + seconds + ' seconds'))
        );
      });

      $.each(vehicle_info[0], function(idx, vehicle) {
        var seconds = vehicle.status.when - timer.getTime();
        tbody.append($('<tr></tr>').append(
            $('<td></td>').append($('<a href=""></a>').append(vehicle.name).click(clickVehicle(vehicle))),
            $('<td></td>').append(vehicle.direction),
            $('<td></td>').append(vehicle.status.track),
            $('<td></td>').append('Arriving in ' + seconds + ' seconds'))
        );
      });
    }

    var out = $('<div></div>').append(div);
    return out.get(0);
  }


  var setupPopup;

  simulation_manager.subscribe('map_init', function() {

    var station_ib;

    require(['infobox'],
        function(_infobox) {
          station_ib = new InfoBox({
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(10, 10),
            station_id: null,
            station_name: ''
          });
          google.maps.event.addListener(station_ib, 'closeclick', function() {
            station_ib.set('station_id', null);
          });
        }
    );

    setupPopup = function(station_id, station_name, latlng) {
      station_ib.close();
      station_ib.set('station_id', station_id);
      station_ib.set('station_name', station_name);

      station_ib.setContent(updateStationPopup(station_id, station_name));
      station_ib.setPosition(latlng);
      station_ib.open(map);
    };


    google.maps.event.addListener(map_layers['stations'], 'click', function(event) {
      //if (station_ib.get('station_id') === event.row.id.value) { return; }
      setupPopup(event.row.id.value, event.row.name.value, event.latLng);
    });

    setInterval(function() {
      if (station_ib.get('station_id') != null) {
        station_ib.setContent(updateStationPopup(station_ib.get('station_id'),
            station_ib.get('station_name')));
      }
    }, 1000);

  });


  return {'openPopup': function(station_id) {
    setupPopup(station_id, stationsPool.get(station_id),
        stationsPool.location_get(station_id));
  }};


});
