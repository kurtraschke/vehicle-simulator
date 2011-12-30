define(['async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback'], function(_gmaps) {

  var stationsPool = (function() {
    var stations = {};

    function get(id) {
      return (typeof stations[id]) === 'undefined' ? '' : stations[id].get('name');
    }

    function location_get(id) {
      return (typeof stations[id]) === 'undefined' ? '' : stations[id].get('location');
    }

    function add(id, name, x, y) {
      var station = new google.maps.MVCObject();
      station.set('name', name);
      station.set('location', new google.maps.LatLng(parseFloat(y), parseFloat(x)));

      stations[id] = station;
    }

    return {
      get: get,
      add: add,
      location_get: location_get
    };
  })();
  return stationsPool;
});
