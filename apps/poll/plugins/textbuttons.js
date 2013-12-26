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
    '.{plugin.class} .answer span { left: 0; right: 0; z-index: 3; text-align: center; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.TextButtons
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TextButtons',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

Echo.Plugin.create(plugin);

})(Echo.jQuery);
