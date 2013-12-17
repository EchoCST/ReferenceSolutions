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
        pingInterval: '12000',
        showSpeed: '500',
        fadeSpeed: '5000',
        showStream: false,
    },

    auth: {
        enabled: false,
        janrainApp: undefined
    }
};

heatmap.dependencies = [
    {
        url: "{config:cdnBaseURL.sdk}/streamserver.pack.js",
        app: "Echo.StreamServer.Controls.Stream"
    },
    { url: '//echocsthost.s3.amazonaws.com/plugins/jquery.ba-dotimeout.min.js' },
    { url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet-0.7.1.css' },
    { url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet-0.7.1.js' },
    { url: '//echocsthost.s3.amazonaws.com/polyfills/geo.js' },
    { url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet.label.js' },
    { url: '//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/leaflet.polylineDecorator.min.js' }
];

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
    var app = this,
        query = 'childrenof:' + app.config.get("datasource.specifiedURL") +
                ' markers:geo.marker itemsPerPage:45';

    app.set('stream', this.initComponent({
        id: 'Stream',
        component: 'Echo.StreamServer.Controls.Stream',
        config: {
            target: element,
            query: query,
            plugins: [{
                name: "HeatMapDataHandler",
                url: "//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/heatmap-data.js"
            }]
        }
    }));

    return element;
};

/**
 * We don't actually render the map here - see below for why. Instead we set up
 * a timeout interval for the "ping" effect.
 *
 * Note that we don't actually draw "pings" as they arrive on the wire, because
 * we're almost always polling the server right now, usually every 60s or so,
 * which would make it look like the map was dead, and suddenly a bunch of pings
 * would arrive. Not very attractive. Instead, we always show a ping selected at
 * random from the Items in our hidden Stream, and we do this on a random
 * interval - configurable in the Dashboard. This makes the map "feel" active
 * no matter how active the feed actually is, as long as it is pre-populated
 * with at least SOME data.
 *
 * NOTE: Timers are set to only be accurate to within 500ms so we don't hurt
 * slower machines.
 * TODO: Make this configurable?
 *
 * @echo_renderer
 */
heatmap.renderers.map = function(element) {
    var app = this,
        nextPingTime = 0,
        pingInterval = parseInt(app.config.get('display.pingInterval')),
        showSpeed = parseInt(app.config.get('display.showSpeed')),
        fadeSpeed = parseInt(app.config.get('display.fadeSpeed'));

    var divIcon = L.divIcon({
        className: 'radar-marker',
        iconSize: [32, 32],
        iconAnchor: [24, 24]
    });

    setInterval(function() {
        // Standard policy is actually NOT to try/catch because a) exceptions
        // should be fixed, and b) most apps can't function if they're getting
        // them anyway (they're all pure JS). But we want the map to truck on
        // even if something in this routine fails so we do it here.
        try {
            var stream = app.get('stream'),
                map = app.get('map'),
                curTime = new Date().getTime();

            // We need a Stream, or we're kind of useless...
            if (!stream || !stream.threads || stream.threads.length < 1) {
                return;
            }

            // Go-time?
            //
            // TODO: We wrote this with a different goal in mind with multiple
            // timeouts running, and now we're realizing that as simple as it
            // is, we could probably just call setTimeout instead from within
            // ourselves and save the trouble of figuring out when to trigger
            // next...
            if (curTime < nextPingTime) {
                return;
            }
            nextPingTime = curTime + Math.floor(Math.random() * pingInterval + 1);

            // Get a random Item to display.
            var index = Math.floor(Math.random() * stream.threads.length),
                Item = stream.threads[index],
                latlng = null;

            // A geo-location marker looks like this, using the standard rule in
            // DataServer:
            //    geo.location:-117.57980013;33.46756302
            $.map(Item.data.object.markers, function(marker) {
                if (marker.substring(0, 13) === 'geo.location:') {
                    var major = marker.split(':');
                    var minor = major[1].split(';');
                    latlng = [parseFloat(minor[1]), parseFloat(minor[0])];
                }
            });

            // This one's a dud...
            if (!latlng) {
                return;
            }

            // TODO: Check for memory leaks here because of the decoupled
            // timing.
            console.log(latlng);
            var marker = L.marker(latlng, {
                icon: divIcon,
                opacity: 0
            }).addTo(map);

            // TODO: It would be nice to have a radial expansion with a bounce
            // effect instead of just fading in. We kept it simple for now.
            $(marker._icon).animate({
                opacity: 1
            }, showSpeed, function() {
                $(marker._icon).animate({
                    opacity: 0
                }, fadeSpeed, function() {
                    map.removeLayer(marker);
                });
            });
        } catch (e) {
            Echo.Utils.log({
                component: 'SocialHeatMap',
                type: 'Exception',
                message: e.message,
                args: e
            });
        }
    }, 500);

    return element;
}

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

            // TODO: Consider exposing some of these options in the Dashboard
            minZoom: 2,
            maxZoom: 5,
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

        // TODO: Move style/color options to the dashboard? Or can we do this
        // with CSS?
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

        $(window).resize(function(e) {
            // TODO: Debounce at some point, but Leaflet doesn't seem to like it
            //$.doTimeout('social-heatmap-resize', 100, function() {
                // Responsive breakpoints. These had to be implemented in JS because
                // Leaflet is touchy - it has an auto-zoom feature but it doesn't
                // work with geoJSON, you have to be using their tile service and we
                // didn't want the dependency. For now we just use 400, 600, 800,
                // and 960 as our main breakpoints. These are deliberately midpoints
                // between, not exact matches, of common numbers.
                var width = mapView.width(),
                    zoom = 4.4;

                if (width < 400)       { mapView.height(230); map.setZoom(2.8); }
                else if (width < 600)  { mapView.height(304); map.setZoom(3.3); }
                else if (width < 800)  { mapView.height(378); map.setZoom(3.6); }
                else if (width < 960)  { mapView.height(452); map.setZoom(3.9); }
                else if (width < 1200) { mapView.height(526); map.setZoom(4.2); }
                else                   { mapView.height(600); map.setView(mapCenter, 4.4); }
            //});
        }).trigger('resize');

        // TODO: Undo this hard-coding
        var collection = Echo.Polyfills.GEO.features.usStates;

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
