define(['jquery',
        'async!http://maps.googleapis.com/maps/api/js' +
        '?v=3.7&sensor=false&libraries=geometry!callback',
        'vehicle', 'vehicleFollower', 'linesPool', 'stationsPool'],
function(_jquery, _gmaps, Vehicle, vehicleFollower, linesPool, stationsPool) {

  // Vehicle helpers
  // Roles:
  // - check backend for new vehicles
  // - manage vehicle objects(class Vehicle)
  //   and animate them (see Vehicle.render method)
  var vehicle_helpers = (function() {

    //vehicleFollower was here

    $('#route_show_trigger').click(function() {
      if ($(this).hasClass('toggled')) {
        $(this).removeClass('toggled');

        linesPool.routeHighlightRemove();
      } else {
        $(this).addClass('toggled');

        var station_ids = $('#vehicle_info').
            attr('data-station-ids').split(',');
        linesPool.routeHighlight(station_ids);
      }

      var value_new = $(this).attr('data-value-toggle');
      $(this).attr('data-value-toggle', $(this).val());
      $(this).val(value_new);
    });

    $('#vehicle_timetable tbody tr a').live('click', function() {
      var station_location = stationsPool.location_get(
          $(this).attr('data-station-id'));
      if (parseInt(station_location.lng(), 10) === 0) { return; }

      map.setCenter(station_location);
      if (map.getZoom() < simulation_manager.getParam('zoom_station')) {
        map.setZoom(simulation_manager.getParam('zoom_station'));
      }

      return false;
    });

    /*Vehicle was here*/

    var vehicleIDs = [];


    return {
      get: function() {
        $.ajax({
          // Replace this with your vehicles API URL
          url: 'api/vehicles/trains.json',
          dataType: 'json',
          success: function(vehicles) {
            $.each(vehicles, function(index, data) {
              if (vehicleIDs.indexOf(data.id) !== -1) { return; }

              var v = new Vehicle(data);
              v.render();
              vehicleIDs.push(data.id);
            });
          }
        });
      }
    };
  })();
  return vehicle_helpers;
});
