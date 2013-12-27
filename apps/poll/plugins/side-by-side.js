(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.SideBySide
 * Displays two elements side by side.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('SideBySide',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
}

plugin.css =
    // General layout
	'.{plugin.class} .{class:children} .{class} { color: #fff; font-size: 16px; width: 49%; float: left; }' +
	'.{plugin.class} .{class:children} .{class}:first-child { margin-right: 2%; }' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
