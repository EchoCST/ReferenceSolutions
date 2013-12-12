(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.TugOfWar
 * Extracts accumulator data from arriving poll items and manages a set
 * of data structures that are used to render substitutions. Also provides
 * some basic substitution instructions for the View API to use.
 *
 * TODO: This does not actually use the View Substitutions renderer. Plugins
 * don't have a way to add new instructions, and that renderer doesn't know
 * how to deal with arrays or nested structures like we have when we have
 * Items that contain both bars and buttons, but they're rendered in different
 * spots in the Stream.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TugOfWar',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
    var item = this.component,
        id = item.get('data.object.id').split('/'),
        votes = (item.depth == 1)
                    ? item.get('data.object.accumulators.repliesCount', 0)
                    : 0;

    // Add a media container for the 'front' side of the card
    this.extendTemplate('insertBefore', 'body', plugin.templates.bar);

    // Add the vote count and ID-based targeting classes
    item.config.get("target").addClass(id.pop() + ' ' + id.pop())
                             .attr('data-votes', votes);
};

/**
 * We add a bar to the visualization as a container for our percentage.
 *
 * @echo_template
 */
plugin.templates.bar = '<div class="{plugin.class:bar} tugofwar-bar"></div>';

/**
 * Get the vote count and expose it as an attribute that we can reuse elsewhere.
 *
 * @echo_renderer
 */
plugin.renderers.bar = function(element) {
    var item = this.component,
        votes = (item.depth == 1)
                    ? item.get('data.object.accumulators.repliesCount', 0)
                    : 0;

    // Add a class to the Stream.Item DIV with the last two path terms for the
    // stream item. This allows styling specifically by which item is being
    // rendered.
    element = this.parentRenderer('bar', arguments);
    element.attr('data-votes', votes);

    return element;
};

plugin.css =
	// Do not display these data elements
    '.{plugin.class} .{class:depth-0}, ' +
	'.{plugin.class} .{class:footer}, ' +
	'.{plugin.class} .{class:avatar-wrapper}, ' +
	'.{plugin.class} .{class:authorName}, ' +
	'.{plugin.class} .{class:text} > div, ' +
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

plugin.init = function() {
    var plugin = this,
        stream = this.component;

    //console.log(stream);
};

plugin.events = {};
(function() {
    $.map([
        'Echo.StreamServer.Controls.Stream.onRender',
        'Echo.StreamServer.Controls.Stream.onRefresh'
    ], function(entry) {
        plugin.events[entry] = function(topic, args) {
            this._processData();
        };
    });
})();

plugin.methods._processData = function() {
    var plugin = this,
        stream = this.component,
        $body = stream.view.get('body'),
        voteCount = 0;

    // First count all the votes
    // TODO: Later we should cache this...
    $body.find('.tugofwar-bar').each(function(i, el) {
        voteCount += $(el).data('votes');
    });

    // Now apply the vote counts and percentages as required
    $body.find('.tugofwar-bar').each(function(i, el) {
        var votes = $(el).data('votes'),
            percentage = Math.round(100 * votes / voteCount);

        $(el).html('<i></i><span class="percentage">' + percentage + '%</span>')
             .data('percentage', percentage);
    });

    // Finally, animate only the LEFT bar
    $body.find('.echo-streamserver-controls-stream-item-children .echo-streamserver-controls-stream-item:first-child').each(function(i, el) {
        var percentage = $(el).find('.tugofwar-bar').data('percentage');
        $(el).animate({ width: percentage + '%' }, 2000);
    });
};

plugin.css =
    '.{plugin.class} { width: 100%; height: 100px; padding: 20px 0 60px 0; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
