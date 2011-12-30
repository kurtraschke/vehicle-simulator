define([], function() {
  // Time helpers
  // Roles:
  // - convert seconds that passed from midnight into nicely formatted hh:mm:ss
  // and viceversa
  var time_helpers = (function() {
    function hms2s(hms) {
      var parts = hms.split(':');
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    function s2hms(dayS) {
      function pad2Dec(what) {
        return (what < 10 ? '0' + what : what);
      }

      if (dayS >= 3600 * 24) {
        dayS -= 3600 * 24;
      }

      // From http://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
      var hours = Math.floor(dayS / 3600);
      dayS %= 3600;
      var minutes = Math.floor(dayS / 60);
      var seconds = dayS % 60;

      return pad2Dec(hours) + ':' + pad2Dec(minutes) + ':' + pad2Dec(seconds);
    }
    function s2hm(dayS) {
      // TODO - Round seconds to minutes, can be done nicer ?
      dayS = (dayS / 60).toFixed(0) * 60;
      var hms = s2hms(dayS);
      return hms.substr(0, 5);
    }

    return {
      hms2s: hms2s,
      s2hms: s2hms,
      s2hm: s2hm
    };
  })();
  return time_helpers;
});

