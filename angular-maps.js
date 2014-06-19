(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(angular) {
    var $MapControlDirective, $document, $maps, $q, $window, MapCenterDirective, MapController, MapDirective, MapFitDirective, MapLayerDirective, MapMarkerDirective, MapPolylineDirective, MapZoomDirective, MapsProvider, apiKey, custom, defaultOptions, deferred, extra, getEventName, module, ng, scriptId, src;
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
    getEventName = function(s) {
      var nameArray;
      nameArray = s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split("-");
      nameArray.shift();
      if (nameArray.length) {
        return nameArray.join("_");
      }
    };
    $window.ngMapsAsync = function() {
      var api;
      api = $window.google.maps;
      custom.Marker = (function(_super) {
        __extends(Marker, _super);

        function Marker(options) {
          var e, self, _i, _len, _ref;
          self = this;
          this.$element = options.element;
          this.$element.css({
            position: "absolute"
          });
          this.$position = options.position;
          this.$$anchor = options.anchor;
          this.$events = ['dblclick'];
          this.$preventEvent = function(event) {
            return event.stopPropagation();
          };
          _ref = this.$events;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            this.$element.on(e, this.$preventEvent);
          }
        }

        Marker.prototype.setMap = function(map) {
          if (this.getMap() === map) {
            return;
          }
          return Marker.__super__.setMap.call(this, map);
        };

        Marker.prototype.onAdd = function() {
          var panes;
          panes = this.getPanes();
          panes.overlayImage.appendChild(this.$element[0]);
          return this.$element.hide();
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

        Marker.prototype.getAnchor = function() {
          var h, w;
          w = this.$element.outerWidth();
          h = this.$element.outerHeight();
          return angular.extend({
            x: 0,
            y: 0
          }, this.$$anchor(w, h));
        };

        Marker.prototype.setDraggable = function(draggable) {
          if (draggable) {
            return this.$element.on("mousedown", angular.bind(this, this._startDrag));
          } else {
            return this.$element.off("mousedown", this._startDrag);
          }
        };

        Marker.prototype.draw = function() {
          var anchor, position, projection;
          projection = this.getProjection();
          if (!this.$position || !projection) {
            return;
          }
          anchor = this.getAnchor();
          position = projection.fromLatLngToDivPixel(this.$position);
          position.x = Math.round(position.x - anchor.x);
          position.y = Math.round(position.y - anchor.y);
          if (!(position.x && position.y)) {
            return;
          }
          return this.$element.css({
            left: position.x,
            top: position.y
          }).show();
        };

        Marker.prototype._getPoint = function() {
          var position;
          position = this.$element.position();
          return new api.Point(position.left, position.top);
        };

        Marker.prototype._getEvent = function(event, point) {
          var anchor, anchoredPoint, latLng, projection;
          anchor = this.getAnchor();
          projection = this.getProjection();
          anchoredPoint = new api.Point(point.x + anchor.x, point.y + anchor.y);
          latLng = projection.fromDivPixelToLatLng(anchoredPoint);
          return {
            originalEvent: event,
            position: latLng,
            defaultPrevented: false,
            preventDefault: function() {
              return this.defaultPrevented = true;
            }
          };
        };

        Marker.prototype._startDrag = function(event) {
          var dragData, dragStartEvent, endDrag, startDrag;
          event.preventDefault();
          api.event.trigger(this, "dragstart", dragStartEvent = this._getEvent(event, this._getPoint()));
          if (dragStartEvent.defaultPrevented) {
            return;
          }
          dragData = {
            origin: event,
            originPoint: this._getPoint(),
            listeners: []
          };
          startDrag = angular.bind(this, this._drag, dragData);
          endDrag = angular.bind(this, this._endDrag, dragData);
          if (this.$element[0].setCapture) {
            this.$element[0].setCapture(true);
            dragData.listeners.push(api.event.addDomListener(this.$element[0], "mousemove", startDrag));
            return dragData.listeners.push(api.event.addDomListener(this.$element[0], "mouseup", endDrag));
          } else {
            dragData.listeners.push(api.event.addDomListener($window, "mousemove", startDrag));
            return dragData.listeners.push(api.event.addDomListener($window, "mouseup", endDrag));
          }
        };

        Marker.prototype._drag = function(data, event) {
          var dragEvent, dx, dy, point, position;
          event.preventDefault();
          dx = event.clientX - data.origin.clientX;
          dy = event.clientY - data.origin.clientY;
          point = new api.Point(data.originPoint.x + dx, data.originPoint.y + dy);
          dragEvent = this._getEvent(event, point);
          position = dragEvent.position;
          api.event.trigger(this, "drag", dragEvent);
          if (dragEvent.defaultPrevented) {
            return;
          }
          return this.setPosition(position);
        };

        Marker.prototype._endDrag = function(data, event) {
          var dragEndEvent, l, _i, _len, _ref;
          api.event.trigger(this, "dragend", dragEndEvent = this._getEvent(event, this._getPoint()));
          _ref = data.listeners;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            l = _ref[_i];
            api.event.removeListener(l);
          }
          if (this.$element[0].releaseCapture) {
            return this.$element[0].releaseCapture();
          }
        };

        return Marker;

      })(api.OverlayView);
      custom.Window = (function(_super) {
        __extends(Window, _super);

        function Window(options) {
          this.$element = angular.element("<div>").append(options.content);
          this.$element.css({
            position: "absolute"
          });
          this.$position = options.position;
          this.$shouldPan = options.pan || false;
          this.$$offset = options.offset;
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
          var bounds, h, map, ne, offset, position, projection, sw, w;
          projection = this.getProjection();
          if (!this.$position || !projection) {
            return;
          }
          w = this.$element.width();
          h = this.$element.height();
          offset = angular.extend({
            x: 0,
            y: 0
          }, this.$$offset(w, h));
          map = this.getMap();
          position = projection.fromLatLngToDivPixel(this.$position);
          position.x = Math.round(position.x + offset.x);
          position.y = Math.round(position.y + offset.y);
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
      $scope.$ngMap = this;
      this.map = null;
      this.center = null;
      this.zoom = null;
      this.bounds = null;
    };
    MapDirective = function($parse, $timeout, $window) {
      return {
        restrict: "ACE",
        controller: ["$scope", "$timeout", MapController],
        scope: true,
        transclude: true,
        link: function(scope, element, attrs, ctrl, transclude) {
          var $$window, loadingClass, view;
          $$window = angular.element($window);
          view = angular.element("<div>").hide();
          loadingClass = 'ng-map-loading';
          element.addClass(loadingClass);
          return $maps().then(function(gmaps) {
            var boundsListener, centerListener, eventName, k, mapEventListeners, onResize, options, v, zoomListener;
            ctrl.api = gmaps;
            ctrl.api.visualRefresh = true;
            options = angular.extend({}, defaultOptions, $parse(attrs.options)(scope));
            element.removeClass(loadingClass);
            ctrl.map = new ctrl.api.Map(element[0], options);
            onResize = function() {
              var center;
              center = new ctrl.api.LatLng(ctrl.center.lat, ctrl.center.lng);
              ctrl.api.event.trigger(ctrl.map, "resize");
              return ctrl.map.panTo(center);
            };
            $$window.on("resize", onResize);
            scope.$on("$ngMap:resize", onResize);
            mapEventListeners = [];
            for (k in attrs) {
              v = attrs[k];
              if (k.indexOf("event") !== 0) {
                continue;
              }
              if ((eventName = getEventName(k))) {
                (function(k, v) {
                  var eventType, listener;
                  eventType = "addListener";
                  if (eventName === "ready") {
                    eventName = "idle";
                    eventType = "addListenerOnce";
                  }
                  listener = ctrl.api.event[eventType](ctrl.map, eventName, function(event) {
                    var locals;
                    locals = {};
                    if (event) {
                      locals["$event"] = event;
                    }
                    return $timeout(function() {
                      return $parse(v)(scope, locals);
                    });
                  });
                  return mapEventListeners.push(listener);
                })(k, v);
              }
            }
            centerListener = ctrl.map.addListener("center_changed", function() {
              var center;
              center = ctrl.map.getCenter();
              return $timeout(function() {
                return ctrl.center = {
                  lat: center.lat(),
                  lng: center.lng()
                };
              });
            });
            zoomListener = ctrl.map.addListener("zoom_changed", function() {
              return $timeout(function() {
                return ctrl.zoom = ctrl.map.getZoom();
              });
            });
            boundsListener = ctrl.map.addListener("bounds_changed", function() {
              var bounds, ne, sw;
              bounds = ctrl.map.getBounds();
              ne = bounds.getNorthEast();
              sw = bounds.getSouthWest();
              return $timeout(function() {
                return ctrl.bounds = {
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
            scope.$on("$destroy", function() {
              var l, _i, _len, _results;
              $$window.off("resize", onResize);
              ctrl.api.event.removeListener(centerListener);
              ctrl.api.event.removeListener(zoomListener);
              ctrl.api.event.removeListener(boundsListener);
              _results = [];
              for (_i = 0, _len = mapEventListeners.length; _i < _len; _i++) {
                l = mapEventListeners[_i];
                _results.push(ctrl.api.event.removeListener(l));
              }
              return _results;
            });
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
        require: "^ngMap",
        scope: {
          lat: "=lat",
          lng: "=lng"
        },
        link: function(scope, element, attrs, ctrl) {
          return scope.$watch(function() {
            return {
              lat: scope.lat,
              lng: scope.lng
            };
          }, function(center) {
            if (!center.lat || !center.lng) {
              return;
            }
            return ctrl.map.setCenter(new ctrl.api.LatLng(center.lat, center.lng));
          }, true);
        }
      };
    };
    MapZoomDirective = function($timeout) {
      return {
        restrict: "ACE",
        require: "^ngMap",
        scope: {
          zoom: "=value"
        },
        link: function(scope, element, attrs, ctrl) {
          return scope.$watch("zoom", function(zoom) {
            if (!zoom) {
              return;
            }
            return ctrl.map.setZoom(zoom);
          });
        }
      };
    };
    MapFitDirective = function($timeout) {
      return {
        restrict: "ACE",
        require: "^ngMap",
        scope: {
          bounds: "=bounds"
        },
        link: function(scope, element, attrs, ctrl) {
          return scope.$watch("bounds", function(bounds) {
            if (!bounds) {
              return;
            }
            return ctrl.map.fitBounds(bounds);
          });
        }
      };
    };
    MapMarkerDirective = function($parse, $timeout) {
      return {
        restrict: "ACE",
        require: "^ngMap",
        scope: true,
        link: function(scope, element, attrs, ctrl) {
          var $marker, centerAnchor, contents, createMarker, draggable, getAnchor, isCustomLayout, lat, lng, markerNode, once, unwatch, unwatchDraggable;
          contents = element.contents();
          markerNode = contents.filter("*");
          isCustomLayout = markerNode.length > 0;
          centerAnchor = "{x: $width / 2, y: $height / 2}";
          getAnchor = function(w, h) {
            return (attrs.anchor && $parse(attrs.anchor) || $parse(centerAnchor))(scope, {
              $width: w,
              $height: h
            });
          };
          createMarker = function() {
            var eventName, k, m, markerEventListeners, v;
            m = null;
            if (isCustomLayout > 0) {
              m = new custom.Marker({
                element: markerNode.first(),
                anchor: getAnchor
              });
              markerEventListeners = [];
              for (k in attrs) {
                v = attrs[k];
                if (k.indexOf("event") !== 0) {
                  continue;
                }
                if ((eventName = getEventName(k))) {
                  (function(k, v) {
                    var listener;
                    listener = ctrl.api.event.addListener(m, eventName, function(event) {
                      var locals;
                      locals = {};
                      if (event) {
                        locals["$event"] = event;
                      }
                      locals["$marker"] = m;
                      return $parse(v)(scope, locals);
                    });
                    return markerEventListeners.push(listener);
                  })(k, v);
                }
              }
              markerEventListeners.push(ctrl.api.event.addListener(m, "dragstart", function(event) {
                return $timeout(function() {
                  return scope.$dragging = true;
                });
              }));
              markerEventListeners.push(ctrl.api.event.addListener(m, "dragend", function(event) {
                return $timeout(function() {
                  return scope.$dragging = false;
                });
              }));
            } else {
              m = new ctrl.api.Marker();
            }
            return m;
          };
          $marker = {
            scope: scope,
            marker: createMarker()
          };
          scope.$marker = $marker.marker;
          lat = $parse(attrs.lat);
          lng = $parse(attrs.lng);
          draggable = $parse(attrs.draggable);
          once = true;
          unwatch = scope.$watch(function() {
            return {
              lat: lat(scope),
              lng: lng(scope)
            };
          }, function(position) {
            $marker.marker.setPosition(new ctrl.api.LatLng(position.lat, position.lng));
            $marker.marker.setMap(ctrl.map);
            if (once && 'onAdd' in attrs) {
              $parse(attrs.onAdd)(scope);
            }
            return once = false;
          }, true);
          unwatchDraggable = scope.$watch(function() {
            return draggable(scope);
          }, function(draggable) {
            return $marker.marker.setDraggable(draggable);
          });
          return scope.$on("$destroy", function() {
            unwatch();
            unwatchDraggable();
            $marker.marker.setMap(null);
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
        link: function(scope, element, attrs, ctrl, transclude) {
          var defaultOffset, getOffset, infoWindowList, shouldPan;
          infoWindowList = [];
          shouldPan = $parse(attrs.pan)(scope) || false;
          defaultOffset = "{x: -$width / 2, y: -$height - 30}";
          getOffset = function(w, h) {
            return (attrs.offset && $parse(attrs.offset) || $parse(defaultOffset))(scope, {
              $width: w,
              $height: h
            });
          };
          return ctrl[attrs.name || "infoWindow"] = function(lat, lng, locals) {
            var $infoWindow;
            if (locals == null) {
              locals = {};
            }
            $infoWindow = {
              scope: angular.extend(scope.$new(), locals)
            };
            $infoWindow.customWindow = new custom.Window({
              position: new ctrl.api.LatLng(lat, lng),
              content: transclude($infoWindow.scope, angular.noop),
              pan: shouldPan,
              offset: getOffset
            });
            $infoWindow.scope.$on("$destroy", function() {
              return $infoWindow.customWindow.close();
            });
            $timeout(function() {
              return $infoWindow.customWindow.open(ctrl.map);
            });
            return $infoWindow;
          };
        }
      };
    };
    MapPolylineDirective = function($parse) {
      return {
        restrict: "ACE",
        require: "^ngMap",
        scope: {
          path: "=path",
          color: "=color",
          opacity: "=opacity",
          weight: "=weight"
        },
        link: function(scope, element, attrs, ctrl) {
          var eventName, k, poly, polylineEventListeners, v;
          poly = new ctrl.api.Polyline();
          poly.setMap(ctrl.map);
          scope.$watch("path", function(pathSrc) {
            var p, path, _i, _len;
            if (pathSrc == null) {
              pathSrc = [];
            }
            path = [];
            for (_i = 0, _len = pathSrc.length; _i < _len; _i++) {
              p = pathSrc[_i];
              path.push(new ctrl.api.LatLng(p[0], p[1]));
            }
            return poly.setPath(path);
          }, true);
          scope.$watch(function() {
            return {
              strokeColor: scope.color || '#FF0000',
              strokeOpacity: scope.opacity || 1.0,
              strokeWeight: scope.weight || 1.0
            };
          }, function(options) {
            return poly.setOptions(options);
          }, true);
          polylineEventListeners = [];
          for (k in attrs) {
            v = attrs[k];
            if (k.indexOf("event") !== 0) {
              continue;
            }
            if ((eventName = getEventName(k))) {
              (function(k, v) {
                var listener;
                listener = ctrl.api.event.addListener(poly, eventName, function(event) {
                  var locals;
                  locals = {};
                  if (event) {
                    locals["$event"] = event;
                  }
                  locals["$poly"] = poly;
                  return $parse(v)(scope.$parent, locals);
                });
                return polylineEventListeners.push(listener);
              })(k, v);
            }
          }
          return scope.$on("$destroy", function() {
            var l, _i, _len;
            for (_i = 0, _len = polylineEventListeners.length; _i < _len; _i++) {
              l = polylineEventListeners[_i];
              ctrl.api.event.removeListener(l);
            }
            return poly.setMap(null);
          });
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
            link: function(scope, element, attrs, ctrl, transclude) {
              var controlElement;
              controlElement = angular.element("<div>").append(transclude());
              return ctrl.map.controls[positions(p, ctrl.api.ControlPosition)].push(controlElement[0]);
            }
          };
        }
      ];
    };
    return module.provider("$ngMaps", [MapsProvider]).directive("ngMap", ["$parse", "$timeout", "$window", MapDirective]).directive("ngMapCenter", ["$timeout", MapCenterDirective]).directive("ngMapZoom", ["$timeout", MapZoomDirective]).directive("ngMapFit", ["$timeout", MapFitDirective]).directive("ngMapMarker", ["$parse", "$timeout", MapMarkerDirective]).directive("ngMapLayer", ["$timeout", "$parse", MapLayerDirective]).directive("ngMapPolyline", ["$parse", MapPolylineDirective]).directive("ngMapTc", $MapControlDirective('tc')).directive("ngMapTl", $MapControlDirective('tl')).directive("ngMapTr", $MapControlDirective('tr')).directive("ngMapLt", $MapControlDirective('lt')).directive("ngMapRt", $MapControlDirective('rt')).directive("ngMapLc", $MapControlDirective('lc')).directive("ngMapRc", $MapControlDirective('rc')).directive("ngMapLb", $MapControlDirective('lb')).directive("ngMapRb", $MapControlDirective('rb')).directive("ngMapBc", $MapControlDirective('bc')).directive("ngMapBl", $MapControlDirective('bl')).directive("ngMapBr", $MapControlDirective('br'));
  })(window.angular);

}).call(this);
