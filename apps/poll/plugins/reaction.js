(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.Reaction
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('Reaction',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
    this.extendTemplate('insertAfter', 'children', plugin.templates.clear);
};

/**
 * Clearfix bar under the floated elements.
 * TODO: Change to a real clearfix?
 *
 * @echo_template
 */
plugin.templates.clear = '<div style="clear: both"></div>';

plugin.css =
	'.{plugin.class} .{class:children} .{class} { margin: 14px 14px 14px 0; display: block; float: left; width: auto; white-space: nowrap; background: #111; position: relative; }' +
	'.{plugin.class} .{class:children} .{class:body} { padding: 0 8px; margin: 0; line-height: 34px; }' +

    // TODO: This needs some work. Right now the span is setting the width of
    // the element. That means when we change its font size to show the result,
    // the width of the element changes. That would be bad for graphic buttons.
	'.{plugin.class} .{class:children} .answer span { position: relative; bottom: inherit; left: inherit; }' +
    '.showing-results .{plugin.class} .{class:children} .answer span { padding: 0 11px  0 12px; font-weight: bold; font-size: 8px; top: 16px; }' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.Reaction
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('Reaction',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

Echo.Plugin.create(plugin);

})(Echo.jQuery);
