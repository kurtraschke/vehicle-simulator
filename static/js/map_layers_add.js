define(['simulation_manager'], function(simulation_manager) {
  var map_layers = {};
  (function() {
    function map_layers_add() {
      var map = simulation_manager.getMap();

      map_layers['lines'] = new google.maps.FusionTablesLayer({
        query: {
          select: 'geometry',
          from: simulation_manager.getParam('ft_id_lines')
        },
        clickable: false,
        map: map,
        styles: [
          {
            polylineOptions: {
              strokeColor: '#FF0000',
              strokeWeight: 2
            }
          },{
            where: "type = 'tunnel'",
            polylineOptions: {
              strokeColor: '#FAAFBE',
              strokeWeight: 1.5
            }
          }
        ]
      });
      map_layers['stations'] = new google.maps.FusionTablesLayer({
        query: {
          select: 'geometry',
          from: simulation_manager.getParam('ft_id_stations')
        },
        clickable: true,
        suppressInfoWindows: true,
        map: map
      });
      map_layers['mask'] = new google.maps.FusionTablesLayer({
        query: {
          select: 'geometry',
          from: simulation_manager.getParam('ft_id_mask')
        },
        clickable: false,
        map: map
      });

      function trigger_toggleLayerVisibility() {
        function toggleLayerVisibility(layer, show) {
          if (show) {
            if (layer.getMap() === null) {
              layer.setMap(map);
            }
          } else {
            if (layer.getMap() !== null) {
              layer.setMap(null);
            }
          }
        }

        var zoom = map.getZoom();
        toggleLayerVisibility(map_layers['stations'], zoom >= 12);
      }

      google.maps.event.addListener(map, 'idle', trigger_toggleLayerVisibility);
      trigger_toggleLayerVisibility();
    }

    simulation_manager.subscribe('map_init', map_layers_add);
  })();

  return map_layers;
});
