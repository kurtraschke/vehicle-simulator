define(['async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback',
  'jquery'],
function(_google, _jquery) {
  var simulation_manager = (function() {
    var params = {
      //center_start: new google.maps.LatLng(40.75773, -73.985708),
      zoom_start: 13,
      zoom_follow: 17,
      zoom_station: 15
      //ft_id_mask: '2474478',
      //ft_id_lines: '2475282',
      //ft_id_stations: '2475281'
    };

    var map = null;

    var listeners = {
      map_init: []
    };

    function notify(type) {
      $.each(listeners[type], function(i, fn) {
        fn();
      });
    }

    function subscribe(type, fn) {
      listeners[type].push(fn);
    }

    function setMap(o) {
      map = o;
    }

    function getMap() {
      return map;
    }

    function getParam(p) {
      return params[p];
    }

    function setParam(p, v) {
      params[p] = v;
    }

    return {
      subscribe: subscribe,
      notify: notify,
      setMap: setMap,
      getMap: getMap,
      getParam: getParam,
      setParam: setParam
    };
  })();

  return simulation_manager;
});
