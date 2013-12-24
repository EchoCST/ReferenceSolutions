/**
 * HiddenValue widget for the Dashboard. In a lot of cases you can just set
 * config values in your Dashboard and they'll save. But if you alter a setting,
 * config options that don't have matching form fields get lost and are not sent
 * to the preview window. This widget is just here to provide an invisible
 * placeholder for items you want retained but not visible.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.Apps.AppServer.Controls.Configurator.Items.HiddenValue")) return;

var hiddenvalue = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.HiddenValue");

hiddenvalue.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

hiddenvalue.config = {
	"defaultTitle": ""
};

hiddenvalue.init = function() {
	this.parent();
}

hiddenvalue.templates.main =
	'<div class="{inherited.class:value} {class:value}"></div>';

hiddenvalue.renderers.value = function(element) {
    return element.hide();

	return element;
};

hiddenvalue.methods.value = function() {
	return this.get("data.value");
};

hiddenvalue.css =
	'.{class:value} { display: none; }';

Echo.AppServer.App.create(hiddenvalue);

})(Echo.jQuery);
