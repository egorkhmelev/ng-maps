((angular) ->

    module = angular.module("ngMaps", [])

    ng = angular.injector(["ng"])
    $document = ng.get("$document")
    $window = ng.get("$window")
    $q = ng.get("$q")

    deferred = $q.defer()
    scriptId = 'google-maps-api'

    src = "//maps.googleapis.com/maps/api/js?sensor=false&language=en&callback=ngMapsAsync"
    apiKey = null
    extra = []
    defaultOptions = {}

    custom = {}

    $window.ngMapsAsync = ->
        api = $window.google.maps

        class custom.Marker extends api.OverlayView
            constructor: (options) ->
                @$element = options.element
                @$element.css(position: "absolute")

                @$position = options.position

                @$events = ['dblclick']
                @$preventEvent = (event) ->
                    event.stopPropagation()

            onAdd: ->
                panes = @getPanes()
                panes.overlayImage.appendChild(@$element[0])
                @$element.on e, @$preventEvent for e in @$events

            onRemove: ->
                @$element.remove()

            setPosition: (latlng) ->
                @$position = latlng
                @draw()

            getPosition: ->
                @$position

            draw: ->
                projection = @getProjection()
                return if !@$position || !projection

                w = @$element.width()
                h = @$element.height()

                position = projection.fromLatLngToDivPixel(@$position)
                position.x = Math.round(position.x - w/2)
                position.y = Math.round(position.y - h/2)

                @$element.css(left: position.x, top: position.y)

        class custom.Window extends api.OverlayView
            constructor: (options) ->
                @$element = angular.element("<div>").addClass("ng-map-window").append(options.content)
                @$element.css(position: "absolute")

                @$position = options.position
                @$shouldPan = options.pan || false

                @$events = [ 'mousedown', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchmove', 'dblclick', 'contextmenu', 'click' ]
                @$preventEvent = (event) ->
                    event.stopPropagation()

                @$panned = false

            onAdd: ->
                panes = @getPanes()
                panes.floatPane.appendChild(@$element[0])
                @$element.on e, @$preventEvent for e in @$events

            onRemove: ->
                @$element.remove()
                @$element.off e, @$preventEvent for e in @$events

            setPosition: (latlng) ->
                @$position = latlng
                @draw()

            open: (map) ->
                @setMap(map)

            close: ->
                @setMap(null)
                @$panned = false

            getPosition: ->
                @$position

            draw: ->
                projection = @getProjection()
                return if !@$position || !projection

                w = @$element.width()
                h = @$element.height()

                map = @getMap()
                position = projection.fromLatLngToDivPixel(@$position)

                position.x = Math.round(position.x - w/2)
                position.y = Math.round(position.y - h - 30)

                @$element.css(left: position.x, top: position.y)

                return if @$panned || !@$shouldPan

                # pan to fit info window
                bounds = map.getBounds()
                sw = projection.fromDivPixelToLatLng(new api.Point(position.x, position.y + h + 20))
                ne = projection.fromDivPixelToLatLng(new api.Point(position.x + w + 20, position.y - 20))
                map.panToBounds(new api.LatLngBounds(sw, ne)) if !bounds.contains(ne) || !bounds.contains(sw)
                @$panned = true

        deferred.resolve(api)

    $maps = ->
        unless $document[0].getElementById(scriptId)
            src += "&key=#{apiKey}" if apiKey
            src += "&libraries=#{extra.join(',')}" if extra.length

            script = $document[0].createElement('script')
            script.id = scriptId
            script.type = 'text/javascript'
            script.src = src
            $document[0].body.appendChild(script)

        return deferred.promise

    MapsProvider = ->
        @key = (key) ->
            apiKey = key
            return this

        @lib = (lib) ->
            extra.push(lib)
            return this

        @options = (o) ->
            defaultOptions = o

        @$get = -> $maps()

        return

    MapController = ($scope, $timeout) ->
        @map = null
        @center = null
        @zoom = null
        @bounds = null

        @$$markers = []

        @addMarker = (marker) =>
            return unless marker
            @$$markers.push(marker)

        @removeMarker = (marker) =>
            return unless marker
            index = @$$markers.indexOf(marker)
            @$$markers.splice(index, 1) if index != -1

        $scope.$ngMap = this
        return


    MapDirective = ($parse, $timeout) ->
        restrict: "ACE"
        controller: ["$scope", "$timeout", MapController]
        scope: true
        transclude: true
        link: (scope, element, attrs, ctrl, transclude) ->
            view = angular.element("<div>").hide()
            loadingClass = 'ng-map-loading'
            element.addClass(loadingClass)

            getEventName = (s) ->
                nameArray = s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split("-")
                nameArray.shift()
                if nameArray.length
                    return nameArray.join("_")

            $maps().then (gmaps) ->
                ctrl.api = gmaps
                ctrl.api.visualRefresh = true

                options = angular.extend({}, defaultOptions, $parse(attrs.options)(scope))
                element.removeClass(loadingClass)

                ctrl.map = new ctrl.api.Map(element[0], options)

                for k, v of attrs
                    continue unless k.indexOf("event") is 0
                    if (eventName = getEventName(k))
                        do (k, v) ->
                            ctrl.map.addListener eventName, (event) ->
                                locals = {}
                                locals["$event"] = event if event

                                $timeout ->
                                    $parse(v)(scope, locals)

                $timeout ->
                    # transclude and parse all child directives
                    transclude(scope, (clone) ->
                        view.append(clone)
                        element.append(view)
                    )


    MapCenterDirective = ($timeout) ->
        restrict: "ACE"
        require: ["^ngMap", "?ngModel"]
        scope:
            lat: "=lat"
            lng: "=lng"
        link: (scope, element, attrs, ctrls) ->
            [ngMap, ngModel] = ctrls

            scope.$watch(->
                lat: scope.lat
                lng: scope.lng
            , (center) ->
                return if !center.lat || !center.lng
                ngMap.map.setCenter(
                    new ngMap.api.LatLng(center.lat, center.lng)
                )
            , true)

            centerListener = ngMap.map.addListener "center_changed", ->
                center = ngMap.map.getCenter()
                $timeout ->
                    ngMap.center = lat: center.lat(), lng: center.lng()

            boundsListener = ngMap.map.addListener "bounds_changed", ->
                bounds = ngMap.map.getBounds()
                ne = bounds.getNorthEast()
                sw = bounds.getSouthWest()

                $timeout ->
                    ngMap.bounds = {
                        ne:
                            lat: ne.lat()
                            lng: ne.lng()
                        sw:
                            lat: sw.lat()
                            lng: sw.lng()
                    }

            scope.$on "$destroy", ->
                ngMap.api.event.removeListener(centerListener)
                ngMap.api.event.removeListener(boundsListener)

    MapZoomDirective = ($timeout) ->
        restrict: "ACE"
        require: ["^ngMap", "?ngModel"]
        scope:
            zoom: "=value"
        link: (scope, element, attrs, ctrls) ->
            [ngMap, ngModel] = ctrls

            scope.$watch("zoom", (zoom) ->
                return unless zoom
                ngMap.map.setZoom(zoom)
            )

            zoomListener = ngMap.map.addListener "zoom_changed", ->
                $timeout ->
                    ngMap.zoom = ngMap.map.getZoom()

            scope.$on "$destroy", ->
                ngMap.api.event.removeListener(zoomListener)

    MapMarkerDirective = ($parse) ->
        restrict: "ACE"
        require: ["^ngMap", "?ngModel"]
        scope: true
        link: (scope, element, attrs, ctrls) ->
            [ngMap, ngModel] = ctrls

            contents = element.contents()
            markerNode = contents.filter("*")
            isCustomLayout =  markerNode.length > 0

            $marker = {
                scope: scope
            }

            createMarker = ->
                m = null

                if isCustomLayout > 0 # Custom marker layout
                    m = new custom.Marker(element: markerNode.first())

                else # Default layout
                    m = new ngMap.api.Marker()

                return m

            lat = $parse(attrs.lat)
            lng = $parse(attrs.lng)

            unwatch = scope.$watch ->
                lat: lat(scope)
                lng: lng(scope)
            , (position) ->
                isVisible = !!$marker.marker
                $marker.marker ||= createMarker()
                $marker.marker.setPosition(new ngMap.api.LatLng(position.lat, position.lng))
                $marker.marker.setMap(ngMap.map)

                scope.$marker = $marker.marker
                ngMap.addMarker($marker)

                $parse(attrs.onAdd)(scope) if !isVisible && 'onAdd' of attrs
            , true

            scope.$on "$destroy", ->
                unwatch()
                $marker.marker.setMap(null)
                ngMap.removeMarker($marker)
                $parse(attrs.onRemove)(scope) if 'onRemove' of attrs

    MapLayerDirective = ($timeout, $parse) ->
        restrict: "ACE"
        require: "^ngMap"
        transclude: true
        link: (scope, element, attrs, ngMap, transclude) ->

            infoWindowList = []
            shouldPan = $parse(attrs.pan)(scope) || false

            ngMap[attrs.name || "infoWindow"] = (lat, lng, locals = {}) ->

                $infoWindow = {
                    scope: angular.extend(scope.$new(), locals)
                }

                $infoWindow.customWindow = new custom.Window(position: new ngMap.api.LatLng(lat, lng), content: transclude($infoWindow.scope, angular.noop), pan: shouldPan)

                $infoWindow.scope.$on "$destroy", ->
                    $infoWindow.customWindow.close()

                $timeout ->
                    $infoWindow.customWindow.open(ngMap.map)

                return $infoWindow

    $MapControlDirective = (p) ->
        positions = (p, api) ->
            {
                'tc': api.TOP_CENTER
                'tl': api.TOP_LEFT
                'tr': api.TOP_RIGHT
                'lt': api.LEFT_TOP
                'rt': api.RIGHT_TOP
                'lc': api.LEFT_CENTER
                'rc': api.RIGHT_CENTER
                'lb': api.LEFT_BOTTOM
                'rb': api.RIGHT_BOTTOM
                'bc': api.BOTTOM_CENTER
                'bl': api.BOTTOM_LEFT
                'br': api.BOTTOM_RIGHT
            }[p]

        [->
            restrict: "ACE"
            require: "^ngMap"
            transclude: true
            scope: true
            link: (scope, element, attrs, ngMap, transclude) ->
                controlElement = angular.element("<div>").append(transclude())
                ngMap.map.controls[positions(p, ngMap.api.ControlPosition)].push(controlElement[0])
        ]

    module
        .provider("$ngMaps", [MapsProvider])

        .directive("ngMap", ["$parse", "$timeout", MapDirective])
        .directive("ngMapCenter", ["$timeout", MapCenterDirective])
        .directive("ngMapZoom", ["$timeout", MapZoomDirective])

        .directive("ngMapMarker", ["$parse", MapMarkerDirective])
        .directive("ngMapLayer", ["$timeout", "$parse", MapLayerDirective])

        .directive("ngMapTc", $MapControlDirective('tc'))
        .directive("ngMapTl", $MapControlDirective('tl'))
        .directive("ngMapTr", $MapControlDirective('tr'))
        .directive("ngMapLt", $MapControlDirective('lt'))
        .directive("ngMapRt", $MapControlDirective('rt'))
        .directive("ngMapLc", $MapControlDirective('lc'))
        .directive("ngMapRc", $MapControlDirective('rc'))
        .directive("ngMapLb", $MapControlDirective('lb'))
        .directive("ngMapRb", $MapControlDirective('rb'))
        .directive("ngMapBc", $MapControlDirective('bc'))
        .directive("ngMapBl", $MapControlDirective('bl'))
        .directive("ngMapBr", $MapControlDirective('br'))

)(window.angular)