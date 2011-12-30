require({
  baseUrl: 'static/js',
  paths: {
    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min',
    jqueryui: 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min',
    infobox: 'infobox_packed'
  },
  priority: ['jquery', 'jqueryui']
}, ['map']);
