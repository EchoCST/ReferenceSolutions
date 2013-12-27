/**
 * There is a bug in AppServer somewhere. If a dashboard listens to events, when
 * you change from one instance to another, the second one will throw an error
 * about an undefined handler. It appears as though the dashboard component is
 * being destroyed but its event handlers aren't being cleaned up / removed. But
 * if we do them here in a control it works fine so we just make an invisible
 * control the LivePoll app can use.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.Apps.AppServer.Controls.Configurator.Items.PollPublisher")) return;

var pollpublisher = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.PollPublisher");

pollpublisher.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

/**
 * Set up the color picker.
 */
pollpublisher.init = function() {
	this.parent();
}

// TODO: We've been copying/pasting this from other dashboard controls. There is
// a LOT of HTML here, and most of it seems to be boilerplate. Can't this be
// refactored into separate templates so value-oriented controls can just
// extendTemplate that one thing?
pollpublisher.templates.main =
	'<div class="{inherited.class:value} {class:value}"></div>';

pollpublisher.renderers.value = function(element) {
    return element.hide();
};

/**
 * TODO: Do we actually need/want this?
 */
pollpublisher.methods.value = function() {
	return this.get("data.value");
};

pollpublisher.events = {
	"Echo.AppServer.Controls.Configurator.onItemChange": function(topic, data) {
        console.log('In onItemChange', data);
	}
};

pollpublisher.css = '.{class:value} { display: none; }';

Echo.AppServer.App.create(pollpublisher);

})(Echo.jQuery);
