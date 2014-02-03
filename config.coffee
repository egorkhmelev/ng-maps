exports.config =
    paths:
        watched: ['src', 'bower_components', 'assets']
    conventions:
        ignored: /(^|\/)_|.min.|jquery.migrate/
        vendor: /^bower_components(\/|\\)|vendor(\/|\\)/
        assets: /assets(\/|\\)/
    modules:
        definition: false
        wrapper: (path, data) ->
          """
(function() {
  'use strict';
  #{data}
}).call(this);\n\n
          """
    files:
        javascripts:
            joinTo:
                'angular-maps.js': /^src/
                'vendor.js': /^bower_components/

