(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.TextButtons
 * Displays text buttons side by side flush underneath the header.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TextButtons',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.css =
    '.{plugin.class} .{class:body} { margin: 0; }' +
	'.{plugin.class} .{class:children} .{class} { width: 50%; float: left; border: 1px solid #333; }' +

    '.{plugin.class} .{class:children} .{class:body} img { max-height: 32px; position: absolute; top: 4px; left: 4px; z-index: 3; }' +

    '.{plugin.class} .answer span { left: 0; right: 0; z-index: 3; text-align: center; }' +

    // Some responsive styling.
    '@media all and (max-width: 900px) {'+
        '.{plugin.class} .{class:children} .{class:body} img { max-height: 28px; top: 3px; left: 3px; }' +
    '}' +

    '@media all and (max-width: 600px) {'+
        '.{plugin.class} .{class:children} .{class:body} img { max-height: 22px; top: 3px; left: 3px; }' +
    '}' +

    '@media all and (max-width: 400px) {'+
        '.{plugin.class} .{class:children} .{class:body} img { display: none; }' +
        // TODO: More elegant way?
        '.echo-streamserver-controls-stream-item-plugin-VoteDataProcessor-resultText { display: none !important; }' +
    '}' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
