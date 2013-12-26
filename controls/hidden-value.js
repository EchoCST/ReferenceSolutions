/**
 * HiddenValue widget for the Dashboard.
 *
 * In a lot of cases you can just set config values in your Dashboard and
 * they'll save. But if you alter a setting, config options that don't have
 * matching form fields appear to get lost - they don't make it into the preview
 * window. Probably there is some issue we need to resolve, but because this is
 * a useful concept anyway, for the time being we just wrote a control that
 * provides an invisible-value placeholder.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.Apps.AppServer.Controls.Configurator.Items.HiddenValue")) return;

var hiddenvalue = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.HiddenValue");

hiddenvalue.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

hiddenvalue.init = function() {
	this.parent();
}

hiddenvalue.templates.main =
	'<div class="{inherited.class:value} {class:value}"></div>';

hiddenvalue.renderers.value = function(element) {
    return element.hide();
};

hiddenvalue.methods.value = function() {
	return this.get("data.value");
};

hiddenvalue.css = '.{class:value} { display: none; }';

Echo.AppServer.App.create(hiddenvalue);

})(Echo.jQuery);
