(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization
 * Transforms a media stream into a pinboard with a streamlined interface.
 *
 * Apps that use this plugin should also include the TweetDisplay plugin. It is
 * optional but recommended to also include ItemSourceClass. CSS styles are
 * defined here that expect these plugins to be available, although this module
 * will not break if they're missing.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('StreamlinedPinboardVisualization',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
    // Cache any media found in the Stream.Item for later use
    this.set('media', Echo.Polyfills.Media.processMedia(this.component));

    // Add a media container for the 'front' side of the card
    this.extendTemplate('insertAfter', 'container', plugin.templates.mediafull);
};

plugin.dependencies = [{
    loaded: function() { return !!Echo.jQuery().isotope; },
    url: '{config:cdnBaseURL.sdk}/third-party/jquery/jquery.isotope.min.js'
}, {
    // This plugin lets us debounce events
    loaded: function() { return !!Echo.jQuery().doTimeout; },
    url: '//echocsthost.s3.amazonaws.com/plugins/jquery.ba-dotimeout.min.js'
}, {
    // The Media Polyfill is used to extract IMG/etc tags for separate display
    loaded: function() { return !!Echo.Polyfills && !!Echo.Polyfills.Media; },
    url: '//echocsthost.s3.amazonaws.com/polyfills/media.js'
}, {
    // TODO: These should only be needed for 'lightbox' secondary display modes
    "loaded": function() { },
    "url": "//cdn.echoenabled.com/sdk/v3/gui.pack.js"
}, {
    "loaded": function() { },
    "url": "//cdn.echoenabled.com/sdk/v3/gui.pack.css"
}];

/**
 * @echo_template
 */
plugin.templates.mediafull = '<div class="{plugin.class:mediafull}"></div>';

/**
 * Rendering magic to create a header DIV and position the required elements
 * within it from their usual spots.
 *
 * @echo_renderer
 */
plugin.component.renderers.frame = function(element) {
    var item = this.component,
        headerClass = this.cssPrefix + 'header';

    // We need the frame rendered before we can monkey with it
    element = item.parentRenderer('frame', arguments);

    // Most of the header elements are a set of DIV siblings found just before
    // the data block. We won't always know which ones are there because some
    // are generated with plugins. Instead, we find our data element and wrap
    // all of the prev-siblings before it.
    $(item.view.get('data').prevAll().get().reverse())
            .wrapAll('<div class="' + this.cssPrefix + 'header"></div>');

    element.find('.' + headerClass).append('<img src="//echocsthost.s3.amazonaws.com/polyfills/rotate.png" class="rotate" />');
    element.find('.rotate').click(function() {
       item.config.get('target').removeClass('rotated');
    });

    // Now move the avatar into the header we just made
    var avatar = item.view.get('avatar-wrapper');
    $('.' + headerClass, element).prepend(avatar);

    return element;
};

/**
 * @echo_renderer
 */
plugin.renderers.mediafull = function(element) {
    var plugin = this,
        item = this.component;

    var mediaItems = plugin.get('media', []);

    if (mediaItems.length < 1) {
        element.addClass('empty');
    } else {
        var eventData = { item: item, element: element };

        element.append(mediaItems);
        element.find('img, iframe').one('error', function() {
            item.config.get('target').addClass('load-error');
            plugin.events.publish({
                topic: 'onMediaError',
                data: eventData
            });
        }).one('load', function() {
            item.config.get('target').addClass('loaded');
            plugin.events.publish({
                topic: 'onMediaLoaded',
                data: eventData
            });
        });

        // Rotate/flip/etc visualizations
        switch (this.component.config.get('parent.display.secondary')) {
            case 'none':
                break;

            case 'lightbox':
                // TODO: Code cleanup after debugging
                element.append('<img src="//echocsthost.s3.amazonaws.com/polyfills/expand.png" class="expand" />');
                element.find('.expand').click(function() {
                    plugin.lightbox();
                });
                break;

            default:
            case 'flip':
                // TODO: Code cleanup after debugging
                element.append('<img src="//echocsthost.s3.amazonaws.com/polyfills/rotate.png" class="rotate" />');
                element.find('.rotate').click(function() {
                    item.config.get('target').addClass('rotated');
                });
                break;
        }
    }

    return element;
};

/**
 * Clean up the lightbox drawn below.
 */
plugin.methods.removeLightbox = function() {
    $('#mg-streamlined-lightbox-overlay').remove();
    $('#mg-streamlined-lightbox').remove();

    // TODO: Any more unbinding needed to avoid memleaks?
    $(window).off('keyup.mgstreamlined');

    var stream = this.get('lightbox-stream');
    if (stream) {
        // TODO: Anything else to shut down a stream?
        stream.destroy();
    }
};

