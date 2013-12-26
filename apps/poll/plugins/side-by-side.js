(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.SideBySide
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('SideBySide',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
//    this.extendTemplate('insertBefore', 'container', plugin.templates.head);
};

/**
 * We add a bar to the visualization as a container for our percentage. Note
 * that we don't use a renderer because we fill the bar later using an event.
 *
 * @echo_template
 */
plugin.templates.head = '<div class="{plugin.class:head}"></div>';

plugin.renderers.head = function(element) {
    var plugin = this,
        item = this.component,
        $img = $('<div>' + item.get('data.object.content') + '</div>').find('.header');

    if (item.depth > 0 && $img.length > 0) {
        element.html($img.wrapAll('<div></div>').parent().html());
    }

    return element;
}

plugin.css =
    // General layout
	'.{plugin.class} .{class:children} .{class} { margin: 7px 0; background: #444; color: #fff; font-size: 16px; line-height: 40px; width: 49%; float: right; }' +
	'.{plugin.class} .{class:children} .{class}:first-child { margin-left: 2%; }' +

    // Visual styles
	'.{plugin.class} .{class:children} .{class} { font-size: 16px; line-height: 40px; }' +
	'.{plugin.class} .{class:children} .{class:text} a.submit-text { color: #fff; text-decoration: none; text-transform: uppercase; font-weight: bold; display: block; padding: 0 10px; }' +
    '.{plugin.class} .{class:data} .percentage { float: right; margin: 0 7px; }' +
    '.{plugin.class} .{class:data} .count { float: right; margin: 0 7px; }' +

    '.{plugin.class} .{class:children} .{class:body} { padding-bottom: 40px; position: relative; }' +

    // Body/Result bar layering
    '.{plugin.class} .{class:children} .{plugin.class:bar} { position: absolute; z-index: -1; left: 0; bottom: 0; background: #417DC1; border-right: 1px solid #ccc; height: 40px; width: 0; }' +
    '.{plugin.class} .{class:children} .{plugin.class:resultText} { position: absolute; z-index: 2; right: 0; bottom: 0; color: #fff; line-height: 40px; font-size: 18px; height: 40px; padding: 0 7px; }' +
	//'.{plugin.class} .{class:children} .{class:body} { padding: 0; position: absolute; height: 40px; z-index: 3; bottom: 0; left: 0; }' +
	//'.{plugin.class} .{class:children} .{class:body}:hover { background: #666; border: 2px solid DarkOrange; }' +

    // Some responsive styling. Note that since phone resolutions are now all
    // over the place we deliberately used widths IN BETWEEN their typical sizes
    // to help make sure we get the edge cases.
    //'@media all and (max-width: 900px) {'+
    //    '.{plugin.class} .{class:children} .{class:data} { height: 34px; }' +
    //	'.{plugin.class} .{class:children} .{class} { font-size: 15px; line-height: 34px; }' +
    //'}' +
    //
    //'@media all and (max-width: 600px) {'+
    //    '.{plugin.class} .{class:children} .{class:data} { height: 28px; }' +
    //	'.{plugin.class} .{class:children} .{class} { font-size: 14px; line-height: 28px; }' +
    //'}' +
    //
    //'@media all and (max-width: 400px) {'+
    //    '.{plugin.class} .{class:children} .{class:data} { height: 24px; }' +
    //	'.{plugin.class} .{class:children} .{class} { font-size: 12px; line-height: 24px; }' +
    //'}' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.SideBySide
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('SideBySide',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.css =
    // Show/hide the results elements. This is done separately from animation.
    // TODO: Move the animation to CSS3 and just have the JS trigger it.
    '.{plugin.class} .results { display: none; }' +

    '.{plugin.class}.show-results-before .results { display: block; }' +
    '.{plugin.class}.show-results-after.voted .results { display: block; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
