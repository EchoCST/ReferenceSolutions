(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.TugOfWar
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TugOfWar',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
    this.extendTemplate('insertBefore', 'body', plugin.templates.bar);
};

/**
 * We add a bar to the visualization as a container for our percentage.
 *
 * @echo_template
 */
plugin.templates.bar = '<div class="{plugin.class:bar} tugofwar-bar"></div>';

plugin.css =
	// Do not display these data elements
    '.{plugin.class} .{class:depth-0}, ' +
	'.{plugin.class} .{class:footer}, ' +
	'.{plugin.class} .{class:avatar-wrapper}, ' +
	'.{plugin.class} .{class:authorName}, ' +
	'.{plugin.class} .{class:text} .header, ' +
    '.{plugin.class} .{class:modeSwitch}, ' +
	'.{plugin.class} .{class} .{class:children} { display: none !important; }' +

    // General layout
	'.{plugin.class} .{class:subwrapper} { margin: 0; }' +
    '.{plugin.class} .{class:children} { width: 100%; height: 100px; position: relative; }' +
	'.{plugin.class} .{class:depth-1} { margin: 0; padding: 0; background-color: transparent; }' +
	'.{plugin.class} .echo-primaryColor { color: #fff; }' +
	'.{plugin.class} .percentage { margin: 0 12px; }' +

	// Bars
	'.{plugin.class} .{class} { position: absolute; top: 0; bottom: 0; left: 0; border: 1px solid #fff; }' +
	'.{plugin.class} .{class}:first-child { background: #55a3cc; text-align: left; z-index: 1; }' +
	'.{plugin.class} .{class}:last-child { background: #ea9101; text-align: right; z-index: 0; right: 0; text-align: right; }' +

    // Text display. Note, there is an embedded <i> tag that the client may
    // style as desired with a badge image.
    '.{plugin.class} .{plugin.class:bar} { height: 100px; color: #fff; line-height: 100px; font-size: 30px; }' +
    '.{plugin.class} .{class}:first-child .{plugin.class:bar} i { float: left; }' +
    '.{plugin.class} .{class}:last-child .{plugin.class:bar} i { float: right; }' +

    // Buttons and other data
    '.{plugin.class} .{class:text} a { display: block; padding: 6px 20px; border-radius: 9px; background: #333; text-decoration: none; font-weight: bold; margin: 10px 20px 0 20px; color: #fff; }' +
	'.{plugin.class} .{class}:first-child .{class:text} a { float: left; }' +
	'.{plugin.class} .{class}:last-child .{class:text} a { float: right; }' +

    // Some responsive styling. Note that since phone resolutions are now all
    // over the place we deliberately used widths IN BETWEEN their typical sizes
    // to help make sure we get the edge cases.
    '@media all and (max-width: 900px) {'+
        '.{plugin.class} .{class:children} { height: 80px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 80px; line-height: 80px; font-size: 24px; }' +
    '}' +

    '@media all and (max-width: 600px) {'+
        '.{plugin.class} .{class:children} { height: 60px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 60px; line-height: 60px; font-size: 20px; }' +
    '}' +

    '@media all and (max-width: 400px) {'+
        '.{plugin.class} .{class:children} { height: 40px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 40px; line-height: 40px; font-size: 16px; }' +
    '}' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.TugOfWar
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TugOfWar',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
    'Echo.StreamServer.Controls.Stream.Plugins.VoteDataProcessor.onProcessed': function(topic, args) {
        this.processData();
    }
};

plugin.methods.processData = function() {
    var plugin = this,
        stream = this.component,
        $body = stream.view.get('body'),
        voteCount = 0;

    $.map(stream.threads[0].children, function(item, i) {
        var $wrapper = item.config.get('target'),
            $bar = item.plugins.TugOfWar.view.get('bar'),
            percentage = item.get('percentage') || 50;

        // TODO: Don't hard-code the <i>. We will be moving this element out to
        // the admin interface and thus into the stream itself. Then, here, we
        // want to only fill in a class=percentage SPAN rather than adding it
        // ourselves.
        // Set up the percentage text display, and convert 0% to 50%.
        $bar.html('<i></i><span class="percentage">' +
                     Math.round(percentage) + '%' +
                     // For debugging
                     // ' ' + item.get('votes') +
                     '</span>');

        // Animate only the LEFT bar
        if (i == 0) {
            // jQuery sets overflow:hidden during animations, and we're using
            // overflow to position the buttons.
            $wrapper.animate({
                width: percentage + '%'
            }, {
                duration: 2000,
                queue: false,
                step: function() {
                    $wrapper.css({ overflow: 'visible' });
                },
                complete: function() {
                    $wrapper.css({ overflow: 'visible' });
                }
            });
        }
    });
};

plugin.css =
    '.{plugin.class} { width: 100%; height: 100px; padding: 20px 0 60px 0; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
