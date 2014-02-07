(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(angular) {
    var $MapControlDirective, $document, $maps, $q, $window, MapCenterDirective, MapController, MapDirective, MapLayerDirective, MapMarkerDirective, MapZoomDirective, MapsProvider, apiKey, custom, defaultOptions, deferred, extra, module, ng, scriptId, src;
    module = angular.module("ngMaps", []);
    ng = angular.injector(["ng"]);
    $document = ng.get("$document");
    $window = ng.get("$window");
    $q = ng.get("$q");
    deferred = $q.defer();
    scriptId = 'google-maps-api';
    src = "//maps.googleapis.com/maps/api/js?sensor=false&language=en&callback=ngMapsAsync";
    apiKey = null;
    extra = [];
    defaultOptions = {};
    custom = {};
    $window.ngMapsAsync = function() {
      var api;
      api = $window.google.maps;
      custom.Marker = (function(_super) {
        __extends(Marker, _super);

        function Marker(options) {
          this.$element = options.element;
          this.$element.css({
            position: "absolute"
          });
          this.$position = options.position;
          this.$events = ['dblclick'];
          this.$preventEvent = function(event) {
            return event.stopPropagation();
          };
        }

        Marker.prototype.onAdd = function() {
          var e, panes, _i, _len, _ref, _results;
          panes = this.getPanes();
          panes.overlayImage.appendChild(this.$element[0]);
          _ref = this.$events;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            _results.push(this.$element.on(e, this.$preventEvent));
          }
          return _results;
        };

        Marker.prototype.onRemove = function() {
          return this.$element.remove();
        };

        Marker.prototype.setPosition = function(latlng) {
          this.$position = latlng;
          return this.draw();
        };

        Marker.prototype.getPosition = function() {
          return this.$position;
        };

        Marker.prototype.draw = function() {
          var h, position, projection, w;
          projection = this.getProjection();
          if (!this.$position || !projection) {
            return;
          }
          w = this.$element.width();
          h = this.$element.height();
          position = projection.fromLatLngToDivPixel(this.$position);
          position.x = Math.round(position.x - w / 2);
          position.y = Math.round(position.y - h / 2);
          return this.$element.css({
            left: position.x,
            top: position.y
          });
        };

        return Marker;

      })(api.OverlayView);
      custom.Window = (function(_super) {
        __extends(Window, _super);

        function Window(options) {
          this.$element = angular.element("<div>").addClass("ng-map-window").append(options.content);
          this.$element.css({
            position: "absolute"
          });
          this.$position = options.position;
          this.$shouldPan = options.pan || false;
          this.$events = ['mousedown', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchmove', 'dblclick', 'contextmenu', 'click'];
          this.$preventEvent = function(event) {
            return event.stopPropagation();
          };
          this.$panned = false;
        }

        Window.prototype.onAdd = function() {
          var e, panes, _i, _len, _ref, _results;
          panes = this.getPanes();
          panes.floatPane.appendChild(this.$element[0]);
          _ref = this.$events;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            _results.push(this.$element.on(e, this.$preventEvent));
          }
          return _results;
        };

        Window.prototype.onRemove = function() {
          var e, _i, _len, _ref, _results;
          this.$element.remove();
          _ref = this.$events;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            _results.push(this.$element.off(e, this.$preventEvent));
          }
          return _results;
        };

        Window.prototype.setPosition = function(latlng) {
          this.$position = latlng;
          return this.draw();
        };

        Window.prototype.open = function(map) {
          return this.setMap(map);
        };

        Window.prototype.close = function() {
          this.setMap(null);
          return this.$panned = false;
        };

        Window.prototype.getPosition = function() {
          return this.$position;
        };

        Window.prototype.draw = function() {
          var bounds, h, map, ne, position, projection, sw, w;
          projection = this.getProjection();
          if (!this.$position || !projection) {
            return;
          }
          w = this.$element.width();
          h = this.$element.height();
          map = this.getMap();
          position = projection.fromLatLngToDivPixel(this.$position);
          position.x = Math.round(position.x - w / 2);
          position.y = Math.round(position.y - h - 30);
          this.$element.css({
            left: position.x,
            top: position.y
          });
          if (this.$panned || !this.$shouldPan) {
            return;
          }
          bounds = map.getBounds();
          sw = projection.fromDivPixelToLatLng(new api.Point(position.x, position.y + h + 20));
          ne = projection.fromDivPixelToLatLng(new api.Point(position.x + w + 20, position.y - 20));
          if (!bounds.contains(ne) || !bounds.contains(sw)) {
            map.panToBounds(new api.LatLngBounds(sw, ne));
          }
          return this.$panned = true;
        };

        return Window;

      })(api.OverlayView);
      return deferred.resolve(api);
    };
    $maps = function() {
      var script;
      if (!$document[0].getElementById(scriptId)) {
        if (apiKey) {
          src += "&key=" + apiKey;
        }
        if (extra.length) {
          src += "&libraries=" + (extra.join(','));
        }
        script = $document[0].createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.src = src;
        $document[0].body.appendChild(script);
      }
      return deferred.promise;
    };
    MapsProvider = function() {
      this.key = function(key) {
        apiKey = key;
        return this;
      };
      this.lib = function(lib) {
        extra.push(lib);
        return this;
      };
      this.options = function(o) {
        return defaultOptions = o;
      };
      this.$get = function() {
        return $maps();
      };
    };
    MapController = function($scope, $timeout) {
      this.map = null;
      this.center = null;
      this.zoom = null;
      this.bounds = null;
      this.$$markers = [];
      this.addMarker = (function(_this) {
        return function(marker) {
          if (!marker) {
            return;
          }
          return _this.$$markers.push(marker);
        };
      })(this);
      this.removeMarker = (function(_this) {
        return function(marker) {
          var index;
          if (!marker) {
            return;
          }
          index = _this.$$markers.indexOf(marker);
          if (index !== -1) {
            return _this.$$markers.splice(index, 1);
          }
        };
      })(this);
      $scope.$ngMap = this;
    };
    MapDirective = function($parse, $timeout) {
      return {
        restrict: "ACE",
        controller: ["$scope", "$timeout", MapController],
        scope: true,
        transclude: true,
        link: function(scope, element, attrs, ctrl, transclude) {
          var getEventName, loadingClass, view;
          view = angular.element("<div>").hide();
          loadingClass = 'ng-map-loading';
          element.addClass(loadingClass);
          getEventName = function(s) {
            var nameArray;
            nameArray = s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split("-");
            nameArray.shift();
            if (nameArray.length) {
              return nameArray.join("_");
            }
          };
          return $maps().then(function(gmaps) {
            var eventName, k, options, v;
            ctrl.api = gmaps;
            ctrl.api.visualRefresh = true;
            options = angular.extend({}, defaultOptions, $parse(attrs.options)(scope));
            element.removeClass(loadingClass);
            ctrl.map = new ctrl.api.Map(element[0], options);
            for (k in attrs) {
              v = attrs[k];
              if (k.indexOf("event") !== 0) {
                continue;
              }
              if ((eventName = getEventName(k))) {
                (function(k, v) {
                  return ctrl.map.addListener(eventName, function(event) {
                    var locals;
                    locals = {};
                    if (event) {
                      locals["$event"] = event;
                    }
                    return $timeout(function() {
                      return $parse(v)(scope, locals);
                    });
                  });
                })(k, v);
              }
            }
            return $timeout(function() {
              return transclude(scope, function(clone) {
                view.append(clone);
                return element.append(view);
              });
            });
          });
        }
      };
    };
    MapCenterDirective = function($timeout) {
      return {
        restrict: "ACE",
        require: ["^ngMap", "?ngModel"],
        scope: {
          lat: "=lat",
          lng: "=lng"
        },
        link: function(scope, element, attrs, ctrls) {
          var boundsListener, centerListener, ngMap, ngModel;
          ngMap = ctrls[0], ngModel = ctrls[1];
          scope.$watch(function() {
            return {
              lat: scope.lat,
              lng: scope.lng
            };
          }, function(center) {
            if (!center.lat || !center.lng) {
              return;
            }
            return ngMap.map.setCenter(new ngMap.api.LatLng(center.lat, center.lng));
          }, true);
          centerListener = ngMap.map.addListener("center_changed", function() {
            var center;
            center = ngMap.map.getCenter();
            return $timeout(function() {
              return ngMap.center = {
                lat: center.lat(),
                lng: center.lng()
              };
            });
          });
          boundsListener = ngMap.map.addListener("bounds_changed", function() {
            var bounds, ne, sw;
            bounds = ngMap.map.getBounds();
            ne = bounds.getNorthEast();
            sw = bounds.getSouthWest();
            return $timeout(function() {
              return ngMap.bounds = {
                ne: {
                  lat: ne.lat(),
                  lng: ne.lng()
                },
                sw: {
                  lat: sw.lat(),
                  lng: sw.lng()
                }
              };
            });
          });
          return scope.$on("$destroy", function() {
            ngMap.api.event.removeListener(centerListener);
            return ngMap.api.event.removeListener(boundsListener);
          });
        }
      };
    };
    MapZoomDirective = function($timeout) {
      return {
        restrict: "ACE",
        require: ["^ngMap", "?ngModel"],
        scope: {
          zoom: "=value"
        },
        link: function(scope, element, attrs, ctrls) {
          var ngMap, ngModel, zoomListener;
          ngMap = ctrls[0], ngModel = ctrls[1];
          scope.$watch("zoom", function(zoom) {
            if (!zoom) {
              return;
            }
            return ngMap.map.setZoom(zoom);
          });
          zoomListener = ngMap.map.addListener("zoom_changed", function() {
            return $timeout(function() {
              return ngMap.zoom = ngMap.map.getZoom();
            });
          });
          return scope.$on("$destroy", function() {
            return ngMap.api.event.removeListener(zoomListener);
          });
        }
      };
    };
    MapMarkerDirective = function($parse) {
      return {
        restrict: "ACE",
        require: ["^ngMap", "?ngModel"],
        scope: true,
        link: function(scope, element, attrs, ctrls) {
          var $marker, contents, createMarker, isCustomLayout, lat, lng, markerNode, ngMap, ngModel, unwatch;
          ngMap = ctrls[0], ngModel = ctrls[1];
          contents = element.contents();
          markerNode = contents.filter("*");
          isCustomLayout = markerNode.length > 0;
          $marker = {
            scope: scope
          };
          createMarker = function() {
            var m;
            m = null;
            if (isCustomLayout > 0) {
              m = new custom.Marker({
                element: markerNode.first()
              });
            } else {
              m = new ngMap.api.Marker();
            }
            return m;
          };
          lat = $parse(attrs.lat);
          lng = $parse(attrs.lng);
          unwatch = scope.$watch(function() {
            return {
              lat: lat(scope),
              lng: lng(scope)
            };
          }, function(position) {
            var isVisible;
            isVisible = !!$marker.marker;
            $marker.marker || ($marker.marker = createMarker());
            $marker.marker.setPosition(new ngMap.api.LatLng(position.lat, position.lng));
            $marker.marker.setMap(ngMap.map);
            scope.$marker = $marker.marker;
            ngMap.addMarker($marker);
            if (!isVisible && 'onAdd' in attrs) {
              return $parse(attrs.onAdd)(scope);
            }
          }, true);
          return scope.$on("$destroy", function() {
            unwatch();
            $marker.marker.setMap(null);
            ngMap.removeMarker($marker);
            if ('onRemove' in attrs) {
              return $parse(attrs.onRemove)(scope);
            }
          });
        }
      };
    };
    MapLayerDirective = function($timeout, $parse) {
      return {
        restrict: "ACE",
        require: "^ngMap",
        transclude: true,
        link: function(scope, element, attrs, ngMap, transclude) {
          var infoWindowList, shouldPan;
          infoWindowList = [];
          shouldPan = $parse(attrs.pan)(scope) || false;
          return ngMap[attrs.name || "infoWindow"] = function(lat, lng, locals) {
            var $infoWindow;
            if (locals == null) {
              locals = {};
            }
            $infoWindow = {
              scope: angular.extend(scope.$new(), locals)
            };
            $infoWindow.customWindow = new custom.Window({
              position: new ngMap.api.LatLng(lat, lng),
              content: transclude($infoWindow.scope, angular.noop),
              pan: shouldPan
            });
            $infoWindow.scope.$on("$destroy", function() {
              return $infoWindow.customWindow.close();
            });
            $timeout(function() {
              return $infoWindow.customWindow.open(ngMap.map);
            });
            return $infoWindow;
          };
        }
      };
    };
    $MapControlDirective = function(p) {
      var positions;
      positions = function(p, api) {
        return {
          'tc': api.TOP_CENTER,
          'tl': api.TOP_LEFT,
          'tr': api.TOP_RIGHT,
          'lt': api.LEFT_TOP,
          'rt': api.RIGHT_TOP,
          'lc': api.LEFT_CENTER,
          'rc': api.RIGHT_CENTER,
          'lb': api.LEFT_BOTTOM,
          'rb': api.RIGHT_BOTTOM,
          'bc': api.BOTTOM_CENTER,
          'bl': api.BOTTOM_LEFT,
          'br': api.BOTTOM_RIGHT
        }[p];
      };
      return [
        function() {
          return {
            restrict: "ACE",
            require: "^ngMap",
            transclude: true,
            scope: true,
            link: function(scope, element, attrs, ngMap, transclude) {
              var controlElement;
              controlElement = angular.element("<div>").append(transclude());
              return ngMap.map.controls[positions(p, ngMap.api.ControlPosition)].push(controlElement[0]);
            }
          };
        }
      ];
    };
    return module.provider("$ngMaps", [MapsProvider]).directive("ngMap", ["$parse", "$timeout", MapDirective]).directive("ngMapCenter", ["$timeout", MapCenterDirective]).directive("ngMapZoom", ["$timeout", MapZoomDirective]).directive("ngMapMarker", ["$parse", MapMarkerDirective]).directive("ngMapLayer", ["$timeout", "$parse", MapLayerDirective]).directive("ngMapTc", $MapControlDirective('tc')).directive("ngMapTl", $MapControlDirective('tl')).directive("ngMapTr", $MapControlDirective('tr')).directive("ngMapLt", $MapControlDirective('lt')).directive("ngMapRt", $MapControlDirective('rt')).directive("ngMapLc", $MapControlDirective('lc')).directive("ngMapRc", $MapControlDirective('rc')).directive("ngMapLb", $MapControlDirective('lb')).directive("ngMapRb", $MapControlDirective('rb')).directive("ngMapBc", $MapControlDirective('bc')).directive("ngMapBl", $MapControlDirective('bl')).directive("ngMapBr", $MapControlDirective('br'));
  })(window.angular);

}).call(this);
