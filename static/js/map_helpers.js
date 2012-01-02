define(['jquery', 'async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback', 'simulation_manager'], function(_jquery, _gmaps, simulation_manager) {
  // Map manager
  // Roles:
  // - initialize the map canvas with available layers (tracks, stations)
  // - styles the maps
  // - add map controls
  // - handle location lookups
  var map_helpers = (function() {
    function init() {
      var mapStyles = [
        {
          featureType: 'poi.business',
          stylers: [
            { visibility: 'off' }
          ]
        },{
          featureType: 'road',
          elementType: 'labels',
          stylers: [
            { visibility: 'off' }
          ]
        },{
          featureType: 'road',
          elementType: 'labels',
          stylers: [
            { visibility: 'off' }
          ]
        },{
          featureType: 'road',
          elementType: 'geometry',
          stylers: [
            { visibility: 'simplified' },
            { lightness: 70 }
          ]
        },{
          featureType: 'transit',
          stylers: [
            { visibility: 'off' }
          ]
        }
      ];

      map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: simulation_manager.getParam('zoom_start'),
        center: simulation_manager.getParam('center_start'),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        scaleControl: true,
        streetViewControl: true,
        overviewMapControl: true,
        scrollwheel: false
            });

      map.setOptions({
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT
        }
      });

      google.maps.event.addListener(map, 'idle', function() {
        if (simulation_manager.getMap() === null) {
          // TODO - FIXME later ?
          // Kind of a hack, getBounds is ready only after a while since loading, so we hook in the 'idle' event
          simulation_manager.setMap(map);
          simulation_manager.notify('map_init');
        }
      });

      // SIMULATION PANEL
      var location_el = $('#user_location');
      location_el.attr('value-default', location_el.attr('value'));

      var geocoder = new google.maps.Geocoder();
      function geocoding_handle(params) {
        geocoder.geocode(params, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            location_el.val(results[0].formatted_address);
            map.setCenter(results[0].geometry.location);
            map.setZoom(15);
          }
        });
      }

      $('#geolocation_click').click(function() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            geocoding_handle({'latLng': new google.maps.LatLng(position.coords.latitude,
                                                               position.coords.longitude)});
          });
        }
      });
      location_el.focus(function() {
        if ($(this).val() === $(this).attr('value-default')) {
          $(this).val('');
        }
      });
      location_el.keypress(function(e) {
        if (e.which === 13) {
          geocoding_handle({'address': $(this).val()});
        }
      });

      $('input.panel_close').click(function() {
        $(this).closest('div[data-type="panel"]').addClass('hidden');
      });
      // END
    }

    return {
      init: init
    };
  })();
  return map_helpers;
});
