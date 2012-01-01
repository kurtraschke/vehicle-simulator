define(['jquery',
        'async!http://maps.googleapis.com/maps/api/js' +
      '?v=3.7&sensor=false&libraries=geometry!callback',
        'timer', 'time_helpers', 'linesPool', 'stationsPool',
        'imagesPool', 'vehicleFollower', 'simulation_manager'],
function(_jquery, _gmaps, timer, time_helpers, linesPool,
    stationsPool, imagesPool, vehicleFollower, simulation_manager) {

  var vehicle_ib;

  require(['infobox'],
      function(_infobox) {
        vehicle_ib = new InfoBox({
          disableAutoPan: true,
          pixelOffset: new google.maps.Size(10, 10),
          vehicle_id: 0
        });
        google.maps.event.addListener(vehicle_ib, 'closeclick', function() {
          linesPool.routeHighlightRemove();
        });
      }
  );


  function Vehicle(params) {
    var has_multiple_days = params.arrs[params.arrs.length - 1] > 24 * 3600;

    this.id = params.id;
    this.stations = params.sts;
    this.depS = params.deps;
    this.arrS = params.arrs;
    this.multiple_days = has_multiple_days;

    var html_rows = [];
    $.each(params.edges, function(index, edges) {
      var s_dep = (typeof params.deps[index] === 'undefined') ? 24 * 3600 : params.deps[index];

      var html_row = '<tr data-dep-sec="' + s_dep + '"><td>' +
          (index + 1) + '.</td>';

      html_row += '<td><a href="#station_id=' + params.sts[index] +
          '" data-station-id="' + params.sts[index] + '">' +
          stationsPool.get(params.sts[index]) + '</a></td>';

      var hm_arr = (typeof params.arrs[index - 1] === 'undefined') ? '' : time_helpers.s2hm(params.arrs[index - 1]);

      html_row += '<td>' + hm_arr + '</td>';

      var hm_dep = (typeof params.deps[index] === 'undefined') ? '' : time_helpers.s2hm(params.deps[index]);

      html_row += '<td>' + hm_dep + '</td></tr>';

      html_rows.push(html_row);

      if (index === 0) { return; }

      if (linesPool.routeExists(params.sts[index - 1], params.sts[index])) {
        return;
      }

      linesPool.routeAdd(params.sts[index - 1], params.sts[index], edges.split(','));
    });
    var timetables_rows = html_rows.join('');

    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(0, 0),
      icon: imagesPool.iconGet(params.type),
      map: null,
      speed: 0,
      status: 'not on map'
    });
    this.marker = marker;

    function vehicle_clickHandler() {
      if ($('#vehicle_info').attr('data-vehicle-id') === params.id) {
        return;
      }

      $('#vehicle_info .vehicle_name').text(params.name);

      var hms = timer.getTime();
      if (has_multiple_days && (hms < params.deps[0])) {
        hms += 24 * 3600;
      }

      $('#vehicle_timetable > tbody').html(timetables_rows);
      $('#vehicle_timetable tbody tr').each(function() {
        if ($(this).attr('data-dep-sec') < hms) {
          $(this).addClass('passed');
        }
      });

      $('#vehicle_info').attr('data-vehicle-id', params.id);
      $('#vehicle_info').attr('data-station-ids', params.sts.join(','));

      $('#vehicle_info').removeClass('hidden');
    }
    google.maps.event.addListener(marker, 'click', function() {
      vehicle_clickHandler();
      vehicleFollower.toggle(true);
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
      if (vehicle_ib.get('vehicle_id') === params.id) { return; }
      vehicle_ib.set('vehicle_id', params.id);

      vehicle_ib.close();

      var popup_div = $('#vehicle_popup');
      $('.vehicle_name', popup_div).text(params.name);
      $('.status', popup_div).text(marker.get('status'));

      vehicle_ib.setContent($('#vehicle_popup_container').html());
      vehicle_ib.open(map, marker);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
      vehicle_ib.set('vehicle_id', null);
      vehicle_ib.close();
    });

    if (vehicleFollower.matchByName(params.name)) {
      vehicle_clickHandler();
      vehicleFollower.toggle(false);
    }
  }


  Vehicle.prototype.render = function() {
    var that = this;
    function animate() {
      var hms = timer.getTime();
      if (that.multiple_days && (hms < that.depS[0])) {
        hms += 24 * 3600;
      }

      var vehicle_found = false;
      for (var i = 0; i < that.arrS.length; i++) {
        if (hms < that.arrS[i]) {
          var station_a = that.stations[i];
          var station_b = that.stations[i + 1];

          var pos = null;

          if (hms > that.depS[i]) {
            // Vehicle is in motion between two stations
            vehicle_found = true;
            if (that.marker.get('speed') === 0) {
              var speed = linesPool.lengthGet(station_a, station_b) * 0.001 * 3600 / (that.arrS[i] - that.depS[i]);
              that.marker.set('speed', parseInt(speed, 10));

              that.marker.set('status', 'Travelling to ' + stationsPool.get(station_b) +
                              ' at ' + that.marker.get('speed') + ' km/h (' +
                              Math.round(that.marker.get('speed') * 0.6213) +
                              ' MPH), arriving at ' + time_helpers.s2hm(that.arrS[i]));
            }

            var route_percent = (hms - that.depS[i]) / (that.arrS[i] - that.depS[i]);

            pos = linesPool.positionGet(station_a, station_b, route_percent);
            if (pos === null) {
              console.log('Couldn\'t get the position of ' + that.id +
                          ' between stations: ' + [station_a, station_b]);
              that.marker.setMap(null);
              break;
            } else {
              if (vehicleFollower.isActive(that.id)) {
                that.marker.setPosition(pos);
              } else {
                if (map.getBounds().contains(pos)) {
                  if (that.marker.getMap() === null) {
                    that.marker.setMap(map);
                  }
                  that.marker.setPosition(pos);
                } else {
                  that.marker.setMap(null);
                }
              }
            }

            setTimeout(animate, 1000);
          } else {
            // Vehicle is in a station
            vehicle_found = true;
            that.marker.set('status', 'Departing ' + stationsPool.get(station_a) +
                            ' at ' + time_helpers.s2hm(that.depS[i]));
            that.marker.set('speed', 0);

            pos = stationsPool.location_get(station_a);
            that.marker.setPosition(pos);

            var seconds_left = that.depS[i] - hms;
            setTimeout(animate, seconds_left * 1000);
          }

          if (vehicleFollower.isWaiting(that.id)) {
            vehicleFollower.setActive();

            map.panTo(pos);
            map.setZoom(simulation_manager.getParam('zoom_follow'));
            map.setMapTypeId('satellite');
            map.setOptions({'draggable': false});

            map.bindTo('center', that.marker, 'position');
          }
          break;
        }
      } // end arrivals loop

      if (vehicle_found === false) {
        that.marker.setMap(null);
      }
    }

    animate();
  };
  return Vehicle;
});