/**
 * The Git history includes an example of how to call Echo.Gui.Modal to get a
 * modal lightbox using Bootstrap. But that component isn't responsive, it's 36k
 * even minified and Gzip'd, and we still would have needed to style it to get
 * the look/feel we were after. So here we implement just the very basics of
 * what we wanted - we can always replace this later with a call to another
 * plugin/component.
 */
plugin.methods.lightbox = function() {
    var plugin = this,
        item = plugin.component;

    // TODO: Markers and such
    var query = 'url:' + item.data.object.id + ' children:1',
        itemid = item.data.object.id;

    plugin.removeLightbox();

    $('<div id="mg-streamlined-lightbox-overlay"></div>').appendTo($('body'));
    $('<div id="mg-streamlined-lightbox"></div>').appendTo($('body'));

    // Close if the overlay is clicked or ESC is pressed
    $('#mg-streamlined-lightbox-overlay').click(function() {
        plugin.removeLightbox();
    });

    $(window).on('keyup.mgstreamlined', function(e) {
        if (e.keyCode == 27) {
            plugin.removeLightbox();
        }
    });

    // Ugly. But effective.
    $('#mg-streamlined-lightbox').html(
        '<div class="mgsl-inner">' +
            '<div class="right"><div id="mg-stream"></div></div>' +
            '<div class="left">' +
                // Extra DIV level for vertical centering
                '<div class="inner"><div class="media"></div></div>' +
            '</div>' +
        '</div>'
    );

    // Fill in the media. If there is a large-size version, use it
    var $media = $(plugin.get('media')).clone();
    //if ($media.hasAttr('data-src-full')) {
    //    $media.attr('src', $media.attr('data-src-full'));
    //}
    $('#mg-streamlined-lightbox .media').append($media);

    var stream = Echo.Loader.initApplication({
        script: "//echoplatform.com/sandbox/apps/echo/stream-plus/app.js",
        component: "Echo.Apps.StreamPlus",
        // TODO: This is too generic
        backplane: {
            serverBaseURL: "https://api.echoenabled.com/v1",
            busName: "jskit"
        },
        config: {
            target: document.getElementById("mg-stream"),
            // TODO: Correct SDK patterns for item.get, appId, appkey, etc.
            targetURL: item.data.object.id,
            dependencies: {
                // TODO: Does this need to be hard-coded around Janrain?
                Janrain: { appId: "echo" },
                StreamServer: { appkey: item.config.get('appkey') }
            }
        }
    });

    plugin.set('lightbox-stream', stream);
}

