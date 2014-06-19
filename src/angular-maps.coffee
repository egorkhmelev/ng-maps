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

    getEventName = (s) ->
        nameArray = s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split("-")
        nameArray.shift()
        if nameArray.length
            return nameArray.join("_")

    $window.ngMapsAsync = ->
        api = $window.google.maps

        class custom.Marker extends api.OverlayView
            constructor: (options) ->
                self = this

                @$element = options.element
                @$element.css(position: "absolute")

                @$position = options.position
                @$$anchor = options.anchor

                @$events = ['dblclick']
                @$preventEvent = (event) ->
                    event.stopPropagation()

                for e in @$events
                    @$element.on(e, @$preventEvent)

            setMap: (map) ->
                return if @getMap() is map
                super(map)

            onAdd: ->
                panes = @getPanes()
                panes.overlayImage.appendChild(@$element[0])
                @$element.hide()

            onRemove: ->
                @$element.remove()

            setPosition: (latlng) ->
                @$position = latlng
                @draw()

            getPosition: ->
                @$position

            getAnchor: ->
                w = @$element.outerWidth()
                h = @$element.outerHeight()
                return angular.extend({x: 0, y: 0}, @$$anchor(w, h))

            setDraggable: (draggable) ->
                if draggable
                    @$element.on("mousedown", angular.bind(this, @_startDrag))
                else
                    @$element.off("mousedown", @_startDrag)


            draw: ->
                projection = @getProjection()
                return if !@$position || !projection

                anchor = @getAnchor()

                position = projection.fromLatLngToDivPixel(@$position)
                position.x = Math.round(position.x - anchor.x)
                position.y = Math.round(position.y - anchor.y)

                return unless position.x && position.y
                @$element.css(left: position.x, top: position.y).show()

            _getPoint: ->
                position = @$element.position()
                return new api.Point(
                    position.left,
                    position.top
                )

            _getEvent: (event, point) ->
                anchor = @getAnchor()
                projection = @getProjection()

                anchoredPoint = new api.Point(
                    point.x + anchor.x,
                    point.y + anchor.y
                )

                latLng = projection.fromDivPixelToLatLng(anchoredPoint)

                return {
                    originalEvent: event
                    position: latLng
                    defaultPrevented: false
                    preventDefault: ->
                        @defaultPrevented = true
                }


            _startDrag: (event) ->
                event.preventDefault()

                api.event.trigger(this, "dragstart", dragStartEvent = @_getEvent(event, @_getPoint()))
                return if dragStartEvent.defaultPrevented

                dragData = {
                    origin: event
                    originPoint: @_getPoint()
                    listeners: []
                }

                startDrag = angular.bind(this, @_drag, dragData)
                endDrag = angular.bind(this, @_endDrag, dragData)

                if @$element[0].setCapture
                    @$element[0].setCapture(true)
                    dragData.listeners.push api.event.addDomListener(@$element[0], "mousemove", startDrag)
                    dragData.listeners.push api.event.addDomListener(@$element[0], "mouseup", endDrag)
                else
                    dragData.listeners.push api.event.addDomListener($window, "mousemove", startDrag)
                    dragData.listeners.push api.event.addDomListener($window, "mouseup", endDrag)

            _drag: (data, event) ->
                event.preventDefault()

                dx = event.clientX - data.origin.clientX
                dy = event.clientY - data.origin.clientY

                point = new api.Point(
                    data.originPoint.x + dx,
                    data.originPoint.y + dy
                )

                dragEvent = @_getEvent(event, point)
                position = dragEvent.position

                api.event.trigger(this, "drag", dragEvent)
                return if dragEvent.defaultPrevented

                @setPosition(position)

            _endDrag: (data, event) ->
                api.event.trigger(this, "dragend", dragEndEvent = @_getEvent(event, @_getPoint()))
                api.event.removeListener(l) for l in data.listeners
                @$element[0].releaseCapture() if @$element[0].releaseCapture


        class custom.Window extends api.OverlayView
            constructor: (options) ->
                @$element = angular.element("<div>").append(options.content)
                @$element.css(position: "absolute")

                @$position = options.position
                @$shouldPan = options.pan || false
                @$$offset = options.offset

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
                offset = angular.extend({x: 0, y: 0}, @$$offset(w, h))

                map = @getMap()
                position = projection.fromLatLngToDivPixel(@$position)

                position.x = Math.round(position.x + offset.x)
                position.y = Math.round(position.y + offset.y)

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
        $scope.$ngMap = this

        @map = null
        @center = null
        @zoom = null
        @bounds = null

        return

    MapDirective = ($parse, $timeout, $window) ->
        restrict: "ACE"
        controller: ["$scope", "$timeout", MapController]
        scope: true
        transclude: true
        link: (scope, element, attrs, ctrl, transclude) ->
            $$window = angular.element($window)

            view = angular.element("<div>").hide()
            loadingClass = 'ng-map-loading'
            element.addClass(loadingClass)

            $maps().then (gmaps) ->
                ctrl.api = gmaps
                ctrl.api.visualRefresh = true

                options = angular.extend({}, defaultOptions, $parse(attrs.options)(scope))
                element.removeClass(loadingClass)

                ctrl.map = new ctrl.api.Map(element[0], options)

                onResize = ->
                    center = new ctrl.api.LatLng(ctrl.center.lat, ctrl.center.lng)
                    ctrl.api.event.trigger(ctrl.map, "resize")
                    ctrl.map.panTo(center)

                $$window.on("resize", onResize)
                scope.$on("$ngMap:resize", onResize)

                mapEventListeners = []
                for k, v of attrs
                    continue unless k.indexOf("event") is 0
                    if (eventName = getEventName(k))
                        do (k, v) ->
                            eventType = "addListener"

                            if eventName is "ready"
                                eventName = "idle"
                                eventType = "addListenerOnce"

                            listener = ctrl.api.event[eventType](ctrl.map, eventName, (event) ->
                                locals = {}
                                locals["$event"] = event if event

                                $timeout ->
                                    $parse(v)(scope, locals)
                            )

                            mapEventListeners.push(listener)

                centerListener = ctrl.map.addListener "center_changed", ->
                    center = ctrl.map.getCenter()
                    $timeout ->
                        ctrl.center = lat: center.lat(), lng: center.lng()

                zoomListener = ctrl.map.addListener "zoom_changed", ->
                    $timeout ->
                        ctrl.zoom = ctrl.map.getZoom()

                boundsListener = ctrl.map.addListener "bounds_changed", ->
                    bounds = ctrl.map.getBounds()
                    ne = bounds.getNorthEast()
                    sw = bounds.getSouthWest()

                    $timeout ->
                        ctrl.bounds = {
                            ne:
                                lat: ne.lat()
                                lng: ne.lng()
                            sw:
                                lat: sw.lat()
                                lng: sw.lng()
                        }

                scope.$on "$destroy", ->
                    $$window.off("resize", onResize)

                    ctrl.api.event.removeListener(centerListener)
                    ctrl.api.event.removeListener(zoomListener)
                    ctrl.api.event.removeListener(boundsListener)

                    # remove all map event listeners
                    ctrl.api.event.removeListener(l) for l in mapEventListeners


                $timeout ->
                    # transclude and parse all child directives
                    transclude(scope, (clone) ->
                        view.append(clone)
                        element.append(view)
                    )


    MapCenterDirective = ($timeout) ->
        restrict: "ACE"
        require: "^ngMap"
        scope:
            lat: "=lat"
            lng: "=lng"
        link: (scope, element, attrs, ctrl) ->
            scope.$watch(->
                lat: scope.lat
                lng: scope.lng
            , (center) ->
                return if !center.lat || !center.lng
                ctrl.map.setCenter(
                    new ctrl.api.LatLng(center.lat, center.lng)
                )
            , true)

    MapZoomDirective = ($timeout) ->
        restrict: "ACE"
        require: "^ngMap"
        scope:
            zoom: "=value"
        link: (scope, element, attrs, ctrl) ->
            scope.$watch("zoom", (zoom) ->
                return unless zoom
                ctrl.map.setZoom(zoom)
            )

    MapFitDirective = ($timeout) ->
        restrict: "ACE"
        require: "^ngMap"
        scope:
            bounds: "=bounds"
        link: (scope, element, attrs, ctrl) ->
            scope.$watch("bounds", (bounds) ->
                return unless bounds
                ctrl.map.fitBounds(bounds)
            )

    MapMarkerDirective = ($parse, $timeout) ->
        restrict: "ACE"
        require: "^ngMap"
        scope: true
        link: (scope, element, attrs, ctrl) ->
            contents = element.contents()
            markerNode = contents.filter("*")
            isCustomLayout =  markerNode.length > 0

            centerAnchor = "{x: $width / 2, y: $height / 2}"
            getAnchor = (w, h) ->
                (attrs.anchor && $parse(attrs.anchor) || $parse(centerAnchor))(scope, {$width: w, $height: h})

            createMarker = ->
                m = null

                if isCustomLayout > 0 # Custom marker layout
                    m = new custom.Marker(element: markerNode.first(), anchor: getAnchor)

                    markerEventListeners = []
                    for k, v of attrs
                        continue unless k.indexOf("event") is 0
                        if (eventName = getEventName(k))
                            do (k, v) ->
                                listener = ctrl.api.event.addListener(m, eventName, (event) ->
                                    locals = {}
                                    locals["$event"] = event if event
                                    locals["$marker"] = m

                                    $parse(v)(scope, locals)
                                )

                                markerEventListeners.push(listener)

                    markerEventListeners.push ctrl.api.event.addListener(m, "dragstart", (event) ->
                        $timeout -> scope.$dragging = true
                    )

                    markerEventListeners.push ctrl.api.event.addListener(m, "dragend", (event) ->
                        $timeout -> scope.$dragging = false
                    )

                else # Default layout
                    m = new ctrl.api.Marker()

                return m

            $marker = {
                scope: scope
                marker: createMarker()
            }

            scope.$marker = $marker.marker

            lat = $parse(attrs.lat)
            lng = $parse(attrs.lng)
            draggable = $parse(attrs.draggable)

            once = true
            unwatch = scope.$watch ->
                lat: lat(scope)
                lng: lng(scope)
            , (position) ->
                $marker.marker.setPosition(new ctrl.api.LatLng(position.lat, position.lng))
                $marker.marker.setMap(ctrl.map)

                $parse(attrs.onAdd)(scope) if once && 'onAdd' of attrs
                once = false
            , true

            unwatchDraggable = scope.$watch ->
                draggable(scope)
            , (draggable) ->
                $marker.marker.setDraggable(draggable)

            scope.$on "$destroy", ->
                unwatch()
                unwatchDraggable()
                $marker.marker.setMap(null)
                $parse(attrs.onRemove)(scope) if 'onRemove' of attrs

    MapLayerDirective = ($timeout, $parse) ->
        restrict: "ACE"
        require: "^ngMap"
        transclude: true
        link: (scope, element, attrs, ctrl, transclude) ->

            infoWindowList = []
            shouldPan = $parse(attrs.pan)(scope) || false

            defaultOffset = "{x: -$width / 2, y: -$height - 30}"
            getOffset = (w, h) ->
                (attrs.offset && $parse(attrs.offset) || $parse(defaultOffset))(scope, {$width: w, $height: h})

            ctrl[attrs.name || "infoWindow"] = (lat, lng, locals = {}) ->

                $infoWindow = {
                    scope: angular.extend(scope.$new(), locals)
                }

                $infoWindow.customWindow = new custom.Window(
                    position: new ctrl.api.LatLng(lat, lng)
                    content: transclude($infoWindow.scope, angular.noop)
                    pan: shouldPan
                    offset: getOffset
                )

                $infoWindow.scope.$on "$destroy", ->
                    $infoWindow.customWindow.close()

                $timeout ->
                    $infoWindow.customWindow.open(ctrl.map)

                return $infoWindow

    MapPolylineDirective = ($parse) ->
        restrict: "ACE"
        require: "^ngMap"
        scope:
            path: "=path"
            color: "=color"
            opacity: "=opacity"
            weight: "=weight"
        link: (scope, element, attrs, ctrl) ->

            poly = new ctrl.api.Polyline()
            poly.setMap(ctrl.map)

            scope.$watch "path", (pathSrc = []) ->
                path = []
                for p in pathSrc
                    path.push new ctrl.api.LatLng(p[0], p[1])
                poly.setPath(path)
            , true

            scope.$watch ->
                strokeColor: scope.color || '#FF0000'
                strokeOpacity: scope.opacity || 1.0
                strokeWeight: scope.weight || 1.0
            , (options) ->
                poly.setOptions(options)
            , true


            polylineEventListeners = []
            for k, v of attrs
                continue unless k.indexOf("event") is 0
                if (eventName = getEventName(k))
                    do (k, v) ->
                        listener = ctrl.api.event.addListener(poly, eventName, (event) ->
                            locals = {}
                            locals["$event"] = event if event
                            locals["$poly"] = poly

                            $parse(v)(scope.$parent, locals)
                        )

                        polylineEventListeners.push(listener)

            scope.$on "$destroy", ->
                ctrl.api.event.removeListener(l) for l in polylineEventListeners
                poly.setMap(null)


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
            link: (scope, element, attrs, ctrl, transclude) ->
                controlElement = angular.element("<div>").append(transclude())
                ctrl.map.controls[positions(p, ctrl.api.ControlPosition)].push(controlElement[0])
        ]

    module
        .provider("$ngMaps", [MapsProvider])

        .directive("ngMap", ["$parse", "$timeout", "$window", MapDirective])
        .directive("ngMapCenter", ["$timeout", MapCenterDirective])
        .directive("ngMapZoom", ["$timeout", MapZoomDirective])
        .directive("ngMapFit", ["$timeout", MapFitDirective])

        .directive("ngMapMarker", ["$parse", "$timeout", MapMarkerDirective])
        .directive("ngMapLayer", ["$timeout", "$parse", MapLayerDirective])

        .directive("ngMapPolyline", ["$parse", MapPolylineDirective])

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