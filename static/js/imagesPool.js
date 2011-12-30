define(['async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback'], function(_gmaps) {
  // Vehicle icons manager.
  // Roles:
  // - keep a reference for each vehicle type (IC, ICE, etc..)
  var imagesPool = (function() {
    var icons = {};
    function iconGet(type) {
      if (typeof icons[type] !== 'undefined') {
        return icons[type];
      }

      var icon = new google.maps.MarkerImage(
          'static/images/vehicle-types/' + type + '.png',
          new google.maps.Size(20, 20),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 10)
          );
      icons[type] = icon;

      return icon;
    }

    return {
      iconGet: iconGet
    };
  })();
  return imagesPool;
});
