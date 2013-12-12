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
    var item = this.component;

    // Add a media container for the 'front' side of the card
    this.extendTemplate('insertBefore', 'body', plugin.templates.bar);
};

plugin.templates.bar = '<div class="{plugin.class:bar} percent-width-bar"></div>';

plugin.renderers.bar = function(element) {
    var plugin = this,
        item = this.component;

    element = this.parentRenderer('bar', element);

    var votes = (item.depth == 1) ? item.data.object.accumulators.repliesCount : 0;
    element.setAttribute('data-votes', votes);

    return element;
};

//	'.{plugin:class} .{echo-streamserver-controls-stream-body > .echo-streamserver-controls-stream-item { position: relative; height: 140px; } ' +
plugin.css =
	// Do not display these data elements
    '.{plugin.class} .{class:depth-0}, ' +
	'.{plugin.class} .{class:footer}, ' +
	'.{plugin.class} .{class:avatar-wrapper}, ' +
	'.{plugin.class} .{class:authorName}, ' +
	'.{plugin.class} .{class:text} > div, ' +
	'.{plugin.class} .{class} .{class:children} { display: none; }' +

    // General layout
	'.{plugin.class} .{class:subwrapper} { margin: 0; }' +
    '.{plugin.class} .{class:children} { width: 100%; height: 100px; position: relative; }' +
	'.{plugin.class} .{class:depth-1} { margin: 0; padding: 0; background-color: transparent; }' +
	'.{plugin.class} .echo-primaryColor { color: #fff; }' +

	// Bars
	'.{plugin.class} .{class} { position: absolute; top: 0; bottom: 0; left: 0; border: 1px solid #777; }' +
	'.{plugin.class} .{class}:first-child { background: #540115; z-index: 1; }' +
	'.{plugin.class} .{class}:last-child { background: #8f052d; z-index: 0; right: 0; text-align: right; }' +

    // Text display
    '.{plugin.class} .{plugin.class:bar} { height: 100px; color: #fff; line-height: 100px; font-size: 30px; }' +
    '.{plugin.class} .{plugin.class:bar} i { display: block; width: 76px; height: 77px; overflow: hidden; background: url(//echosandbox.com/cse/cokezero/badges.png) 0 0 no-repeat; margin: 12px; }' +
    '.{plugin.class} .{class}:first-child .{plugin.class:bar} i { float: left; background-position: 0 -231px; }' +
    '.{plugin.class} .{class}:last-child .{plugin.class:bar} i { float: right; }' +

    // Buttons and other data
    '.{plugin.class} .{class:text} a { display: block; padding: 6px 20px; border-radius: 9px; background: #fff; text-decoration: none; font-weight: bold; margin: 10px 20px 0 20px; }' +
	'.{plugin.class} .{class}:first-child .{class:text} a { float: left; color: #540115; }' +
	'.{plugin.class} .{class}:last-child .{class:text} a { float: right; color: #8f052d; }' +

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
            console.log(topic);
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
    $body.find('.percent-width-bar').each(function(i, el) {
        voteCount += $(el).data('votes');
    });

    // Now apply the vote counts and percentages as required
    $body.find('.percent-width-bar').each(function(i, el) {
        var votes = $(el).data('votes'),
            percentage = Math.round(100 * votes / voteCount);

        $(el).html('<i></i>' + percentage + '%').data('percentage', percentage);
    });

    // Finally, animate only the LEFT bar
    $body.find('.echo-streamserver-controls-stream-item-children .echo-streamserver-controls-stream-item:first-child').each(function(i, el) {
        var percentage = $(el).find('.percent-width-bar').data('percentage');
        $(el).animate({ width: percentage + '%' }, 2000);
    });
};

plugin.css =
    '.{plugin.class} { width: 100%; height: 100px; padding: 20px 0 60px 0; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
