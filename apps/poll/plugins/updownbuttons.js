(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.UpDownButtons
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('UpDownButtons',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
    this.extendTemplate('insertAfter', 'text', plugin.templates.thumb);
};

/**
 * Clearfix bar under the floated elements.
 * TODO: Change to a real clearfix?
 *
 * @echo_template
 */
plugin.templates.clear = '<div style="clear: both"></div>';

/**
 * Specific element for the thumbs-up/down graphics.
 *
 * @echo_template
 */
plugin.templates.thumb = '<div class="{plugin.class:thumb}"><span class="icon-thumb"></span></div>';

plugin.css =
    '.{plugin.class} .{class:body} { margin: 0; }' +
	'.{plugin.class} .{class:children} .{class} { width: 50%; float: left; border: 1px solid #333; }' +
    '.{plugin.class} .answer span { left: 0; right: 0; z-index: 3; text-align: center; }' +

    '.{plugin.class} .{class:children} .{plugin.class} .{plugin.class:thumb} { position: absolute; left: 50%; margin-left: -16px; z-index: 4; }' +
    '.{plugin.class} .{class:children} .{plugin.class}:first-child .{plugin.class:thumb} .icon-thumb { display: block; width: 32px; height: 32px; background: url(//echocsthost.s3.amazonaws.com/polyfills/thumbs-up-32.png) 0 0 no-repeat; margin: 4px auto; }' +
    '.{plugin.class} .{class:children} .{plugin.class}:last-child .{plugin.class:thumb} .icon-thumb { display: block; width: 32px; height: 32px; background: url(//echocsthost.s3.amazonaws.com/polyfills/thumbs-down-32.png) 0 0 no-repeat; margin: 4px auto; }' +

    // No text here
	'.{plugin.class} .{class:children} .{class:text} { display: none; }' +

    // TODO: This mode is NOT responsive yet!

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.UpDownButtons
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('UpDownButtons',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

Echo.Plugin.create(plugin);

})(Echo.jQuery);
