define(['jquery'], function(_jquery) {

  var vehicleFollower = (function() {
    var track_vehicle_name = null;
    var vehicle_name_found = window.location.href.match(/vehicle_name=([^&]*)/);
    if (vehicle_name_found !== null) {
      track_vehicle_name = decodeURIComponent(
          vehicle_name_found[1]).replace(/[^A-Z0-9]/i, '');
    }

    function isWaiting(id) {
      if ($('#vehicle_info').attr('data-vehicle-id') !== id) {
        return false;
      }

      if ($('#vehicle_info').attr('data-vehicle-follow') !== 'yes-init') {
        return false;
      }

      return true;
    }

    function matchByName(name) {
      if (track_vehicle_name === null) {
        return false;
      }

      name = name.replace(/[^A-Z0-9]/i, '');

      if (track_vehicle_name !== name) {
        return false;
      }

      return true;
    }

    function setActive() {
      $('#vehicle_info').attr('data-vehicle-follow', 'yes');
    }

    function isActive(id) {
      if ($('#vehicle_info').attr('data-vehicle-id') !== id) {
        return false;
      }

      if ($('#vehicle_info').attr('data-vehicle-follow') !== 'yes') {
        return false;
      }

      return true;
    }

    var toggler = $('#follow_trigger');
    function toggle(stop_following) {
      var toggler_value = 'Follow';
      if (stop_following) {
        $('#vehicle_info').attr('data-vehicle-follow', 'no');
        toggler.removeClass('toggled');
        map.unbind('center');
      } else {
        $('#vehicle_info').attr('data-vehicle-follow', 'yes-init');
        toggler.addClass('toggled');
        toggler_value = toggler.attr('data-value-toggle');
      }

      toggler.val(toggler_value);
    }
    toggler.click(function() {
      toggle(toggler.hasClass('toggled'));
    });

    return {
      isWaiting: isWaiting,
      matchByName: matchByName,
      setActive: setActive,
      isActive: isActive,
      toggle: toggle
    };
  })();
  return vehicleFollower;
});