plugin.css =
    // Note: This line is not here to set the actual width of the Items. That
    // will be done above when Isotope is triggered. It's here to manage the
    // styling of the items when they first arrive before that effect starts.
    // Otherwise, the first item is HUGE.
    '.{plugin.class} { max-width: 30%; float: left; }' +

    // Lightbox styling
    // TODO: Refactor?
    // TODO: Support for browsers that don't support fixed?
    '#mg-streamlined-lightbox-overlay { position: fixed; z-index: 99999998; top: 0; left: 0; bottom: 0; right: 0; background: #000; opacity: 0.7; }' +
    '#mg-streamlined-lightbox { position: fixed; z-index: 99999999; top: 20px; left: 20px; bottom: 20px; right: 20px; background: #fff; opacity: 1; }' +
    '#mg-streamlined-lightbox .mgsl-inner { height: 100%; }' +
    '#mg-streamlined-lightbox .left { height: 100%; margin-right: 320px; box-sizing: border-box; border-right: 1px solid #999; background: #111; }' +
    '#mg-streamlined-lightbox .right { float: right; width: 320px; height: 100%; box-sizing: border-box; padding: 5px; background: #f0f00f0; }' +
    '#mg-streamlined-lightbox #mg-stream { background: #fff; padding: 8px; height: 100%; overflow-y: scroll; box-sizing: border-box; }' +
    '#mg-streamlined-lightbox .left .inner { position: relative; width: 100%; height: 100%; }' +
    '#mg-streamlined-lightbox .left .inner:before { content: \'\'; display: inline-block; height: 100%; vertical-align: middle; }' +
    '#mg-streamlined-lightbox .left .media { width: 90%; display: inline-block; margin: 0 0 0 5%; position: relative; vertical-align: middle; }' +
    '#mg-streamlined-lightbox .left .media iframe,' +
    '#mg-streamlined-lightbox .left .media img { max-width: 100%; display: block; margin: 0 auto; width: auto; max-height: 95%; }' +
    '#mg-streamlined-lightbox { }' +
    '#mg-streamlined-lightbox { }' +
    // TODO: Move down to a general responsive section once known
    '@media all and (max-width: 500px) {' +
        '#mg-streamlined-lightbox .left { float: none; margin-right: 0; height: 300px; }' +
        '#mg-streamlined-lightbox .right { float: none; width: 100%; height: auto; }' +
    '}' +


    // Override some incompatible default styles
    '.{plugin.class} .{class:container} { padding: 0px; }' +
    '.{plugin.class} .{class:subwrapper} { margin-left: 0px; }' +
    '.{plugin.class} .{class:avatar-wrapper} { margin-right: 7px; }' +
    '.{plugin.class} .{plugin.class} a { color: #2CA0C7; }' +

    // General layout
    '.{plugin.class} { perspective: 1000; -webkit-transition-property: transform, opacity; -moz-transition-property: transform, opacity; -ms-transition-property: transform, opacity; -wekit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -ms-transition-duration: 0.8s; }' +
    '.{plugin.class} img,' +
    '.{plugin.class} iframe { display: block; }' +
    '.{plugin.class} div { box-sizing: border-box; } ' +
    '.{plugin.class} .{class:data} { padding: 7px; }' +

    // For some reason Echo is putting Instagram item text into an H2 title tag
    // so we need to override its font or it looks awful.
    '.{plugin.class} h2.echo-item-title { font-size: 1em; line-height: 1.25em; }' +

    // Transitions for card flipping.
    '.{plugin.class} .{class:content} { -webkit-transition: 0.6s; -moz-transition: 0.6s; -ms-transition: 0.6s; -webkit-transform-style: preserve-3d; -moz-transform-style: preserve-3d; -ms-transform-style: preserve-3d; position: relative; -webkit-perspective: 800; -moz-perspective: 800; -ms-perspective: 800; padding-bottom: 0px; margin: 5px; }' +
    '.{plugin.class} .{class:content} .{class:container}, ' +
    '.{plugin.class} .{class:content} .{plugin.class:mediafull} { -webkit-backface-visibility: hidden; -moz-backface-visibility: hidden; -ms-backface-visibility: hidden; -webkit-transition: 250ms cubic-bezier(.8,.01,.74,.79); -moz-transition: 250ms cubic-bezier(.8,.01,.74,.79); -ms-transition: 250ms cubic-bezier(.8,.01,.74,.79); position: static; border: 1px solid #111; background: white; box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.8); -webkit-box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.8); -moz-box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.8); -ms-box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.8); -webkit-transform-style: preserve-3d; -moz-transform-style: preserve-3d; -ms-transform-style: preserve-3d; }' +
    '.{plugin.class} .{class:content} .{class:container} { -webkit-transform: rotatey(-180deg); -moz-transform: rotatey(-180deg); -ms-transform: rotatey(-180deg); position: absolute; top: 0; bottom: 0; width: 100%; }' +
    '.{plugin.class}.rotated .{class:content} > .{plugin.class:mediafull} { -webkit-transform: rotatey(180deg); -moz-transform: rotatey(180deg); -ms-transform: rotatey(180deg); }' +
    '.{plugin.class}.rotated .{class:content} > .{class:container} { -webkit-transform: rotatey(0deg); -moz-transform: rotatey(0deg); -ms-transform: rotatey(0deg); }' +
//    '.{plugin.class} .{class:content}:hover > .{plugin.class:mediafull} { -webkit-transform: rotatey(180deg); -moz-transform: rotatey(180deg); -ms-transform: rotatey(180deg); }' +
//    '.{plugin.class} .{class:content}:hover > .{class:container} { -webkit-transform: rotatey(0deg); -moz-transform: rotatey(0deg); -ms-transform: rotatey(0deg); }' +
    '.{plugin.class} .{class:content} .{class:container} .media-processed { display: none; }' +

    // General media visuals
    '.{plugin.class:media} { margin: 4px 7px 0 0; width: 25%; float: left; }' +
    '.{plugin.class:mediafull} { background: #000; }' +
    '.{plugin.class:mediafull} img { max-width: 100%; display: block; margin: 0 auto; }' +
    // TODO: Collapse class for shorter styling?
    '.{plugin.class:mediafull} .rotate { position: absolute; top: 4px; right: 4px; opacity: 0.5; }' +
    '.{plugin.class:mediafull} .rotate:hover { opacity: 1; }' +
    '.{plugin.class:mediafull} .expand { position: absolute; top: 4px; right: 4px; opacity: 0.4; }' +
    '.{plugin.class:mediafull} .expand:hover { opacity: .8; }' +

    // Separate the header visually, and color-code it
    '.{plugin.class} .{plugin.class:header} { padding: 5px; background: #f0f0f0; border-bottom: 1px solid #ccc; position: relative; }' +
    '.{plugin.class} .item-source-twitter .{plugin.class:header} { background: #E5F5FF; border-bottom: 1px solid #A1C7DF; }' +
    '.{plugin.class} .item-source-instagram .{plugin.class:header} { background: #E4CAB1; border-bottom: 1px solid #B49F8B; }' +
    '.{plugin.class} .{plugin.class:header} .rotate { position: absolute; bottom: 3px; right: 4px; opacity: 0.5; }' +
    '.{plugin.class} .{plugin.class:header} .rotate:hover { opacity: 1; }' +

    // Separate the footer visually, and color-code it
    '.{plugin.class} .{class:footer} { position: absolute; bottom: 0; left: 0; right: 0; height: 24px; background: #f0f0f0; border-top: 1px solid #ccc; padding: 4px 8px; }' +
    '.{plugin.class} .item-source-twitter .{class:footer} { background: #E5F5FF; border-top: 1px solid #A1C7DF; }' +
    '.{plugin.class} .item-source-twitter .{class:button-Share} { display: none; }' +
    '.{plugin.class} .item-source-instagram .{class:footer} { background: #E4CAB1; border-top: 1px solid #B49F8B; }' +

    // Un-float the auth/user values since there won't be room for them side-by-side. Also add ellipsis if necessary
    '.{plugin.class} .{class:plugin-TweetDisplay-tweetUserName},' +
    '.{plugin.class} .{class:authorName} { float: none; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-left: 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.StreamlinedPinboardVisualization
 * StreamServer plugins are isolated from one another so they communicate
 * through events. This extends the Stream itself to apply the Isotope effect
 * whenever the stream is updated.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('StreamlinedPinboardVisualization',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
    /**
     * @cfg {Number} minColWidth
     * The smallest a column is allowed to be. This controls the responsive
     * resizing behavior. Column count is reduced as necessary to meet this.
     */
    minColWidth: 300,
};

