(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.NativeAdvertising
 * This plugin adds Native Advertising support to Streams. It will inject
 * placeholder DIV elements at a specified interval within a Stream, then fire
 * an Echo.StreamServer.Controls.Stream.onNativeAdRender Event that other
 * listeners on the page can subscribe to so they can fill them with sponsor
 * graphics.
 *
 * Event data object: {
 *   stream: Echo.StreamServer.Controls.Stream where the ads were rendered,
 *   body: Echo.View('body') where the ads were rendered,
 *   elements: $([]) elements array containing the rendered placeholders
 * }
 *
 * NOTE: Placeholders are created from the END of the stream FORWARD. This is
 * because new stream items will arrive at the top. If this was done the other
 * way, the first arriving item would always trigger an ad display. Suppose the
 * interval was 6. When first drawn, there would be an ad in slots 6 and 12
 * (assuming a 15-item stream). The first arriving item would push them to 7 and
 * 13, so we would render an ad in slot 1. By drawing from the back, you're more
 * likely to have ads at slots 9 and 3 (again, assuming a 15-item stream), and
 * thus will get a few new items drawn before the next ad is shown.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest("NativeAdvertising", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	/**
	 * @cfg {Number} nativeAdInterval The number of Stream.Item elements between
	 * which the ad placeholders will be created. Disabled by default.
	 */
	"nativeAdInterval": 0
};

plugin.dependencies = [{
	// This plugin lets us debounce events
	"loaded": function() { return !!Echo.jQuery().doTimeout; },
	"url": "//echocsthost.s3.amazonaws.com/plugins/jquery.ba-dotimeout.min.js"
}];

// When we draw or refresh items, trigger our behavior
plugin.events = {};
(function() {
	$.map([
		"Echo.StreamServer.Controls.Stream.onRender",
		"Echo.StreamServer.Controls.Stream.onRefresh"
	], function(entry) {
		plugin.events[entry] = function(topic, args) {
			var plugin = this;
			$.doTimeout('refresh-native-ads', 250, function() {
                plugin._refreshView();
            });
		};
	});
})();

/**
 * Place our elements
 *
 * TODO: We need to think about processing orders and how to control them.
 * Ideally, we would ensure that we run last, and the visualization would do
 * this. Right now we are relying on other visualizations to mark items with
 * this flag, so our count is accurate when we calculate our intervals.
 */
plugin.methods._refreshView = function() {
	var plugin = this,
        stream = this.component,
        interval = plugin.config.get('nativeAdInterval', 0);

	// Do we even want to run?
    if (!interval) return;

    // Find the element we want to render into
	var $body = stream.view.get("body");
	if ($body.length < 1) return;

	// Clean up any broken images so we don't mis-count. See TODO: above.
	$body.find('.load-error').remove();

	// Create our placeholders. Note that we use index() instead of prevAll()
    // because prevAll() returns its elements in reverse order!
    // If there are no placeholders yet, work backward from the last item.
    // Otherwise, work backward from the first placeholder.
    var $items = $body.children();
    var first = $items.index($body.find('.native-ad-placeholder').first());
    var $prev = (first > 0) ? $items.slice(0, first) : $items;
    var rendered = [];

    while ($prev.length > interval) {
        $prev = $prev.slice(0, $prev.length - interval);

        var $el = $('<div />').addClass('echo-streamserver-controls-stream-item native-ad-placeholder');
        rendered.push($el);
        $el.insertAfter($prev.last());
    }

    // Let the main page know we have new placeholders to fill
    if (rendered.length > 0) {
        Echo.Events.publish({
            topic: 'Echo.StreamServer.Controls.Stream.onAdPlaceholder',
            data: {
                stream: stream,
                body: $body,
                elements: rendered
            }
        });
    }
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
