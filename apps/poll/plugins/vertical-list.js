(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.VerticalList
 * Displays a vertical list of the options.
 *
 * This is the simplest visualization (it's the defaut), so it requires almost
 * no work. This is really just here as a placeholder for future functionality.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('VerticalList',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

Echo.Plugin.create(plugin);

})(Echo.jQuery);