plugin.init = function() {
    var plugin = this, stream = this.component;

    // display an item immediately (cancel the slide down animation)
    // to let the Isotope library work with the final state of the DOM element
    // representing the item, to avoid its incorrect positioning in the grid
    this.component.config.set('slideTimeout', 0);

    // Update columnWidth on window resize. We do this more smoothly than
    // Isotope does.
    $(window).on('resize', function() {
        $.doTimeout('refresh-view', 250, function() {
            plugin._refreshView();
        });
    });
};

plugin.enabled = function() {
    return document.compatMode !== 'BackCompat'
};

plugin.dependencies = [{
    'loaded': function() { return !!Echo.jQuery().isotope; },
    'url': '{config:cdnBaseURL.sdk}/third-party/jquery/jquery.isotope.min.js'
}];

plugin.events = {};
(function() {
    $.map([
        'Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization.onMediaError',
        'Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization.onMediaLoaded',
        'Echo.StreamServer.Controls.Stream.onRender',
        'Echo.StreamServer.Controls.Stream.onRefresh'
    ], function(entry) {
        plugin.events[entry] = function(topic, args) {
            var plugin = this;
            $.doTimeout('refresh-view', 250, function() {
                plugin._refreshView();
            });
        };
    });
})();

plugin.methods._refreshView = function() {
    var plugin = this,
        stream = this.component,
        hasEntries = stream.threads.length,
        $body = stream.view.get('body');

    // In case we get called before even this element is rendered
    if ($body.length < 1) return;

    // Clean up any broken images before they disrupt the visualization.
    // TODO: The first line is an ugly hack to bubble up a class from a lower
    // element until we get a chance to move the class itself
    $body.find('.empty').each(function() {
        $(this).closest('.echo-streamserver-controls-stream-item')
               .addClass('load-error');
    });
    $body.find('.load-error').remove();

    // Figure out how many columns we should render. We need at least one
    // column, so we start checking for cols > 1.
    var minColWidth = plugin.config.get('minColWidth'),
        bodyWidth = $body.width(),
        columns = 1;
    for ( ; (Math.floor(bodyWidth / (columns+1)) >= minColWidth); columns++)
        ;

    // Set up our Isotope options. Note that the original gallery allowed these
    // options to be extended or overridden. We removed this ability because we
    // will probably move this to Packery very shortly. We don't want anybody to
    // build an App that depends on an Isotope option until we evaluate this.
    var config = {
        sortBy: 'original-order',
        resizable: false,
        itemPositionDataEnabled: true,
        layoutMode: 'masonry',
        masonry: {
            columnWidth: Math.floor(bodyWidth / columns)
        }
    };
    //throw Exception;

    $body.children().css({
        'max-width': config.masonry.columnWidth + 'px',
        'float': null
    });
    $body.data('isotope')
        ? (hasEntries
            ? $body.isotope('reloadItems').isotope(config)
            : $body.isotope('destroy'))
        : hasEntries && $body.isotope(config);
};

plugin.css = '.{plugin.class} .isotope { transition-property: height, width; transition-duration: 0.8s; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
