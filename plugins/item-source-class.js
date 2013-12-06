(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.ItemSourceClass
 * Add a class to each Stream Item that contains its source, to enable
 * per-source styling. The source is applied to the 'content' element, which is
 * the outermost wrapper just inside the item itself.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest("ItemSourceClass",
								  "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * The source is applied to the -content DIV.
 *
 * @echo_renderer
 */
plugin.component.renderers.content = function(element) {
	var plugin = this, item = this.component;

	element = item.parentRenderer("content", arguments);
	element.addClass('item-source-' + item.data.source.name.toLowerCase());

	return element;
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
