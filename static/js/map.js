define(['jquery', 'jqueryui',
        'async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback',
        'simulation_manager',
  'map_layers_add', 'stationsPool', 'imagesPool', 'linesPool',
  'time_helpers', 'timer', 'map_helpers',
  'vehicle_helpers', 'edgeStore', 'station'],
function(jQuery, _jqueryui, _gmaps, simulation_manager,
    map_layers_add, stationsPool, imagesPool, linesPool,    
    time_helpers, timer, map_helpers, vehicle_helpers, edgeStore, station) {
  /*global $, google, simcity_topology_edges, InfoBox */

  /*simulation_manager was here*/

  /*map_layers_add was here*/

  $(document).ready(function() {
    var map;

    /*stationsPool was here*/

    /*imagesPool was here*/

    /*linesPool was here*/

    /*time_helpers was here*/

    /*timer was here*/

    /*map_helpers was here*/

    /*vehicle_helpers was here*/

    // END HELPERS

    $.ajax({
      url: 'api/stations.json',
      dataType: 'json',
      success: function(stations_data) {
        $.each(stations_data, function(index, station) {
          stationsPool.add(parseInt(station.id, 10), station.name, parseFloat(station.x), parseFloat(station.y));
        });
        fetch_edges();
      }
    });

    var fetch_edges = function() {

      $.ajax({
        url: 'api/edges.json',
        dataType: 'json',
        success: function(edges) {
          $.each(edges, function(index, edge) {
            edgeStore[index] = edge;
          });
          getConfig();
        }
      });
    };

    var getConfig = function() {
      $.ajax({url: 'api/config.json',
        dataType: 'json',
        success: function(config) {
          config['center_start'] = new google.maps.LatLng(config['center_start'][0],
              config['center_start'][1]);
          $.each(config, function(key, value) {
            simulation_manager.setParam(key, value);
          });
          startup();
        }});
    };

    var startup = function() {

      simulation_manager.subscribe('map_init', function() {
        vehicle_helpers.get();
        setInterval(vehicle_helpers.get, 5 * 60 * 1000);

        var updateBox = function() {
          var hms = timer.getTime();
          $('#vehicle_timetable tbody tr').each(function() {
            if ($(this).attr('data-dep-sec') < hms) {
              $(this).addClass('passed', 3000);
            }
          });
        };

        setInterval(updateBox, 1000);
      });


      timer.init('08:00:00');
      map_helpers.init();
      $('#panel').draggable({'handle': 'div:first-child > p', 'containment': 'document'});

    };

  });

});
