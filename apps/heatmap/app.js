(function($) {
"use strict";

var heatmap = Echo.App.manifest("Echo.Apps.HeatMap");

if (Echo.App.isDefined(heatmap)) return;

heatmap.init = function() {
    if (!this.checkAppKey()) return;

    this.set('stream', null);

    this.render();
    this.ready();
};

heatmap.labels = {
    "signin": "Please sign in..."
};

/**
 * Configuration defaults.
 *
 * NOTE: These defaults must match those defined in the Dashboard template
 * _exactly_. When we receive an app config, if the user sets a setting to its
 * default value, the setting is _remove.d_ That means if we define a different
 * default here, we will get the default app.js defines, not the default from
 * the dashboard.
 *
 * This is especially confusing for checkboxes. If a checkbox defaults to True
 * in Dashboard and the user has it checked, if we then have it defaulting to
 * false here or simply not defined it will always evaluate to false!
 */
heatmap.config = {
    appkey: "",

    datasource: {
        targetURLSource: 'specific',
        specifiedURL: '',
    },

    display: {
        visualization: 'world',
        heading: '',
        pingDelay: '1000',
        fadeSpeed: '3000',
        fakeInterval: '6000',
        showStream: false,
    },

    auth: {
        enabled: false,
        janrainApp: undefined
    }
};

heatmap.dependencies = [{
    url: "{config:cdnBaseURL.sdk}/streamserver.pack.js",
    app: "Echo.StreamServer.Controls.Stream"
}, {
    // TODO: Copy to Echo CDN?
    url: '//cdn.leafletjs.com/leaflet-0.6.4/leaflet.css'
}, {
    // TODO: Copy to Echo CDN?
    url: '//cdn.leafletjs.com/leaflet-0.6.4/leaflet.js'
}, {
    url: '//echocsthost.s3.amazonaws.com/polyfills/geo.js'
}, {
    url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet.label.js'
}, {
    url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet.polylineDecorator.min.js'
}, {
    url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/d3.v3.min.js'
}];

/**
 * Main template for the App.
 *
 * @echo_template
 */
heatmap.templates.main =
    '<div class="{class:container}">' +
        '<div class="{class:map}"></div>' +
        '<div class="{class:streamWrapper}">' +
            '<div class="{class:stream}"></div>' +
        '</div>' +
    '</div>';

/**
 * We need to hide/show the Stream via a wrapper because there is other logic in
 * the SDK that overrides our hide() behavior as the Stream gets initialized.
 *
 * Note that because the purpose of this App is to draw a map, we don't do
 * anything with the Stream. Developers who want to use the Stream as well
 * should use plugins to style it, either by deriving from this App to make
 * a use-case-specific version, or using Echo.Loader.Override() to add them
 * directly.
 *
 * @echo_renderer
 */
heatmap.renderers.streamWrapper = function(element) {
    return (!this.config.get('display.showStream')) ? element.hide() : element;
};

/**
 * Stream Component of the app. Note that this is hidden via streamWrapper above
 * because we're just using it as a data source.
 *
 * @echo_renderer
 */
heatmap.renderers.stream = function(element) {
    var app = this;

    var query = 'childrenof:' + app.config.get("datasource.specifiedURL") +
                ' markers:geo.marker itemsPerPage:45';

    var stream = this.initComponent({
        id: 'Stream',
        component: 'Echo.StreamServer.Controls.Stream',
        config: {
            target: element,
            query: query,
            plugins: [{
                name: "HeatMapDataHandler",
                url: "//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/heatmap-data.js"
            }],
        }
    });

    app.set('stream', stream);

    console.log(this);

    return element;
};

/**
 * We have to wait until the stream and map are rendered - waiting on the Stream
 * just saves us some code since it already has and async event being published
 * for it. We can't do this setup in the renderer itself because in there, the
 * element has not yet been placed in the DOM and laid out by the browser. That
 * means it doesn't have a width/height yet and Leaflet does NOT like that.
 */
heatmap.events = {
    'Echo.Apps.HeatMap.onRender': function(topic, args) {
        var app = this,
            mapView = app.view.get('map'),
            mapCenter = [39, -96.9];

        var map = new L.map(mapView.get(0), {
            // TODO: Base CENTER and ZOOM on visualization
            center: mapCenter,
            zoom: 4.4,

            // TODO: Consider exposing some of these config options in the Dashboard
            minZoom: 1,
            maxZoom: 10,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false,
            trackResize: true,
            attributionControl: false,
        });
        app.set('map', map);

        var bounds = map.getBounds();

        var heading = app.config.get('display.heading').trim();
        if (heading != '') {
            var label = new L.Label({
                classname: 'heading',
                direction: 'center',
                offset: [0, 0]
            });
            label.setContent(heading);
            label.setLatLng([51.6, mapCenter[1]]);
            map.showLabel(label);
        }

        // TODO: Move style/color options to the dashboard? Or can we do this with
        // CSS?
        var lineOptions = {
            color: '#b8b8b8',
            opacity: 1.0,
            clickable: false,
            dashArray: [2, 2],
            weight: 2
        };

        var pl1 = L.polyline([
            [50.9, -125],
            [50.9, -105]
        ], lineOptions).addTo(map);
        pl1._path.style["stroke-linecap"] = "butt";

        var pl2 = L.polyline([
            [50.9, -88],
            [50.9, -68]
        ], lineOptions).addTo(map);
        pl2._path.style["stroke-linecap"] = "butt";

        var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide states");

        var divIcon = L.divIcon({
            className: 'radar-marker',
            iconSize: [32, 32],
            iconAnchor: [24, 24]
        });

        $(window).resize(function(e) {
            // Responsive breakpoints. These had to be implemented in JS because
            // Leaflet is touchy - it has an auto-zoom feature but it doesn't
            // work with geoJSON, you have to be using their tile service and we
            // didn't want the dependency. For now we just use 400, 600, 800,
            // and 960 as our main breakpoints. These are deliberately midpoints
            // between, not exact matches, of common numbers.
            var width = mapView.width();
            if (width < 400)       { mapView.height(230); map.setZoom(2.8); }
            else if (width < 600)  { mapView.height(304); map.setZoom(3.3); }
            else if (width < 800)  { mapView.height(378); map.setZoom(3.6); }
            else if (width < 960)  { mapView.height(452); map.setZoom(3.9); }
            else if (width < 1200) { mapView.height(526); map.setZoom(4.2); }
            else                   { mapView.height(600); map.setZoom(4.4); }
            //map.invalidateSize();
        });

        // TODO: Undo this hard-coding
        var collection = Echo.Polyfills.GEO.features.usStates;
/*        $(window).bind('resize', function() {
            reset();
            map.invalidateSize(true);
        });
*/
/*
        var transform = d3.geo.transform({point: projectPoint}),
            path = d3.geo.path().projection(transform),
            bounds = path.bounds(collection);

        var feature = g.selectAll("path")
                       .data(collection.features)
                       .enter().append("path");

        $(window).bind('resize', function() {
            reset();
            map.invalidateSize(true);
        });
        map.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            var topLeft = bounds[0],
            bottomRight = bounds[1];

            console.log(bounds);
            svg.attr("width", bottomRight[0] - topLeft[0])
               .attr("height", bottomRight[1] - topLeft[1])
               .style("left", topLeft[0] + "px")
               .style("top", topLeft[1] + "px");
            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
            feature.attr("d", path);
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

*/
        L.geoJson(Echo.Polyfills.GEO.features.usStates, {
            style: {
                fillColor: '#ff4344',
                fillOpacity: 1,
                stroke: true,
                color: '#ffffff',
                weight: 2,
                opacity: 1
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.description);
            }
        }).addTo(map);
    /*
        var mapmarkers = [];
        var stateNumber = 0;
        Echo.Loader.initEnvironment(function() {
            var e = Echo.Events.subscribe({
                topic: 'Echo.StreamServer.Controls.Stream.onDataReceive',
                handler: function(topic, params) {
                    if (params.query == geoquery) {
                        //console && console.log && console.log(params.entries);
                        $.map(params.entries, function(entry) {
                            var latlng = stateCenters[states[stateNumber % states.length]];
                            stateNumber++;
                            var marker = L.marker(latlng, {icon: divIcon, opacity: 0}).addTo(map);
                            mapmarkers.push(marker);

                            $(marker._icon).animate({ opacity: 1 }, 3000);
                        });

                        while (mapmarkers.length > 5) {
                            var marker = mapmarkers.shift();
                            $(marker._icon).animate({ opacity: 0 }, 3000, function() {
                                map.removeLayer(marker);
                            });
                        }
                    }
                }
            });
        });
    */
    }
};

heatmap.css =
    '.{class} .{class:map} { width: 100%; height: 600px; max-height: 600px; background: #fff; }' +
    '.{class} .{class:map} .states path { fill: #ff4344; stroke: #fff; stroke-width: 1.5px; }' +
    '.{class} .{class:map} .states path:hover { fill: #ff4344; fill-opacity: .7; }' +
    '.{class} .{class:map} .leaflet-label { white-space: nowrap; font-size: 22px; text-align: center; }' +

    '.{class} .{class:map} .radar-marker { background: url(img/beacon32.png) 0 0 no-repeat; }' +

    '@media all and (max-width: 1200px) {' +
    '}' +

    '@media all and (max-width: 960px) {' +
        '.{class} .{class:map} .leaflet-label { font-size: 20px; }' +
    '}' +

    '@media all and (max-width: 800px) {' +
        '.{class} .{class:map} .leaflet-label { font-size: 18px; }' +
    '}' +

    '@media all and (max-width: 600px) {' +
        '.{class} .{class:map} .leaflet-label { font-size: 15px; }' +
    '}' +

    '@media all and (max-width: 400px) {' +
        '.{class} .{class:map} .leaflet-label { font-size: 13px; }' +
    '}' +

    '';

Echo.App.create(heatmap);

})(Echo.jQuery);
