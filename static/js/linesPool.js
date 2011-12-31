define(['async!http://maps.googleapis.com/maps/api/js?v=3.7&sensor=false&libraries=geometry!callback', 'edgeStore'], function(_gmaps, edgeStore) {
  // Routes manager.
  // Roles:
  // - keep a reference for the routes between stations
  //      i.e. (Zürich HB-Bern, Zürich HB-Olten, Olten-Bern)
  //      Note: one route can contain one or more edges (the low-level entity in the simulation graph)
  // - interpolate position at given percent along a route
  var linesPool = (function() {
    var routes = {};
    var route_highlight = new google.maps.Polyline({
      path: [],
      strokeColor: '#FDD017',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: null,
      ids: null
    });

    // TODO - that can be a nice feature request for google.maps.geometry lib
    function positionOnRouteAtPercentGet(a, b, perc) {
      var route = routes[a + '_' + b];

      var dC = 0;
      var dAC = route.length * perc;

      for (var i = 1; i < route.points.length; i++) {
        var pA = route.points[i - 1];
        var pB = route.points[i];
        var d12 = google.maps.geometry.spherical.computeDistanceBetween(pA, pB);
        if ((dC + d12) > dAC) {
          return google.maps.geometry.spherical.interpolate(pA, pB, (dAC - dC) / d12);
        }
        dC += d12;
      }

      return null;
    }

    function routeExists(a, b) {
      return typeof routes[a + '_' + b] !== 'undefined';
    }

    function routeAdd(a, b, edges) {
      var routePoints = [];
      $.each(edges, function(k, edgeID) {
        var edge = edgeStore[Math.abs(edgeID)];

        var points = google.maps.geometry.encoding.decodePath(edge);
        if (edgeID < 0) {
          points.reverse();
        }
        // TODO - use some MVCArray magic to remove the last element of edges when concatenating ?
        routePoints = routePoints.concat(points);
      });

      var routeLength = google.maps.geometry.spherical.computeLength(routePoints).toFixed(3);

      routes[a + '_' + b] = {
        'points': routePoints,
        'length': routeLength
      };
    }

    function lengthGet(a, b) {
      return routes[a + '_' + b].length;
    }

    function routeHighlight(station_ids) {
      if (route_highlight.get('ids') === station_ids.join(',')) { return; }
      route_highlight.set('ids', station_ids.join(','));

      var points = [];
      $.each(station_ids, function(index, id) {
        if (index === 0) { return; }
        points = points.concat(routes[station_ids[index - 1] + '_' + id].points);
      });

      route_highlight.setPath(points);
      route_highlight.setMap(map);
    }

    function routeHighlightRemove() {
      route_highlight.setMap(null);
      route_highlight.set('ids', null);
    }

    return {
      positionGet: positionOnRouteAtPercentGet,
      routeExists: routeExists,
      routeAdd: routeAdd,
      lengthGet: lengthGet,
      routeHighlight: routeHighlight,
      routeHighlightRemove: routeHighlightRemove
    };
  })();
  return linesPool;
});
