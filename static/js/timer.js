define(['time_helpers'], function(time_helpers) {
  // Time manager
  // Roles:
  // - manages the current number of seconds that passed since midnight
  // - 'init' can be used with given hh:mm:ss in order to simulate different timestamps
  var timer = (function() {
    var delay = 0;

    function getNow() {
      var now = new Date();

      var hours = now.getHours();
      var minutes = now.getMinutes();
      var seconds = now.getSeconds();

      return hours * 3600 + minutes * 60 + seconds;
    }

    function getDaySeconds() {
      return getNow() - delay;
    }

    function init(hms) {
      if (typeof(hms) !== 'undefined') {
        delay = getNow() - time_helpers.hms2s(hms);
      }

      var timeContainer = $('#day_time');
      function paintHM() {
        timeContainer.text(time_helpers.s2hms(getDaySeconds()));
      }

      setInterval(function() {
        paintHM();
      }, 1000);
    }

    function getHM() {
      var hms = time_helpers.s2hms(getDaySeconds());
      return hms.substring(0, 2) + hms.substring(3, 5);
    }

    return {
      init: init,
      getTime: getDaySeconds,
      getHM: getHM
    };
  })();
  return timer;
});

